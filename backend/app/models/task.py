import uuid
from datetime import datetime, timezone
from decimal import Decimal
from sqlalchemy import String, Boolean, Numeric, Integer, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.db.base import Base


class Task(Base):
    __tablename__ = "tasks"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id: Mapped[str] = mapped_column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    raw_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    service_category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    max_budget: Mapped[Decimal] = mapped_column(Numeric(10, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(3), default="USD", nullable=False)
    deadline_days: Mapped[int] = mapped_column(Integer, nullable=False)
    min_rating: Mapped[Decimal] = mapped_column(Numeric(3, 2), default=Decimal("4.00"), nullable=False)
    preferences: Mapped[str] = mapped_column(Text, nullable=True)  # JSON formatted extra user constraints
    status: Mapped[str] = mapped_column(
        String(50),
        default="PENDING",
        nullable=False,
        index=True
    )  # PENDING, DISCOVERING, EVALUATING, NEGOTIATING, PENDING_APPROVAL, APPROVED, PAYMENT_PENDING, COMPLETED, REJECTED, FAILED
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc)
    )

    user: Mapped["User"] = relationship("User", back_populates="tasks")
    candidates: Mapped[list["TaskCandidate"]] = relationship("TaskCandidate", back_populates="task", cascade="all, delete-orphan")
    offers: Mapped[list["Offer"]] = relationship("Offer", back_populates="task", cascade="all, delete-orphan")
    approvals: Mapped[list["Approval"]] = relationship("Approval", back_populates="task", cascade="all, delete-orphan")
    payments: Mapped[list["Payment"]] = relationship("Payment", back_populates="task", cascade="all, delete-orphan")
    orders: Mapped[list["Order"]] = relationship("Order", back_populates="task", cascade="all, delete-orphan")
    actions: Mapped[list["AgentAction"]] = relationship("AgentAction", back_populates="task", cascade="all, delete-orphan")


class TaskCandidate(Base):
    __tablename__ = "task_candidates"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    task_id: Mapped[str] = mapped_column(String(36), ForeignKey("tasks.id", ondelete="CASCADE"), nullable=False, index=True)
    provider_id: Mapped[str] = mapped_column(String(36), ForeignKey("providers.id", ondelete="CASCADE"), nullable=False, index=True)
    
    relevance_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    rating_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    budget_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    delivery_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    verification_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    composite_score: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal("0.00"), nullable=False)
    
    evaluation_reasoning: Mapped[str] = mapped_column(Text, nullable=True)
    rank: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    is_selected: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(timezone.utc))

    task: Mapped["Task"] = relationship("Task", back_populates="candidates")
    provider: Mapped["Provider"] = relationship("Provider", back_populates="candidates")
