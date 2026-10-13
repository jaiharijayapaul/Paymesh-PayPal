# PayMesh REST API Contract

Base URL: `/api/v1`  
All protected endpoints require `Authorization: Bearer <JWT_ACCESS_TOKEN>`.

---

## 1. Authentication & User Profile

### `POST /auth/register`
Creates a new buyer/operator account and initializes default risk preferences.
- **Request:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123",
    "full_name": "Alex Mercer"
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "access_token": "eyJhbGciOiJIUzI1NiIsIn...",
    "token_type": "bearer",
    "user": {
      "id": "uuid-string",
      "email": "user@example.com",
      "full_name": "Alex Mercer",
      "is_active": true,
      "created_at": "2026-10-12T12:00:00Z"
    }
  }
  ```

### `POST /auth/login`
Authenticates credentials and issues JWT token.
- **Request:**
  ```json
  {
    "email": "user@example.com",
    "password": "securepassword123"
  }
  ```

### `GET /auth/me`
Fetches current authenticated operator profile and preferences.

### `PUT /auth/preferences`
Updates personal policy boundaries.
- **Request:**
  ```json
  {
    "preferred_currency": "USD",
    "max_transaction_amount": 500.00,
    "min_provider_rating": 4.5,
    "preferred_delivery_days": 3,
    "mandatory_payment_approval": true
  }
  ```

---

## 2. Tasks & Multi-Agent Orchestration

### `POST /tasks`
Submits a natural language commerce prompt. Personal Intent Agent parses structured parameters.
- **Request:**
  ```json
  {
    "prompt": "Find me a professional logo designer for my startup under $100 within 3 days rated above 4.5."
  }
  ```
- **Response (201 Created):**
  ```json
  {
    "id": "task-uuid",
    "title": "Startup Logo Design & Brand Mark",
    "service_category": "logo_design",
    "max_budget": 100.00,
    "currency": "USD",
    "deadline_days": 3,
    "min_rating": 4.50,
    "status": "PENDING"
  }
  ```

### `GET /tasks`
Lists all tasks submitted by the authenticated user.

### `GET /tasks/{task_id}`
Retrieves specific task details with evaluated candidates and action history.

### `POST /tasks/{task_id}/execute`
Runs the coordinated multi-agent orchestration pipeline:
1. Intent Extraction
2. Provider Discovery
3. Candidate Evaluation & Ranking
4. Provider Merchant Agent Negotiation
5. Deterministic Policy Engine Validation
6. Creation of immutable Approval record

### `GET /tasks/{task_id}/timeline`
Returns the chronological audit log of all agent reasoning steps.

---

## 3. Marketplace

### `GET /providers`
Queries active service providers with optional query parameters:
- `category`: Filter by category (e.g., `logo_design`, `web_development`)
- `min_rating`: Minimum rating filter (e.g., `4.5`)
- `max_price`: Maximum starting catalog price
- `search`: Keyword search across name and bio

### `GET /providers/{provider_id}`
Returns complete provider profile, verified skills, and sample works.

---

## 4. Offers & Negotiation

### `GET /tasks/{task_id}/offers`
Lists proposals generated for the task.

### `POST /offers/{offer_id}/negotiate`
Directs the Buyer Agent to counter-offer with specific price and instructions.

---

## 5. Human Approvals

### `GET /approvals/pending`
Returns all transactions currently awaiting explicit human sign-off.

### `POST /approvals/{approval_id}/approve`
Signs the transaction authorization. **Unlocks PayPal Sandbox Checkout**.

### `POST /approvals/{approval_id}/reject`
Rejects the proposal and halts payment processing.

---

## 6. Payments & PayPal Orders v2

### `POST /payments/create-order`
Creates a PayPal Sandbox Order (intent: `CAPTURE`) on the server.
- **Request:**
  ```json
  {
    "approval_id": "approval-uuid"
  }
  ```
- **Response:**
  ```json
  {
    "payment_id": "payment-uuid",
    "paypal_order_id": "ORDER-ID-OR-MOCK",
    "status": "CREATED",
    "amount": 98.00,
    "currency": "USD",
    "approval_id": "approval-uuid",
    "client_id": "paypal-client-id"
  }
  ```

### `POST /payments/capture-order`
Executes server-side capture of the approved PayPal order.
- **Response:**
  ```json
  {
    "id": "payment-uuid",
    "status": "COMPLETED",
    "paypal_capture_id": "CAPTURE-ID",
    "amount": 98.00,
    "currency": "USD"
  }
  ```

---

## 7. Webhooks

### `POST /webhooks/paypal`
Receives asynchronous PayPal events (`PAYMENT.CAPTURE.COMPLETED`, etc.), verifies signatures, prevents duplicates, and updates state.

---

## 8. Dashboard Metrics

### `GET /dashboard/summary`
Calculates real-time values from persisted database records:
- `active_tasks`: Count of in-flight tasks
- `pending_approvals`: Count of approvals awaiting human signature
- `completed_sandbox_payments`: Number of captured payments
- `total_sandbox_transaction_value`: Total dollars captured
- `estimated_negotiated_savings`: Total dollars saved through agent negotiation
- `average_offer_discount_pct`: Mean % discount achieved
- `orders_in_progress`: Current active order deliverables
