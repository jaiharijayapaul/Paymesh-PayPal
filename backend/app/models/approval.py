import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Boolean, Numeric, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    offer_id: Mapped[str] = mapped_column(String(36), ForeignKey("offers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    offer_version: Mapped[int] = mapped_column(Integer, nullable=False)
    approved_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    
    status: Mapped[str] = mapped_column(
        String(50),
        default="PENDING",
        nullable=False,
        index=True
    )  # PENDING, APPROVED, REJECTED, INVALIDATED, EXPIRED
    
    policy_check_passed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    policy_details: Mapped[str] = mapped_column(Text, nullable=True)  # JSON with deterministic checks
    user_notes: Mapped[str] = mapped_column(Text, nullable=True)
    approved_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="approvals")
    task: Mapped["Task"] = relationship("Task", back_populates="approvals")
    offer: Mapped["Offer"] = relationship("Offer", back_populates="approvals")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="approval")
