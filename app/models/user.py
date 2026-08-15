from pydantic import BaseModel, Field
from typing import Literal, Optional


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2)
    phone: str = Field(..., min_length=10)
    password: str = Field(..., min_length=6)
    role: Literal["CITIZEN", "RESPONDER"] = "CITIZEN"


class UserLogin(BaseModel):
    phone: str
    password: str


class UserResponse(BaseModel):
    id: str
    name: str
    phone: str
    role: str