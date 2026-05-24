# ProductivOS — Frontend Code Review

**Date:** 2026-05-18  
**Reviewer:** Gemini CLI (Senior Staff Frontend Engineer)  
**Status:** Initial Review  
**Source of Truth:** PRODUCTIVOS_PROJECT_SPEC.md, docs/reviews/CODE_REVIEW_MASTER.md, docs/reviews/CODE_REVIEW_BACKEND.md

---

## 1. Reviewer Metadata
- **Expertise:** React (Hooks, Context, Performance), Modern CSS (Tailwind), State Management (Zustand), Frontend Infrastructure.
- **Focus:** Performance (Renders, Memoization), State Consistency, UX Polish, Scalability.
- **Project Context:** Solo developer project, targeting production readiness for a Data Science portfolio.

---

## 2. Summary Table

| Category | 🔴 Critical | 🟡 Medium | 🟢 Low | Total |
|----------|-------------|-----------|--------|-------|
| State Management | 1 | 2 | 1 | 4 |
| Performance | 0 | 2 | 1 | 3 |
| UX / UI | 0 | 3 | 2 | 5 |
| Architecture | 0 | 1 | 2 | 3 |
| **Total** | **1** | **8** | **6** | **15** |

---

## 3. Critical Issues

### ISSUE-SF-07 ✅ Fixed — Parallel API Calls Blocking State Synchronization

* **File:** `frontend/src/pages/JobTracker.jsx`, `frontend/src/pages/Tasks.jsx`, `frontend/src/pages/DailyLog.jsx`, `frontend/src/components/AddTaskModal.jsx`
* **Problem:** `JobTracker` and `DailyLog` use `Promise.all` to fetch multiple entities (jobs, stats, follow-ups). If ANY of these calls fails, the entire `loadData` block fails, leaving the user with an empty screen or a generic error message, even if most data was successfully retrieved.
* **Why it matters:** Brittle data loading. A single non-critical endpoint failure (like `/jobs/stats`) should not prevent the user from seeing their job list.
* **Reproduction:** Mock a 500 error for `/jobs/stats` while `/jobs` is healthy; the entire JobTracker page will show "Failed to load job data".
* **Root cause:** Use of `Promise.all` instead of `Promise.allSettled` or individual try/catch blocks for non-essential metrics.
* **Recommended fix:** Switch to `Promise.allSettled` or wrap individual calls in try/catch to allow partial page rendering.
* **Classification:** UX / ARCHITECTURE

---

## 4. Medium Issues

### ISSUE-SF-08 ✅ Fixed — Missing Loading/Error States in Questions Session

* **File:** `frontend/src/components/study/QuestionSession.jsx`
* **Problem:** While generating questions has a loading state, submitting an answer (`submitAttempt`) only has a local `submitting` boolean. If the API call fails, the `error` state is set, but there is no mechanism to clear it or retry the specific submission without restarting the session.
* **Why it matters:** AI evaluation calls are prone to timeouts (see backend review `SB-07`). A failure here traps the user in a broken state.
* **Recommended fix:** Add a "Retry" button for failed evaluation requests.
* **Classification:** UX / ERROR-HANDLING

### ISSUE-SF-09 ✅ Fixed — Missing Cleanup/Abort in API Effects

* **File:** `frontend/src/pages/StudyQA.jsx`, `frontend/src/pages/DailyLog.jsx`, `frontend/src/components/LogJournal.jsx`, `frontend/src/components/study/QuestionSession.jsx`, `frontend/src/components/study/DueTodayPanel.jsx`, `frontend/src/components/study/ProgressDashboard.jsx`, `frontend/src/pages/JobTracker.jsx`, `frontend/src/pages/Tasks.jsx`
* **Problem:** `useEffect` hooks perform API calls without `AbortController`.
* **Why it matters:** Race conditions. If a user quickly toggles between subjects in StudyQA or dates in DailyLog, multiple requests will be in flight. The state will ultimately reflect whichever request finished *last*, not the one the user most recently selected.
* **Recommended fix:** Implement `AbortController` in `useEffect` cleanup functions to cancel stale requests.
* **Classification:** PERFORMANCE / DATA-INTEGRITY

### ISSUE-SF-10 ✅ Fixed: Stale Data after Reference Data Creation

* **File:** `frontend/src/components/AddTaskModal.jsx`
* **Problem:** When creating a new Subject/Subtopic/Platform via the modal, the local state (`subjects`, `subtopics`, etc.) was refreshed by calling the `get` API again.
* **Why it matters:** Wasteful network traffic. Since the `create` API returns the new object, the local list should be updated optimistically.
* **How Fixed:** Added `addProject`, `addSubject`, `addPlatform` actions to Zustand store that append the new item to the global list without a full refetch.
* **Classification:** PERF / UX

### ISSUE-SF-11 🟡 Inefficient Rerenders in Kanban Board

* **File:** `frontend/src/pages/Tasks.jsx`
* **Problem:** The `Tasks` page passes down the entire `tasks` object and `allowedMoves` to every `KanbanColumn`.
* **Why it matters:** Every time one task moves, the entire board rerenders. While not critical now, it will lag as the task count grows.
* **Recommended fix:** Memoize `KanbanColumn` and `TaskCard`. Pass only the specific array slice to each column.
* **Classification:** PERFORMANCE

### ISSUE-SF-12 ✅ Fixed: Local State vs Zustand [AUTH-DEFER]

