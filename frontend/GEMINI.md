# ProductivOS — Project Context

## Project Overview
Full-stack personal productivity app.
Spec file: PRODUCTIVOS_PROJECT_SPEC.md — always read this before making changes.

## Stack
- Frontend: React + Vite + TailwindCSS → hosted on Vercel
- Backend: FastAPI (Python) → hosted on Railway
- Database: PostgreSQL via Supabase
- AI Layer: Gemini 1.5 Flash API (free tier)
- Python package manager: uv (NEVER pip)

## Project Structure
```
productivos/
├── frontend/        # React + Vite
├── backend/         # FastAPI
│   ├── app/
│   │   ├── main.py
│   │   ├── database.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── services/
│   │   └── schemas/
│   ├── pyproject.toml
│   └── .env
└── PRODUCTIVOS_PROJECT_SPEC.md
```

## Modules Built So Far
- [x] Backend skeleton + health check
- [x] All 11 Supabase tables created
- [x] Tasks router (CRUD + backlog scheduler)
- [x] Reference data router (subjects, subtopics, platforms, projects)
- [x] Daily logs router (CRUD + search + pagination)
- [x] Jobs router (CRUD + stats + follow-up)
- [x] React frontend skeleton (routing + sidebar + layout)
- [x] Tasks page (Kanban board + Add Task modal)
- [ ] Daily Log page
- [ ] Job Tracker page
- [ ] Adaptive Study Q&A module

## Hard Rules — Never Break These
1. Use uv for ALL Python dependency management
2. Use Supabase Python client only — no SQLAlchemy, no raw psycopg2
3. user_id is hardcoded as "00000000-0000-0000-0000-000000000000" until auth is added
4. All API routes must match PRODUCTIVOS_PROJECT_SPEC.md exactly
5. Do not add features beyond what is in the spec
6. Never modify the database schema without explicit instruction
7. Frontend .env variable prefix is VITE_
8. Backend runs with: uv run uvicorn app.main:app --reload
9. Frontend runs with: npm run dev
10. Database URL uses port 6543 (Supabase connection pooler)

## Running The Project
```bash
# Terminal 1 — Backend
cd backend && uv run uvicorn app.main:app --reload

# Terminal 2 — Frontend  
cd frontend && npm run dev

# Backend docs
http://localhost:8000/docs

# Frontend
http://localhost:5173
```

## Import This For Sub-Agents
@./backend/GEMINI.md
@./frontend/GEMINI.md