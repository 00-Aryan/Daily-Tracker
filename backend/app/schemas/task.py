from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field
from typing import Literal


class TaskCreate(BaseModel):
    title: str
    task_type: Literal["study", "general"]
    priority: int = Field(default=3, ge=1, le=5)
    deadline: Optional[date] = None
    status: Literal["today", "done", "backlog"] = "today"
    project_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    subtopic_id: Optional[UUID] = None
    platform_id: Optional[UUID] = None
    problem_name: Optional[str] = None


class TaskUpdate(BaseModel):
    title: Optional[str] = None
    task_type: Optional[Literal["study", "general"]] = None
    priority: Optional[int] = Field(default=None, ge=1, le=5)
    deadline: Optional[date] = None
    status: Optional[Literal["today", "done", "backlog"]] = None
    project_id: Optional[UUID] = None
    subject_id: Optional[UUID] = None
    subtopic_id: Optional[UUID] = None
    platform_id: Optional[UUID] = None
    problem_name: Optional[str] = None
    completed_at: Optional[datetime] = None
    moved_to_backlog_at: Optional[datetime] = None


class TaskResponse(BaseModel):
    id: UUID
    title: str
    task_type: Literal["study", "general"]
    priority: int
    deadline: Optional[date]
    status: Literal["today", "done", "backlog"]
    project_id: Optional[UUID]
    project_name: Optional[str] = None
    subject_id: Optional[UUID]
    subject_name: Optional[str] = None
    subtopic_id: Optional[UUID]
    subtopic_name: Optional[str] = None
    platform_id: Optional[UUID]
    platform_name: Optional[str] = None
    problem_name: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]
    moved_to_backlog_at: Optional[datetime]