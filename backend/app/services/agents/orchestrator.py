import json
from sqlalchemy.orm import Session
from app.models.task import Task
from app.models.user import User
from app.models.agent import AgentAction
from app.services.agents.intent_agent import IntentAgent
from app.services.agents.discovery_agent import DiscoveryAgent
from app.services.agents.evaluation_agent import EvaluationAgent
from app.services.agents.negotiation_agent import NegotiationAgent
from app.services.agents.policy_engine import PolicyEngine


class AgentOrchestrator:
    """Master Multi-Agent Workflow Coordinator."""

    @classmethod
    def execute_task_pipeline(cls, db: Session, user: User, task: Task) -> Task:
        # Step 1: Intent Extraction (if newly created or re-executing)
        task.status = "DISCOVERING"
        db.flush()

        action_intent = AgentAction(
            task_id=task.id,
            agent_name="Personal Intent Agent",
            action_type="INTENT_EXTRACTION",
            input_data=json.dumps({"prompt": task.raw_prompt}),
            output_data=json.dumps({
                "service_category": task.service_category,
                "max_budget": str(task.max_budget),
                "currency": task.currency,
                "deadline_days": task.deadline_days,
                "min_rating": str(task.min_rating)
            }),
            reasoning="Extracted explicit constraints: category, budget ceiling, delivery target, and minimum provider rating."
        )
        db.add(action_intent)
        db.flush()

        # Step 2: Discovery Agent searches marketplace
        discovered_providers = DiscoveryAgent.discover_candidates(db, task)
        action_discovery = AgentAction(
            task_id=task.id,
            agent_name="Marketplace Discovery Agent",
            action_type="PROVIDER_DISCOVERY",
            input_data=json.dumps({"service_category": task.service_category, "min_rating": str(task.min_rating)}),
            output_data=json.dumps({
                "providers_found": len(discovered_providers),
                "candidate_names": [p.name for p in discovered_providers]
            }),
            reasoning=f"Found {len(discovered_providers)} eligible providers matching category '{task.service_category}' with rating >= {task.min_rating}."
        )
        db.add(action_discovery)
        db.flush()

        if not discovered_providers:
            task.status = "FAILED"
            db.commit()
            return task

        # Step 3: Evaluation Agent ranks candidates
        task.status = "EVALUATING"
        db.flush()
        ranked_candidates = EvaluationAgent.evaluate_and_rank(db, task, discovered_providers)
        top_candidate = ranked_candidates[0]
        selected_provider = top_candidate.provider

        action_eval = AgentAction(
            task_id=task.id,
            agent_name="Evaluation Agent",
            action_type="CANDIDATE_EVALUATION",
            input_data=json.dumps({"candidate_count": len(ranked_candidates)}),
            output_data=json.dumps({
                "selected_provider_id": selected_provider.id,
                "selected_provider_name": selected_provider.name,
                "composite_score": str(top_candidate.composite_score),
                "rank": top_candidate.rank
            }),
            reasoning=f"Selected '{selected_provider.name}' with composite score {top_candidate.composite_score}/100. {top_candidate.evaluation_reasoning}"
        )
        db.add(action_eval)
        db.flush()

        # Step 4: Negotiation Agent engages Simulated Merchant Agent
        task.status = "NEGOTIATING"
        db.flush()
        offer, rounds = NegotiationAgent.initiate_negotiation(db, task, selected_provider)

        action_negotiation = AgentAction(
            task_id=task.id,
            agent_name="Negotiation Agent",
            action_type="NEGOTIATION_ROUND",
            input_data=json.dumps({
                "initial_price": str(offer.original_price),
                "budget_ceiling": str(task.max_budget)
            }),
            output_data=json.dumps({
                "final_negotiated_price": str(offer.final_price),
                "savings": str(offer.original_price - offer.final_price),
                "rounds_completed": len(rounds)
            }),
            reasoning=f"Negotiation completed across {len(rounds)} rounds. Final agreed price: ${offer.final_price} (original: ${offer.original_price})."
        )
        db.add(action_negotiation)
        db.flush()

        # Step 5: Policy Engine validates the offer deterministically
        policy_validation = PolicyEngine.validate_offer_policy(db, user, task, offer)
        approval = PolicyEngine.create_or_update_approval(db, user, task, offer)

        action_policy = AgentAction(
            task_id=task.id,
            agent_name="Deterministic Policy Engine",
            action_type="POLICY_VERIFICATION",
            input_data=json.dumps({"offer_id": offer.id, "amount": str(offer.final_price)}),
            output_data=json.dumps({"passed": policy_validation.passed, "approval_id": approval.id}),
            reasoning=policy_validation.reasoning
        )
        db.add(action_policy)

        # Step 6: Task awaits human authorization
        if policy_validation.passed:
            task.status = "PENDING_APPROVAL"
        else:
            task.status = "REJECTED"

        db.commit()
        db.refresh(task)
        return task
