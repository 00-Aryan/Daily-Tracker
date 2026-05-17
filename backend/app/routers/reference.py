from datetime import datetime
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from postgrest.exceptions import APIError

from app.database import supabase
from app.schemas.reference import (
    SubjectCreate, SubjectResponse,
    SubtopicCreate, SubtopicResponse,
    PlatformCreate, PlatformResponse,
    ProjectCreate, ProjectResponse,
)

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
async def get_subjects():
    result = supabase.table("subjects").select("*").order("created_at", desc=True).execute()
    return [_row_to_subject(r) for r in result.data]


@router.post("/subjects", response_model=SubjectResponse, status_code=201)
async def create_subject(subject: SubjectCreate):
    data = {"name": subject.name}
    try:
        result = supabase.table("subjects").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_subject(result.data[0])


@router.delete("/subjects/{subject_id}")
async def delete_subject(subject_id: UUID):
    try:
        result = supabase.table("subjects").delete().eq("id", str(subject_id)).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result.data == []:
        raise HTTPException(status_code=404, detail="Subject not found")
    return {"message": "Subject deleted"}


# Subtopics
@router.get("/subtopics", response_model=List[SubtopicResponse])
async def get_subtopics(subject_id: Optional[UUID] = Query(None)):
    query = supabase.table("subtopics").select("*")
    if subject_id:
        query = query.eq("subject_id", str(subject_id))
    result = query.execute()
    return [_row_to_subtopic(r) for r in result.data]


@router.post("/subtopics", response_model=SubtopicResponse, status_code=201)
async def create_subtopic(subtopic: SubtopicCreate):
    data = {
        "subject_id": str(subtopic.subject_id),
        "name": subtopic.name,
    }
    try:
        result = supabase.table("subtopics").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_subtopic(result.data[0])


@router.delete("/subtopics/{subtopic_id}")
async def delete_subtopic(subtopic_id: UUID):
    try:
        result = supabase.table("subtopics").delete().eq("id", str(subtopic_id)).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result.data == []:
        raise HTTPException(status_code=404, detail="Subtopic not found")
    return {"message": "Subtopic deleted"}


# Platforms
@router.get("/platforms", response_model=List[PlatformResponse])
async def get_platforms():
    result = supabase.table("platforms").select("*").execute()
    return [_row_to_platform(r) for r in result.data]


@router.post("/platforms", response_model=PlatformResponse, status_code=201)
async def create_platform(platform: PlatformCreate):
    data = {"name": platform.name}
    try:
        result = supabase.table("platforms").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_platform(result.data[0])


@router.delete("/platforms/{platform_id}")
async def delete_platform(platform_id: UUID):
    try:
        result = supabase.table("platforms").delete().eq("id", str(platform_id)).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result.data == []:
        raise HTTPException(status_code=404, detail="Platform not found")
    return {"message": "Platform deleted"}


# Projects
@router.get("/projects", response_model=List[ProjectResponse])
async def get_projects():
    result = supabase.table("projects").select("*").order("created_at", desc=True).execute()
    return [_row_to_project(r) for r in result.data]


@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def create_project(project: ProjectCreate):
    data = {
        "name": project.name,
        "description": project.description,
    }
    try:
        result = supabase.table("projects").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_project(result.data[0])


@router.delete("/projects/{project_id}")
async def delete_project(project_id: UUID):
    try:
        result = supabase.table("projects").delete().eq("id", str(project_id)).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result.data == []:
        raise HTTPException(status_code=404, detail="Project not found")
    return {"message": "Project deleted"}