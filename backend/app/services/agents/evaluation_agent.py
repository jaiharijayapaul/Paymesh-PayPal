from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session
from app.models.provider import Provider
from app.models.task import Task, TaskCandidate


class EvaluationAgent:
    """Evaluation Agent: Evaluates and ranks provider candidates across 5 weighted dimensions."""

    @staticmethod
    def evaluate_and_rank(db: Session, task: Task, candidates: List[Provider]) -> List[TaskCandidate]:
        # Delete any previous candidates for this task to avoid duplicates on re-execution
        db.query(TaskCandidate).filter(TaskCandidate.task_id == task.id).delete()
        db.flush()

        scored_list = []

        for p in candidates:
            # 1. Relevance Score (Max 30)
            relevance = Decimal("30.00") if p.category == task.service_category else Decimal("20.00")

            # 2. Rating Score (Max 25): (rating / 5.0) * 25
            rating_ratio = (p.rating / Decimal("5.00"))
            rating_score = (rating_ratio * Decimal("25.00")).quantize(Decimal("0.01"))

            # 3. Budget Score (Max 20):
            # If starting price <= budget: full 20. If above, score drops based on how close min_price is.
            if p.starting_price <= task.max_budget:
                budget_score = Decimal("20.00")
            elif p.minimum_price <= task.max_budget:
                budget_score = Decimal("16.00")
            else:
                budget_score = Decimal("8.00")

            # 4. Delivery Speed Score (Max 15):
            if p.delivery_days <= task.deadline_days:
                delivery_score = Decimal("15.00")
            else:
                delivery_score = Decimal("8.00")

            # 5. Verification Score (Max 10):
            verification_score = Decimal("10.00") if p.is_verified else Decimal("4.00")

            composite_score = (relevance + rating_score + budget_score + delivery_score + verification_score).quantize(Decimal("0.01"))

            reasoning = (
                f"Candidate '{p.name}' matched category '{p.category}' with a {p.rating}★ rating ({p.review_count} reviews). "
                f"Starting list price is ${p.starting_price} (negotiable floor down to ${p.minimum_price}) with {p.delivery_days}-day delivery. "
                f"Identity verification: {'Verified badge' if p.is_verified else 'Standard'}."
            )

            scored_list.append({
                "provider": p,
                "relevance": relevance,
                "rating": rating_score,
                "budget": budget_score,
                "delivery": delivery_score,
                "verification": verification_score,
                "composite": composite_score,
                "reasoning": reasoning
            })

        # Sort descending by composite score
        scored_list.sort(key=lambda x: x["composite"], reverse=True)

        task_candidates = []
        for index, item in enumerate(scored_list):
            candidate_record = TaskCandidate(
                task_id=task.id,
                provider_id=item["provider"].id,
                relevance_score=item["relevance"],
                rating_score=item["rating"],
                budget_score=item["budget"],
                delivery_score=item["delivery"],
                verification_score=item["verification"],
                composite_score=item["composite"],
                evaluation_reasoning=item["reasoning"],
                rank=index + 1,
                is_selected=(index == 0)
            )
            db.add(candidate_record)
            task_candidates.append(candidate_record)

        db.flush()
        return task_candidates
