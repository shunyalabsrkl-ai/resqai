import os

from fastapi import FastAPI

from app.database.mongodb import client
from app.routes.incidents import router as incidents_router
from app.routes.ai import router as ai_router
from fastapi.middleware.cors import CORSMiddleware
from app.routes.auth import router as auth_router, provision_admin_from_env
from app.routes.responders import router as responders_router


app = FastAPI(
    title="ResQAI API",
    description="AI-Powered Emergency Response System",
    version="1.0.0"
)

allowed_origins = [
    origin.strip().rstrip("/")
    for origin in (
        os.getenv("RESQAI_ALLOWED_ORIGINS")
        or os.getenv(
            "RESQAI_ALLOWED_ORIGIN",
            "http://localhost:5173,http://127.0.0.1:5173",
        )
    ).split(",")
    if origin.strip().rstrip("/")
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(incidents_router)
app.include_router(ai_router)
app.include_router(auth_router)
app.include_router(responders_router)


@app.on_event("startup")
def create_configured_admin():
    provision_admin_from_env()


@app.get("/")
def root():
    return {
        "message": "ResQAI API is running 🚨",
        "status": "online"
    }


@app.get("/health")
def health():

    try:

        client.admin.command("ping")

        return {
            "status": "healthy",
            "database": "connected"
        }

    except Exception as e:

        return {
            "status": "unhealthy",
            "database": "disconnected",
            "error": str(e)
        }
