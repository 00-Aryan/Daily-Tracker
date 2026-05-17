from datetime import date, datetime
from uuid import UUID
from typing import Optional
from pydantic import BaseModel


class LogCreate(BaseModel):
    log_date: date
    what_i_did: Optional[str] = None
    blockers: Optional[str] = None
    tomorrow_intention: Optional[str] = None


class LogUpdate(BaseModel):
    log_date: Optional[date] = None
    what_i_did: Optional[str] = None
    blockers: Optional[str] = None
    tomorrow_intention: Optional[str] = None


class LogResponse(BaseModel):
    id: UUID
    log_date: date
    what_i_did: Optional[str]
    blockers: Optional[str]
    tomorrow_intention: Optional[str]
    created_at: datetime
    updated_at: datetime