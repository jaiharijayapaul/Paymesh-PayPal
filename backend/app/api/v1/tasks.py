from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.user import User
from app.models.task import Task
from app.models.agent import AgentAction
from app.schemas.task import TaskCreate, TaskResponse, TaskTimelineResponse, AgentActionResponse
from app.services.agents.intent_agent import IntentAgent
from app.services.agents.orchestrator import AgentOrchestrator
from app.api.deps import get_current_user, get_current_user_with_query


router = APIRouter()


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    task_in: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Personal Intent Agent extracts structured parameters
    intent = IntentAgent.extract_intent(task_in.prompt)

    task = Task(
        user_id=current_user.id,
        title=intent.title,
        raw_prompt=task_in.prompt,
        service_category=intent.service_category,
        max_budget=intent.max_budget,
        currency=intent.currency,
        deadline_days=intent.deadline_days,
        min_rating=intent.min_rating,
        preferences=intent.preferences,
        status="PENDING"
    )
    db.add(task)
    db.commit()
    db.refresh(task)
    return TaskResponse.model_validate(task)


@router.get("", response_model=List[TaskResponse])
def list_user_tasks(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    tasks = db.query(Task).filter(Task.user_id == current_user.id).order_by(Task.created_at.desc()).all()
    return [TaskResponse.model_validate(t) for t in tasks]


@router.get("/{task_id}", response_model=TaskResponse)
def get_task_details(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found or unauthorized.")
    return TaskResponse.model_validate(task)


@router.post("/{task_id}/execute", response_model=TaskResponse)
def execute_task_workflow(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found or unauthorized.")

    executed_task = AgentOrchestrator.execute_task_pipeline(db, current_user, task)
    return TaskResponse.model_validate(executed_task)


@router.get("/{task_id}/timeline", response_model=TaskTimelineResponse)
def get_task_timeline(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found or unauthorized.")

    actions = db.query(AgentAction).filter(AgentAction.task_id == task_id).order_by(AgentAction.created_at.asc()).all()
    return TaskTimelineResponse(
        task_id=task.id,
        status=task.status,
        actions=[AgentActionResponse.model_validate(a) for a in actions]
    )


@router.get("/{task_id}/stream")
async def stream_task_workflow(
    task_id: str,
    token: Optional[str] = None,
    current_user: User = Depends(get_current_user_with_query),
    db: Session = Depends(get_db)
):
    """Server-Sent Events (SSE) live stream of autonomous multi-agent pipeline execution."""
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Task not found or unauthorized.")

    return StreamingResponse(
        AgentOrchestrator.stream_task_pipeline(db, current_user, task),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

