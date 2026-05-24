# ProductivOS — Integration Code Review

**Date:** 2026-05-18  
**Reviewer:** Gemini CLI (Senior Solutions Architect)  
**Status:** Initial Review  
**Source of Truth:** PRODUCTIVOS_PROJECT_SPEC.md, docs/reviews/CODE_REVIEW_MASTER.md  

---

## 1. Reviewer Metadata
- **Expertise:** Full-Stack Integration, Data Lifecycle Management, Cross-Module State Sync, Spaced Repetition Systems.
- **Focus:** End-to-end user flows, data consistency between frontend and backend, and edge cases in the "Adaptive Study" loop.

---

## 2. Summary Table

| Category | 🔴 Critical | 🟡 Medium | 🟢 Low | Total |
|----------|-------------|-----------|--------|-------|
| Data Lifecycle | 1 | 2 | 1 | 4 |
| State Sync | 0 | 2 | 1 | 3 |
| Error Resilience | 0 | 3 | 1 | 4 |
| UX Continuity | 0 | 2 | 2 | 4 |
| **Total** | **1** | **9** | **5** | **15** |

---

## 3. Critical Issues

### ISSUE-INT-01 ✅ Fixed: Study Session Data Flow (expected_concepts)

* **Frontend File(s):** `frontend/src/components/study/QuestionSession.jsx`
* **Backend File(s):** `backend/app/routers/study.py`, `backend/create_tables.sql`
* **Problem:** End-to-end data loss. Gemini generates `expected_concepts` for a question, but the backend didn't store them. When the user submitted an answer, the evaluation logic received an empty list of concepts, leading to generic or inaccurate scoring.
* **How Fixed:** Added `expected_concepts JSONB` column to the `study_questions` table. Updated `generate_study_questions` to persist these concepts and `submit_attempt` to retrieve them before calling the evaluation AI.
* **Classification:** DATA-INTEGRITY / CORE-LOOP

---

## 4. Medium Issues

### ISSUE-INT-02 🟡 SM-2 Feedback Loop Delay

* **Frontend File(s):** `frontend/src/components/study/DueTodayPanel.jsx`
* **Backend File(s):** `backend/app/routers/study.py`
* **Problem:** After completing a question session, the "Due Today" count on the dashboard doesn't update until a full page refresh.
* **Why it matters:** Broken UX "Success" loop. The user finishes work but the dashboard says they still have work to do.
* **Recommended fix:** Implement a `refresh()` trigger or use a shared Zustand store to update the "Due Today" count immediately upon attempt submission.
* **Classification:** UX / STATE-SYNC

### ISSUE-INT-03 🟡 Silent Evaluation Failures

* **Frontend File(s):** `frontend/src/components/study/QuestionSession.jsx`
* **Backend File(s):** `backend/app/services/gemini_service.py`
* **Problem:** If the Gemini evaluation call fails (timeout or rate limit), the backend returns a default "Evaluation failed" object with a 0.0 score.
* **Why it matters:** The user is penalized (0 score) for a system error. The SM-2 algorithm will schedule the question for "Tomorrow" even if the user gave a perfect answer.
* **Recommended fix:** Raise a 503 error on backend; frontend should catch this and allow a "Retry Evaluation" without losing the user's typed answer.
* **Classification:** ERROR-RESILIENCE

---

## 5. State Synchronization Issues
### ISSUE-INT-04 ✅ Fixed: Cross-Module Stale State (Tasks vs Logs)

* **Frontend File(s):** `frontend/src/pages/Tasks.jsx`, `frontend/src/pages/DailyLog.jsx`, `frontend/src/store/useAppStore.js`
* **Backend File(s):** `backend/app/routers/tasks.py`
* **Problem:** Completing a task on the Tasks page did not update the task list in the Daily Log without a refresh.
* **How Fixed:** Migrated Tasks to shared Zustand store (`useAppStore`). Both pages now consume the same `tasks` object. Any mutation (drag and drop, status button, delete) updates the central store, and all components reflect the change instantly.
* **Classification:** UX / STATE-SYNC

