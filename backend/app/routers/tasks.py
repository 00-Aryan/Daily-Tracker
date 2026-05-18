from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from postgrest.exceptions import APIError

from app.database import supabase
from app.schemas.task import TaskCreate, TaskUpdate, TaskResponse

router = APIRouter()

USER_ID = "00000000-0000-0000-0000-000000000000"


def _row_to_response(row: dict) -> TaskResponse:
    return TaskResponse(
        id=UUID(row["id"]),
        title=row["title"],
        task_type=row["task_type"],
        priority=row["priority"],
        deadline=row.get("deadline"),
        status=row["status"],
        project_id=UUID(row["project_id"]) if row.get("project_id") else None,
        project_name=(row.get("projects") or {}).get("name"),
        subject_id=UUID(row["subject_id"]) if row.get("subject_id") else None,
        subject_name=(row.get("subjects") or {}).get("name"),
        subtopic_id=UUID(row["subtopic_id"]) if row.get("subtopic_id") else None,
        subtopic_name=(row.get("subtopics") or {}).get("name"),
        platform_id=UUID(row["platform_id"]) if row.get("platform_id") else None,
        platform_name=(row.get("platforms") or {}).get("name"),
        problem_name=row.get("problem_name"),
        created_at=row["created_at"],
        completed_at=row.get("completed_at"),
        moved_to_backlog_at=row.get("moved_to_backlog_at"),
    )


@router.get("", response_model=List[TaskResponse])
async def get_tasks(status: Optional[str] = Query(None, description="Filter by status: today, done, or backlog")):
    # Select task fields plus related table names
    query_str = "*, projects(name), subjects(name), subtopics(name), platforms(name)"
    query = supabase.table("tasks").select(query_str).eq("user_id", USER_ID)

    if status:
        if status not in ["today", "done", "backlog"]:
            raise HTTPException(status_code=400, detail="Invalid status. Must be 'today', 'done', or 'backlog'")
        query = query.eq("status", status)

    result = query.execute()

    tasks = result.data
    if status == "backlog":
        tasks = sorted(tasks, key=lambda t: t.get("priority", 3))
    return [_row_to_response(t) for t in tasks]


@router.post("", response_model=TaskResponse, status_code=201)
async def create_task(task: TaskCreate):
    now = datetime.now()
    data = {
        "user_id": USER_ID,
        "title": task.title,
        "task_type": task.task_type,
        "priority": task.priority,
        "deadline": task.deadline,
        "status": task.status,
        "project_id": str(task.project_id) if task.project_id else None,
        "subject_id": str(task.subject_id) if task.subject_id else None,
        "subtopic_id": str(task.subtopic_id) if task.subtopic_id else None,
        "platform_id": str(task.platform_id) if task.platform_id else None,
        "problem_name": task.problem_name,
        "created_at": now.isoformat(),
    }

    try:
        result = supabase.table("tasks").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _row_to_response(result.data[0])


@router.patch("/{task_id}", response_model=TaskResponse)
async def update_task(task_id: UUID, task_update: TaskUpdate):
    existing = supabase.table("tasks").select("*").eq("id", str(task_id)).eq("user_id", USER_ID).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Task not found")

    current = existing.data[0]
    update_data = {}

    if task_update.title is not None:
        update_data["title"] = task_update.title
    if task_update.task_type is not None:
        update_data["task_type"] = task_update.task_type
    if task_update.priority is not None:
        update_data["priority"] = task_update.priority
    if task_update.deadline is not None:
        update_data["deadline"] = task_update.deadline
    if task_update.status is not None:
        if task_update.status == "done" and current["status"] != "done":
            update_data["completed_at"] = datetime.now().isoformat()
        elif task_update.status == "backlog" and current["status"] != "backlog":
            update_data["moved_to_backlog_at"] = datetime.now().isoformat()
        update_data["status"] = task_update.status
    if task_update.project_id is not None:
        update_data["project_id"] = str(task_update.project_id) if task_update.project_id else None
    if task_update.subject_id is not None:
        update_data["subject_id"] = str(task_update.subject_id) if task_update.subject_id else None
    if task_update.subtopic_id is not None:
        update_data["subtopic_id"] = str(task_update.subtopic_id) if task_update.subtopic_id else None
    if task_update.platform_id is not None:
        update_data["platform_id"] = str(task_update.platform_id) if task_update.platform_id else None
    if task_update.problem_name is not None:
        update_data["problem_name"] = task_update.problem_name
    if task_update.completed_at is not None:
        update_data["completed_at"] = task_update.completed_at.isoformat()
    if task_update.moved_to_backlog_at is not None:
        update_data["moved_to_backlog_at"] = task_update.moved_to_backlog_at.isoformat()

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    try:
        supabase.table("tasks").update(update_data).eq("id", str(task_id)).eq("user_id", USER_ID).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Re-fetch with joins to include related names in response
    query_str = "*, projects(name), subjects(name), subtopics(name), platforms(name)"
    result = supabase.table("tasks").select(query_str).eq("id", str(task_id)).eq("user_id", USER_ID).execute()
    return _row_to_response(result.data[0])


@router.delete("/{task_id}")
async def delete_task(task_id: UUID):
    try:
        supabase.table("tasks").delete().eq("id", str(task_id)).eq("user_id", USER_ID).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"message": "Task deleted"}


@router.post("/run-backlog-check")
async def run_backlog_check():
    try:
        result = supabase.table("tasks")\
            .update({
                "status": "backlog",
                "moved_to_backlog_at": datetime.now().isoformat()
            })\
            .eq("status", "today")\
            .eq("user_id", USER_ID)\
            .execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return {"moved": len(result.data)}
