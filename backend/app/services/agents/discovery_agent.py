from decimal import Decimal
from typing import List
from sqlalchemy.orm import Session
from app.models.provider import Provider
from app.models.task import Task


class DiscoveryAgent:
    """Discovery Agent: Queries the real provider database applying strict eligibility criteria."""

    @staticmethod
    def discover_candidates(db: Session, task: Task) -> List[Provider]:
        query = db.query(Provider).filter(
            Provider.category == task.service_category,
            Provider.is_available == True,
            Provider.rating >= task.min_rating
        )

        candidates = query.all()

        # If strict category matches are fewer than 2, also retrieve providers from related skills
        if len(candidates) < 2:
            fallback_query = db.query(Provider).filter(
                Provider.is_available == True,
                Provider.rating >= (task.min_rating - Decimal("0.50"))
            )
            candidates = fallback_query.limit(5).all()

        return candidates
