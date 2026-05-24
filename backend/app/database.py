from dotenv import load_dotenv
from supabase import create_client, Client
import os
import logging
from typing import Optional

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Missing required environment variables: "
        "SUPABASE_URL and SUPABASE_KEY must be set in .env"
    )

# Global client using anon/publishable key (respects RLS, no user context)
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_supabase_client(access_token: Optional[str] = None) -> Client:
    """
    Returns a Supabase client scoped to the authenticated user.
    
    Directly sets the Authorization header on the postgrest client to the user's JWT.
    This ensures auth.uid() resolves correctly in Postgres RLS policies without
    relying on set_session (which makes an extra network call and can fail).
    """
    if not access_token:
        return supabase

    from supabase.client import ClientOptions
    client = create_client(
        SUPABASE_URL,
        SUPABASE_KEY,
        options=ClientOptions(persist_session=False),
    )
    # Directly set the user's JWT as the Authorization header.
    # This is what set_session ultimately does via _listen_to_auth_events,
    # but without the fragile get_user() network call.
    client.options.headers["Authorization"] = f"Bearer {access_token}"
    # Reset postgrest so it picks up the new header on next access
    client._postgrest = None
    
    logging.debug(f"[get_supabase_client] Created scoped client, auth header set to user JWT")
    return client