from datetime import datetime
from decimal import Decimal
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict


class CreatePayPalOrderRequest(BaseModel):
    approval_id: str


class PayPalOrderResponse(BaseModel):
    payment_id: str
    paypal_order_id: str
    status: str
    amount: Decimal
    currency: str
    approval_id: str
    client_id: str


class CapturePaymentRequest(BaseModel):
    payment_id: str
    paypal_order_id: str


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    task_id: str
    approval_id: str
    paypal_order_id: Optional[str] = None
    paypal_capture_id: Optional[str] = None
    amount: Decimal
    currency: str
    status: str
    payer_email: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    task_id: str
    provider_id: str
    payment_id: str
    total_amount: Decimal
    currency: str
    fulfillment_status: str
    merchant_acknowledgment: Optional[str] = None
    delivery_deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
