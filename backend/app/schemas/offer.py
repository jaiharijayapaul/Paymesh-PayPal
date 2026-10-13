from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.provider import ProviderResponse


class NegotiationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    offer_id: str
    round_number: int
    sender: str
    proposed_price: Decimal
    message: str
    rationale: Optional[str] = None
    created_at: datetime


class OfferResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    provider_id: str
    version: int
    original_price: Decimal
    final_price: Decimal
    currency: str
    delivery_days: int
    scope_summary: str
    status: str
    expires_at: datetime
    created_at: datetime
    updated_at: datetime
    provider: ProviderResponse
    negotiations: List[NegotiationResponse] = []


class NegotiateRequest(BaseModel):
    target_price: Optional[Decimal] = Field(None, gt=0, description="Target counter-offer price")
    user_message: Optional[str] = Field(None, description="Optional custom instruction to merchant")
