from datetime import datetime
from decimal import Decimal
from typing import Optional, List, Any
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.provider import ProviderResponse


class TaskCreate(BaseModel):
    prompt: str = Field(..., min_length=5, description="Natural language prompt for task")


class IntentExtractionResult(BaseModel):
    service_category: str
    title: str
    max_budget: Decimal
    currency: str = "USD"
    deadline_days: int
    min_rating: Decimal = Decimal("4.00")
    preferences: Optional[str] = None
    confidence_score: float = 0.95
    clarification_needed: bool = False
    clarification_question: Optional[str] = None


class TaskCandidateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    provider_id: str
    relevance_score: Decimal
    rating_score: Decimal
    budget_score: Decimal
    delivery_score: Decimal
    verification_score: Decimal
    composite_score: Decimal
    evaluation_reasoning: Optional[str] = None
    rank: int
    is_selected: bool
    created_at: datetime
    provider: ProviderResponse


class AgentActionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    task_id: str
    agent_name: str
    action_type: str
    input_data: Optional[str] = None
    output_data: Optional[str] = None
    reasoning: Optional[str] = None
    created_at: datetime


class TaskResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    raw_prompt: str
    service_category: str
    max_budget: Decimal
    currency: str
    deadline_days: int
    min_rating: Decimal
    preferences: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    candidates: List[TaskCandidateResponse] = []
    actions: List[AgentActionResponse] = []


class TaskTimelineResponse(BaseModel):
    task_id: str
    status: str
    actions: List[AgentActionResponse]
