# ProductivOS — Code Review Document

**Date:** 2026-05-18  
**Scope:** Tasks Module + Daily Log Module + Shared Infrastructure  
**Status:** Living document — updated as issues are fixed  

## How To Use This Document

- Each issue has a unique ID (e.g., `TB-01`, `DLF-03`) for easy reference
- Severity: 🔴 Critical (breaks functionality) | 🟡 Medium (incorrect behavior) | 🟢 Low (cosmetic/optimization)
- When fixing an issue: mark it ✅ in its section, add entry to Fix Log (Section 9), update Progress Tracker (Section 10)
- Issues marked with `[AUTH-DEFER]` are expected to be resolved when Supabase Auth is implemented

---

## Summary

| Module | 🔴 Critical | 🟡 Medium | 🟢 Low | Total |
|--------|-------------|-----------|--------|-------|
| Tasks — Backend | 1 | 4 | 2 | 7 |
| Tasks — Frontend | 0 | 4 | 3 | 7 |
| Daily Log — Backend | 1 | 4 | 1 | 6 |
| Daily Log — Frontend | 1 | 3 | 3 | 7 |
| Shared Infrastructure | 1 | 4 | 3 | 8 |
| Study Q&A — Backend | 0 | 4 | 2 | 6 |
| Study Q&A — Frontend | 0 | 3 | 3 | 6 |
| Feature Gap (Combobox) | — | — | — | 1 |
| **Total** | **4** | **26** | **17** | **48** |

---

## Section 1: Critical Issues (Fix First)

| ID | Module | Issue | Why Critical |
|----|--------|-------|--------------|
| DLB-01 | Daily Log Backend | `/search` route is unreachable — shadowed by `/{log_date}` | Search feature is completely broken |
| TB-01 | Tasks Backend | No `user_id` filtering on any query | All users see all data (security hole when auth is added) |
| DLF-01 | Daily Log Frontend | "Today's Tasks" always shows current tasks, not tasks for selected date | Contradicts spec, misleading historical view |
| SI-01 | Shared Infra | CORS `allow_origins=["*"]` with `allow_credentials=True` | Will break entirely when auth cookies/tokens are added |

---

## Section 2: Tasks Module — Backend

**File:** `backend/app/routers/tasks.py`

### TB-01 🔴 No user_id filtering on queries `[AUTH-DEFER]`
- **What:** All task queries (`get_tasks`, `update_task`, `delete_task`) have no `.eq("user_id", ...)` filter. Every user sees every task.
- **Impact:** Security — data leaks across users once auth is added.
- **Fix:** Add user_id filter to every query. Extract user from auth token via dependency injection.

### TB-02 🟡 DUMMY_USER_ID defined but never used
- **What:** Line 10 defines `DUMMY_USER_ID = "00000000-..."` but it's never passed to any insert or query.
- **Impact:** Suggests intent to scope by user, but implementation was never completed. Data inserted without user_id becomes orphaned.
- **Fix:** Either use it as a placeholder for dev, or remove it and implement proper auth extraction.

### TB-03 ✅ ~~_row_to_response null safety on joined tables~~
- **What:** `row.get("projects", {}).get("name")` — if Supabase returns `None` (not `{}`) for a deleted/null FK, calling `.get("name")` on `None` raises `AttributeError`.
- **Impact:** 500 error when a task references a deleted project (FK is `ON DELETE SET NULL`).
- **Fix:** Use `(row.get("projects") or {}).get("name")` pattern.

### TB-04 🟡 run-backlog-check race condition + no user scoping
- **What:** First SELECTs count of today tasks, then UPDATEs all today→backlog. Between these two calls, state can change. Also moves ALL users' tasks to backlog.
- **Impact:** Incorrect count returned; all users affected by one cron trigger.
- **Fix:** Remove the count step (just do the update and return affected rows). Add user_id scoping when auth exists.

