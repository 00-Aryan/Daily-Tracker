from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from postgrest.exceptions import APIError
from supabase import Client

from app.schemas.reference import (
    SubjectCreate, SubjectResponse,
    SubtopicCreate, SubtopicResponse,
    PlatformCreate, PlatformResponse,
    ProjectCreate, ProjectResponse,
)
from app.dependencies import get_current_user, get_db

router = APIRouter()


def _row_to_subject(row: dict) -> SubjectResponse:
    return SubjectResponse(
        id=UUID(row["id"]),
        name=row["name"],
        created_at=row["created_at"],
    )


def _row_to_subtopic(row: dict) -> SubtopicResponse:
    return SubtopicResponse(
        id=UUID(row["id"]),
        subject_id=UUID(row["subject_id"]),
        name=row["name"],
    )


def _row_to_platform(row: dict) -> PlatformResponse:
    return PlatformResponse(
        id=UUID(row["id"]),
        name=row["name"],
    )


def _row_to_project(row: dict) -> ProjectResponse:
    return ProjectResponse(
        id=UUID(row["id"]),
        name=row["name"],
        description=row.get("description"),
        created_at=row["created_at"],
    )


# Subjects
@router.get("/subjects", response_model=List[SubjectResponse])
async def get_subjects(current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    result = db.table("subjects").select("*").eq("user_id", current_user).order("created_at", desc=True).execute()
    return [_row_to_subject(r) for r in result.data]


@router.post("/subjects", response_model=SubjectResponse, status_code=201)
async def create_subject(subject: SubjectCreate, current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    data = {"name": subject.name, "user_id": current_user}
    try:
        result = db.table("subjects").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_subject(result.data[0])


@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: UUID, current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        result = db.table("subjects").delete().eq("id", str(subject_id)).eq("user_id", current_user).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result.data == []:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted"}


# Subtopics
@router.get("/subtopics", response_model=List[SubtopicResponse])
async def get_subtopics(
    subject_id: Optional[UUID] = Query(None),
    current_user: str = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    query = db.table("subtopics").select("*").eq("user_id", current_user)
    if subject_id:
        query = query.eq("subject_id", str(subject_id))
    result = query.execute()
    return [_row_to_subtopic(r) for r in result.data]


@router.post("/subtopics", response_model=SubtopicResponse, status_code=201)
async def create_subtopic(subtopic: SubtopicCreate, current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    # Verify subject ownership
    subject = db.table("subjects").select("id").eq("id", str(subtopic.subject_id)).eq("user_id", current_user).execute()
    if not subject.data:
        raise HTTPException(status_code=404, detail="Subject not found or access denied")

    data = {
        "user_id": current_user,
        "subject_id": str(subtopic.subject_id),
        "name": subtopic.name,
    }
    try:
        result = db.table("subtopics").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_subtopic(result.data[0])


@router.delete("/subtopics/{subtopic_id}")
async def delete_subtopic(subtopic_id: UUID, current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        result = db.table("subtopics").delete().eq("id", str(subtopic_id)).eq("user_id", current_user).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result.data == []:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    return {"message": "Subtopic deleted"}


# Platforms
@router.get("/platforms", response_model=List[PlatformResponse])
async def get_platforms(current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    result = db.table("platforms").select("*").eq("user_id", current_user).execute()
    return [_row_to_platform(r) for r in result.data]


@router.post("/platforms", response_model=PlatformResponse, status_code=201)
async def create_platform(platform: PlatformCreate, current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    data = {"name": platform.name, "user_id": current_user}
    try:
        result = db.table("platforms").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_platform(result.data[0])


@router.delete("/platforms/{platform_id}")
async def delete_platform(platform_id: UUID, current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        result = db.table("platforms").delete().eq("id", str(platform_id)).eq("user_id", current_user).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result.data == []:
        raise HTTPException(status_code=404, detail="Platform not found")
    return {"message": "Platform deleted"}


# Projects
@router.get("/projects", response_model=List[ProjectResponse])
async def get_projects(current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    result = db.table("projects").select("*").eq("user_id", current_user).order("created_at", desc=True).execute()
    return [_row_to_project(r) for r in result.data]


@router.get("/projects/debug-auth")
async def debug_auth(current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    """TEMPORARY: Forensic debug endpoint to verify auth state reaching Postgres."""
    import logging
    logger = logging.getLogger("reference.debug")
    
    # Check what the scoped client's postgrest Authorization header is
    pg_headers = dict(db.postgrest.session.headers)
    pg_auth = pg_headers.get("authorization", "NONE")
    # Only log first 20 chars (safe - not the full token)
    auth_prefix = pg_auth[:25] + "..." if len(pg_auth) > 25 else pg_auth
    is_user_jwt = pg_auth.startswith("Bearer ey")  # Real JWTs start with ey (base64 of {"alg":...)
    is_sb_key = "sb_publishable" in pg_auth or "sb_secret" in pg_auth
    
    logger.info(f"[DEBUG-AUTH] current_user={current_user}, auth_prefix={auth_prefix}, is_jwt={is_user_jwt}, is_sb_key={is_sb_key}")
    
    # Try a SELECT to verify auth.uid() works
    select_ok = False
    select_error = None
    try:
        result = db.table("projects").select("id").limit(1).execute()
        select_ok = True
    except Exception as e:
        select_error = str(e)[:100]
    
    return {
        "current_user": current_user,
        "is_dummy": current_user == "00000000-0000-0000-0000-000000000000",
        "scoped_client_auth_is_jwt": is_user_jwt,
        "scoped_client_auth_is_sb_key": is_sb_key,
        "scoped_client_auth_prefix": auth_prefix,
        "select_works": select_ok,
        "select_error": select_error,
    }


@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def create_project(project: ProjectCreate, current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    import logging
    logger = logging.getLogger("reference.projects")
    
    data = {
        "user_id": current_user,
        "name": project.name,
        "description": project.description,
    }
    
    # TEMPORARY DEBUG: Log auth context (never log tokens)
    pg_headers = dict(db.postgrest.session.headers)
    pg_auth = pg_headers.get("authorization", "NONE")
    is_user_jwt = pg_auth.startswith("Bearer ey")
    logger.warning(f"[DEBUG] create_project: user_id={current_user}, payload_user_id={data['user_id']}, auth_is_jwt={is_user_jwt}, auth_prefix={pg_auth[:25]}...")
    
    try:
        result = db.table("projects").insert(data).execute()
    except APIError as e:
        logger.error(f"[DEBUG] create_project FAILED: {e}, user_id={current_user}, auth_is_jwt={is_user_jwt}")
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_project(result.data[0])


@router.delete("/projects/{project_id}")
async def delete_project(project_id: UUID, current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        result = db.table("projects").delete().eq("id", str(project_id)).eq("user_id", current_user).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result.data == []:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}