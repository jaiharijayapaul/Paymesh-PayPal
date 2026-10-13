from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.offer import OfferResponse
from app.schemas.task import TaskResponse


class PolicyRuleCheck(BaseModel):
    rule_name: str
    passed: bool
    details: str


class PolicyValidationResult(BaseModel):
    passed: bool
    overall_status: str
    checks: List[PolicyRuleCheck]
    reasoning: str


class ApprovalCreate(BaseModel):
    task_id: str
    offer_id: str


class ApprovalResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    task_id: str
    offer_id: str
    offer_version: int
    approved_amount: Decimal
    currency: str
    status: str
    policy_check_passed: bool
    policy_details: Optional[str] = None
    user_notes: Optional[str] = None
    approved_at: Optional[datetime] = None
    expires_at: datetime
    created_at: datetime
    updated_at: datetime
    offer: Optional[OfferResponse] = None


class ApprovalActionRequest(BaseModel):
    user_notes: Optional[str] = None