### TB-05 ✅ ~~update_task response missing joined names~~
- **What:** After `supabase.table("tasks").update(...)`, the returned row doesn't include joined table data (projects, subjects, etc.). `_row_to_response` will return `null` for all `*_name` fields.
- **Impact:** Frontend shows task without project/subject names after a status change until page refresh.
- **Fix:** Re-fetch with joins after update: `.select("*, projects(name), subjects(name), subtopics(name), platforms(name)")`.

### TB-06 🟢 delete_task idempotency
- **What:** Deleting an already-deleted task returns 404. Not harmful but not RESTful — DELETE should be idempotent.
- **Impact:** Minor — could cause confusing errors if user double-clicks delete.
- **Fix:** Return 204 regardless, or keep 404 but handle gracefully on frontend.

### TB-07 🟢 Task creation doesn't set user_id — orphaned data `[AUTH-DEFER]`
- **What:** `create_task` insert payload has no `user_id` field. DB column is nullable (no explicit NOT NULL), so insert succeeds but data is unowned.
- **Impact:** When auth is added, existing data won't belong to any user. Migration needed.
- **Fix:** Set user_id from auth context on every insert. For dev, use DUMMY_USER_ID.

---

## Section 3: Tasks Module — Frontend

### TF-01 ✅ ~~AddTaskModal form not reset on cancel~~
- **File:** `frontend/src/components/AddTaskModal.jsx`
- **What:** Form state only resets after successful submit. If user fills fields, clicks Cancel, then reopens modal — old data persists.
- **Fix:** Reset form state in `onClose` handler or in the `useEffect` that watches `isOpen`.

### TF-02 🟡 No loading state while reference data loads in modal
- **File:** `frontend/src/components/AddTaskModal.jsx`
- **What:** When modal opens, `loadReferenceData()` fires but dropdowns show empty options with no spinner/skeleton. User might think there are no projects.
- **Fix:** Show a loading indicator or disable the form until reference data is loaded.

### TF-03 🟡 KanbanColumn min-h-screen makes columns too tall
- **File:** `frontend/src/components/KanbanColumn.jsx`
- **What:** `min-h-screen` on each column forces them to be at least viewport height even with 0-2 tasks. Wastes space and looks odd.
- **Fix:** Use `min-h-[400px]` or `min-h-[50vh]` instead.

### TF-04 🟡 TaskCard formatDeadline timezone issue
- **File:** `frontend/src/components/TaskCard.jsx`
- **What:** `new Date("2026-05-18")` is parsed as UTC midnight. In IST (+5:30), `getDate()` returns 18 but in negative-offset timezones it could show the previous day.
- **Fix:** Append `T12:00:00` to the date string before parsing, or use string splitting instead of Date object.

### TF-05 🟢 No drag-and-drop (spec deviation)
- **File:** `frontend/src/pages/Tasks.jsx`
- **What:** Spec says "Drag and drop between Today ↔ Backlog" but implementation uses button-based moves.
- **Impact:** Functional but less intuitive. Buttons work fine for now.
- **Fix:** Add drag-and-drop later (e.g., `@dnd-kit/core`). Low priority — buttons are functional.

### TF-06 🟢 3 parallel API calls on every status change
- **File:** `frontend/src/pages/Tasks.jsx`
- **What:** `loadAllTasks()` makes 3 separate `getTasks(status)` calls. After moving one task, all 3 columns refetch.
- **Impact:** Extra network requests. Not broken but wasteful.
- **Fix:** Either fetch all tasks in one call (no status filter) and split client-side, or only refetch the two affected columns.

### TF-07 🟢 Done column is terminal with no undo
- **File:** `frontend/src/pages/Tasks.jsx`
- **What:** `allowedMoves.Done = {}` — once marked done, no way to move it back. Accidental mark-as-done is permanent.
- **Impact:** User must delete and recreate the task to undo.
- **Fix:** Add a "→ Today" button on Done cards, or add a confirmation dialog before marking done.

---

## Section 4: Daily Log Module — Backend