---

## 6. Async Lifecycle Issues

### ISSUE-INT-05 🟡 Implicit Dependency on Client-Side Clock

* **Frontend File(s):** `frontend/src/pages/DailyLog.jsx`
* **Backend File(s):** `backend/app/routers/tasks.py` (run-backlog-check)
* **Problem:** "Today" is defined by the frontend's local time, but the "Backlog Scheduler" on the backend runs based on the server's clock (UTC).
* **Why it matters:** "Midnight Drift". A user in IST (+5:30) might see tasks move to backlog at 5:30 AM their time (UTC midnight), or vice-versa.
* **Root cause:** Backend scheduler is unaware of the user's local timezone.
* **Recommended fix:** Store user's timezone in `user_profile` and use it in the scheduler logic.
* **Classification:** UX / DATA-LIFECYCLE

---

## 7. Auth-Deferred Risks [AUTH-DEFER]

### ISSUE-INT-06 🟡 Multi-User Isolation Leak (Reference Data)

* **Backend File(s):** `backend/app/routers/reference.py`
* **Problem:** `create_subtopic` accepts `subject_id` without verifying ownership.
* **Why it matters:** Security. User A can pollute User B's subjects with subtopics if they know the ID.
* **RLS Compatibility:** Once RLS is enabled on `subjects`, a subtopic insert for a subject the user doesn't own will fail at the DB level, which is a good safety net.
* **Classification:** SECURITY

### ISSUE-INT-07 🟡 Supabase Service Key Bypass

* **Backend File(s):** `backend/app/database.py`
* **Problem:** Backend uses `SUPABASE_KEY` (service role) which bypasses RLS.
* **Why it matters:** The backend currently acts as a "super-user". If there is any bug in the `.eq("user_id", ...)` filter (like the missing filters found in `TB-01`), it will return data from other users.
* **Recommended fix:** Backend should use the user's JWT to initialize a Supabase client per request to ensure RLS is enforced even if application logic fails.
* **Classification:** SECURITY

---

## 8. Deployment Risks

### ISSUE-INT-08 🟡 CORS Origin Discrepancy

* **Backend File(s):** `backend/app/main.py`
* **Problem:** CORS `allow_origins` is hardcoded to `localhost`.
* **Why it matters:** Deployment Failure. The app will fail to load in production (Vercel/Railway) unless the CORS config is updated to include the production frontend URL.
* **Classification:** DEPLOYMENT

---

## 9. Recommended Fix Order

1. **SB-01 / INT-01:** Fix Study module data flow and refresh logic. (Critical for core loop).
2. **SF-07 / INT-03:** Improve error handling and partial failure resilience.
3. **INT-05:** Address timezone drift in scheduler.
4. **SF-12 / INT-04:** Migrate to Zustand for cross-module consistency.
5. **SI-01 / INT-08:** Production-ready CORS and environment configs.

---

## 10. Fix Log

| Issue ID | Date Fixed | Files Changed | Implementation Summary | Verified? |
|----------|-----------|---------------|------------------------|-----------|
| INT-01 | 2026-05-19 | `study.py`, `create_tables.sql` | Fixed end-to-end persistence of `expected_concepts` by adding DB column and updating router logic. | ✅ |
| INT-04 | 2026-05-18 | `Tasks.jsx`, `DailyLog.jsx`, `useAppStore.js` | Synced Tasks and DailyLog via Zustand shared state. | ✅ |

## 11. Verification Checklist

- [x] Complete a Study Session and verify `expected_concepts` are correctly retrieved from DB during evaluation.
- [x] Verify `generate_study_questions` (Gemini API) does not block concurrent health check requests.
- [ ] Mock a failure in `/jobs/stats` and verify `JobTracker` still displays the job list.
- [ ] Check `DailyLog` at 12:05 AM to verify correct date navigation and task status.
- [ ] Audit all `PATCH` requests to ensure `updated_at` is set by the backend.
