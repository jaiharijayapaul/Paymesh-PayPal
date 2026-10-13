import re
import json
import logging
from decimal import Decimal
from typing import Optional
import httpx
from app.schemas.task import IntentExtractionResult
from app.core.config import settings

logger = logging.getLogger(__name__)


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
        """Extracts intent using Google Gemini API if configured, otherwise deterministic rule parser."""
        if settings.AI_PROVIDER == "gemini" and settings.GEMINI_API_KEY:
            try:
                gemini_result = cls._extract_with_gemini(prompt)
                if gemini_result:
                    return gemini_result
            except Exception as e:
                logger.warning(f"Gemini API invocation encountered error: {str(e)}. Falling back to deterministic engine.")

        return cls._extract_with_rules(prompt)

    @classmethod
    def _extract_with_gemini(cls, prompt: str) -> Optional[IntentExtractionResult]:
        """Calls Google Gemini API with JSON structured instructions."""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        
        system_instructions = (
            "You are an AI Commerce Intent Extraction Agent. Extract parameters from the user's service request.\n"
            "Return strictly valid JSON with keys:\n"
            "- service_category (must be one of: logo_design, web_development, video_editing, ai_automation, presentation_design, content_writing)\n"
            "- title (concise professional project title)\n"
            "- max_budget (number, e.g. 100.00)\n"
            "- currency (standard 3-letter currency code, default USD)\n"
            "- deadline_days (integer days required)\n"
            "- min_rating (number, e.g. 4.5)\n"
            "- preferences (short summary of user preferences)\n"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": f"{system_instructions}\n\nUser request: \"{prompt}\""}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.1,
                "responseMimeType": "application/json"
            }
        }

        with httpx.Client(timeout=8.0) as client:
            resp = client.post(url, json=payload)
            if resp.status_code == 200:
                data = resp.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                parsed = json.loads(text_content)
                
                cat = parsed.get("service_category", "logo_design")
                if cat not in cls.CATEGORIES:
                    cat = "logo_design"

                return IntentExtractionResult(
                    service_category=cat,
                    title=parsed.get("title", f"{cat.replace('_', ' ').title()} Project"),
                    max_budget=Decimal(str(parsed.get("max_budget", 100.00))),
                    currency=parsed.get("currency", "USD"),
                    deadline_days=int(parsed.get("deadline_days", 3)),
                    min_rating=Decimal(str(parsed.get("min_rating", 4.00))),
                    preferences=parsed.get("preferences", "Extracted via Google Gemini"),
                    confidence_score=0.99,
                    clarification_needed=False,
                    clarification_question=None
                )
        return None

    @classmethod
    def _extract_with_rules(cls, prompt: str) -> IntentExtractionResult:
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