**File:** `backend/app/routers/logs.py`

### DLB-01 ✅ ~~CRITICAL: /search route unreachable — shadowed by /{log_date}~~
- **What:** Route definition order in `logs.py`: `GET /{log_date}` is defined BEFORE `GET /search`. FastAPI matches top-to-bottom. When frontend calls `GET /logs/search`, it hits `get_log_by_date("search")` which tries `date.fromisoformat("search")` → raises 400 "Invalid date format".
- **Impact:** Search feature is completely broken. Users cannot search logs.
- **Fix:** Move the `/search` route ABOVE the `/{log_date}` route. FastAPI needs specific routes before parameterized ones.

### DLB-02 🟡 No user_id filtering `[AUTH-DEFER]`
- **What:** `get_logs`, `get_log_by_date`, `search_logs` have no `.eq("user_id", ...)`. All users see all logs.
- **Impact:** Privacy violation in multi-user scenario.
- **Fix:** Add user_id filter to every query once auth is implemented.

### DLB-03 🟡 No user_id on insert `[AUTH-DEFER]`
- **What:** `create_log` doesn't include `user_id` in the insert payload. Data is orphaned.
- **Impact:** Same as TB-07 — data won't belong to any user.
- **Fix:** Set user_id from auth context.

### DLB-04 🟡 Duplicate check not user-scoped
- **What:** `create_log` checks for existing log with `.eq("log_date", ...)` but no user_id filter. In multi-user scenario, User A's log for May 18 blocks User B from creating their own log for May 18.
- **Impact:** False 409 conflicts in multi-user mode.
- **Fix:** Add `.eq("user_id", ...)` to the duplicate check.

### DLB-05 🟡 UNIQUE constraint mismatch with backend logic
- **What:** DB has `UNIQUE(user_id, log_date)` but backend never passes user_id. The constraint is effectively `UNIQUE(NULL, log_date)` — in PostgreSQL, NULL != NULL so multiple NULL user_id rows with same date are allowed. The backend's manual duplicate check is the only guard.
- **Impact:** Inconsistency between DB-level and app-level uniqueness logic.
- **Fix:** Once user_id is set properly, the DB constraint will work as intended. Remove the manual check or keep as belt-and-suspenders.

### DLB-06 🟢 update_log with all None fields
- **What:** If `LogUpdate` has all fields as None, the handler still updates `updated_at`. Not harmful but wasteful.
- **Impact:** Unnecessary DB write.
- **Fix:** Check if any actual field changed before executing update. Low priority.

---

## Section 5: Daily Log Module — Frontend

### DLF-01 🔴 Today's Tasks shows current tasks regardless of selectedDate
- **File:** `frontend/src/pages/DailyLog.jsx`
- **What:** The "Today's Tasks" section always calls `getTasks('today')` — it shows the current live "today" tasks no matter what date is selected. If user navigates to May 15, they still see today's (May 18) tasks.
- **Impact:** Contradicts spec: "Tasks side is read-only — shows what was in Today + Done for that date." Historical view is meaningless.
- **Fix:** This is architecturally hard — there's no snapshot of what tasks were in "today" on a past date. Options: (a) store task status history, (b) only show tasks section for today's date, (c) accept the limitation and relabel the section.

### DLF-02 🟡 Vertical layout vs spec's split view
- **File:** `frontend/src/pages/DailyLog.jsx`
- **What:** Spec says "Left = Today's Tasks | Right = Log Entry" (side-by-side split). Implementation stacks them vertically (tasks above, log below).
- **Impact:** Not a bug — works fine. But deviates from spec.
- **Fix:** Use CSS grid/flex with `grid-cols-2` for desktop, stack on mobile.

### DLF-03 🟡 No Done tasks shown for selected date
- **File:** `frontend/src/pages/DailyLog.jsx`
- **What:** Only fetches `getTasks('today')`. Spec says show "Today + Done for that date" but Done tasks are never fetched.
- **Fix:** Also fetch `getTasks('done')` and display both lists.

