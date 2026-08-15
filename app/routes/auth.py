from fastapi import APIRouter, HTTPException
from datetime import datetime, timezone
from bson import ObjectId
import hashlib

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


def hash_password(password: str):
    return hashlib.sha256(
        password.encode()
    ).hexdigest()


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


    if existing_user["password"] != hash_password(
        user.password
    ):

        raise HTTPException(
            status_code=401,
            detail="Invalid phone or password"
        )


    return {
        "message": "Login successful",

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