import re
from decimal import Decimal
from typing import Optional
from app.schemas.task import IntentExtractionResult
from app.core.config import settings


class IntentAgent:
    """Personal Intent Agent: Parses natural language commerce requests into structured tasks."""

    CATEGORIES = {
        "logo_design": ["logo", "branding", "brand identity", "icon", "vector mark", "graphic design"],
        "web_development": ["website", "web development", "react", "frontend", "fullstack", "developer", "html", "landing page"],
        "video_editing": ["video", "editor", "editing", "reel", "youtube", "tiktok", "premiere", "after effects"],
        "ai_automation": ["ai", "automation", "agent", "bot", "workflow", "n8n", "zapier", "script"],
        "presentation_design": ["presentation", "pitch deck", "slides", "powerpoint", "keynote"],
        "content_writing": ["content", "copywriting", "article", "blog", "technical writing", "writer"]
    }

    @classmethod
    def extract_intent(cls, prompt: str) -> IntentExtractionResult:
        lowered = prompt.lower()
        
        # 1. Detect Category
        detected_category = "logo_design"
        for category, keywords in cls.CATEGORIES.items():
            if any(kw in lowered for kw in keywords):
                detected_category = category
                break

        # 2. Extract Budget (e.g. "$100", "under $80", "150 dollars", "budget of 120")
        budget = Decimal("100.00")
        budget_match = re.search(r"\$\s*(\d+(?:\.\d{1,2})?)", prompt)
        if not budget_match:
            budget_match = re.search(r"(?:under|budget|max|maximum|below)\s*(?:of\s*)?\$?\s*(\d+(?:\.\d{1,2})?)", lowered)
        
        if budget_match:
            try:
                budget = Decimal(budget_match.group(1))
            except Exception:
                budget = Decimal("100.00")

        # 3. Extract Deadline (e.g. "within 3 days", "in 2 days", "24 hours", "deliver within 5 days")
        deadline = 3
        deadline_match = re.search(r"(\d+)\s*(?:day|days)", lowered)
        if deadline_match:
            try:
                deadline = int(deadline_match.group(1))
            except Exception:
                deadline = 3
        elif "24 hours" in lowered or "tomorrow" in lowered:
            deadline = 1

        # 4. Extract Min Rating (e.g. "rated above 4.5", "rating 4.8", "above 4.0")
        min_rating = Decimal("4.00")
        rating_match = re.search(r"(?:rating|rated|stars?)\s*(?:above|of|at least|minimum)?\s*(\d(?:\.\d)?)", lowered)
        if rating_match:
            try:
                parsed_rating = Decimal(rating_match.group(1))
                if Decimal("1.0") <= parsed_rating <= Decimal("5.0"):
                    min_rating = parsed_rating
            except Exception:
                min_rating = Decimal("4.00")

        # 5. Extract Title
        readable_title = f"{detected_category.replace('_', ' ').title()} Request"
        if "logo" in lowered:
            readable_title = "Startup Logo Design & Brand Mark"
        elif "web" in lowered:
            readable_title = "Web Development Project"
        elif "video" in lowered:
            readable_title = "Video Editing & Post-Production"
        elif "presentation" in lowered or "pitch" in lowered:
            readable_title = "Investor Pitch Deck Design"
        elif "ai" in lowered:
            readable_title = "AI Workflow Automation"
        elif "writing" in lowered:
            readable_title = "Content Writing & Copy"

        return IntentExtractionResult(
            service_category=detected_category,
            title=readable_title,
            max_budget=budget,
            currency="USD",
            deadline_days=deadline,
            min_rating=min_rating,
            preferences="Standard high-quality delivery with human sign-off requested.",
            confidence_score=0.98,
            clarification_needed=False,
            clarification_question=None
        )
