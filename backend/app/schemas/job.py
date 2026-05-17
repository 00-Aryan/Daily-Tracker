from datetime import date, datetime
from uuid import UUID
from typing import Optional, List
from pydantic import BaseModel
from typing import Literal


class JobCreate(BaseModel):
    company_name: str
    role: str
    jd_link: Optional[str] = None
    date_applied: date
    platform: Optional[str] = None
    resume_version: Optional[str] = None
    status: Literal["Applied", "Screening", "Interview", "Offer", "Rejected"] = "Applied"
    notes: Optional[str] = None


class JobUpdate(BaseModel):
    company_name: Optional[str] = None
    role: Optional[str] = None
    jd_link: Optional[str] = None
    date_applied: Optional[date] = None
    platform: Optional[str] = None
    resume_version: Optional[str] = None
    status: Optional[Literal["Applied", "Screening", "Interview", "Offer", "Rejected"]] = None
    notes: Optional[str] = None
    follow_up_sent: Optional[bool] = None


class JobResponse(BaseModel):
    id: UUID
    company_name: str
    role: str
    jd_link: Optional[str]
    date_applied: date
    platform: Optional[str]
    resume_version: Optional[str]
    status: Literal["Applied", "Screening", "Interview", "Offer", "Rejected"]
    notes: Optional[str]
    follow_up_sent: bool
    created_at: datetime
    updated_at: datetime


class ResumeStats(BaseModel):
    resume_version: str
    total_applications: int
    total_responses: int
    response_rate: float