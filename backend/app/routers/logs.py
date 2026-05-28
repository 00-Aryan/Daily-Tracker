from datetime import date, datetime
from uuid import UUID
from fastapi import APIRouter, HTTPException, Query, Depends
from typing import Optional, List
from postgrest.exceptions import APIError
from supabase import Client

from app.schemas.log import LogCreate, LogUpdate, LogResponse
from app.dependencies import get_current_user, get_db

router = APIRouter()


def _row_to_log(row: dict) -> LogResponse:
    return LogResponse(
        id=UUID(row["id"]),
        log_date=row["log_date"],
        what_i_did=row.get("what_i_did"),
        blockers=row.get("blockers"),
        tomorrow_intention=row.get("tomorrow_intention"),
        created_at=row["created_at"],
        updated_at=row["updated_at"],
    )


@router.get("", response_model=List[LogResponse])
async def get_logs(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    current_user: str = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    offset = (page - 1) * limit
    result = db.table("daily_logs")\
        .select("*")\
        .eq("user_id", current_user)\
        .order("log_date", desc=True)\
        .range(offset, offset + limit - 1)\
        .execute()
    return [_row_to_log(r) for r in result.data]

@router.get("/search", response_model=List[LogResponse])
async def search_logs(
    q: str = Query(..., description="Search query"),
    current_user: str = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    search_pattern = f"%{q}%"
    result = db.table("daily_logs")\
        .select("*")\
        .eq("user_id", current_user)\
        .or_(
            f"what_i_did.ilike.{search_pattern},blockers.ilike.{search_pattern},tomorrow_intention.ilike.{search_pattern}"
        )\
        .order("log_date", desc=True)\
        .execute()
    return [_row_to_log(r) for r in result.data]

@router.get("/{log_date}", response_model=LogResponse)
async def get_log_by_date(log_date: str, current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    try:
        parsed_date = date.fromisoformat(log_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    result = db.table("daily_logs")\
        .select("*")\
        .eq("log_date", str(parsed_date))\
        .eq("user_id", current_user)\
        .execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Log not found for this date")
    return _row_to_log(result.data[0])


@router.post("", response_model=LogResponse, status_code=201)
async def create_log(log: LogCreate, current_user: str = Depends(get_current_user), db: Client = Depends(get_db)):
    # Belt-and-suspenders check alongside DB UNIQUE constraint
    existing = db.table("daily_logs")\
        .select("id")\
        .eq("log_date", str(log.log_date))\
        .eq("user_id", current_user)\
        .execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Log for this date already exists")

    now = datetime.now()
    data = {
        "user_id": current_user,
        "log_date": str(log.log_date),
        "what_i_did": log.what_i_did,
        "blockers": log.blockers,
        "tomorrow_intention": log.tomorrow_intention,
        "created_at": now.isoformat(),
        "updated_at": now.isoformat(),
    }

    try:
        result = db.table("daily_logs").insert(data).execute()
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _row_to_log(result.data[0])




@router.patch("/{log_date}", response_model=LogResponse)
async def update_log(
    log_date: str, 
    log_update: LogUpdate, 
    current_user: str = Depends(get_current_user),
    db: Client = Depends(get_db),
):
    try:
        parsed_date = date.fromisoformat(log_date)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")

    update_data = {
        "what_i_did": log_update.what_i_did,
        "blockers": log_update.blockers,
        "tomorrow_intention": log_update.tomorrow_intention,
    }
    
    update_data = {k: v for k, v in update_data.items() if v is not None}
    update_data["updated_at"] = datetime.now().isoformat()
    
    if len(update_data) == 1:
        existing = db.table("daily_logs")\
            .select("*")\
            .eq("log_date", str(parsed_date))\
            .eq("user_id", current_user).execute()
        if not existing.data:
            raise HTTPException(status_code=404, detail="Log not found")
        return _row_to_log(existing.data[0])

    try:
        result = db.table("daily_logs")\
            .update(update_data)\
            .eq("log_date", str(parsed_date))\
            .eq("user_id", current_user)\
            .execute()
        if not result.data:
             raise HTTPException(status_code=404, detail="Log not found")
    except APIError as e:
        raise HTTPException(status_code=400, detail=str(e))

    return _row_to_log(result.data[0])

