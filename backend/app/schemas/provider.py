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
    rating: Decimal = Decimal("4.85")
    review_count: int = 15
    starting_price: Decimal
    minimum_price: Decimal
    currency: str = "USD"
    delivery_days: int = 3
    is_available: bool = True
    is_verified: bool = True
    skills: Optional[str] = None
    portfolio_samples: Optional[str] = None


class ProviderCreate(ProviderBase):
    pass


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
