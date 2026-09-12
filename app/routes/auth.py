from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from datetime import datetime, timezone
from bson import ObjectId
import base64
import hashlib
import hmac
import json
import os
import secrets

from app.database.mongodb import db
from app.models.user import (
    UserRegister,
    UserLogin,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


users_collection = db["users"]
bearer_scheme = HTTPBearer(auto_error=False)
AUTH_SECRET = os.getenv("RESQAI_AUTH_SECRET") or secrets.token_urlsafe(48)
TOKEN_TTL_SECONDS = 60 * 60 * 12


def hash_password(password: str):
    """PBKDF2 is deliberately slow, unlike the previous single SHA-256 hash."""
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
    return "pbkdf2_sha256${}${}".format(
        base64.urlsafe_b64encode(salt).decode(),
        base64.urlsafe_b64encode(digest).decode(),
    )


def verify_password(password: str, stored_hash: str):
    """Accept legacy hashes once, so existing users can be migrated on login."""
    if stored_hash.startswith("pbkdf2_sha256$"):
        try:
            _, salt_value, digest_value = stored_hash.split("$", 2)
            salt = base64.urlsafe_b64decode(salt_value)
            expected = base64.urlsafe_b64decode(digest_value)
            actual = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 310_000)
            return hmac.compare_digest(actual, expected)
        except (ValueError, TypeError):
            return False

    return hmac.compare_digest(
        stored_hash,
        hashlib.sha256(password.encode()).hexdigest(),
    )


def issue_access_token(user):
    payload = {
        "sub": str(user["_id"]),
        "role": str(user.get("role", "")).upper(),
        "exp": int(datetime.now(timezone.utc).timestamp()) + TOKEN_TTL_SECONDS,
    }
    encoded = base64.urlsafe_b64encode(
        json.dumps(payload, separators=(",", ":")).encode()
    ).decode().rstrip("=")
    signature = hmac.new(AUTH_SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}"


def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme)):
    if not credentials or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")

    try:
        encoded, signature = credentials.credentials.split(".", 1)
        expected = hmac.new(AUTH_SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError("Invalid signature")
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=" * (-len(encoded) % 4)))
        if payload["exp"] < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError("Expired token")
        user = users_collection.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise ValueError("Unknown user")
        return user
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")


def require_admin(user=Depends(get_current_user)):
    if str(user.get("role", "")).upper() != "ADMIN":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")
    return user


def provision_admin_from_env():
    """Create the first administrator only from deployment secrets, never public registration."""
    phone = os.getenv("RESQAI_ADMIN_PHONE")
    password = os.getenv("RESQAI_ADMIN_PASSWORD")
    name = os.getenv("RESQAI_ADMIN_NAME", "ResQAI Administrator")
    if not phone or not password:
        return

    existing = users_collection.find_one({"phone": phone})
    if existing:
        # The configured bootstrap identity takes precedence over a previously
        # registered account. This also makes a deliberate password rotation in
        # Render take effect on the next service restart.
        users_collection.update_one(
            {"_id": existing["_id"]},
            {"$set": {"role": "ADMIN", "password": hash_password(password)}},
        )
        print("ResQAI admin bootstrap: configured account updated")
        return

    users_collection.insert_one({
        "name": name,
        "phone": phone,
        "password": hash_password(password),
        "role": "ADMIN",
        "created_at": datetime.now(timezone.utc),
    })
    print("ResQAI admin bootstrap: configured account created")


@router.post("/register")
def register(user: UserRegister):

    existing_user = users_collection.find_one({
        "phone": user.phone
    })

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="Phone number already registered"
        )


    new_user = {
        "name": user.name,
        "phone": user.phone,

        "password": hash_password(
            user.password
        ),

        "role": user.role,

        "created_at":
            datetime.now(timezone.utc)
    }


    result = users_collection.insert_one(
        new_user
    )


    return {
        "message": "Registration successful",

        "user": {
            "id": str(result.inserted_id),
            "name": user.name,
            "phone": user.phone,
            "role": user.role
        }
    }


@router.post("/login")
def login(user: UserLogin):

    existing_user = users_collection.find_one({
        "phone": user.phone
    })


    if not existing_user:

        raise HTTPException(
            status_code=401,
            detail="Invalid phone or password"
        )


    if not verify_password(user.password, existing_user["password"]):

        raise HTTPException(
            status_code=401,
            detail="Invalid phone or password"
        )


    # Upgrade older SHA-256 hashes after a successful sign-in.
    if not existing_user["password"].startswith("pbkdf2_sha256$"):
        users_collection.update_one(
            {"_id": existing_user["_id"]},
            {"$set": {"password": hash_password(user.password)}},
        )

    return {
        "message": "Login successful",

        "access_token": issue_access_token(existing_user),
        "token_type": "bearer",

        "user": {
            "id": str(
                existing_user["_id"]
            ),

            "name":
                existing_user["name"],

            "phone":
                existing_user["phone"],

            "role":
                existing_user["role"]
        }
    }

