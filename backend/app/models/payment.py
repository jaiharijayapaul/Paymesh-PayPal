import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import TYPE_CHECKING
from sqlalchemy import String, Numeric, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.task import Task
    from app.models.approval import Approval
    from app.models.provider import Provider


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    approval_id: Mapped[str] = mapped_column(String(36), ForeignKey("approvals.id", ondelete="CASCADE"), nullable=False, index=True)
    
    paypal_order_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=True)
    paypal_capture_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=True)
    
    amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    
    status: Mapped[str] = mapped_column(
        String(50),
        default="CREATED",
        nullable=False,
        index=True
    )  # CREATED, APPROVED, COMPLETED, PENDING, DENIED, FAILED, REFUNDED
    
    payer_email: Mapped[str] = mapped_column(String(255), nullable=True)
    gateway_response: Mapped[str] = mapped_column(Text, nullable=True)  # JSON raw response
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="payments")
    task: Mapped["Task"] = relationship("Task", back_populates="payments")
    approval: Mapped["Approval"] = relationship("Approval", back_populates="payments")
    order: Mapped["Order"] = relationship("Order", back_populates="payment", uselist=False)


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("providers.id", ondelete="CASCADE"), nullable=False, index=True)
    payment_id: Mapped[str] = mapped_column(String(36), ForeignKey("payments.id", ondelete="CASCADE"), unique=True, nullable=False)
    
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    
    fulfillment_status: Mapped[str] = mapped_column(
        String(50),
        default="CONFIRMED",
        nullable=False,
        index=True
    )  # CONFIRMED, IN_PROGRESS, DELIVERED, COMPLETED
    
    merchant_acknowledgment: Mapped[str] = mapped_column(Text, nullable=True)
    delivery_deadline: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="orders")
    task: Mapped["Task"] = relationship("Task", back_populates="orders")
    provider: Mapped["Provider"] = relationship("Provider", back_populates="orders")
    payment: Mapped["Payment"] = relationship("Payment", back_populates="order")


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    paypal_event_id: Mapped[str] = mapped_column(String(100), unique=True, index=True, nullable=False)
    event_type: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="PROCESSED", nullable=False)  # PROCESSED, IGNORED, FAILED
    payload: Mapped[str] = mapped_column(Text, nullable=False)  # Raw JSON
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), nullable=True, index=True)
    action: Mapped[str] = mapped_column(String(100), index=True, nullable=False)
    resource_type: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=True)  # JSON
    ip_address: Mapped[str] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
