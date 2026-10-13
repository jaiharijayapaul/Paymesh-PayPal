from decimal import Decimal
from datetime import datetime, timezone, timedelta
from app.models.task import Task
from app.models.offer import Offer
from app.models.approval import Approval
from app.models.payment import Payment


def test_paypal_order_and_capture_workflow(client, db, auth_headers, test_user, test_provider, monkeypatch):
    task = Task(
        user_id=test_user.id,
        title="Payment Test Task",
        raw_prompt="payment test",
        service_category="logo_design",
        max_budget=Decimal("100.00"),
        currency="USD",
        deadline_days=3,
        min_rating=Decimal("4.50"),
        status="APPROVED"
    )
    db.add(task)
    db.flush()

    offer = Offer(
        task_id=task.id,
        provider_id=test_provider.id,
        version=1,
        original_price=Decimal("110.00"),
        final_price=Decimal("98.00"),
        currency="USD",
        delivery_days=3,
        scope_summary="Full identity branding package",
        status="ACCEPTED",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
    )
    db.add(offer)
    db.flush()

    approval = Approval(
        user_id=test_user.id,
        task_id=task.id,
        offer_id=offer.id,
        offer_version=1,
        approved_amount=Decimal("98.00"),
        currency="USD",
        status="APPROVED",
        policy_check_passed=True,
        expires_at=offer.expires_at
    )
    db.add(approval)
    db.commit()

    # Step 1: Create PayPal Order
    order_res = client.post(
        "/api/v1/payments/create-order",
        headers=auth_headers,
        json={"approval_id": approval.id}
    )
    assert order_res.status_code == 200
    order_data = order_res.json()
    assert "paypal_order_id" in order_data
    payment_id = order_data["payment_id"]
    paypal_order_id = order_data["paypal_order_id"]

    # Mock server-side capture response as per Section 10 of specification
    async def mock_capture(order_id: str):
        return {
            "id": order_id,
            "status": "COMPLETED",
            "payer": {"email_address": "sandbox-buyer@paymesh.ai"},
            "purchase_units": [
                {
                    "payments": {
                        "captures": [
                            {"id": f"CAP-{order_id[-6:]}", "status": "COMPLETED", "amount": {"value": "98.00", "currency_code": "USD"}}
                        ]
                    }
                }
            ]
        }
    monkeypatch.setattr("app.services.payments.paypal_service.PayPalService.capture_order", mock_capture)

    # Step 2: Capture PayPal Order server-side
    capture_res = client.post(
        "/api/v1/payments/capture-order",
        headers=auth_headers,
        json={"payment_id": payment_id, "paypal_order_id": paypal_order_id}
    )
    assert capture_res.status_code == 200
    capture_data = capture_res.json()
    assert capture_data["status"] == "COMPLETED"

    # Step 3: Verify Order Fulfillment created
    orders_res = client.get("/api/v1/payments/orders/list", headers=auth_headers)
    assert orders_res.status_code == 200
    orders_list = orders_res.json()
    assert len(orders_list) >= 1
    assert orders_list[0]["fulfillment_status"] == "CONFIRMED"
    assert "Simulated Merchant Agent" in orders_list[0]["merchant_acknowledgment"]

    # Step 4: Duplicate payment prevention check
    dup_res = client.post(
        "/api/v1/payments/create-order",
        headers=auth_headers,
        json={"approval_id": approval.id}
    )
    assert dup_res.status_code == 400


def test_webhook_duplicate_protection(client, db):
    payload = {
        "id": "WH-TEST-EVENT-101",
        "event_type": "PAYMENT.CAPTURE.COMPLETED",
        "resource_type": "capture",
        "summary": "Capture completed",
        "resource": {
            "id": "CAP-TEST-101",
            "status": "COMPLETED"
        }
    }

    # First event
    res1 = client.post("/api/v1/webhooks/paypal", json=payload)
    assert res1.status_code == 200
    assert res1.json()["status"] == "success"

    # Second event (duplicate)
    res2 = client.post("/api/v1/webhooks/paypal", json=payload)
    assert res2.status_code == 200
    assert res2.json()["status"] == "duplicate_ignored"
