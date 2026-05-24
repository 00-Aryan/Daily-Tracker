# ProductivOS — Backend Code Review

**Date:** 2026-05-20  
**Reviewer:** Gemini CLI (Senior Staff Backend Engineer)  
**Status:** Phase 4 Router Integration Complete  
**Source of Truth:** PRODUCTIVOS_PROJECT_SPEC.md, docs/reviews/CODE_REVIEW_MASTER.md  

---

## 1. Reviewer Metadata
- **Expertise:** FastAPI, Supabase, PostgreSQL, Distributed Systems, AI Orchestration.
- **Focus:** Performance, Data Integrity, Security (Auth Readiness), API Consistency.
- **Project Context:** Early-stage solo developer project, targeting production readiness for a Data Science student portfolio.

---

## 2. Summary Table

| Category | 🔴 Critical | 🟡 Medium | 🟢 Low | Total |
|----------|-------------|-----------|--------|-------|
| Performance | 1 | 0 | 1 | 2 |
| Data Integrity | 1 | 1 | 0 | 2 |
| Security | 0 | 0 | 0 | 0 |
| API Consistency | 0 | 1 | 1 | 2 |
| Error Handling | 0 | 1 | 1 | 2 |
| **Total** | **2** | **3** | **3** | **8** |

---

## 3. Critical Issues

### ISSUE-SB-07 ✅ Fixed — Synchronous Gemini API Calls (Event Loop Block)

* **File:** `backend/app/services/gemini_service.py`, `backend/app/routers/study.py`
* **Problem:** The `generate_questions` and `evaluate_answer` functions are synchronous and perform heavy I/O (Gemini API calls). They are called directly within `async def` route handlers in `study.py`.
* **How Fixed:** Wrapped `generate_questions` and `evaluate_answer` in `await asyncio.to_thread(...)` within the `study.py` router. This offloads the blocking calls to a worker thread, keeping the main event loop responsive.
* **Classification:** PERF / ARCHITECTURE

### ISSUE-SB-01 ✅ Fixed — study_questions Schema Mismatch (Data Loss)

* **File:** `backend/app/routers/study.py`, `backend/create_tables.sql`
* **Problem:** `study.py` attempts to insert `expected_concepts` into the `study_questions` table, but this column was missing from the table definition in `create_tables.sql`.
* **How Fixed:** Added `expected_concepts JSONB DEFAULT '[]'` to the `study_questions` table in `create_tables.sql`. Updated the router to correctly handle the persistence and retrieval of these concepts as lists/JSONB.
* **Classification:** SPEC-BREAK / DATA-INTEGRITY

---

## 4. Medium Issues

### ISSUE-JB-01 ✅ Fixed — Missing User Scoping (Jobs Router)

* **File:** `backend/app/routers/jobs.py`
* **How Fixed:** Injected `get_current_user` dependency and added `.eq("user_id", current_user)` to all queries.
* **Classification:** SECURITY

### ISSUE-RB-01 ✅ Fixed — Missing User Scoping (Reference Router)

* **File:** `backend/app/routers/reference.py`
* **How Fixed:** Injected `get_current_user` dependency into subjects, subtopics, platforms, and projects routes.
* **Classification:** SECURITY

### ISSUE-RB-02 🟡 Unauthorized Cross-User Association

* **File:** `backend/app/routers/reference.py`
* **Problem:** `create_subtopic` accepts a `subject_id` but does not verify that the current user owns that subject.
* **Recommended fix:** Add a check to verify subject ownership before creating the subtopic.
* **Classification:** SECURITY

### ISSUE-SB-03 🟡 Stale Reviews in due-today

* **File:** `backend/app/routers/study.py`
* **Problem:** `get_due_today` returns all questions with `scheduled_for <= today`. It does not filter out questions that have already been reviewed/attempted *today*.
* **Classification:** UX / API-CONSISTENCY

### ISSUE-SB-04 🟡 Brittle AI Service Integration

* **File:** `backend/app/services/gemini_service.py`
* **Problem:** There is zero error handling around the `client.models.generate_content` call.
* **Classification:** ERROR-HANDLING

---

## 5. Low Issues

### ISSUE-SI-02 🟢 Import-Time Side Effects (Database Client)

* **File:** `backend/app/database.py`
* **Problem:** The Supabase client is initialized globally at import time.
* **Classification:** ARCHITECTURE / CLEANUP

### ISSUE-JB-02 🟢 Non-Idempotent Job Deletion

* **File:** `backend/app/routers/jobs.py`
* **Problem:** `delete_job` returns a 404 if the job does not exist or has already been deleted.
* **Classification:** API-CONSISTENCY

### ISSUE-LB-02 🟢 Unoptimized Log Search

* **File:** `backend/app/routers/logs.py`
* **Problem:** `search_logs` uses three `ilike` filters joined by `OR`.
* **Classification:** PERF

---

## 6. Deferred Auth Findings [AUTH-DEFER]
- **Router Scoping Complete**: All backend routers are now utilizing the `get_current_user` dependency.
- **RLS Readiness**: The current schema in `create_tables.sql` is ready for RLS enforcement.
- **Anonymous Compatibility**: System remains functional in anonymous mode using the dummy user ID fallback.

---

## 7. Recommended Fix Order
1. **RB-02 (Cross-User Verification):** Important for complete isolation.
2. **SB-03 (due-today logic):** Improve study UX.
3. **Phase 5 Frontend Integration:** Pass auth headers from the UI.

---

## 8. Quick Wins (<10 minute fixes)
- **SI-02:** Add environment variable validation in `database.py`.
- **JB-02:** Remove 404 check in `delete_job`.
- **DLB-06:** Add "no-op" check in `update_log`.

---

## 9. Verification Checklist
- [x] Verify `generate_study_questions` does not block other routes.
- [x] Confirm `expected_concepts` column exists in Supabase.
- [x] Confirm all tables have `user_id` columns and indexes.
- [x] Verify `get_current_user` dependency parses (placeholder mode).
- [x] Test all routers for `USER_ID` scoping via dependency injection.
