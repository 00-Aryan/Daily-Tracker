from datetime import date, datetime, timedelta
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, List
from postgrest.exceptions import APIError

from app.database import supabase
from app.schemas.job import JobCreate, JobUpdate, JobResponse, ResumeStats

router = APIRouter()


def _row_to_job(row: dict) -> JobResponse:
    return JobResponse(
        id=UUID(row["id"]),
        company_name=row["company_name"],
        role=row["role"],
        jd_link=row.get("jd_link"),
        date_applied=row["date_applied"],
        platform=row.get("platform"),
        resume_version=row.get("resume_version"),
        status=row["status"],
        notes=row.get("notes"),
        follow_up_sent=row.get("follow_up_sent", False),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("", response_model=List[JobResponse])
async def get_jobs(status: Optional[str] = Query(None)):
    query = supabase.table("job_applications").select("*").order("date_applied", desc=True)
    if status:
        query = query.eq("status", status)
    result = query.execute()
    return [_row_to_job(r) for r in result.data]


@router.post("", response_model=JobResponse, status_code=201)
async def create_job(job: JobCreate):
    now = datetime.now()
    data = {
        "company_name": job.company_name,
        "role": job.role,
        "jd_link": job.jd_link,
        "date_applied": str(job.date_applied),
        "platform": job.platform,
        "resume_version": job.resume_version,
        "status": job.status,
        "notes": job.notes,
        "follow_up_sent": False,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }
    try:
        result = supabase.table("job_applications").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return _row_to_job(result.data[0])


@router.patch("/{job_id}", response_model=JobResponse)
async def update_job(job_id: UUID, job_update: JobUpdate):
    existing = supabase.table("job_applications").select("*").eq("id", str(job_id)).execute()
    if not existing.data:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = {"updated_at": datetime.now().isoformat()}

    if job_update.company_name is not None:
        update_data["company_name"] = job_update.company_name
    if job_update.role is not None:
        update_data["role"] = job_update.role
    if job_update.jd_link is not None:
        update_data["jd_link"] = job_update.jd_link
    if job_update.date_applied is not None:
        update_data["date_applied"] = str(job_update.date_applied)
    if job_update.platform is not None:
        update_data["platform"] = job_update.platform
    if job_update.resume_version is not None:
        update_data["resume_version"] = job_update.resume_version
    if job_update.status is not None:
        update_data["status"] = job_update.status
    if job_update.notes is not None:
        update_data["notes"] = job_update.notes
    if job_update.follow_up_sent is not None:
        update_data["follow_up_sent"] = job_update.follow_up_sent

    try:
        result = supabase.table("job_applications").update(update_data).eq("id", str(job_id)).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _row_to_job(result.data[0])


@router.delete("/{job_id}")
async def delete_job(job_id: UUID):
    try:
        result = supabase.table("job_applications").delete().eq("id", str(job_id)).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if result.data == []:
        raise HTTPException(status_code=404, detail="Job not found")
    return {"message": "Application deleted"}


@router.get("/stats")
async def get_job_stats():
    all_jobs = supabase.table("job_applications").select("*").execute()
    jobs = all_jobs.data

    total = len(jobs)
    in_screening = sum(1 for j in jobs if j["status"] == "Screening")
    interviews = sum(1 for j in jobs if j["status"] == "Interview")
    rejected = sum(1 for j in jobs if j["status"] == "Rejected")

    resume_stats = {}
    for job in jobs:
        rv = job.get("resume_version") or "none"
        if rv not in resume_stats:
            resume_stats[rv] = {"total": 0, "responses": 0}
        resume_stats[rv]["total"] += 1
        if job["status"] != "Applied":
            resume_stats[rv]["responses"] += 1

    resume_performance = []
    for rv, stats in resume_stats.items():
        rate = (stats["responses"] / stats["total"] * 100) if stats["total"] > 0 else 0
        resume_performance.append(ResumeStats(
            resume_version=rv,
            total_applications=stats["total"],
            total_responses=stats["responses"],
            response_rate=round(rate, 1),
        ))

    return {
        "total_applied": total,
        "in_screening": in_screening,
        "interviews": interviews,
        "rejected": rejected,
        "resume_performance": resume_performance,
    }


@router.get("/followup", response_model=List[JobResponse])
async def get_followup_jobs():
    cutoff = (date.today() - timedelta(days=7)).isoformat()
    result = supabase.table("job_applications").select("*").eq("status", "Applied").eq("follow_up_sent", False).lte("date_applied", cutoff).order("date_applied", desc=True).execute()
    return [_row_to_job(r) for r in result.data]