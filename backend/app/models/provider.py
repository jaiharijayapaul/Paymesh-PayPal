import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import String, Boolean, Numeric, Integer, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.task import TaskCandidate
    from app.models.offer import Offer
    from app.models.payment import Order


class Provider(Base):
    __tablename__ = "providers"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    tagline: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    avatar_url: Mapped[str] = mapped_column(String(500), nullable=True)
    rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("5.00"), nullable=False)
    review_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    starting_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    minimum_price: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)  # reservation price floor for simulated merchant
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    delivery_days: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    skills: Mapped[str] = mapped_column(Text, nullable=True)  # JSON or comma-separated tags
    portfolio_samples: Mapped[str] = mapped_column(Text, nullable=True)  # JSON summary
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    candidates: Mapped[list["TaskCandidate"]] = relationship("TaskCandidate", back_populates="provider")
    offers: Mapped[list["Offer"]] = relationship("Offer", back_populates="provider")
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="provider")
