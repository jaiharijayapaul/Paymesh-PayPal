import json
import logging
from fastapi import APIRouter, Request, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.payment import WebhookEvent, Payment
from app.services.payments.paypal_service import PayPalService

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/paypal", status_code=status.HTTP_200_OK)
async def handle_paypal_webhook(request: Request, db: Session = Depends(get_db)):
    raw_body = await request.body()
    body_str = raw_body.decode("utf-8")
    
    headers = {k.lower(): v for k, v in request.headers.items()}
    
    # 1. Verify Webhook Signature
    is_valid = await PayPalService.verify_webhook_signature(headers, body_str)
    if not is_valid:
        logger.warning("PayPal Webhook signature verification failed.")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid webhook signature")

    try:
        event_data = json.loads(body_str)
    except json.JSONDecodeError:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid JSON payload")

    event_id = event_data.get("id")
    event_type = event_data.get("event_type")
    resource = event_data.get("resource", {})

    if not event_id or not event_type:
        return {"status": "ignored", "reason": "Missing event id or type"}

    # 2. Check for duplicate webhook processing
    existing_event = db.query(WebhookEvent).filter(WebhookEvent.paypal_event_id == event_id).first()
    if existing_event:
        logger.info(f"Duplicate webhook event {event_id} ignored.")
        return {"status": "duplicate_ignored"}

    # Persist Webhook Event
    webhook_record = WebhookEvent(
        paypal_event_id=event_id,
        event_type=event_type,
        resource_type=event_data.get("resource_type", "capture"),
        summary=event_data.get("summary", ""),
        status="PROCESSED",
        payload=body_str
    )
    db.add(webhook_record)

    # 3. Handle Event Types
    if event_type == "PAYMENT.CAPTURE.COMPLETED":
        capture_id = resource.get("id")
        # Try to find payment by custom_id or capture_id
        custom_id = resource.get("custom_id")
        payment = None
        if custom_id:
            payment = db.query(Payment).filter(Payment.approval_id == custom_id).first()
        if not payment and capture_id:
            payment = db.query(Payment).filter(Payment.paypal_capture_id == capture_id).first()

        if payment and payment.status != "COMPLETED":
            payment.status = "COMPLETED"
            payment.paypal_capture_id = capture_id
            logger.info(f"Payment {payment.id} marked COMPLETED via webhook.")

    elif event_type == "PAYMENT.CAPTURE.DENIED":
        capture_id = resource.get("id")
        payment = db.query(Payment).filter(Payment.paypal_capture_id == capture_id).first()
        if payment:
            payment.status = "DENIED"
            logger.warning(f"Payment {payment.id} marked DENIED via webhook.")

    elif event_type == "PAYMENT.CAPTURE.PENDING":
        capture_id = resource.get("id")
        payment = db.query(Payment).filter(Payment.paypal_capture_id == capture_id).first()
        if payment:
            payment.status = "PENDING"
            logger.info(f"Payment {payment.id} set to PENDING via webhook.")

    db.commit()
    return {"status": "success", "event_id": event_id}
