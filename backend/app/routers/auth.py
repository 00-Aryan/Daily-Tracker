from fastapi import APIRouter, HTTPException, Depends
from postgrest.exceptions import APIError
import logging

from app.database import supabase
from app.dependencies import get_current_user, DUMMY_USER_ID

router = APIRouter()

# The order matters to respect foreign key constraints if we were deleting, 
# but for updates it is generally safe if we just update user_id everywhere.
TABLES_TO_MIGRATE = [
    "user_profile",
    "subjects",
    "subtopics",
    "platforms",
    "projects",
    "tasks",
    "daily_logs",
    "topic_levels",
    "study_questions",
    "study_attempts",
    "job_applications",
]

@router.post("/claim-anonymous-data")
async def claim_anonymous_data(current_user: str = Depends(get_current_user)):
    """
    Safely migrates all data belonging to the DUMMY_USER_ID to the currently authenticated user.
    This operation uses the service role client (global `supabase`) to bypass RLS, 
    as the authenticated user may not have permission to read/modify DUMMY_USER_ID records
    once strict RLS is enforced.
    
    Idempotent: If no dummy records exist, it does nothing safely.
    Reversible: Can be rolled back manually by a DBA if necessary (e.g., updating back based on created_at).
    """
    if current_user == DUMMY_USER_ID:
        raise HTTPException(
            status_code=401, 
            detail="Must be fully authenticated to claim anonymous data."
        )
    
    migration_results = {}
    total_migrated = 0
    
    try:
        for table in TABLES_TO_MIGRATE:
            # We use the global `supabase` client (Service Role) here specifically
            # because an RLS-enforced client (get_db) would block the user from modifying 
            # rows they don't own yet (the DUMMY_USER_ID rows).
            result = supabase.table(table)\
                .update({"user_id": current_user})\
                .eq("user_id", DUMMY_USER_ID)\
                .execute()
            
            count = len(result.data)
            migration_results[table] = count
            total_migrated += count
            
        logging.info(f"Successfully migrated {total_migrated} records to user {current_user}")
        
    except APIError as e:
        logging.error(f"Migration error: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"Migration failed partially or completely. Please contact support. Details: {e.message}"
        )
        
    return {
        "status": "success",
        "message": f"Successfully migrated {total_migrated} anonymous records to your account.",
        "details": migration_results
    }