### DLF-04 ✅ ~~LogEditor: no dirty state tracking~~
- **File:** `frontend/src/components/LogEditor.jsx`
- **What:** If user types content then navigates away (changes date via arrows), unsaved content is silently lost. No "unsaved changes" warning.
- **Fix:** Track dirty state (compare current values to last saved). Show warning or auto-save on date change.

### DLF-05 🟢 LogEditor: JSON.stringify on potential circular reference
- **File:** `frontend/src/components/LogEditor.jsx`
- **What:** Error display uses `JSON.stringify(error)` as fallback. If error object has circular references, this throws and crashes the component.
- **Fix:** Wrap in try/catch or use `error?.message || 'Unknown error'` instead.

### DLF-06 🟢 LogJournal: duplicate entries on pagination
- **File:** `frontend/src/components/LogJournal.jsx`
- **What:** `handleLoadMore` appends new page to existing array. If a log was created between page loads, offset shifts and a log could appear twice.
- **Fix:** Deduplicate by `id` before setting state: `setLogs(prev => [...new Map([...prev, ...data].map(l => [l.id, l])).values()])`.

### DLF-07 🟢 LogJournal: hardcoded max-height calc
- **File:** `frontend/src/components/LogJournal.jsx`
- **What:** `max-h-[calc(100vh-220px)]` assumes fixed header/nav height of 220px. If layout changes, this breaks.
- **Fix:** Use `flex-1 overflow-y-auto` on parent instead of hardcoded calc.

---

## Section 6: Shared Infrastructure

### SI-01 ✅ ~~CORS wildcard + credentials anti-pattern~~
- **File:** `backend/app/main.py`
- **What:** `allow_origins=["*"]` with `allow_credentials=True`. Browsers reject credentials (cookies/auth headers) when origin is wildcard. When Supabase Auth is added, all authenticated requests will fail with CORS errors.
- **Fix:** Replace `"*"` with explicit origins: `["http://localhost:5173", "https://your-vercel-app.vercel.app"]`.

### SI-02 🟡 No error handling if env vars are None
- **File:** `backend/app/database.py`
- **What:** `SUPABASE_URL = os.getenv("SUPABASE_URL")` — if `.env` is missing or var is unset, `create_client(None, None)` throws a cryptic error at import time.
- **Fix:** Add validation: `if not SUPABASE_URL or not SUPABASE_KEY: raise RuntimeError("Missing SUPABASE_URL or SUPABASE_KEY")`.

### SI-03 🟡 Empty Zustand store — no shared state
- **File:** `frontend/src/store/useAppStore.js`
- **What:** Zustand is installed and imported but the store is empty. All state is local to components. No cross-page communication.
- **Impact:** Creating a task on Tasks page → navigating to Daily Log → tasks section doesn't reflect the new task without a full refetch.
- **Fix:** Move shared data (tasks, projects, reference data) into the store. Implement when needed.

### SI-04 🟡 No 404/catch-all route
- **File:** `frontend/src/App.jsx`
- **What:** Navigating to `/anything-invalid` renders the Layout with empty `<main>`. No "Page Not Found" feedback.
- **Fix:** Add `<Route path="*" element={<NotFound />} />` inside the Layout route.

### SI-05 🟡 No error boundary
- **File:** `frontend/src/App.jsx`
- **What:** If any page component throws during render, the entire app crashes to white screen with no recovery.
- **Fix:** Wrap `<Outlet />` in a React Error Boundary component that shows a fallback UI.

### SI-06 🟢 No API interceptors for auth/errors
- **File:** `frontend/src/services/api.js`
- **What:** No request interceptor to attach auth tokens. No response interceptor for global error handling (401 → redirect to login, 500 → toast).
- **Fix:** Add axios interceptors when auth is implemented. `[AUTH-DEFER]`

