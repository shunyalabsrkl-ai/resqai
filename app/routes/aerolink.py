from fastapi import APIRouter
from pydantic import BaseModel

from backend.app.services.groq_service import ask_aerolink


router = APIRouter(
    prefix="/aerolink",
    tags=["AeroLink"]
)


class AeroLinkRequest(BaseModel):
    prompt: str
    model: str = ""


@router.post("/test")
async def test_aerolink(request: AeroLinkRequest):

    return await ask_aerolink(
        request.prompt,
        request.model
    )