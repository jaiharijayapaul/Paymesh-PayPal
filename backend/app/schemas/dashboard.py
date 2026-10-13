from decimal import Decimal
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel


class DashboardSummaryResponse(BaseModel):
    active_tasks: int
    pending_approvals: int
    completed_sandbox_payments: int
    total_sandbox_transaction_value: Decimal
    currency: str = "USD"
    estimated_negotiated_savings: Decimal
    average_offer_discount_pct: Decimal
    orders_in_progress: int


class DashboardActivityItem(BaseModel):
    id: str
    timestamp: datetime
    type: str  # AGENT_ACTION, PAYMENT, TASK, APPROVAL
    title: str
    description: str
    status: Optional[str] = None
    task_id: Optional[str] = None
    amount: Optional[Decimal] = None
