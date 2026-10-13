from decimal import Decimal
from app.models.task import Task
from app.models.user import User
from app.core.security import hash_password, create_access_token


def test_auth_workflow(client):
    # Register
    reg_res = client.post("/api/v1/auth/register", json={
        "email": "newuser@paymesh.ai",
        "password": "strongpassword123",
        "full_name": "New Developer"
    })
    assert reg_res.status_code == 201
    data = reg_res.json()
    assert "access_token" in data
    assert data["user"]["email"] == "newuser@paymesh.ai"

    # Login
    login_res = client.post("/api/v1/auth/login", json={
        "email": "newuser@paymesh.ai",
        "password": "strongpassword123"
    })
    assert login_res.status_code == 200
    assert "access_token" in login_res.json()


def test_create_and_execute_task(client, auth_headers, test_provider):
    # Create task with natural language prompt
    res = client.post(
        "/api/v1/tasks",
        headers=auth_headers,
        json={"prompt": "Find me a professional logo designer for my startup under $100 within 3 days rated above 4.5."}
    )
    assert res.status_code == 201
    task = res.json()
    task_id = task["id"]
    assert task["service_category"] == "logo_design"
    assert Decimal(str(task["max_budget"])) == Decimal("100.00")

    # Execute full pipeline
    exec_res = client.post(f"/api/v1/tasks/{task_id}/execute", headers=auth_headers)
    assert exec_res.status_code == 200
    exec_data = exec_res.json()
    assert exec_data["status"] == "PENDING_APPROVAL"

    # Check timeline
    timeline_res = client.get(f"/api/v1/tasks/{task_id}/timeline", headers=auth_headers)
    assert timeline_res.status_code == 200
    timeline = timeline_res.json()
    assert len(timeline["actions"]) >= 4

    # Check pending approvals
    approvals_res = client.get("/api/v1/approvals/pending", headers=auth_headers)
    assert approvals_res.status_code == 200
    approvals = approvals_res.json()
    assert len(approvals) >= 1
    approval = approvals[0]
    assert approval["status"] == "PENDING"
    assert Decimal(str(approval["approved_amount"])) <= Decimal("100.00")

    # Human approves transaction
    app_id = approval["id"]
    approve_res = client.post(f"/api/v1/approvals/{app_id}/approve", headers=auth_headers, json={"user_notes": "Approved by founder"})
    assert approve_res.status_code == 200
    assert approve_res.json()["status"] == "APPROVED"


def test_user_access_isolation(client, db, auth_headers, test_provider):
    # Create another user
    other_user = User(
        email="other@paymesh.ai",
        hashed_password=hash_password("password123"),
        full_name="Other User"
    )
    db.add(other_user)
    db.flush()

    # Create task belonging to other user
    other_task = Task(
        user_id=other_user.id,
        title="Other's Secret Task",
        raw_prompt="secret project",
        service_category="logo_design",
        max_budget=Decimal("150.00"),
        currency="USD",
        deadline_days=3,
        min_rating=Decimal("4.00"),
        status="PENDING"
    )
    db.add(other_task)
    db.commit()

    # Attempt to fetch other user's task with test_user headers
    res = client.get(f"/api/v1/tasks/{other_task.id}", headers=auth_headers)
    assert res.status_code == 404
