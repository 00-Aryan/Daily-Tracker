# Frontend Code Review

## 2026-05-23: Fix Empty-State Handling for New Users

### Problem
New authenticated users saw infinite loading states on Tasks and Daily Log pages despite the backend returning valid empty responses (404 for missing logs, empty arrays for tasks).

### Root Cause
Two issues in the async lifecycle:

1. **Stale `tasksLoading` deadlock** (`useAppStore.js`): The `finally` block in `fetchTasks` and `fetchReferenceData` had a guard `if (!config.signal?.aborted)` that skipped clearing `tasksLoading` when a request was aborted (e.g., React StrictMode double-mount, navigation). This left `tasksLoading: true` permanently, and subsequent fetch attempts hit the `if (tasksLoading) return` guard — creating a deadlock.

2. **404 treated as failure** (`asyncUtils.js`): `hasSettledFailure` counted 404 responses as errors. For new users with no tasks, if the backend returned 404 for a status query, the UI showed an error message instead of an empty state.

### Changes

**`frontend/src/store/useAppStore.js`**
- Removed `if (!config.signal?.aborted)` guard from `finally` blocks in both `fetchTasks` and `fetchReferenceData`
- Loading state now always clears, preventing deadlock on re-mount
- Added abort check before setting state in single-status fetch path

**`frontend/src/services/asyncUtils.js`**
- Added `is404()` helper to identify 404 responses
- `getSettledData`: Returns empty array fallback for 404 rejected promises (valid empty state)
- `hasSettledFailure`: Excludes 404 from failure detection (alongside abort errors)

### Error Semantics After Fix
| Response | Interpretation |
|----------|---------------|
| 200 + data | Normal data |
| 200 + `[]` | Valid empty state |
| 404 | Valid empty state (resource doesn't exist yet) |
| 401 | Auth error (handled by interceptor) |
| 500/network | Actual error → shows error UI |

### Verification
- `npm run build` passes cleanly
- DailyLog: 404 → renders empty editor (already worked, no change needed)
- Tasks: Empty arrays → loading clears → renders empty kanban columns
- Abort race: Loading always clears → no deadlock on re-mount
