from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


class ProviderBase(BaseModel):
    name: str
    tagline: str
    description: str
    category: str
    avatar_url: Optional[str] = None
    rating: Decimal
    review_count: int
    starting_price: Decimal
    minimum_price: Decimal
    currency: str
    delivery_days: int
    is_available: bool
    is_verified: bool
    skills: Optional[str] = None
    portfolio_samples: Optional[str] = None


class ProviderResponse(ProviderBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    created_at: datetime
    updated_at: datetime


class ProviderFilter(BaseModel):
    category: Optional[str] = None
    max_price: Optional[Decimal] = None
    min_rating: Optional[Decimal] = None
    max_delivery_days: Optional[int] = None
    search: Optional[str] = None
