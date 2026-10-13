import pytest
from decimal import Decimal
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.db.base import Base
from app.db.session import get_db
from app.main import app
from app.models.user import User, UserPreference
from app.models.provider import Provider
from app.core.security import hash_password, create_access_token

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_db():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def db():
    connection = engine.connect()
    transaction = connection.begin()
    session = TestingSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture
def client(db):
    def override_get_db():
        yield db

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_user(db):
    user = User(
        email="testuser@paymesh.ai",
        hashed_password=hash_password("password123"),
        full_name="Test Operator"
    )
    db.add(user)
    db.flush()

    pref = UserPreference(
        user_id=user.id,
        preferred_currency="USD",
        max_transaction_amount=Decimal("500.00"),
        min_provider_rating=Decimal("4.50"),
        preferred_delivery_days=3,
        mandatory_payment_approval=True
    )
    db.add(pref)
    db.commit()
    return user


@pytest.fixture
def auth_headers(test_user):
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture
def test_provider(db):
    provider = Provider(
        name="Test Designer Co.",
        tagline="Top rated design agency",
        description="Providing top notch vector branding",
        category="logo_design",
        rating=Decimal("4.90"),
        review_count=50,
        starting_price=Decimal("110.00"),
        minimum_price=Decimal("85.00"),
        currency="USD",
        delivery_days=3,
        is_available=True,
        is_verified=True
    )
    db.add(provider)
    db.commit()
    return provider
