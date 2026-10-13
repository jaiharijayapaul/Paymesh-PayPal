from datetime import datetime, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.approval import Approval
from app.models.agent import AgentAction
from app.schemas.approval import ApprovalResponse, ApprovalActionRequest
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/pending", response_model=List[ApprovalResponse])
def get_pending_approvals(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approvals = db.query(Approval).filter(
        Approval.user_id == current_user.id,
        Approval.status == "PENDING"
    ).order_by(Approval.created_at.desc()).all()
    return [ApprovalResponse.model_validate(a) for a in approvals]


@router.get("/{approval_id}", response_model=ApprovalResponse)
def get_approval_details(
    approval_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.id == approval_id,
        Approval.user_id == current_user.id
    ).first()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found.")
    return ApprovalResponse.model_validate(approval)


@router.post("/{approval_id}/approve", response_model=ApprovalResponse)
def approve_transaction(
    approval_id: str,
    body: ApprovalActionRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.id == approval_id,
        Approval.user_id == current_user.id
    ).first()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found.")

    if approval.status != "PENDING":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Cannot approve an approval in '{approval.status}' state.")

    if not approval.policy_check_passed:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot approve: Policy checks failed.")

    now = datetime.now(timezone.utc)
    if approval.expires_at.tzinfo is not None and approval.expires_at < now:
        approval.status = "EXPIRED"
        db.commit()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Approval has expired.")

    approval.status = "APPROVED"
    approval.approved_at = now
    if body and body.user_notes:
        approval.user_notes = body.user_notes

    # Update Task Status
    task = approval.task
    task.status = "APPROVED"

    # Record Agent Action
    action = AgentAction(
        task_id=task.id,
        agent_name="Human Supervisor (Buyer)",
        action_type="APPROVAL_GRANTED",
        output_data=f'{{"approved_amount": "{approval.approved_amount}", "currency": "{approval.currency}"}}',
        reasoning="Explicit human authorization granted. Unlocking PayPal checkout."
    )
    db.add(action)

    db.commit()
    db.refresh(approval)
    return ApprovalResponse.model_validate(approval)


@router.post("/{approval_id}/reject", response_model=ApprovalResponse)
def reject_transaction(
    approval_id: str,
    body: ApprovalActionRequest = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.id == approval_id,
        Approval.user_id == current_user.id
    ).first()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found.")

    approval.status = "REJECTED"
    if body and body.user_notes:
        approval.user_notes = body.user_notes

    task = approval.task
    task.status = "REJECTED"

    db.commit()
    db.refresh(approval)
    return ApprovalResponse.model_validate(approval)
