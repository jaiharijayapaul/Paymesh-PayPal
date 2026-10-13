from decimal import Decimal
from datetime import datetime, timezone, timedelta
from app.services.agents.intent_agent import IntentAgent
from app.services.agents.discovery_agent import DiscoveryAgent
from app.services.agents.evaluation_agent import EvaluationAgent
from app.services.agents.negotiation_agent import NegotiationAgent
from app.services.agents.policy_engine import PolicyEngine
from app.models.task import Task
from app.models.offer import Offer
from app.models.provider import Provider


def test_intent_extraction():
    prompt = "Find me a professional logo designer for my startup. My maximum budget is $100, delivery must be within 3 days, and I prefer providers rated above 4.5. Negotiate the best reasonable price and ask me before making any payment."
    result = IntentAgent.extract_intent(prompt)

    assert result.service_category == "logo_design"
    assert result.max_budget == Decimal("100.00")
    assert result.deadline_days == 3
    assert result.min_rating == Decimal("4.5")
    assert "Logo" in result.title


def test_discovery_and_ranking(db, test_provider):
    task = Task(
        user_id="fake-user-id",
        title="Logo Task",
        raw_prompt="need logo",
        service_category="logo_design",
        max_budget=Decimal("100.00"),
        currency="USD",
        deadline_days=3,
        min_rating=Decimal("4.50"),
        status="DISCOVERING"
    )
    db.add(task)
    db.commit()

    candidates = DiscoveryAgent.discover_candidates(db, task)
    assert len(candidates) >= 1
    assert any(c.id == test_provider.id for c in candidates)

    ranked = EvaluationAgent.evaluate_and_rank(db, task, candidates)
    assert len(ranked) >= 1
    assert ranked[0].rank == 1
    assert ranked[0].is_selected is True
    assert ranked[0].composite_score > 0


def test_negotiation_agent_constraints(db, test_provider):
    task = Task(
        user_id="fake-user-id",
        title="Logo Negotiation Task",
        raw_prompt="negotiate logo",
        service_category="logo_design",
        max_budget=Decimal("100.00"),
        currency="USD",
        deadline_days=3,
        min_rating=Decimal("4.50"),
        status="NEGOTIATING"
    )
    db.add(task)
    db.commit()

    offer, rounds = NegotiationAgent.initiate_negotiation(db, task, test_provider)
    assert offer.original_price == Decimal("110.00")
    # Must negotiate down to <= $100 and >= $85 (provider min)
    assert offer.final_price <= Decimal("100.00")
    assert offer.final_price >= test_provider.minimum_price
    assert len(rounds) == 4
    assert any(r.sender == "BUYER_AGENT" for r in rounds)
    assert any(r.sender == "MERCHANT_AGENT" for r in rounds)


def test_policy_engine_validation(db, test_user, test_provider):
    task = Task(
        user_id=test_user.id,
        title="Policy Validated Task",
        raw_prompt="test policy",
        service_category="logo_design",
        max_budget=Decimal("100.00"),
        currency="USD",
        deadline_days=3,
        min_rating=Decimal("4.50"),
        status="PENDING_APPROVAL"
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
        scope_summary="Full logo identity package",
        status="PROPOSED",
        expires_at=datetime.now(timezone.utc) + timedelta(hours=24)
    )
    db.add(offer)
    db.flush()

    # Test passing scenario
    result = PolicyEngine.validate_offer_policy(db, test_user, task, offer)
    assert result.passed is True
    assert result.overall_status == "PASS"

    # Test failing scenario: budget exceeded
    offer.final_price = Decimal("150.00")
    result_fail = PolicyEngine.validate_offer_policy(db, test_user, task, offer)
    assert result_fail.passed is False
    assert any(c.rule_name == "TASK_BUDGET_CEILING" and not c.passed for c in result_fail.checks)
