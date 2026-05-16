# ProductivOS — Personal Productivity System
> A fully customized productivity OS built for tracking tasks, daily logs, adaptive study Q&A, and job applications.

---

## Project Overview

**ProductivOS** is a personal full-stack web application designed to solve fragmentation — plans, tasks, study progress, and job applications all in one place, accessible across devices.

### Core Philosophy
- Nothing gets lost
- Everything is tracked and revisitable
- The system adapts to the user's learning level over time
- Mobile + Desktop accessible

---

## Tech Stack

| Layer | Technology | Reason |
|---|---|---|
| Frontend | React + Vite | Best for dashboard/SPA apps |
| Styling | TailwindCSS | Fast, clean, utility-first |
| Backend | FastAPI (Python) | DS-relevant, fast, async-ready |
| Database | PostgreSQL via Supabase | Free tier, no sleep, auth built-in |
| AI Layer | Gemini 1.5 Flash API | Free tier, question generation + answer evaluation |
| Frontend Hosting | Vercel | Free, instant CI/CD |
| Backend Hosting | Railway | Free tier, Python support |
| Auth | Supabase Auth | Built-in, email/password |
| Python Package Manager | uv | Faster than pip+venv, modern standard |

---

## Project Structure

```
productivos/
├── frontend/                        # React + Vite app
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   └── shared/
│   │   ├── pages/                   # One file per module
│   │   │   ├── Tasks.jsx
│   │   │   ├── DailyLog.jsx
│   │   │   ├── StudyQA.jsx
│   │   │   └── JobTracker.jsx
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── services/                # API call functions
│   │   │   └── api.js
│   │   ├── store/                   # State management (Zustand)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                         # FastAPI app
│   ├── app/
│   │   ├── main.py                  # FastAPI entry point
│   │   ├── database.py              # Supabase/PostgreSQL connection
│   │   ├── models/                  # SQLAlchemy or Supabase models
│   │   │   ├── task.py
│   │   │   ├── log.py
│   │   │   ├── study.py
│   │   │   └── job.py
│   │   ├── routers/                 # One router per module
│   │   │   ├── tasks.py
│   │   │   ├── logs.py
│   │   │   ├── study.py
│   │   │   └── jobs.py
│   │   ├── services/
│   │   │   ├── gemini_service.py    # Gemini API integration
│   │   │   ├── sm2_algorithm.py     # Spaced repetition scoring
│   │   │   └── scheduler.py        # Midnight auto-backlog logic
│   │   └── schemas/                 # Pydantic request/response schemas
│   ├── pyproject.toml           # uv manages dependencies here
│   ├── uv.lock                  # lockfile — commit this to git
│   └── .env
│
└── README.md
```

---

## Database Schema

### users
```sql
id UUID PRIMARY KEY
email TEXT UNIQUE
name TEXT
created_at TIMESTAMP
```

### user_profile
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
strengths TEXT[]          -- e.g. ["Python", "EDA"]
weaknesses TEXT[]         -- e.g. ["SQL", "Statistics"]
learning_style TEXT       -- e.g. "visual", "problem-first"
current_goals TEXT[]      -- e.g. ["Get DS job", "Learn FastAPI"]
created_at TIMESTAMP
updated_at TIMESTAMP
```

### subjects
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
name TEXT                 -- e.g. "SQL", "Machine Learning"
created_at TIMESTAMP
```

### subtopics
```sql
id UUID PRIMARY KEY
subject_id UUID REFERENCES subjects(id)
name TEXT                 -- e.g. "Window Functions", "Gradient Boosting"
```

### platforms
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
name TEXT                 -- e.g. "LeetCode", "Mode Analytics", "Kaggle"
```

### projects
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
name TEXT                 -- e.g. "Engage2Value", "Job Applications"
description TEXT
created_at TIMESTAMP
```

### tasks
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
title TEXT
task_type TEXT            -- "study" | "general"
priority INTEGER          -- 1 (highest) to 5 (lowest)
deadline DATE
status TEXT               -- "today" | "done" | "backlog"
project_id UUID REFERENCES projects(id)
subject_id UUID REFERENCES subjects(id)      -- nullable, study tasks only
subtopic_id UUID REFERENCES subtopics(id)    -- nullable, study tasks only
platform_id UUID REFERENCES platforms(id)    -- nullable, study tasks only
problem_name TEXT                            -- nullable, study tasks only
created_at TIMESTAMP
completed_at TIMESTAMP
moved_to_backlog_at TIMESTAMP
```

### daily_logs
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
log_date DATE
what_i_did TEXT
blockers TEXT
tomorrow_intention TEXT
created_at TIMESTAMP
updated_at TIMESTAMP
```

