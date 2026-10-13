from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.session import get_db
from app.models.user import User
from app.models.task import Task
from app.models.approval import Approval
from app.models.payment import Payment, Order
from app.models.offer import Offer
from app.models.agent import AgentAction
from app.schemas.dashboard import DashboardSummaryResponse, DashboardActivityItem
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryResponse)
def get_dashboard_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Active tasks: not completed, not rejected, not failed
    active_tasks_count = db.query(Task).filter(
        Task.user_id == current_user.id,
        Task.status.in_(["PENDING", "DISCOVERING", "EVALUATING", "NEGOTIATING", "PENDING_APPROVAL", "APPROVED", "PAYMENT_PENDING"])
    ).count()

    # Pending approvals
    pending_approvals_count = db.query(Approval).filter(
        Approval.user_id == current_user.id,
        Approval.status == "PENDING"
    ).count()

    # Completed sandbox payments
    completed_payments = db.query(Payment).filter(
        Payment.user_id == current_user.id,
        Payment.status == "COMPLETED"
    ).all()
    completed_payments_count = len(completed_payments)
    total_payment_value = sum((p.amount for p in completed_payments), Decimal("0.00"))

    # Orders in progress
    orders_in_progress_count = db.query(Order).filter(
        Order.user_id == current_user.id,
        Order.fulfillment_status.in_(["CONFIRMED", "IN_PROGRESS"])
    ).count()

    # Negotiated savings across all user offers
    user_task_ids = [t.id for t in current_user.tasks]
    offers = db.query(Offer).filter(Offer.task_id.in_(user_task_ids)).all() if user_task_ids else []

    total_original = Decimal("0.00")
    total_negotiated = Decimal("0.00")
    for o in offers:
        if o.original_price > o.final_price:
            total_original += o.original_price
            total_negotiated += o.final_price

    estimated_savings = total_original - total_negotiated
    avg_discount_pct = Decimal("0.00")
    if total_original > Decimal("0.00"):
        avg_discount_pct = ((estimated_savings / total_original) * Decimal("100.00")).quantize(Decimal("0.1"))

    return DashboardSummaryResponse(
        active_tasks=active_tasks_count,
        pending_approvals=pending_approvals_count,
        completed_sandbox_payments=completed_payments_count,
        total_sandbox_transaction_value=total_payment_value,
        currency="USD",
        estimated_negotiated_savings=estimated_savings,
        average_offer_discount_pct=avg_discount_pct,
        orders_in_progress=orders_in_progress_count
    )


@router.get("/activity", response_model=List[DashboardActivityItem])
def get_dashboard_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    user_task_ids = [t.id for t in current_user.tasks]
    activity_items: List[DashboardActivityItem] = []

    # 1. Recent agent actions
    if user_task_ids:
        actions = db.query(AgentAction).filter(
            AgentAction.task_id.in_(user_task_ids)
        ).order_by(AgentAction.created_at.desc()).limit(15).all()

        for a in actions:
            activity_items.append(DashboardActivityItem(
                id=a.id,
                timestamp=a.created_at,
                type="AGENT_ACTION",
                title=f"{a.agent_name} executed {a.action_type.replace('_', ' ').title()}",
                description=a.reasoning or "Automated multi-agent reasoning event.",
                status="COMPLETED",
                task_id=a.task_id
            ))

    # 2. Recent payments
    payments = db.query(Payment).filter(
        Payment.user_id == current_user.id
    ).order_by(Payment.created_at.desc()).limit(5).all()

    for p in payments:
        activity_items.append(DashboardActivityItem(
            id=p.id,
            timestamp=p.created_at,
            type="PAYMENT",
            title=f"PayPal Sandbox Order: ${p.amount} {p.currency}",
            description=f"Transaction Status: {p.status} (Order: {p.paypal_order_id or 'Pending'})",
            status=p.status,
            task_id=p.task_id,
            amount=p.amount
        ))

    # Sort all chronologically descending
    activity_items.sort(key=lambda x: x.timestamp, reverse=True)
    return activity_items[:20]
