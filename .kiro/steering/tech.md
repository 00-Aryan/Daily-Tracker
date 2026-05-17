# Technology Stack — ProductivOS

## Frontend
- React 18 + Vite
- TailwindCSS v4
- React Router v6
- Axios (all API calls via src/services/api.js)
- Zustand (global state in src/store/useAppStore.js)
- Plain JavaScript — NO TypeScript

## Backend
- Python 3.11+
- FastAPI + Uvicorn
- Supabase Python client (supabase-py) — NO SQLAlchemy, NO psycopg2
- Pydantic v2 for schemas
- APScheduler for cron jobs (midnight backlog task)
- google.genai (NOT google.generativeai — that package is deprecated)

## AI Layer
- Model: gemini-1.5-flash (free tier)
- Import: import google.genai as genai
- Used for: question generation + answer evaluation in Study Q&A module

## Database
- PostgreSQL via Supabase
- Connection via Supabase Python client only
- Port 6543 (connection pooler — required for Railway)
- All 11 tables already created — DO NOT run CREATE TABLE

## Package Management
- Python: uv ONLY — never pip, never pip install
  - Add package: uv add package-name
  - Run script: uv run python script.py
  - Run server: uv run uvicorn app.main:app --reload
- JavaScript: npm

## Hosting
- Frontend: Vercel
- Backend: Railway
- Database: Supabase (free tier)

## Environment Variables

### Backend (.env)
  SUPABASE_URL=
  SUPABASE_KEY=
  GEMINI_API_KEY=
  DATABASE_URL=  (port 6543)
  SECRET_KEY=

### Frontend (.env)
  VITE_API_BASE_URL=http://localhost:8000

## Hard Constraints — Never Violate
1. uv only for Python packages — NEVER pip
2. Supabase client only — NEVER SQLAlchemy
3. google.genai — NEVER google.generativeai
4. user_id hardcoded: "00000000-0000-0000-0000-000000000000" (auth not added yet)
5. Frontend env vars must be prefixed with VITE_
6. Never add features not in PRODUCTIVOS_PROJECT_SPEC.md
7. Never modify existing database schema
8. No external UI libraries (no MUI, Chakra, Ant Design)
9. Tailwind utility classes only — no custom CSS files
10. No TypeScript — plain JavaScript only
