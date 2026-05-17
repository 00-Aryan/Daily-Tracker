# Project Structure — ProductivOS

## Root Layout
```
productivos/
├── frontend/                    # React + Vite app
├── backend/                     # FastAPI app
├── PRODUCTIVOS_PROJECT_SPEC.md  # Source of truth — read before any change
├── GEMINI.md                    # Gemini CLI project context
└── .cursor/rules/               # Cursor scoped rules
    ├── core.mdc
    ├── backend.mdc
    ├── frontend.mdc
    └── database.mdc
```

## Backend Structure
```
backend/
├── app/
│   ├── main.py           # App entry, router registration, startup events
│   ├── database.py       # Supabase client — exports `supabase`
│   ├── routers/          # One file per module
│   │   ├── tasks.py      # DONE
│   │   ├── reference.py  # DONE (subjects, subtopics, platforms, projects)
│   │   ├── logs.py       # DONE
│   │   ├── jobs.py       # DONE
│   │   └── study.py      # NOT STARTED
│   ├── schemas/          # Pydantic models — one file per module
│   │   ├── task.py       # DONE
│   │   ├── reference.py  # DONE
│   │   ├── log.py        # DONE
│   │   ├── job.py        # DONE
│   │   └── study.py      # NOT STARTED
│   ├── services/         # Business logic
│   │   ├── gemini_service.py   # NOT STARTED
│   │   ├── sm2_algorithm.py    # NOT STARTED
│   │   └── scheduler.py        # Midnight backlog cron
│   └── models/           # Reserved — not used yet
├── pyproject.toml        # uv dependencies
└── .env                  # Never commit this
```

## Frontend Structure
```
frontend/src/
├── components/           # Reusable UI components
│   ├── Sidebar.jsx       # DONE
│   ├── Navbar.jsx        # DONE
│   ├── TaskCard.jsx      # DONE
│   ├── KanbanColumn.jsx  # DONE
│   ├── AddTaskModal.jsx  # DONE
│   ├── LogEditor.jsx     # DONE
│   ├── LogJournal.jsx    # DONE
│   ├── AddJobModal.jsx   # DONE
│   ├── JobCard.jsx       # DONE
│   └── study/            # NOT STARTED — Study Q&A components go here
├── pages/
│   ├── Tasks.jsx         # DONE
│   ├── DailyLog.jsx      # DONE
│   ├── JobTracker.jsx    # DONE
│   └── StudyQA.jsx       # NOT STARTED
├── services/
│   └── api.js            # ALL API calls — axios instance + named functions
├── store/
│   └── useAppStore.js    # Zustand global state
├── App.jsx               # Router + layout
└── main.jsx
```

## Key Patterns

### Backend — Supabase Query Pattern
```python
from app.database import supabase

result = supabase.table("table_name").select("*").eq("user_id", USER_ID).execute()
data = result.data  # always a list
```

### Backend — Router Registration in main.py
```python
from app.routers import new_module
app.include_router(new_module.router, prefix="/route", tags=["Tag"])
```

### Frontend — API Call Pattern
```javascript
// Define in api.js
export const getData = () => api.get('/endpoint')

// Use in component
useEffect(() => {
  getData().then(res => setData(res.data)).catch(err => setError(err.message))
}, [])
```

### Frontend — Component Pattern
```jsx
export default function ComponentName({ prop1, prop2 }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  if (loading) return <div className="p-4 text-stone-400">Loading...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>

  return <div>{/* content */}</div>
}
```

## Naming Conventions
- React components: PascalCase (TaskCard.jsx)
- API service functions: camelCase (getJobs, createTask)
- Python files: snake_case (gemini_service.py)
- Database tables: snake_case (job_applications, study_attempts)
- CSS: Tailwind utility classes only, no custom class names

## What Is Complete vs Pending
Complete: tasks, reference, logs, jobs routers + all their pages
Pending: study router, gemini_service, sm2_algorithm, StudyQA page

## Placeholder user_id
All backend queries use:
USER_ID = "00000000-0000-0000-0000-000000000000"
This will be replaced when auth is implemented later.