### topic_levels
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
subject_id UUID REFERENCES subjects(id)
subtopic_id UUID REFERENCES subtopics(id)
numerical_score FLOAT     -- 1.0 to 10.0
attempt_count INTEGER
correct_count INTEGER
streak INTEGER
last_attempted TIMESTAMP
updated_at TIMESTAMP
```

### study_questions
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
subject_id UUID REFERENCES subjects(id)
subtopic_id UUID REFERENCES subtopics(id)
question_text TEXT
difficulty_level TEXT     -- "beginner" | "intermediate" | "advanced"
generated_by TEXT         -- "gemini" | "user"
created_at TIMESTAMP
```

### study_attempts
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
question_id UUID REFERENCES study_questions(id)
user_answer TEXT
gemini_raw_score FLOAT    -- 0.0 to 1.0 from Gemini evaluation
final_score FLOAT         -- calculated by SM-2 algorithm
feedback TEXT             -- Gemini's feedback on the answer
is_correct BOOLEAN
scheduled_for DATE        -- when to repeat this question (SM-2)
attempt_date TIMESTAMP
```

### job_applications
```sql
id UUID PRIMARY KEY
user_id UUID REFERENCES users(id)
company_name TEXT
role TEXT
jd_link TEXT
date_applied DATE
platform TEXT             -- "Wellfound" | "Internshala" | "LinkedIn" etc
resume_version TEXT       -- e.g. "ML_Resume_v2", "DS_Resume_v1"
status TEXT               -- "Applied" | "Screening" | "Interview" | "Rejected" | "Offer"
notes TEXT
follow_up_sent BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
updated_at TIMESTAMP
```

---

## Module 1 — Task + Backlog

### UI Layout
- Kanban board with 3 columns: **Today | Done | Backlog**
- Drag and drop between Today ↔ Backlog (Done is terminal for the day)
- Top right: Add Task button → opens modal

### Add Task Modal Fields
**General Task:**
- Title (text)
- Project (dropdown — user-created)
- Priority (1-5 selector)
- Deadline (date picker)
- Task Type: General

**Study Task:**
- Title (text, optional — auto-filled from subject+subtopic+problem)
- Subject (dropdown — user-created)
- Subtopic (dropdown — filtered by subject)
- Problem Name (text)
- Platform (dropdown — user-created)
- Priority (1-5)
- Deadline (date picker)
- Task Type: Study

### Core Logic

**Auto-backlog (backend scheduled job):**
```
Every day at 11:59 PM:
  SELECT all tasks WHERE status = 'today' AND user_id = X
  UPDATE status = 'backlog', moved_to_backlog_at = NOW()
```

**Manual backlog push:**
- Drag card from Today → Backlog column
- PATCH /tasks/{id} with status: "backlog"

**Drag back to Today:**
- Drag card from Backlog → Today column
- PATCH /tasks/{id} with status: "today"

**Backlog sort order:**
- Sort by priority (1 = top), then by created_at

### Progress Tracking (Sequential Implementation)
1. **Phase 1:** Progress bar per subtopic — "4/10 problems done"
2. **Phase 2:** Weekly problem count per subject — "7 SQL problems this week"
3. **Phase 3:** GitHub-style heatmap — activity per day across subjects

---

## Module 2 — Daily Log

### UI Layout
- Split view per day: **Left = Today's Tasks | Right = Log Entry**
- Top: Date selector to navigate to past days
- Tasks side is read-only — shows what was in Today + Done for that date

### Log Entry Fields
- **What I did** (textarea)
- **Blockers / How I felt / Time sinks** (textarea)
- **Tomorrow's intention** (textarea)
- Save button → PATCH or POST /logs/{date}

### Revisit (Sequential Implementation)
1. **Phase 1:** Journal scroll — paginated list of past entries
2. **Phase 2:** Date + keyword search
3. **Phase 3:** Weekly auto-summary via Gemini — "This week you completed X, blocked on Y"

---

## Module 3 — Adaptive Study Q&A

### This Is The Most Complex Module. Build Last.

### Onboarding Flow (One-time)
When user first opens Study Q&A:
1. Ask: What subjects are you studying? (multi-select from their created subjects)
2. Ask: Rate your current confidence per subject (1-10 slider)
3. Ask: What are your main weak areas? (free text)
4. Ask: What's your learning goal? (e.g. "Get DS job", "Clear ML interviews")
5. Save to `user_profile` table

### Question Generation (Gemini API)

**System Prompt Template for Gemini:**
```
You are an adaptive learning assistant for a Data Science student.

User Profile:
- Strengths: {strengths}
- Weaknesses: {weaknesses}
- Goals: {goals}
- Current level on {subtopic}: {numerical_score}/10
- Recent wrong answers: {recent_wrong_answers}

Generate 5 questions on the topic: {subject} → {subtopic}

