# ProductivOS — Backend Agent Context

## This Agent Handles
FastAPI backend only. Do not touch frontend files.

## Stack
- Python 3.11+
- FastAPI + Uvicorn
- Supabase Python client (supabase-py)
- Pydantic v2 for schemas
- uv for package management
- APScheduler for cron jobs

## Folder Responsibilities
```
app/main.py          → App entry point, router registration, startup events
app/database.py      → Supabase client init — export as `supabase`
app/routers/         → One file per module (tasks, logs, jobs, reference, study)
app/schemas/         → Pydantic models — one file per module
app/services/        → Business logic (gemini_service, sm2_algorithm, scheduler)
app/models/          → Reserved for future use
```

## Supabase Pattern — Always Use This
```python
from app.database import supabase

# SELECT
result = supabase.table("tasks").select("*").eq("user_id", user_id).execute()
data = result.data

# INSERT
result = supabase.table("tasks").insert(payload).execute()

# UPDATE
result = supabase.table("tasks").update(payload).eq("id", task_id).execute()

# DELETE
result = supabase.table("tasks").delete().eq("id", task_id).execute()
```

## Error Handling Pattern
```python
from fastapi import HTTPException

if not result.data:
    raise HTTPException(status_code=404, detail="Not found")
```

## Schema Pattern
```python
from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class TaskResponse(BaseModel):
    id: UUID
    title: str
    created_at: datetime
    
    class Config:
        from_attributes = True
```

## Placeholder user_id
```python
USER_ID = "00000000-0000-0000-0000-000000000000"
```

## Adding A New Package
```bash
uv add package-name
# NEVER: pip install package-name
```

## Running Backend
```bash
uv run uvicorn app.main:app --reload
```

## What NOT To Do
- Never use SQLAlchemy
- Never use raw psycopg2
- Never use pip
- Never add endpoints not in PRODUCTIVOS_PROJECT_SPEC.md
- Never modify Supabase tables directly — tables are already created