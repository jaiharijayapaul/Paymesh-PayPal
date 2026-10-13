import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.approval import Approval
from app.models.payment import Payment, Order
from app.models.agent import AgentAction
from app.schemas.payment import (
    CreatePayPalOrderRequest,
    PayPalOrderResponse,
    CapturePaymentRequest,
    PaymentResponse,
    OrderResponse
)
from app.services.payments.paypal_service import PayPalService
from app.core.config import settings
from app.api.deps import get_current_user

router = APIRouter()


@router.post("/create-order", response_model=PayPalOrderResponse)
async def create_paypal_order(
    req: CreatePayPalOrderRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    approval = db.query(Approval).filter(
        Approval.id == req.approval_id,
        Approval.user_id == current_user.id
    ).first()
    if not approval:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Approval not found.")

    if approval.status != "APPROVED":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Approval status is '{approval.status}'. Explicit human authorization required prior to payment."
        )

    # Check for existing completed payment
    existing = db.query(Payment).filter(
        Payment.approval_id == approval.id,
        Payment.status == "COMPLETED"
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payment already completed for this approval.")

    # Call PayPal Orders v2 API
    order_data = await PayPalService.create_order(
        amount=approval.approved_amount,
        currency=approval.currency,
        custom_id=approval.id,
        description=f"PayMesh Service: {approval.task.title}"
    )

    paypal_order_id = order_data["id"]

    # Persist or update Payment record
    payment = db.query(Payment).filter(Payment.approval_id == approval.id).first()
    if not payment:
        payment = Payment(
            user_id=current_user.id,
            task_id=approval.task_id,
            approval_id=approval.id,
            paypal_order_id=paypal_order_id,
            amount=approval.approved_amount,
            currency=approval.currency,
            status="CREATED",
            gateway_response=json.dumps(order_data)
        )
        db.add(payment)
    else:
        payment.paypal_order_id = paypal_order_id
        payment.status = "CREATED"
        payment.gateway_response = json.dumps(order_data)

    approval.task.status = "PAYMENT_PENDING"
    db.commit()
    db.refresh(payment)

    approval_url = None
    for link in order_data.get("links", []):
        if link.get("rel") == "approve":
            approval_url = link.get("href")
            break

    return PayPalOrderResponse(
        payment_id=payment.id,
        paypal_order_id=paypal_order_id,
        status="CREATED",
        amount=approval.approved_amount,
        currency=approval.currency,
        approval_id=approval.id,
        client_id=settings.PAYPAL_CLIENT_ID or "sb",
        approval_url=approval_url
    )


@router.post("/capture-order", response_model=PaymentResponse)
async def capture_paypal_order(
    req: CapturePaymentRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(
        Payment.id == req.payment_id,
        Payment.user_id == current_user.id
    ).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment record not found.")

    if payment.status == "COMPLETED":
        return PaymentResponse.model_validate(payment)

    # Execute PayPal server-side capture
    capture_data = await PayPalService.capture_order(req.paypal_order_id)
    capture_status = capture_data.get("status", "FAILED")

    if capture_status != "COMPLETED":
        payment.status = "FAILED"
        payment.gateway_response = json.dumps(capture_data)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Payment capture returned status '{capture_status}'."
        )

    # Extract capture ID and payer email safely
    capture_id = None
    try:
        captures = capture_data.get("purchase_units", [])[0].get("payments", {}).get("captures", [])
        if captures:
            capture_id = captures[0].get("id")
    except Exception:
        pass

    payer_email = capture_data.get("payer", {}).get("email_address", "sandbox-buyer@paymesh.ai")

    # Update Payment state
    payment.status = "COMPLETED"
    payment.paypal_capture_id = capture_id or f"CAP-{payment.id[:8]}"
    payment.payer_email = payer_email
    payment.gateway_response = json.dumps(capture_data)

    # Create Order Fulfillment
    approval = payment.approval
    task = payment.task
    provider = approval.offer.provider

    order = Order(
        user_id=current_user.id,
        task_id=task.id,
        provider_id=provider.id,
        payment_id=payment.id,
        total_amount=payment.amount,
        currency=payment.currency,
        fulfillment_status="CONFIRMED",
        merchant_acknowledgment=(
            f"[Simulated Merchant Agent for {provider.name}] Payment verified via PayPal Sandbox "
            f"(Transaction ID: {payment.paypal_capture_id}). Order confirmed! Work has commenced with delivery in "
            f"{approval.offer.delivery_days} days."
        )
    )
    db.add(order)

    # Update Task Status
    task.status = "COMPLETED"

    # Record Agent Action for payment verification and merchant fulfillment
    action = AgentAction(
        task_id=task.id,
        agent_name="PayPal Settlement & Merchant Fulfillment",
        action_type="PAYMENT_CAPTURED_AND_FULFILLED",
        output_data=json.dumps({
            "paypal_order_id": payment.paypal_order_id,
            "paypal_capture_id": payment.paypal_capture_id,
            "amount": str(payment.amount),
            "currency": payment.currency
        }),
        reasoning=f"PayPal Sandbox capture verified. Merchant Agent notified; order {order.id} status confirmed."
    )
    db.add(action)

    db.commit()
    db.refresh(payment)
    return PaymentResponse.model_validate(payment)


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment_details(
    payment_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payment = db.query(Payment).filter(
        Payment.id == payment_id,
        Payment.user_id == current_user.id
    ).first()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found.")
    return PaymentResponse.model_validate(payment)


@router.get("", response_model=List[PaymentResponse])
def list_payments(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    payments = db.query(Payment).filter(Payment.user_id == current_user.id).order_by(Payment.created_at.desc()).all()
    return [PaymentResponse.model_validate(p) for p in payments]


@router.get("/orders/list", response_model=List[OrderResponse])
def list_orders(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.created_at.desc()).all()
    return [OrderResponse.model_validate(o) for o in orders]