Rules:
- If level < 4: beginner questions — definitions, basic concepts
- If level 4-7: intermediate — application, why/how reasoning
- If level > 7: advanced — edge cases, tradeoffs, real-world application
- Prioritize areas where the user has answered incorrectly recently
- Questions must test intuition, not just definitions
- Return ONLY a JSON array, no extra text:
[
  {
    "question": "...",
    "difficulty": "beginner|intermediate|advanced",
    "expected_concepts": ["concept1", "concept2"]
  }
]
```

### Answer Evaluation (Gemini API)

**Evaluation Prompt Template:**
```
You are evaluating a Data Science student's answer.

Question: {question}
Expected concepts to cover: {expected_concepts}
Student's answer: {user_answer}

Evaluate the answer and return ONLY JSON, no extra text:
{
  "raw_score": 0.0 to 1.0,
  "is_correct": true/false,
  "feedback": "specific feedback on what was right, wrong, or missing",
  "missing_concepts": ["concept1", "concept2"]
}
```

### SM-2 Scoring Algorithm (Backend — sm2_algorithm.py)

```python
def calculate_new_score(
    current_score: float,      # 1.0 to 10.0
    gemini_raw_score: float,   # 0.0 to 1.0 from Gemini
    attempt_count: int,
    correct_count: int,
    streak: int
) -> dict:
    """
    Hybrid SM-2 inspired algorithm.
    Does NOT rely purely on LLM score.
    """
    
    # Accuracy rate over all attempts
    accuracy = correct_count / attempt_count if attempt_count > 0 else 0
    
    # Streak bonus/penalty
    streak_factor = min(streak * 0.1, 0.5) if gemini_raw_score > 0.6 else -min(streak * 0.05, 0.3)
    
    # Recency weight — recent attempts matter more
    recency_weight = 0.7  # 70% new score, 30% historical
    
    # Weighted new score
    raw_adjusted = (gemini_raw_score * 10)  # convert to 1-10 scale
    new_score = (recency_weight * raw_adjusted) + ((1 - recency_weight) * current_score)
    
    # Apply accuracy adjustment
    accuracy_adjustment = (accuracy - 0.5) * 2  # -1 to +1 range
    new_score = new_score + accuracy_adjustment
    
    # Apply streak factor
    new_score = new_score + streak_factor
    
    # Clamp to 1-10
    new_score = max(1.0, min(10.0, new_score))
    
    # Calculate next review date (SM-2 spacing)
    if gemini_raw_score < 0.4:
        next_review_days = 1   # Wrong — review tomorrow
    elif gemini_raw_score < 0.7:
        next_review_days = 3   # Partial — review in 3 days
    else:
        next_review_days = max(1, streak * 2)  # Correct — space it out
    
    return {
        "new_score": round(new_score, 2),
        "next_review_days": next_review_days,
        "updated_streak": streak + 1 if gemini_raw_score > 0.6 else 0
    }
```

### UI Flow
1. User selects Subject + Subtopic
2. Gemini generates 5 questions for the session
3. One question shown at a time
4. User types free text answer → submits
5. Gemini evaluates → shows score + feedback
6. After all 5 → session summary: score per question, level change, what to review
7. Wrong/weak answers scheduled for tomorrow automatically

### Progress Tracking UI
- Per subtopic: numerical level (1-10) + accuracy percentage + total attempts
- Per subject: aggregate score across all subtopics
- Timeline: score change over time (line chart)

---

## Module 4 — Job Tracker

### UI Layout
- Table view with filters by status
- Stats bar at top: Total Applied | In Screening | Interviews | Rejected
- Resume Performance section: which resume version has best response rate

### Table Columns
| Company | Role | Platform | Resume Used | Date Applied | Status | JD | Follow Up | Notes |

### Status Flow
```
Applied → Screening → Interview → Offer
                    → Rejected (can happen at any stage)
```

### Resume Performance Logic
```python
# Backend calculation
def resume_performance(applications):
    resume_stats = {}
    for app in applications:
        v = app.resume_version
        if v not in resume_stats:
            resume_stats[v] = {"total": 0, "responses": 0}
        resume_stats[v]["total"] += 1
        if app.status != "Applied":  # Any movement = response
            resume_stats[v]["responses"] += 1
    
    for v in resume_stats:
        resume_stats[v]["response_rate"] = (
            resume_stats[v]["responses"] / resume_stats[v]["total"] * 100
        )
    return resume_stats
```

### Follow-up Reminder Logic
```
Daily check (backend scheduler):
  SELECT applications WHERE
    status = 'Applied'
    AND follow_up_sent = FALSE
    AND date_applied <= NOW() - INTERVAL '7 days'
  → Flag these in UI with a banner: "Consider following up with X"
  → User clicks "Mark Follow Up Sent" → follow_up_sent = TRUE
