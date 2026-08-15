from pydantic import BaseModel, Field
from typing import Optional


class IncidentCreate(BaseModel):

    description: str = Field(
        ...,
        min_length=5
    )

    emergency_type: Optional[str] = None

    latitude: Optional[float] = None
    longitude: Optional[float] = None

    reporter_id: Optional[str] = None


class IncidentResponse(BaseModel):

    id: str
    description: str
    emergency_type: Optional[str] = None
    severity: str
    status: str