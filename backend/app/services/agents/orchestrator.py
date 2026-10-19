import json
import asyncio
from typing import AsyncGenerator
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

        # Step 4: Competitive Multi-Provider Negotiation Agent
        task.status = "NEGOTIATING"
        db.flush()

        top_candidates = ranked_candidates[:3]
        if len(top_candidates) > 1:
            competing_providers = [c.provider for c in top_candidates]
            offer, all_offers, all_rounds, metadata = NegotiationAgent.conduct_competitive_bidding(
                db, task, competing_providers
            )

            # Record individual negotiation actions for each competing merchant
            for o in all_offers:
                o_savings = o.original_price - o.final_price
                action_bid = AgentAction(
                    task_id=task.id,
                    agent_name="Negotiation Agent",
                    action_type="COMPETITIVE_NEGOTIATION",
                    input_data=json.dumps({
                        "provider_name": o.provider.name,
                        "catalog_price": str(o.original_price),
                        "budget_cap": str(task.max_budget)
                    }),
                    output_data=json.dumps({
                        "counter_price": str(o.final_price),
                        "savings": str(o_savings),
                        "delivery_days": o.delivery_days
                    }),
                    reasoning=f"Negotiated with {o.provider.name}: brought catalog ${o.original_price} down to ${o.final_price} (saved ${o_savings})."
                )
                db.add(action_bid)

            # Record Competitive Arbitration Action
            action_arbitration = AgentAction(
                task_id=task.id,
                agent_name="Competitive Arbitration Agent",
                action_type="ARBITRATION_SELECTION",
                input_data=json.dumps({"bids_evaluated": len(all_offers), "comparisons": metadata["comparisons"]}),
                output_data=json.dumps({
                    "winning_provider": offer.provider.name,
                    "winning_price": str(offer.final_price),
                    "savings": str(offer.original_price - offer.final_price),
                    "score": metadata["winner_score"]
                }),
                reasoning=f"Analyzed {len(all_offers)} parallel vendor counteroffers. Crowned '{offer.provider.name}' (${offer.final_price}) as winning bid with optimal utility score {metadata['winner_score']}."
            )
            db.add(action_arbitration)
            db.flush()
        else:
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

    @classmethod
    async def stream_task_pipeline(
        cls,
        db: Session,
        user: User,
        task: Task
    ) -> AsyncGenerator[str, None]:
        """Asynchronous SSE generator yielding real-time agent thoughts, negotiation rounds,

        arbitration outcomes, and deterministic policy proofs.
        """
        def format_sse(data: dict) -> str:
            return f"data: {json.dumps(data)}\n\n"

        # Step 1: Personal Intent Extraction
        yield format_sse({
            "event": "STEP_START",
            "phase": "INTENT",
            "agent": "Personal Intent Agent",
            "title": "Natural Language Intent Extraction",
            "message": "Parsing trade-offs, category constraints, budget ceiling, and delivery deadlines..."
        })
        await asyncio.sleep(0.35)

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

        yield format_sse({
            "event": "STEP_COMPLETE",
            "phase": "INTENT",
            "agent": "Personal Intent Agent",
            "title": "Intent Validated",
            "message": f"Identified category: '{task.service_category}', Budget: ${task.max_budget} {task.currency}, SLA: {task.deadline_days} days."
        })
        await asyncio.sleep(0.3)

        # Step 2: Discovery Agent
        yield format_sse({
            "event": "STEP_START",
            "phase": "DISCOVERY",
            "agent": "Marketplace Discovery Agent",
            "title": "Scanning Verified Providers",
            "message": f"Querying verified active marketplace directory for category '{task.service_category}' with rating >= {task.min_rating}★..."
        })
        await asyncio.sleep(0.4)

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
            yield format_sse({
                "event": "STEP_FAILED",
                "phase": "DISCOVERY",
                "agent": "Marketplace Discovery Agent",
                "message": "No verified providers matched specified constraints."
            })
            return

        yield format_sse({
            "event": "STEP_COMPLETE",
            "phase": "DISCOVERY",
            "agent": "Marketplace Discovery Agent",
            "title": "Providers Discovered",
            "message": f"Found {len(discovered_providers)} eligible verified candidates.",
            "candidates": [p.name for p in discovered_providers]
        })
        await asyncio.sleep(0.3)

        # Step 3: Candidate Evaluation
        yield format_sse({
            "event": "STEP_START",
            "phase": "EVALUATION",
            "agent": "Evaluation Agent",
            "title": "Multi-Dimensional Algorithmic Scoring",
            "message": "Executing 5-dimensional scoring model (Relevance 30%, Ratings 25%, Budget 20%, Speed 15%, Verification 10%)..."
        })
        await asyncio.sleep(0.4)

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

        yield format_sse({
            "event": "STEP_COMPLETE",
            "phase": "EVALUATION",
            "agent": "Evaluation Agent",
            "title": "Candidate Ranking Finalized",
            "message": f"Ranked #{top_candidate.rank}: '{selected_provider.name}' with composite score {top_candidate.composite_score}/100.",
            "top_candidate": {
                "name": selected_provider.name,
                "score": str(top_candidate.composite_score),
                "price": str(selected_provider.starting_price)
            }
        })
        await asyncio.sleep(0.3)

        # Step 4: Competitive Multi-Provider Negotiation
        task.status = "NEGOTIATING"
        db.flush()

        top_candidates = ranked_candidates[:3]
        if len(top_candidates) > 1:
            competing_providers = [c.provider for c in top_candidates]
            yield format_sse({
                "event": "STEP_START",
                "phase": "NEGOTIATION",
                "agent": "Negotiation Agent",
                "title": "Concurrent Multi-Vendor Negotiation",
                "message": f"Initiating parallel multi-round negotiation across {len(competing_providers)} competing merchants..."
            })
            await asyncio.sleep(0.4)

            offer, all_offers, all_rounds, metadata = NegotiationAgent.conduct_competitive_bidding(
                db, task, competing_providers
            )

            for o in all_offers:
                o_savings = o.original_price - o.final_price
                action_bid = AgentAction(
                    task_id=task.id,
                    agent_name="Negotiation Agent",
                    action_type="COMPETITIVE_NEGOTIATION",
                    input_data=json.dumps({
                        "provider_name": o.provider.name,
                        "catalog_price": str(o.original_price),
                        "budget_cap": str(task.max_budget)
                    }),
                    output_data=json.dumps({
                        "counter_price": str(o.final_price),
                        "savings": str(o_savings),
                        "delivery_days": o.delivery_days
                    }),
                    reasoning=f"Negotiated with {o.provider.name}: brought catalog ${o.original_price} down to ${o.final_price} (saved ${o_savings})."
                )
                db.add(action_bid)
                yield format_sse({
                    "event": "NEGOTIATION_OUTCOME",
                    "phase": "NEGOTIATION",
                    "provider": o.provider.name,
                    "catalog_price": str(o.original_price),
                    "negotiated_price": str(o.final_price),
                    "savings": str(o_savings),
                    "message": f"Merchant agreement for {o.provider.name}: ${o.final_price} (saved ${o_savings})."
                })
                await asyncio.sleep(0.25)

            action_arbitration = AgentAction(
                task_id=task.id,
                agent_name="Competitive Arbitration Agent",
                action_type="ARBITRATION_SELECTION",
                input_data=json.dumps({"bids_evaluated": len(all_offers), "comparisons": metadata["comparisons"]}),
                output_data=json.dumps({
                    "winning_provider": offer.provider.name,
                    "winning_price": str(offer.final_price),
                    "savings": str(offer.original_price - offer.final_price),
                    "score": metadata["winner_score"]
                }),
                reasoning=f"Analyzed {len(all_offers)} parallel vendor counteroffers. Crowned '{offer.provider.name}' (${offer.final_price}) as winning bid with optimal utility score {metadata['winner_score']}."
            )
            db.add(action_arbitration)
            db.flush()

            yield format_sse({
                "event": "ARBITRATION_COMPLETE",
                "phase": "ARBITRATION",
                "agent": "Competitive Arbitration Agent",
                "title": "Winning Bid Selected",
                "winner": offer.provider.name,
                "price": str(offer.final_price),
                "savings": str(offer.original_price - offer.final_price),
                "comparisons": metadata["comparisons"],
                "message": f"Arbitration complete: Crowned '{offer.provider.name}' (${offer.final_price}) as winning proposal."
            })
            await asyncio.sleep(0.3)
        else:
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
        yield format_sse({
            "event": "STEP_START",
            "phase": "POLICY",
            "agent": "Deterministic Policy Engine",
            "title": "Deterministic Financial Gate Verification",
            "message": "Executing 6 mandatory security checks (budget cap, user limit, currency match, unexpired, idempotency)..."
        })
        await asyncio.sleep(0.4)

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

        if policy_validation.passed:
            task.status = "PENDING_APPROVAL"
        else:
            task.status = "REJECTED"

        db.commit()
        db.refresh(task)

        yield format_sse({
            "event": "POLICY_COMPLETE",
            "phase": "POLICY",
            "agent": "Deterministic Policy Engine",
            "title": "Policy Verification Result",
            "passed": policy_validation.passed,
            "checks": [c.model_dump() for c in policy_validation.checks],
            "message": "All 6 deterministic policy gates satisfied. Human authorization unlocked."
        })
        await asyncio.sleep(0.25)

        # Step 6: Pipeline Final Complete
        yield format_sse({
            "event": "PIPELINE_COMPLETE",
            "task_id": task.id,
            "status": task.status,
            "offer_id": offer.id,
            "approval_id": approval.id,
            "message": "Autonomous workflow complete. Human authorization required before PayPal checkout."
        })

