import json
from datetime import datetime, timezone
from decimal import Decimal
from typing import Tuple
from sqlalchemy.orm import Session
from app.models.offer import Offer
from app.models.task import Task
from app.models.user import User
from app.models.payment import Payment
from app.models.approval import Approval
from app.schemas.approval import PolicyValidationResult, PolicyRuleCheck


class PolicyEngine:
    """Deterministic Risk and Policy Engine. Enforces rigorous financial authorization gates."""

    @staticmethod
    def validate_offer_policy(
        db: Session,
        user: User,
        task: Task,
        offer: Offer
    ) -> PolicyValidationResult:
        checks: list[PolicyRuleCheck] = []
        overall_passed = True

        # 1. Budget Constraint Check
        budget_passed = offer.final_price <= task.max_budget
        checks.append(PolicyRuleCheck(
            rule_name="TASK_BUDGET_CEILING",
            passed=budget_passed,
            details=f"Offer final price (${offer.final_price}) is {'within' if budget_passed else 'EXCEEDS'} task budget (${task.max_budget})."
        ))
        if not budget_passed:
            overall_passed = False

        # 2. User Profile Max Limit Check
        user_max = user.preferences.max_transaction_amount if user.preferences else Decimal("1000.00")
        limit_passed = offer.final_price <= user_max
        checks.append(PolicyRuleCheck(
            rule_name="USER_TRANSACTION_LIMIT",
            passed=limit_passed,
            details=f"Offer amount (${offer.final_price}) is {'within' if limit_passed else 'EXCEEDS'} user account cap (${user_max})."
        ))
        if not limit_passed:
            overall_passed = False

        # 3. Currency Match Check
        currency_passed = offer.currency == task.currency
        checks.append(PolicyRuleCheck(
            rule_name="CURRENCY_CONSISTENCY",
            passed=currency_passed,
            details=f"Offer currency '{offer.currency}' matches authorized task currency '{task.currency}'."
        ))
        if not currency_passed:
            overall_passed = False

        # 4. Provider Eligibility & Verification Check
        provider = offer.provider
        provider_passed = provider.is_available and provider.is_verified
        checks.append(PolicyRuleCheck(
            rule_name="PROVIDER_ELIGIBILITY",
            passed=provider_passed,
            details=f"Provider '{provider.name}' is {'verified & available' if provider_passed else 'ineligible or unverified'}."
        ))
        if not provider_passed:
            overall_passed = False

        # 5. Offer Expiry Check
        now = datetime.now(timezone.utc)
        expiry_passed = offer.expires_at.tzinfo is not None and offer.expires_at > now or offer.expires_at.replace(tzinfo=timezone.utc) > now
        checks.append(PolicyRuleCheck(
            rule_name="OFFER_EXPIRY_CHECK",
            passed=expiry_passed,
            details=f"Offer is valid until {offer.expires_at.isoformat()}."
        ))
        if not expiry_passed:
            overall_passed = False

        # 6. Duplicate Payment Prevention Check
        existing_payment = db.query(Payment).filter(
            Payment.task_id == task.id,
            Payment.status.in_(["COMPLETED", "APPROVED"])
        ).first()
        no_dup_passed = existing_payment is None
        checks.append(PolicyRuleCheck(
            rule_name="DUPLICATE_PAYMENT_PREVENTION",
            passed=no_dup_passed,
            details="No prior finalized or pending capture payment exists for this task." if no_dup_passed else f"Payment already recorded: {existing_payment.id}."
        ))
        if not no_dup_passed:
            overall_passed = False

        reasoning = (
            "All deterministic risk rules satisfied. Transaction ready for explicit human authorization."
            if overall_passed else
            "Policy engine rejected transaction due to security or budget rule violations."
        )

        return PolicyValidationResult(
            passed=overall_passed,
            overall_status="PASS" if overall_passed else "FAIL",
            checks=checks,
            reasoning=reasoning
        )

    @classmethod
    def create_or_update_approval(
        cls,
        db: Session,
        user: User,
        task: Task,
        offer: Offer
    ) -> Approval:
        validation = cls.validate_offer_policy(db, user, task, offer)

        # Invalidate any old approvals for this task
        old_approvals = db.query(Approval).filter(Approval.task_id == task.id).all()
        for app in old_approvals:
            app.status = "INVALIDATED"
        db.flush()

        approval = Approval(
            user_id=user.id,
            task_id=task.id,
            offer_id=offer.id,
            offer_version=offer.version,
            approved_amount=offer.final_price,
            currency=offer.currency,
            status="PENDING",
            policy_check_passed=validation.passed,
            policy_details=validation.model_dump_json(),
            expires_at=offer.expires_at
        )
        db.add(approval)
        db.flush()
        return approval