```

---

## API Routes

### Tasks
```
GET    /tasks?status=today|done|backlog     Get tasks by status
POST   /tasks                               Create task
PATCH  /tasks/{id}                          Update task (status, priority, etc)
DELETE /tasks/{id}                          Delete task
POST   /tasks/run-backlog-check             Trigger midnight backlog move (cron)
```

### Daily Logs
```
GET    /logs?date=YYYY-MM-DD               Get log for specific date
GET    /logs?page=1&limit=10               Paginated journal view
POST   /logs                               Create log entry
PATCH  /logs/{id}                          Update log entry
GET    /logs/search?q=keyword              Search logs
```

### Study
```
GET    /study/subjects                     Get all subjects
POST   /study/subjects                     Create subject
POST   /study/subtopics                    Create subtopic under subject
GET    /study/questions/generate           Trigger Gemini question generation
POST   /study/attempts                     Submit answer + trigger evaluation
GET    /study/levels                       Get user's level per subtopic
GET    /study/stats                        Accuracy + progress over time
```

### Jobs
```
GET    /jobs                               Get all applications
POST   /jobs                               Add new application
PATCH  /jobs/{id}                          Update status/notes
GET    /jobs/stats                         Resume performance + counts
GET    /jobs/followup                      Get applications needing follow-up
```

### Profile
```
GET    /profile                            Get user profile + SWOT
POST   /profile                            Create initial profile
PATCH  /profile                            Update profile
```

---

## Environment Variables

### Frontend (.env)
```
VITE_API_BASE_URL=https://your-railway-app.railway.app
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Backend (.env)
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_service_key
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_postgres_connection_string
SECRET_KEY=your_jwt_secret
```

---

## Build Order (Do Not Deviate)

### Phase 1 — Foundation (Week 1-2)

**Backend setup with uv:**
```bash
# Install uv (if not already installed)
curl -LsSf https://astral.sh/uv/install.sh | sh

# Create backend project
cd productivos/backend
uv init
uv add fastapi uvicorn supabase python-dotenv pydantic

# Run the server
uv run uvicorn app.main:app --reload

# Add packages later like this (NOT pip install)
uv add google-generativeai
uv add apscheduler   # for midnight backlog cron
```

1. Set up Supabase project + create all tables
2. Set up FastAPI backend using uv — auth + basic health check
3. Set up React + Vite frontend — routing + sidebar + layout
4. Deploy backend to Railway, frontend to Vercel

### Phase 2 — Tasks Module (Week 3-4)
1. Backend: Tasks CRUD + backlog scheduler
2. Frontend: Kanban board + drag and drop
3. Predefined dropdowns: Projects, Subjects, Subtopics, Platforms (CRUD)
4. Test full task flow end to end

### Phase 3 — Daily Log (Week 5)
1. Backend: Logs CRUD + search
2. Frontend: Split view (tasks left, log right)
3. Past log journal view

### Phase 4 — Job Tracker (Week 6)
1. Backend: Jobs CRUD + resume stats + follow-up logic
2. Frontend: Table view + stats bar + resume performance chart

### Phase 5 — Adaptive Study Q&A (Week 7-10)
1. Backend: Gemini integration — question generation
2. Backend: SM-2 algorithm + answer evaluation
3. Backend: Topic level tracking + scheduling
4. Frontend: Onboarding flow
5. Frontend: Q&A session UI
6. Frontend: Progress dashboard (level, accuracy, timeline chart)

---

## Agent Prompting Guide

When using Claude Code, Cursor, or Gemini CLI to build modules, use this structure in your prompts:

```
Context:
- Project: ProductivOS — personal productivity full-stack app
- Stack: React + Vite (frontend), FastAPI (backend), PostgreSQL via Supabase
- Current phase: [Phase X — Module Name]

Task:
[Specific thing to build — be precise, one thing at a time]

Constraints:
- Follow the project structure defined in PRODUCTIVOS_PROJECT_SPEC.md
- Use the exact database schema defined in the spec
- API routes must match the spec exactly
- Do not add features beyond what is specified — keep it minimal and working

Reference:
- Database schema: [paste relevant tables]
- API route: [paste relevant route]

Deliver:
- Working code only
- Include comments explaining non-obvious logic
- Do not skip error handling
```

---

## Notes For The Builder (Aryan)

- **Build one module at a time. Do not jump ahead.**
- Test each API route in Postman or FastAPI docs before touching frontend
- Commit to GitHub after each working feature — not after each session
- The SM-2 algorithm in sm2_algorithm.py is pre-written above — use it exactly, do not ask AI to rewrite it
- Gemini prompts are defined above — copy them exactly, only fill in the variables
- When stuck: debug backend first, then frontend. Never assume it's the frontend
- This spec is the source of truth. If AI suggests something that contradicts this spec, follow the spec.