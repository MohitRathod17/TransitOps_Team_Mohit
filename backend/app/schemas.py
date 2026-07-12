from pydantic import BaseModel, EmailStr, Field, ConfigDict
from decimal import Decimal
from datetime import datetime
from typing import Optional
from app.models import VehicleStatus

class BaseConfigModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)

class RoleResponse(BaseConfigModel):
    id: int
    name: str

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)
    full_name: str
    role_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseConfigModel):
    id: int
    email: EmailStr
    full_name: str
    role: RoleResponse

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    email: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

class VehicleCreate(BaseModel):
    registration_number: str = Field(..., min_length=2, max_length=50)
    model: str = Field(..., min_length=1, max_length=100)
    type: str = Field(..., min_length=1, max_length=50)
    max_load_capacity: Decimal = Field(..., gt=0)

class VehicleResponse(BaseConfigModel):
    id: int
    registration_number: str
    model: str
    type: str
    max_load_capacity: Decimal
    status: VehicleStatus
    created_at: datetime
