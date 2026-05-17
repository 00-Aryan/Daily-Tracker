from datetime import datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel


class SubjectCreate(BaseModel):
    name: str


class SubjectResponse(BaseModel):
    id: UUID
    name: str
    created_at: datetime


class SubtopicCreate(BaseModel):
    subject_id: UUID
    name: str


class SubtopicResponse(BaseModel):
    id: UUID
    subject_id: UUID
    name: str


class PlatformCreate(BaseModel):
    name: str


class PlatformResponse(BaseModel):
    id: UUID
    name: str


class ProjectCreate(BaseModel):
    name: str
    description: Optional[str] = None


class ProjectResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    created_at: datetime