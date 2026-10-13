# PayMesh Deployment Guide

This guide covers production deployment:
- **Frontend**: Vercel
- **Backend**: Render / Railway
- **Database**: Managed PostgreSQL (Supabase / Neon / Render Postgres)

---

## 1. Managed PostgreSQL Setup (Neon / Supabase)

1. Provision a free PostgreSQL database instance (e.g. at [Neon.tech](https://neon.tech) or [Supabase](https://supabase.com)).
2. Copy the connection string in standard format:
   ```
   postgresql://user:password@ep-host.region.aws.neon.tech/paymesh_db?sslmode=require
   ```

---

## 2. Backend Deployment on Render

1. Create a new **Web Service** on [Render](https://render.com) pointing to your PayMesh repository.
2. Configure settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python seed.py`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   ```env
   DATABASE_URL=postgresql://user:password@host/paymesh_db?sslmode=require
   SECRET_KEY=generate_a_random_production_secret_32_characters
   PAYPAL_MODE=sandbox
   PAYPAL_CLIENT_ID=your_paypal_client_id
   PAYPAL_CLIENT_SECRET=your_paypal_client_secret
   PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
   FRONTEND_URL=https://paymesh.vercel.app
   BACKEND_URL=https://paymesh-api.onrender.com
   ```

---

## 3. Frontend Deployment on Vercel

1. Import your Git repository into [Vercel](https://vercel.com).
2. Configure project settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
3. Add Environment Variables:
   ```env
   VITE_API_URL=https://paymesh-api.onrender.com/api/v1
   ```
4. Deploy!