### SI-07 🟢 Dependencies not pinned
- **File:** `frontend/package.json`
- **What:** All deps use caret ranges (`^`). Fresh `npm install` could pull breaking minor/patch versions.
- **Fix:** Pin exact versions or use lockfile strictly. Low priority since lockfile exists.

### SI-08 🟢 DB schema user_id mismatch — orphaned data `[AUTH-DEFER]`
- **File:** `backend/create_tables.sql` vs all routers
- **What:** Every table has `user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE` but no router ever sets it. Column is nullable (no NOT NULL), so inserts succeed but data is unowned.
- **Impact:** When auth is added, existing data needs migration to assign ownership.
- **Fix:** Set user_id on every insert. For dev without auth, use a consistent dummy UUID.

---

## Section 7: Feature Gap — Project Combobox

### Current Problem
- `AddTaskModal` has a plain `<select>` for project_id
- Projects are fetched from `GET /reference/projects` on modal open
- If no projects exist in DB, dropdown shows only "Select project..." — **dead end**
- There is **no UI anywhere** in the app to create/manage projects
- Backend `POST /reference/projects` exists and works, but nothing calls it from the frontend

### Solution: Combobox with Type-to-Create

Replace the `<select>` with a searchable combobox input that:

1. **On focus/type:** Shows filtered list of existing projects matching input text
2. **No match found:** Shows a "➕ Create '[typed name]'" option at the bottom
3. **On select "Create":** Calls `POST /reference/projects` with `{ name: typedName }`, waits for response, then auto-selects the newly created project
4. **On select existing:** Sets `project_id` to that project's UUID

### Implementation Notes
- **Scope:** Only the Project field. Subjects/Subtopics/Platforms stay as plain `<select>`.
- **Backend:** Already supports `POST /reference/projects` — no backend changes needed.
- **Library options:** Build custom (no external dep) OR add a lightweight lib like `downshift` or `cmdk`.
- **Edge cases to handle:**
  - Loading state while creating project
  - Error if project name already exists (backend should return 409 or handle gracefully)
  - Refresh projects list after successful creation
  - Empty state: show "Type to create your first project" placeholder
  - Clicking outside should close dropdown without losing selection

### UX Flow
```
User opens Add Task modal
  → Clicks Project field
  → Types "Engage2Value"
  → Dropdown shows: "➕ Create 'Engage2Value'"
  → User clicks it
  → Spinner briefly shows
  → Project created, auto-selected
  → User continues filling rest of form
```

---

## Section 8: Recommended Fix Order

Priority-ordered. Fix top items first.

| Priority | ID | Reason |
|----------|-----|--------|
| 1 | DLB-01 | Search is completely broken — 1 line fix (move route) |
| 2 | TB-03 | Null safety — causes 500 errors in production |
| 3 | TB-05 | Task names disappear after status change — visible UX bug |
| 4 | SI-01 | CORS will block all requests when auth is added |
| 5 | TF-01 | Form data persists on cancel — confusing UX |
| 6 | DLF-04 | Unsaved log content lost on navigation — data loss |
| 7 | Feature Gap | Project combobox — unblocks task creation workflow |
| 8 | SI-04 | 404 route — quick win, 5 min fix |
| 9 | SI-05 | Error boundary — prevents white screen crashes |
| 10 | TF-03 | Column height — visual fix, quick |
| 11+ | All `[AUTH-DEFER]` | Fix together when implementing Supabase Auth |

---

## Section 9: Fix Log

> **Instructions for LLM:** After fixing any issue, add a row to this table AND mark the issue as ✅ in its original section above. Include enough detail in "How Fixed" that a future reader understands the approach without reading the diff.

