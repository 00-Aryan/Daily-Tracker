from dotenv import load_dotenv
from supabase import create_client
import os

load_dotenv(override=True)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

if not SUPABASE_URL or not SUPABASE_KEY:
    raise RuntimeError(
        "Missing required environment variables: "
        "SUPABASE_URL and SUPABASE_KEY must be set in .env"
    )

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)