* **File:** `frontend/src/store/useAppStore.js`
* **Problem:** Zustand store was completely empty. All data (tasks, jobs, logs) was managed in local component state.
* **Why it matters:** Hard to sync data across views. For example, if a user marks a task as "Done" on the Tasks page, the "Done" list in the Daily Log wouldn't update until that page was manually refreshed.
* **How Fixed:** Centralized Tasks and Reference Data (projects, subjects, platforms) in Zustand store. Refactored Tasks, DailyLog, and AddTaskModal to use this shared source of truth.
* **Classification:** ARCHITECTURE

---

## 5. Low Issues

### ISSUE-SF-13 🟢 Hardcoded Date Formatting Logic

* **File:** `frontend/src/pages/DailyLog.jsx`, `frontend/src/pages/JobTracker.jsx`
* **Problem:** Date formatting and ISO conversion logic is duplicated across multiple files (e.g., `toISODate`, `MONTHS` arrays).
* **Recommended fix:** Move date utilities to a shared `src/utils/date.js` file.
* **Classification:** CLEANUP

### ISSUE-SF-14 🟢 Prop Drilling in TaskBoard

* **File:** `frontend/src/pages/Tasks.jsx` -> `KanbanColumn` -> `TaskCard`
* **Problem:** `onDelete`, `onStatusChange`, and `allowedMoves` are drilled through multiple layers.
* **Recommended fix:** Use a Context or the Zustand store to handle actions.
* **Classification:** CLEANUP

### ISSUE-SF-15 🟢 Lack of "Empty States" Visuals

* **File:** `frontend/src/pages/JobTracker.jsx`, `frontend/src/pages/DailyLog.jsx`
* **Problem:** Empty states are handled with simple `<p>` tags (e.g., "No applications yet").
* **Recommended fix:** Use stylized empty state components with icons/guidance to match the "rich aesthetics" goal of the spec.
* **Classification:** UX

---

## 6. Deferred Auth Findings [AUTH-DEFER]

- **API Header Readiness:** `api.js` is set up with a base instance. It needs a request interceptor to attach `Authorization: Bearer <token>` once Supabase Auth is implemented.
- **Route Guards:** `App.jsx` needs a `ProtectedRoute` wrapper to redirect unauthenticated users to a (future) login page.
- **State Clearing:** The Zustand store must implement a `reset()` method to clear all data on logout.

---

## 7. Recommended Fix Order

1. **SF-07 (Promise.all):** High impact on reliability.
2. **SF-09 (AbortController):** Prevents confusing "jumping" data in Study/Logs.
3. **SF-08 (Retry Logic):** Critical for AI-heavy workflows.
4. **SF-12 (Zustand Migration):** Foundation for multi-page consistency.
5. **SF-13 (Cleanup):** Move date utils to shared file.

---

## 8. Quick Wins (<10 minute fixes)

- **SF-10:** Optimize `AddTaskModal` to append new items instead of refetching.
- **SF-13:** Consolidate `MONTHS` and `DAYS` constants into a single util file.
- **SF-06 (Revisiting):** Fix the division by zero guard in `QuestionSession.jsx` (already listed in MASTER but verified here).

---

## 9. Fix Log

| Issue ID | Date Fixed | Files Changed | Implementation Summary | Verified? |
|----------|-----------|---------------|------------------------|-----------|
| SF-07 | 2026-05-18 | `JobTracker.jsx`, `Tasks.jsx`, `DailyLog.jsx`, `AddTaskModal.jsx`, `asyncUtils.js` | Replaced `Promise.all` with `Promise.allSettled`; each section updates independently; partial-failure banners where appropriate | ✅ build |
| SF-08 | 2026-05-18 | `QuestionSession.jsx` | Separated `loadError`/`submitError`; Retry buttons for failed generation and evaluation; session state preserved on submit failure | ✅ build |
| SF-09 | 2026-05-18 | `StudyQA.jsx`, `DailyLog.jsx`, `LogJournal.jsx`, `QuestionSession.jsx`, `DueTodayPanel.jsx`, `ProgressDashboard.jsx`, `JobTracker.jsx`, `Tasks.jsx`, `api.js`, `asyncUtils.js` | `AbortController` in `useEffect` cleanups; `active` flag guards; `isAbortError` helper; optional `signal` on API calls | ✅ build |
| SF-10 | 2026-05-18 | `AddTaskModal.jsx`, `useAppStore.js` | Added optimistic update actions (`addProject`, etc.) to store; modal now appends new reference items directly to store state | ✅ build |
| SF-12 | 2026-05-18 | `useAppStore.js`, `Tasks.jsx`, `DailyLog.jsx`, `AddTaskModal.jsx` | Migrated Tasks and Reference Data to Zustand; synchronized state between Kanban and Daily Log. **Stabilized 2026-05-19:** Optimized selectors to prevent re-renders, added concurrent fetch protection in store, and fixed dynamic import build warnings. | ✅ build |

## 10. Verification Checklist

- [x] Verify `JobTracker` renders even if stats API fails.
- [x] Confirm `useEffect` cleanups cancel pending network requests.
- [x] Test `AddTaskModal` creation flow (Subject -> Subtopic) without full refetch.
- [x] Verify no "white screen" when navigating to an invalid URL (handled by catch-all).
- [x] **Phase 3 Verification (2026-05-19):**
    - [x] Tasks stay synchronized between DailyLog and Tasks page after updates.
    - [x] Optimized store selectors prevent unnecessary re-renders in major pages.
    - [x] `fetchTasks` throttles background refreshes to 10s unless forced.
    - [x] Removed ineffective dynamic imports in `useAppStore.js` to fix build warnings.
    - [x] Confirmed `npm run build` passes with zero warnings.
