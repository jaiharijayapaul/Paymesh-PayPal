import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.task import Task
from app.models.offer import Offer
from app.models.agent import AgentAction
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


@router.post("/offers/{offer_id}/select", response_model=OfferResponse)
def select_competitive_bid(
    offer_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Allows user to manually switch the designated winning bid among the competitive proposals."""
    offer = db.query(Offer).filter(Offer.id == offer_id).first()
    if not offer:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Offer not found.")

    task = offer.task
    if task.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unauthorized.")

    # Validate the selected offer against the deterministic policy engine
    validation = PolicyEngine.validate_offer_policy(db, current_user, task, offer)
    if not validation.passed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot select this bid: {validation.reasoning}"
        )

    # Demote current PROPOSED offer(s) for this task to COMPETITIVE_BID
    all_offers = db.query(Offer).filter(Offer.task_id == task.id).all()
    for o in all_offers:
        if o.id == offer.id:
            o.status = "PROPOSED"
        elif o.status == "PROPOSED":
            o.status = "COMPETITIVE_BID"

    # Bind fresh approval record to this newly selected offer
    PolicyEngine.create_or_update_approval(db, current_user, task, offer)

    # Log action to agent timeline
    action = AgentAction(
        task_id=task.id,
        agent_name="Human Supervisor Gate",
        action_type="BID_SELECTION_OVERRIDE",
        input_data=json.dumps({"selected_offer_id": offer.id, "provider_name": offer.provider.name}),
        output_data=json.dumps({"final_price": str(offer.final_price), "status": "PROPOSED"}),
        reasoning=f"User manually designated {offer.provider.name} (${offer.final_price}) as the winning bid for authorization."
    )
    db.add(action)
    db.commit()
    db.refresh(offer)
    return OfferResponse.model_validate(offer)

