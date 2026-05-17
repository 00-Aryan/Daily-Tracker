from datetime import date, datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel


class ProfileCreate(BaseModel):
    strengths: list[str] = []
    weaknesses: list[str] = []
    learning_style: Optional[str] = None
    current_goals: list[str] = []


class ProfileResponse(BaseModel):
    id: UUID
    strengths: list[str]
    weaknesses: list[str]
    learning_style: Optional[str]
    current_goals: list[str]
    created_at: datetime
    updated_at: datetime


class QuestionResponse(BaseModel):
    id: UUID
    question_text: str
    difficulty_level: str
    expected_concepts: list[str] = []
    subject_id: UUID
    subtopic_id: UUID


class AttemptCreate(BaseModel):
    question_id: UUID
    user_answer: str


class AttemptResponse(BaseModel):
    score: float
    feedback: str
    is_correct: bool
    next_review_days: int


class LevelResponse(BaseModel):
    subject_id: UUID
    subject_name: Optional[str] = None
    subtopic_id: UUID
    subtopic_name: Optional[str] = None
    numerical_score: float
    streak: int
    attempt_count: int
    correct_count: int
    last_attempted: Optional[datetime] = None
