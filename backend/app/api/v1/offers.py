from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.task import Task
from app.models.offer import Offer
from app.schemas.offer import OfferResponse, NegotiateRequest
from app.services.agents.negotiation_agent import NegotiationAgent
from app.services.agents.policy_engine import PolicyEngine
from app.api.deps import get_current_user

router = APIRouter()


@router.get("/tasks/{task_id}/offers", response_model=List[OfferResponse])
def get_task_offers(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found or unauthorized.")

    offers = db.query(Offer).filter(Offer.task_id == task_id).order_by(Offer.created_at.desc()).all()
    return [OfferResponse.model_validate(o) for o in offers]


@router.post("/offers/{offer_id}/negotiate", response_model=OfferResponse)
def counter_negotiate_offer(
    offer_id: str,
    req: NegotiateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")

    task = offer.task
    if task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

    if not req.target_price:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Target price is required.")

    updated_offer, _, _ = NegotiationAgent.counter_negotiate(
        db,
        offer,
        req.target_price,
        req.user_message or f"Revise proposal to ${req.target_price}"
    )

    # Invalidate previous approvals and generate fresh approval bound to the new version
    PolicyEngine.create_or_update_approval(db, current_user, task, updated_offer)
    db.commit()
    db.refresh(updated_offer)
    return OfferResponse.model_validate(updated_offer)


@router.post("/offers/{offer_id}/accept", response_model=OfferResponse)
def accept_offer(
    offer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")

    if offer.task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

    offer.status = "ACCEPTED"
    db.commit()
    db.refresh(offer)
    return OfferResponse.model_validate(offer)


@router.post("/offers/{offer_id}/reject", response_model=OfferResponse)
def reject_offer(
    offer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")

    if offer.task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

    offer.status = "REJECTED"
    offer.task.status = "REJECTED"
    db.commit()
    db.refresh(offer)
    return OfferResponse.model_validate(offer)
