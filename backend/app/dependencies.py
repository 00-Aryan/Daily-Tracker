from fastapi import Header, HTTPException, Depends
from typing import Optional
from postgrest.exceptions import APIError
from supabase import Client
import logging

from app.database import supabase, get_supabase_client

# For now, we use a placeholder user ID for anonymous/local dev
DUMMY_USER_ID = "00000000-0000-0000-0000-000000000000"

async def get_current_user(authorization: Optional[str] = Header(None)) -> str:
    """
    Dependency to extract the user ID from the Authorization header.
    Returns UUID string.
    
    If no token is provided, returns DUMMY_USER_ID (local dev).
    If a token IS provided but invalid, raises 401 (prevents user_id/auth.uid() mismatch).
    """
    if not authorization or not authorization.startswith("Bearer "):
        return DUMMY_USER_ID
    
    token = authorization.split(" ")[1]
    try:
        user_response = supabase.auth.get_user(token)
        if user_response and user_response.user:
            return str(user_response.user.id)
    except Exception as e:
        logging.warning(f"Auth token verification failed: {e}")
        raise HTTPException(status_code=401, detail="Invalid or expired authentication token")

    raise HTTPException(status_code=401, detail="Could not validate user from token")

async def get_db(authorization: Optional[str] = Header(None)) -> Client:
    """
    Returns a Supabase client. 
    If a valid JWT is provided, returns an RLS-enforced client for that user.
    Otherwise returns the default client (which still requires app-level user_id filtering).
    """
    if not authorization or not authorization.startswith("Bearer "):
        logging.warning("[get_db] No auth header - returning global client")
        return supabase
    
    token = authorization.split(" ")[1]
    client = get_supabase_client(token)
    
    # TEMPORARY DEBUG: Verify the scoped client has the correct auth header
    pg_auth = client.options.headers.get("Authorization", "NONE")
    is_user_jwt = pg_auth.startswith("Bearer ey")
    if not is_user_jwt:
        logging.error(f"[get_db] CRITICAL: Scoped client auth header is NOT a user JWT! prefix={pg_auth[:30]}")
    
    return client
