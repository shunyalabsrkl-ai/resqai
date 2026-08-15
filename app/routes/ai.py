from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.groq_service import analyze_emergency


router = APIRouter(
    prefix="/ai",
    tags=["AI"]
)


class EmergencyRequest(BaseModel):
    description: str


@router.post("/analyze")
async def analyze(request: EmergencyRequest):

    try:

        result = await analyze_emergency(
            request.description
        )

        return result

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"AI analysis failed: {str(e)}"
        )