| Issue ID | Date Fixed | How It Was Fixed | Files Changed | Verified? |
|----------|-----------|------------------|---------------|-----------|
| DLB-01 | 2026-05-18 | Moved `/search` route definition above `/{log_date}` so FastAPI matches it first | `backend/app/routers/logs.py` | ✅ |
| TB-03 | 2026-05-18 | Changed `row.get("projects", {}).get("name") if row.get("projects") else None` to `(row.get("projects") or {}).get("name")` — handles both None and missing keys safely | `backend/app/routers/tasks.py` | ✅ |
| TB-05 | 2026-05-18 | Separated update from fetch: update executes without capturing result, then re-fetches the task with full join query (`*, projects(name), subjects(name), subtopics(name), platforms(name)`) to return complete data | `backend/app/routers/tasks.py` | ✅ |
| SI-01 | 2026-05-18 | Replaced `allow_origins=["*"]` with explicit list `["http://localhost:5173", "http://localhost:4173"]`. Add production Vercel URL when deploying. | `backend/app/main.py` | ✅ |
| TF-01 | 2026-05-18 | Added `else` branch in `isOpen` useEffect that resets form state and clears error when modal closes. Removed redundant reset in handleSubmit. | `frontend/src/components/AddTaskModal.jsx` | ✅ |
| DLF-04 | 2026-05-18 | Added `isDirty` state + `handleFieldChange` wrapper that sets dirty on edit. Added `beforeunload` listener for browser close. Added `onDirtyChange` prop to notify parent. DailyLog now shows confirm dialog on date navigation if unsaved changes exist. | `frontend/src/components/LogEditor.jsx`, `frontend/src/pages/DailyLog.jsx` | ✅ |
| | | | | |

---

## Section 10: Progress Tracker

> **Instructions for LLM:** After completing a fix session, update the counts below and the "Last Updated" timestamp.

**Last Updated:** 2026-05-18 04:25 IST

### Overall Progress

| Metric | Count |
|--------|-------|
| Total Issues | 47 |
| Fixed | 6 |
| Remaining | 41 |
| Feature Gaps | 1 (Project Combobox) |

### Per-Module Status

| Module | Fixed / Total | Status |
|--------|---------------|--------|
| Tasks — Backend | 2 / 7 | 🟡 In progress |
| Tasks — Frontend | 1 / 7 | 🟡 In progress |
| Daily Log — Backend | 1 / 6 | 🟡 In progress |
| Daily Log — Frontend | 1 / 7 | 🟡 In progress |
| Shared Infrastructure | 1 / 8 | 🟡 In progress |
| Study Q&A — Backend | 0 / 6 | 🔲 Not started |
| Study Q&A — Frontend | 0 / 6 | 🔲 Not started |
| Project Combobox | 0 / 1 | 🔲 Not started |

### Status Legend
- 🔲 Not started
- 🟡 In progress (some fixes applied)
- ✅ Clean (all issues resolved)

---

## Section 11: Study Q&A Module — Backend

**Files:** `backend/app/routers/study.py`, `backend/app/services/gemini_service.py`, `backend/app/services/sm2_algorithm.py`

### SB-01 🟡 expected_concepts lost between generation and evaluation
- **What:** When questions are generated, `expected_concepts` is returned by Gemini and sent to frontend, but NOT stored in the `study_questions` DB table. When `submit_attempt` evaluates an answer, it passes `expected_concepts=[]` to Gemini because it can't retrieve them.
- **Impact:** Gemini evaluates without knowing what concepts to check for — less accurate scoring.
- **Fix:** Either add an `expected_concepts` JSONB column to `study_questions` table, or store them in a separate table/cache.

### SB-02 🟡 Gemini calls are synchronous (blocking)
- **What:** `generate_questions()` and `evaluate_answer()` are regular sync functions called from async route handlers. They block the event loop during the Gemini API call (could be 2-5 seconds).
- **Impact:** Under concurrent requests, the server becomes unresponsive while waiting for Gemini.
- **Fix:** Use `await asyncio.to_thread(generate_questions, ...)` or make the genai calls async natively.

