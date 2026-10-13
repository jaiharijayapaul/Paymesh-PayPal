import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine
import app.models  # register all models
from app.api.v1 import (
    auth,
    tasks,
    marketplace,
    offers,
    approvals,
    payments,
    webhooks,
    dashboard
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("paymesh")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure database schema tables exist
    logger.info("Initializing database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("PayMesh API initialized successfully.")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="PayMesh AI Agent Commerce Network with PayPal Sandbox Integration",
    lifespan=lifespan
)

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all for seamless local dev & preview environments
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": "PayMesh AI Commerce API",
        "version": settings.VERSION,
        "paypal_configured": bool(settings.PAYPAL_CLIENT_ID and settings.PAYPAL_CLIENT_SECRET)
    }


# Include v1 Routers
api_v1_router = FastAPI()
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(tasks.router, prefix=f"{settings.API_V1_STR}/tasks", tags=["Tasks"])
app.include_router(marketplace.router, prefix=f"{settings.API_V1_STR}/providers", tags=["Marketplace"])
app.include_router(offers.router, prefix=f"{settings.API_V1_STR}", tags=["Offers & Negotiation"])
app.include_router(approvals.router, prefix=f"{settings.API_V1_STR}/approvals", tags=["Human Approvals"])
app.include_router(payments.router, prefix=f"{settings.API_V1_STR}/payments", tags=["PayPal Payments & Orders"])
app.include_router(webhooks.router, prefix=f"{settings.API_V1_STR}/webhooks", tags=["Webhooks"])
app.include_router(dashboard.router, prefix=f"{settings.API_V1_STR}/dashboard", tags=["Dashboard"])
