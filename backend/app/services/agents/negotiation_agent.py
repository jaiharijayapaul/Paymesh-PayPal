from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import Tuple
from sqlalchemy.orm import Session
from app.models.provider import Provider
from app.models.task import Task
from app.models.offer import Offer, Negotiation


class NegotiationAgent:
    """Coordinates simulated negotiation rounds between the Buyer Personal Agent and the Provider Merchant Agent."""

    @classmethod
    def initiate_negotiation(
        cls,
        db: Session,
        task: Task,
        provider: Provider
    ) -> Tuple[Offer, list[Negotiation]]:
        # Invalidate/supersede any existing pending offers for this task
        existing_offers = db.query(Offer).filter(Offer.task_id == task.id).all()
        for eo in existing_offers:
            eo.status = "SUPERSEDED"
        db.flush()

        initial_price = provider.starting_price
        user_budget = task.max_budget
        min_reserve = provider.minimum_price

        # Default expiry: 48 hours from now
        expires_at = datetime.now(timezone.utc) + timedelta(hours=48)

        # Create new Offer
        offer = Offer(
            task_id=task.id,
            provider_id=provider.id,
            version=1,
            original_price=initial_price,
            final_price=initial_price,  # will update after negotiation rounds
            currency=task.currency,
            delivery_days=min(provider.delivery_days, task.deadline_days),
            scope_summary=f"Full {task.title} deliverable by {provider.name} including source files, revisions, and commercial licensing.",
            status="PROPOSED",
            expires_at=expires_at
        )
        db.add(offer)
        db.flush()

        rounds = cls._simulate_negotiation_rounds(db, offer, task, provider)
        db.flush()
        return offer, rounds

    @classmethod
    def _simulate_negotiation_rounds(
        cls,
        db: Session,
        offer: Offer,
        task: Task,
        provider: Provider
    ) -> list[Negotiation]:
        initial_price = provider.starting_price
        user_budget = task.max_budget
        min_reserve = provider.minimum_price

        negotiation_rounds: list[Negotiation] = []

        # Round 1: Provider Merchant presents catalog price
        r1 = Negotiation(
            offer_id=offer.id,
            round_number=1,
            sender="MERCHANT_AGENT",
            proposed_price=initial_price,
            message=f"[Simulated Merchant Agent for {provider.name}] Welcome! Our catalog rate for this project tier is ${initial_price} with delivery in {provider.delivery_days} days.",
            rationale=f"Standard catalog rate for verified tier service."
        )
        db.add(r1)
        negotiation_rounds.append(r1)

        # If initial price is higher than user budget, Buyer Agent negotiates:
        if initial_price > user_budget:
            # Round 2: Buyer Agent counters with target within user budget
            buyer_target = max(user_budget - Decimal("5.00"), min_reserve)
            r2 = Negotiation(
                offer_id=offer.id,
                round_number=2,
                sender="BUYER_AGENT",
                proposed_price=buyer_target,
                message=f"[Buyer Agent] Our client's maximum authorized budget is ${user_budget}. We propose ${buyer_target} for prompt kickoff and immediate commitment.",
                rationale=f"Negotiating within user budget (${user_budget}) targeting an optimal discount."
            )
            db.add(r2)
            negotiation_rounds.append(r2)

            # Round 3: Merchant Agent considers floor and counters or accepts
            simulated_final = max(min_reserve, min(user_budget - Decimal("2.00"), initial_price - Decimal("12.00")))
            if simulated_final > user_budget:
                simulated_final = user_budget

            r3 = Negotiation(
                offer_id=offer.id,
                round_number=3,
                sender="MERCHANT_AGENT",
                proposed_price=simulated_final,
                message=f"[Simulated Merchant Agent for {provider.name}] We reviewed the scope. To establish a long-term partnership within your ${user_budget} cap, we can agree to ${simulated_final} with guaranteed {provider.delivery_days}-day delivery.",
                rationale=f"Price is above provider reservation floor (${min_reserve}) and satisfies buyer's budget cap."
            )
            db.add(r3)
            negotiation_rounds.append(r3)

            # Round 4: Buyer Agent accepts counteroffer
            r4 = Negotiation(
                offer_id=offer.id,
                round_number=4,
                sender="BUYER_AGENT",
                proposed_price=simulated_final,
                message=f"[Buyer Agent] Deal agreed in principle at ${simulated_final}. Preparing transaction authorization package for human approval.",
                rationale=f"Counter-offer of ${simulated_final} meets budget and delivery requirements."
            )
            db.add(r4)
            negotiation_rounds.append(r4)

            offer.final_price = simulated_final
        else:
            # If initial price was already <= budget, negotiate a friendly discount if above minimum
            if initial_price > min_reserve:
                discounted = max(min_reserve, initial_price - Decimal("5.00"))
                r2 = Negotiation(
                    offer_id=offer.id,
                    round_number=2,
                    sender="BUYER_AGENT",
                    proposed_price=discounted,
                    message=f"[Buyer Agent] We can commit immediately if you can offer a courtesy discount to ${discounted}.",
                    rationale=f"Optimizing budget efficiency."
                )
                db.add(r2)
                negotiation_rounds.append(r2)

                r3 = Negotiation(
                    offer_id=offer.id,
                    round_number=3,
                    sender="MERCHANT_AGENT",
                    proposed_price=discounted,
                    message=f"[Simulated Merchant Agent for {provider.name}] Accepted! We are pleased to confirm ${discounted}.",
                    rationale=f"Within provider margin threshold."
                )
                db.add(r3)
                negotiation_rounds.append(r3)
                offer.final_price = discounted
            else:
                offer.final_price = initial_price

        return negotiation_rounds

    @classmethod
    def conduct_competitive_bidding(
        cls,
        db: Session,
        task: Task,
        providers: list[Provider]
    ) -> Tuple[Offer, list[Offer], list[Negotiation], dict]:
        """Conducts concurrent multi-agent negotiation rounds with multiple competing providers,

        scores each final counteroffer across savings, SLA, and provider rating, and crowns the winning bid.
        """
        # Invalidate existing offers for this task
        existing_offers = db.query(Offer).filter(Offer.task_id == task.id).all()
        for eo in existing_offers:
            eo.status = "SUPERSEDED"
        db.flush()

        all_offers: list[Offer] = []
        all_rounds: list[Negotiation] = []
        bid_summaries: list[dict] = []
        expires_at = datetime.now(timezone.utc) + timedelta(hours=48)

        for provider in providers:
            offer = Offer(
                task_id=task.id,
                provider_id=provider.id,
                version=1,
                original_price=provider.starting_price,
                final_price=provider.starting_price,
                currency=task.currency,
                delivery_days=min(provider.delivery_days, task.deadline_days),
                scope_summary=f"Full {task.title} deliverable by {provider.name} including source files, revisions, and commercial licensing.",
                status="COMPETITIVE_BID",
                expires_at=expires_at
            )
            db.add(offer)
            db.flush()

            rounds = cls._simulate_negotiation_rounds(db, offer, task, provider)
            all_offers.append(offer)
            all_rounds.extend(rounds)

            savings = offer.original_price - offer.final_price
            savings_pct = float((savings / offer.original_price) * Decimal("100.00")) if offer.original_price > 0 else 0.0
            rating_val = float(provider.rating)
            headroom = max(Decimal("0.00"), task.max_budget - offer.final_price)
            delivery_penalty = float(offer.delivery_days) * 2.5

            # Multi-attribute utility score for arbitration
            competitive_score = (
                (rating_val * 12.0) +
                (min(30.0, savings_pct * 1.5)) +
                (float(headroom) * 0.8) -
                delivery_penalty
            )

            bid_summaries.append({
                "offer": offer,
                "provider": provider,
                "original_price": str(offer.original_price),
                "final_price": str(offer.final_price),
                "savings": str(savings),
                "savings_pct": round(savings_pct, 1),
                "delivery_days": offer.delivery_days,
                "rating": str(provider.rating),
                "competitive_score": round(competitive_score, 2)
            })

        # Rank bids by competitive utility score
        bid_summaries.sort(key=lambda b: b["competitive_score"], reverse=True)
        winner_summary = bid_summaries[0]
        winner_offer = winner_summary["offer"]
        winner_offer.status = "PROPOSED"
        db.flush()

        metadata = {
            "bids_evaluated": len(all_offers),
            "winner_offer_id": winner_offer.id,
            "winner_provider_name": winner_offer.provider.name,
            "winner_score": winner_summary["competitive_score"],
            "total_savings": winner_summary["savings"],
            "savings_pct": winner_summary["savings_pct"],
            "comparisons": [
                {
                    "offer_id": b["offer"].id,
                    "provider_id": b["provider"].id,
                    "provider_name": b["provider"].name,
                    "original_price": b["original_price"],
                    "final_price": b["final_price"],
                    "savings": b["savings"],
                    "savings_pct": b["savings_pct"],
                    "delivery_days": b["delivery_days"],
                    "rating": b["rating"],
                    "score": b["competitive_score"],
                    "is_winner": (b["offer"].id == winner_offer.id)
                }
                for b in bid_summaries
            ]
        }

        return winner_offer, all_offers, all_rounds, metadata


    @staticmethod
    def counter_negotiate(
        db: Session,
        offer: Offer,
        target_price: Decimal,
        user_message: str
    ) -> Tuple[Offer, Negotiation, Negotiation]:
        """Allows manual counter-negotiation from human user request."""
        provider = offer.provider
        min_reserve = provider.minimum_price
        
        # Round N: Buyer Agent counters with user specified price
        next_round_num = len(offer.negotiations) + 1
        buyer_round = Negotiation(
            offer_id=offer.id,
            round_number=next_round_num,
            sender="BUYER_AGENT",
            proposed_price=target_price,
            message=f"[Buyer Agent on User Direction] Client requests revision: '{user_message}'. Proposing ${target_price}.",
            rationale="User-directed negotiation instruction."
        )
        db.add(buyer_round)

        # Provider evaluates target_price against min_reserve
        next_round_num += 1
        if target_price >= min_reserve:
            merchant_price = target_price
            merchant_msg = f"[Simulated Merchant Agent for {provider.name}] Counter-offer of ${target_price} accepted by provider."
            offer.final_price = target_price
            offer.version += 1
        else:
            merchant_price = min_reserve
            merchant_msg = f"[Simulated Merchant Agent for {provider.name}] ${target_price} is below our operational minimum floor (${min_reserve}). Our best and final offer is ${min_reserve}."
            offer.final_price = min_reserve
            offer.version += 1

        merchant_round = Negotiation(
            offer_id=offer.id,
            round_number=next_round_num,
            sender="MERCHANT_AGENT",
            proposed_price=merchant_price,
            message=merchant_msg,
            rationale=f"Checked against provider bottom floor (${min_reserve})."
        )
        db.add(merchant_round)
        db.flush()

        return offer, buyer_round, merchant_round
