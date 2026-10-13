from datetime import datetime
from decimal import Decimal
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    full_name: str = Field(min_length=2, max_length=100)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserResponse"


class UserPreferenceUpdate(BaseModel):
    preferred_currency: Optional[str] = Field(None, min_length=3, max_length=3)
    max_transaction_amount: Optional[Decimal] = Field(None, gt=0)
    min_provider_rating: Optional[Decimal] = Field(None, ge=1.0, le=5.0)
    preferred_delivery_days: Optional[int] = Field(None, gt=0)
    mandatory_payment_approval: Optional[bool] = None


class UserPreferenceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    preferred_currency: str
    max_transaction_amount: Decimal
    min_provider_rating: Decimal
    preferred_delivery_days: int
    mandatory_payment_approval: bool
    created_at: datetime
    updated_at: datetime


class UserResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: str
    full_name: str
    is_active: bool
    created_at: datetime
    preferences: Optional[UserPreferenceResponse] = None


Token.model_rebuild()
