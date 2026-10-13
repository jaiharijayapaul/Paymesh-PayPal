# PayPal Sandbox Integration Guide

PayMesh integrates genuine PayPal Sandbox Checkout using the **PayPal Orders v2 REST API**.

---

## 1. Creating a PayPal Developer Account

1. Navigate to the [PayPal Developer Dashboard](https://developer.paypal.com/).
2. Log in with your standard PayPal credentials or create a free developer account.
3. In the left navigation, select **Apps & Credentials**.
4. Toggle to the **Sandbox** tab.
5. Click **Create App**:
   - **App Name**: `PayMesh AI Commerce`
   - **App Type**: `Merchant`
   - **Sandbox Business Account**: Select the default business account or create one.

---

## 2. Extracting Credentials

Copy the following credentials into your PayMesh `.env` or backend environment:

```env
PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_sandbox_client_id_here
PAYPAL_CLIENT_SECRET=your_sandbox_client_secret_here
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
```

> **Security Rule:** Never expose `PAYPAL_CLIENT_SECRET` to the frontend repository or browser bundle. It is used strictly on the FastAPI backend to acquire ephemeral OAuth 2.0 bearer tokens.

---

## 3. Sandbox Buyer Accounts for Testing

1. In the PayPal Developer Dashboard, navigate to **Testing Tools** > **Sandbox Accounts**.
2. Locate the default personal account (e.g., `sb-buyerXXXX@personal.example.com`).
3. Click the three dots `...` > **View/Edit Account** to retrieve the system-generated password.
4. During testing in PayMesh, you can log in with this sandbox personal account when PayPal Checkout opens.

---

## 4. Webhook Setup (Optional for Local, Required for Production)

1. Under your app in **Apps & Credentials**, scroll down to **Webhooks** and click **Add Webhook**.
2. Set the Webhook URL to: `https://your-domain.com/api/v1/webhooks/paypal` (or your local ngrok HTTPS tunnel).
3. Select the following event triggers:
   - `Payment capture completed` (`PAYMENT.CAPTURE.COMPLETED`)
   - `Payment capture pending` (`PAYMENT.CAPTURE.PENDING`)
   - `Payment capture denied` (`PAYMENT.CAPTURE.DENIED`)
4. Copy the resulting **Webhook ID** and set:
   ```env
   PAYPAL_WEBHOOK_ID=your_webhook_id_here
   ```

---

## 5. Built-in Deterministic Demo Fallback

If `PAYPAL_CLIENT_ID` or `PAYPAL_CLIENT_SECRET` are not provided in `.env`:
- PayMesh automatically operates in **Deterministic High-Fidelity Simulation Mode**.
- Orders, approvals, captures, and transaction receipts are generated with clean `MOCK-SANDBOX-` prefixes.
- This ensures reviewers and judges can test the full end-to-end commerce loop immediately without needing credentials upfront!