### SB-03 🟡 due-today returns ALL past due attempts, not just unreviewd
- **What:** `get_due_today` fetches all attempts where `scheduled_for <= today`. If a question was already re-attempted today, it still shows up. No filter for "already reviewed today."
- **Impact:** Questions keep appearing in due-today even after being answered again.
- **Fix:** Add a filter: exclude questions that have an attempt with `attempt_date >= today`.

### SB-04 🟡 No error handling around Gemini API calls
- **What:** If Gemini API is down, rate-limited, or the API key is invalid, `client.models.generate_content()` will throw an unhandled exception → 500 error with no useful message.
- **Fix:** Wrap Gemini calls in try/except, return a meaningful HTTPException.

### SB-05 🟢 get_profile returns None (not 404)
- **What:** `GET /study/profile` returns `None` (JSON `null`) when no profile exists. This is unconventional — most REST APIs return 404 or an empty object.
- **Impact:** Frontend must check for `null` response body specifically.
- **Fix:** Acceptable as-is since frontend handles it. Could return `{}` or 404 for consistency.

### SB-06 🟢 generate_study_questions is GET with side effects
- **What:** `GET /study/questions/generate` inserts rows into `study_questions` table. GET requests should be idempotent/safe. Refreshing the page generates duplicate questions.
- **Fix:** Change to `POST /study/questions/generate` or accept the trade-off for simplicity.

---

## Section 12: Study Q&A Module — Frontend

**Files:** `frontend/src/pages/StudyQA.jsx`, `frontend/src/components/study/*.jsx`

### SF-01 🟡 DueTodayPanel "Start Review" doesn't pass question context
- **File:** `StudyQA.jsx` + `DueTodayPanel.jsx`
- **What:** Clicking "Start Review" sets `sessionActive=true` but doesn't pass the due questions or their subject/subtopic to `QuestionSession`. The session will try to generate NEW questions using `selectedSubject`/`selectedSubtopic` which may be empty strings.
- **Impact:** Starting a review session without selecting subject/subtopic will call `generateQuestions('', '')` → 422 validation error from backend.
- **Fix:** Either pass due question IDs to QuestionSession for re-review mode, or auto-select the subject/subtopic from the first due question.

### SF-02 🟡 QuestionSession doesn't validate props before API call
- **File:** `QuestionSession.jsx`
- **What:** If `subjectId` or `subtopicId` is empty/undefined (e.g., from DueTodayPanel flow), the `generateQuestions` call fires with invalid params.
- **Fix:** Guard the useEffect: `if (!subjectId || !subtopicId) return;`

### SF-03 🟡 No way to cancel/exit an active session
- **File:** `QuestionSession.jsx` / `StudyQA.jsx`
- **What:** Once a session starts, there's no "X" or "Cancel" button. User is stuck until they answer all 5 questions.
- **Fix:** Add a close/cancel button that confirms and calls `onSessionComplete(null)`.

### SF-04 🟢 OnboardingFlow doesn't validate empty subjects list
- **File:** `OnboardingFlow.jsx`
- **What:** If no subjects exist in the system, Step 1 shows "No subjects found" message but the Next button is disabled (correct). However, the user is stuck — no guidance on how to create subjects.
- **Fix:** Add a link/note: "Go to Tasks → Add Task → Study to create subjects first."

### SF-05 🟢 ProgressDashboard doesn't auto-refresh
- **File:** `ProgressDashboard.jsx`
- **What:** Dashboard fetches levels once on mount. After completing a session, the parent uses `refreshKey` to remount it — this works but is a workaround.
- **Impact:** Minor — works correctly via key prop remount.
- **Fix:** Accept as-is, or expose a `refresh()` method via ref.

### SF-06 🟢 Session summary division by zero if no results
- **File:** `QuestionSession.jsx`
- **What:** `results.reduce(...) / results.length` — if `results` is empty (edge case), this divides by zero → NaN displayed.
- **Impact:** Extremely unlikely since session only completes after answering questions.
- **Fix:** Guard: `results.length > 0 ? ... : 0`.

---

*End of review document. This file is the source of truth for code quality issues in ProductivOS.*