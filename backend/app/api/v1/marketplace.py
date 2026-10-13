from typing import List, Optional
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.provider import Provider
from app.schemas.provider import ProviderResponse, ProviderCreate

router = APIRouter()


@router.post("", response_model=ProviderResponse, status_code=status.HTTP_201_CREATED)
def create_provider(provider_in: ProviderCreate, db: Session = Depends(get_db)):
    """Onboards a new Service Provider / Merchant into the persistent database."""
    if provider_in.minimum_price > provider_in.starting_price:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Minimum reserve price cannot exceed the starting price."
        )

    provider = Provider(**provider_in.model_dump())
    db.add(provider)
    db.commit()
    db.refresh(provider)
    return ProviderResponse.model_validate(provider)


@router.get("", response_model=List[ProviderResponse])
def list_providers(
    category: Optional[str] = Query(None),
    min_rating: Optional[Decimal] = Query(None),
    max_price: Optional[Decimal] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    query = db.query(Provider)

    if category:
        query = query.filter(Provider.category == category)
    if min_rating:
        query = query.filter(Provider.rating >= min_rating)
    if max_price:
        query = query.filter(Provider.starting_price <= max_price)
    if search:
        pattern = f"%{search}%"
        query = query.filter(
            (Provider.name.ilike(pattern)) |
            (Provider.description.ilike(pattern)) |
            (Provider.tagline.ilike(pattern))
        )

    providers = query.order_by(Provider.rating.desc(), Provider.review_count.desc()).all()
    return [ProviderResponse.model_validate(p) for p in providers]


@router.get("/{provider_id}", response_model=ProviderResponse)
def get_provider_details(provider_id: str, db: Session = Depends(get_db)):
    provider = db.query(Provider).filter(Provider.id == provider_id).first()
    if not provider:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found.")
    return ProviderResponse.model_validate(provider)
