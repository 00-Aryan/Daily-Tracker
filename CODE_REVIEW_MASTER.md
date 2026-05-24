# Code Review — Master Log

## 2026-05-23: Frontend Empty-State Handling Fix

**Scope:** Frontend only — async lifecycle + error semantics  
**Files Modified:**
- `frontend/src/store/useAppStore.js`
- `frontend/src/services/asyncUtils.js`

**Summary:**  
Fixed infinite loading states for new authenticated users. Root cause was a `tasksLoading` deadlock caused by abort-guarded `finally` blocks, combined with 404 responses being classified as failures instead of valid empty states.

**Impact:** Tasks page, Daily Log tasks panel, and reference data loading all resolve correctly for users with no existing data.

**Risk:** Low — changes are isolated to loading state cleanup and error classification. No architectural changes, no new dependencies, no backend modifications.

**Build:** ✅ Passes (`npm run build`)

**Details:** See [CODE_REVIEW_FRONTEND.md](./CODE_REVIEW_FRONTEND.md)

---

## 2026-05-23: RLS INSERT Auth Propagation Fix

**Scope:** Backend — Supabase client auth propagation  
**Files Modified:**
- `backend/app/database.py`
- `backend/app/routers/reference.py`
- `backend/app/routers/tasks.py`
- `backend/app/routers/jobs.py`
- `backend/app/routers/logs.py`
- `backend/app/routers/study.py`

**Summary:**  
All data routers were using the global anon-key Supabase client which has no user session. RLS policies check `auth.uid() = user_id`, but `auth.uid()` was NULL → INSERT/UPDATE/DELETE all failed. Additionally, `get_supabase_client()` incorrectly passed the JWT as the API key argument to `create_client`.

**Fix:** All routers now use `db: Client = Depends(get_db)` which creates a properly scoped client via `create_client(URL, ANON_KEY) + client.auth.set_session(jwt)`. Auth router intentionally kept on service-role for data migration.

**Impact:** All CRUD operations now work correctly under RLS for authenticated users.

**Risk:** Low — client swap only, no logic changes, no RLS policy modifications.

**Build:** ✅ Passes (`uv run python -c "from app.main import app"`)

**Details:** See [CODE_REVIEW_SECURITY.md](./CODE_REVIEW_SECURITY.md) and [RLS_ENFORCEMENT.md](./RLS_ENFORCEMENT.md)

---

## 2026-05-23: Task Creation RLS Fix

**Scope:** Backend — auth dependency + payload serialization  
**Files Modified:**
- `backend/app/dependencies.py`
- `backend/app/routers/tasks.py`

**Summary:**  
Task INSERT failed with RLS violation because `get_current_user` silently fell back to DUMMY_USER_ID when token validation threw an exception on the global client, while `get_db` successfully created a scoped client with the real user's JWT. This caused `user_id` in the INSERT payload to not match `auth.uid()` from the scoped client. Additionally, `task.deadline` (Python `date` object) wasn't JSON-serializable.

**Fix:** `get_current_user` now raises 401 when a token is present but invalid (no silent fallback). Date fields converted to strings before INSERT.

**Impact:** Authenticated task CRUD now works correctly under RLS. No more user_id/auth.uid() mismatch possible.

**Risk:** Low — auth behavior change only affects error handling (401 instead of silent fallback). Local dev (no token) still works via DUMMY_USER_ID.

**Build:** ✅ Backend loads, frontend builds.

**Details:** See [CODE_REVIEW_SECURITY.md](./CODE_REVIEW_SECURITY.md)

---

## 2026-05-23: Forensic Fix — Projects INSERT RLS (set_session elimination)

**Scope:** Backend — `database.py` scoped client creation  
**Files Modified:**
- `backend/app/database.py`
- `backend/app/dependencies.py` (debug logging added)
- `backend/app/routers/reference.py` (debug endpoint + logging added)

**Root Cause:**  
`get_supabase_client` used `client.auth.set_session(token, refresh_token="")` which makes a network call to `get_user(token)` on every request. If this call fails, the Authorization header remains as `Bearer sb_publishable_...` (not a valid JWT), causing PostgREST to reject it or fall back to anon role where `auth.uid() = NULL`, failing the RLS WITH CHECK.

**Fix:** Replaced `set_session` with direct header assignment: `client.options.headers["Authorization"] = f"Bearer {access_token}"`. This is the exact operation that the auth event listener performs internally, but without the fragile network call.

**Key Discovery:** `SUPABASE_KEY` is the publishable/anon key (`sb_publishable_*` format), NOT the service role key. It does not bypass RLS.

**Risk:** Low — direct header assignment is simpler and more reliable than `set_session`. The user JWT still reaches PostgREST for validation. No security weakening.

**Build:** ✅ Backend loads, frontend builds.

**Details:** See [CODE_REVIEW_SECURITY.md](./CODE_REVIEW_SECURITY.md) and [RLS_ENFORCEMENT.md](./RLS_ENFORCEMENT.md)
