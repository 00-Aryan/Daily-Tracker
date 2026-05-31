# ProductivOS — Daily Tracker

A full-stack productivity application designed to help you manage tasks, journal daily reflections, track job applications, and study adaptively using AI-powered question generation.

**Live Demo:** [https://daily-tracker-seven-phi.vercel.app](https://daily-tracker-seven-phi.vercel.app)

---

## 🎯 Features

### 📋 **Tasks**
- **Kanban Board**: Organize tasks across three statuses: Today, Done, and Backlog
- **Drag & Drop**: Intuitive reorganization using `@dnd-kit`
- **Backlog Scheduler**: Automatic daily refresh of backlog items (midnight cron job)
- **Real-time Sync**: Changes sync instantly between frontend and backend

### 📔 **Daily Log**
- **Journal Editor**: Rich text editor for daily reflections
- **Calendar Navigation**: Browse logs across past dates
- **Task Integration**: Quick access to today's tasks while journaling
- **Search**: Full-text search across all journal entries
- **Pagination**: Efficient data retrieval for large datasets

### 💼 **Job Tracker**
- **Application Management**: Track job applications from submission to offer
- **Status Pipeline**: Applied → Screening → Interview → Offer or Rejected
- **Auto Follow-ups**: System alerts when applications need follow-up (7 days)
- **Resume Analytics**: Performance metrics by resume version (response rates)
- **Statistics Dashboard**: Total applied, in screening, interviews, rejections

### 🧠 **Adaptive Study Q&A** *(In Progress)*
- **AI Question Generation**: Gemini 1.5 Flash generates questions from study materials
- **Spaced Repetition**: SM-2 algorithm optimizes review schedules
- **Concept Extraction**: AI extracts key concepts for accurate evaluation
- **Progress Tracking**: Visual progress and due-today counter

---

## 🏗️ Architecture

### **Tech Stack**

| Layer | Technology | Details |
|-------|-----------|---------|
| **Frontend** | React 19 + Vite | Modern, fast development experience |
| | TailwindCSS v4 | Utility-first styling |
| | React Router v7 | Client-side routing |
| | Zustand | Global state management |
| | Axios | HTTP client with centralized API |
| | @dnd-kit | Drag-and-drop interactions |
| **Backend** | FastAPI | Python async web framework |
| | Uvicorn | ASGI server |
| | Supabase | PostgreSQL + Auth + RLS |
| | Pydantic v2 | Data validation |
| | google-genai | AI integration |
| | APScheduler | Cron job scheduling |
| **Database** | PostgreSQL | Via Supabase (free tier) |
| **AI** | Gemini 1.5 Flash | Free API for Q&A generation |
| **Deployment** | Vercel | Frontend hosting |
| | Railway | Backend hosting |

---

## 📁 Project Structure

```
productivos/
├── frontend/                           # React app
│   ├── src/
│   │   ├── components/                 # Reusable UI components
│   │   │   ├── TaskCard.jsx           # Individual task card
│   │   │   ├── KanbanColumn.jsx       # Kanban column with DnD
│   │   │   ├── AddTaskModal.jsx       # Task creation modal
│   │   │   ├── LogEditor.jsx          # Journal text editor
│   │   │   ├── JobCard.jsx            # Job application card
│   │   │   ├── Navbar.jsx             # Top navigation
│   │   │   └── Sidebar.jsx            # Left sidebar navigation
│   │   ├── pages/                      # Route pages
│   │   │   ├── Tasks.jsx              # Task management page
│   │   │   ├── DailyLog.jsx           # Journal page
│   │   │   ├── JobTracker.jsx         # Job applications page
│   │   │   └── StudyQA.jsx            # Spaced repetition page
│   │   ├── services/
│   │   │   └── api.js                 # Centralized axios instance
│   │   ├── store/
│   │   │   └── useAppStore.js         # Zustand global store
│   │   └── App.jsx                    # Router & layout
│   └── package.json
│
├── backend/                            # FastAPI app
│   ├── app/
│   │   ├── main.py                    # Entry point & CORS setup
│   │   ├── database.py                # Supabase client init
│   │   ├── routers/                   # API endpoints (one per module)
│   │   │   ├── tasks.py               # Task CRUD + scheduler
│   │   │   ├── logs.py                # Journal CRUD + search
│   │   │   ├── jobs.py                # Job tracking + stats
│   │   │   ├── reference.py           # Reference data (subjects, projects)
│   │   │   ├── study.py               # Q&A generation & evaluation
│   │   │   └── auth.py                # Authentication (placeholder)
│   │   ├── schemas/                   # Pydantic models (one per module)
│   │   │   ├── task.py
│   │   │   ├── log.py
│   │   │   ├── job.py
│   │   │   └── study.py
│   │   └── services/                  # Business logic
│   │       ├── gemini_service.py      # AI Q&A generation & eval
│   │       └── sm2_algorithm.py       # Spaced repetition scheduling
│   ├── pyproject.toml                 # uv dependencies
│   └── create_tables.sql              # Schema definition
│
├── PRODUCTIVOS_PROJECT_SPEC.md        # Source of truth spec
├── docs/                              # Code reviews & architecture
│   └── reviews/
│       ├── CODE_REVIEW_MASTER.md
│       ├── CODE_REVIEW_BACKEND.md
│       ├── CODE_REVIEW_FRONTEND.md
│       ├── CODE_REVIEW_INTEGRATION.md
│       └── CODE_REVIEW_SECURITY.md
└── README.md                          # This file
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.14+
- uv (Python package manager)
- Supabase account (free tier)

### Environment Setup

**Backend (.env)**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-public-anon-key
GEMINI_API_KEY=your-gemini-api-key
DATABASE_URL=postgres://...
SECRET_KEY=your-secret-key
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174
```

**Frontend (.env)**
```env
VITE_API_BASE_URL=http://localhost:8000
```

### Installation

```bash
# Clone repository
git clone https://github.com/00-Aryan/Daily-Tracker.git
cd Daily-Tracker

# Backend setup
cd backend
uv sync
cd ..

# Frontend setup
cd frontend
npm install
cd ..
```

### Running Locally

**Terminal 1 — Backend**
```bash
cd backend
uv run uvicorn app.main:app --reload
# Backend runs at http://localhost:8000
# API docs at http://localhost:8000/docs
```

**Terminal 2 — Frontend**
```bash
cd frontend
npm run dev
# Frontend runs at http://localhost:5173
```

---

## 📊 Key APIs

### Tasks
- `GET /tasks` — List all tasks
- `POST /tasks` — Create task
- `PUT /tasks/{id}` — Update task status
- `DELETE /tasks/{id}` — Delete task

### Daily Logs
- `GET /logs/{date}` — Get log for specific date
- `POST /logs` — Create/update log
- `GET /logs/search` — Full-text search logs
- `GET /logs/paginated` — Paginated log list

### Jobs
- `GET /jobs` — List all job applications
- `POST /jobs` — Add new application
- `PUT /jobs/{id}` — Update job status
- `DELETE /jobs/{id}` — Delete application
- `GET /jobs/stats` — Application statistics
- `GET /jobs/follow-ups` — Applications needing follow-up

### Study
- `POST /study/generate-questions` — AI-generate questions from material
- `POST /study/submit-attempt` — Submit answer & get AI evaluation
- `GET /study/due-today` — Get questions due for review today

---

## 🔐 Security & Architecture

- **Row-Level Security (RLS)**: Supabase RLS policies enforce user data isolation
- **CORS Configuration**: Restricted to approved frontend domains
- **Input Validation**: Pydantic models validate all API inputs
- **Error Handling**: Comprehensive error handling with meaningful HTTP status codes
- **Async Processing**: Backend uses asyncio for non-blocking operations

See detailed security review in `docs/reviews/CODE_REVIEW_SECURITY.md`

---

## 🧪 Code Quality

This project includes comprehensive code reviews covering:
- **Performance**: Async/await patterns, query optimization
- **Data Integrity**: Schema validation, RLS enforcement
- **Security**: Input validation, CORS, user scoping
- **Architecture**: State management, API design, error handling
- **Integration**: End-to-end data flows, state synchronization

Review documents in `docs/reviews/`:
- `CODE_REVIEW_MASTER.md` — Executive summary
- `CODE_REVIEW_BACKEND.md` — FastAPI architecture
- `CODE_REVIEW_FRONTEND.md` — React patterns
- `CODE_REVIEW_INTEGRATION.md` — Full-stack data flows
- `CODE_REVIEW_SECURITY.md` — Security analysis

---

## 📈 Current Status

### ✅ Completed
- Full task management (CRUD + Kanban + scheduler)
- Daily journal with search & pagination
- Job application tracking with follow-up reminders
- Reference data management
- Frontend-backend integration
- RLS security implementation
- Comprehensive code reviews

### 🔄 In Progress
- Adaptive Study Q&A module (AI question generation & SM-2 scheduling)
- User authentication system

### 🎯 Planned
- Mobile app
- Advanced analytics & insights
- Export to PDF/CSV
- Integration with calendar services

---

## 🎓 Learning Outcomes

This project demonstrates:
- **Full-stack development** with modern tools (React, FastAPI, PostgreSQL)
- **AI integration** using Gemini API for intelligent features
- **Database design** with normalized schemas and RLS policies
- **Async programming** in both JavaScript (async/await) and Python
- **State management** with Zustand for complex UI state
- **API design** following REST principles with proper error handling
- **Software architecture** with separation of concerns (routers, schemas, services)
- **Production readiness** with security, validation, and comprehensive error handling

---

## 📚 Documentation

- **Architecture**: See `docs/` directory for detailed code reviews
- **API Spec**: Generated at `/docs` when backend is running (Swagger UI)
- **Project Spec**: See `PRODUCTIVOS_PROJECT_SPEC.md` for feature specifications
- **Tech Stack**: See `.kiro/steering/tech.md` for technology decisions

---

## 🤝 Contributing

This is a personal portfolio project. For improvements or bug reports, feel free to open an issue.

---

## 📝 License

MIT License — See LICENSE file for details

---

## 👤 Author

**Aryan** — Full-stack developer learning modern web technologies

- GitHub: [@00-Aryan](https://github.com/00-Aryan)
- Portfolio: [daily-tracker-seven-phi.vercel.app](https://daily-tracker-seven-phi.vercel.app)

---

## 📞 Support

For questions or issues:
1. Check the documentation in `docs/`
2. Review API docs at `http://localhost:8000/docs` (local development)
3. Open an issue on GitHub

---

**Last Updated**: May 31, 2026
