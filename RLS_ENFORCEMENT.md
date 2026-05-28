# RLS Enforcement — ProductivOS

## Architecture

All user-facing data operations use **user-scoped Supabase clients** that carry the authenticated user's JWT. This ensures `auth.uid()` resolves correctly in Postgres RLS policies.

## Client Types

| Client | Created By | RLS Behavior | Used In |
|--------|-----------|--------------|---------|
| Global `supabase` | `create_client(URL, SUPABASE_KEY)` | Respects RLS, anon role, `auth.uid()` = NULL | Auth router (data migration only), local dev fallback |
| Scoped `db` | `get_supabase_client(jwt)` via `get_db` dependency | Respects RLS, authenticated role, `auth.uid()` = user's UUID | All data routers |

**Note:** `SUPABASE_KEY` is the publishable/anon key (`sb_publishable_*` format), NOT the service role key. It does NOT bypass RLS.

## How Scoped Clients Work

```python
# database.py
def get_supabase_client(access_token):
    client = create_client(SUPABASE_URL, SUPABASE_KEY, options=ClientOptions(persist_session=False))
    # Directly set the user's JWT as the Authorization header.
    # PostgREST validates this JWT, sets role=authenticated, and
    # populates auth.uid() from the JWT's 'sub' claim.
    client.options.headers["Authorization"] = f"Bearer {access_token}"
    client._postgrest = None  # Force re-creation with new headers
    return client
```

**Why direct header assignment (not `set_session`):**
- `set_session` makes a network call to `get_user(token)` which can fail (rate limits, network errors, token edge cases)
- If `set_session` fails, the Authorization header remains as `Bearer <publishable_key>` which PostgREST rejects (PGRST301: not a valid JWT)
- Direct assignment guarantees the user JWT reaches PostgREST regardless of auth module behavior
- This is exactly what `_listen_to_auth_events` does internally after `set_session` succeeds

## Dependency Chain

```
Frontend (Authorization: Bearer <jwt>)
  → FastAPI endpoint receives header
    → get_current_user: validates JWT, extracts user_id (for app logic)
    → get_db: creates scoped client with JWT (for RLS enforcement)
      → Supabase PostgREST: auth.uid() = user's UUID
        → RLS policy: auth.uid() = user_id ✓
```

## RLS Policy Pattern (Expected)

```sql
-- INSERT: user can only insert rows they own
CREATE POLICY "Users can insert own data" ON projects
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- SELECT: user can only read own rows
CREATE POLICY "Users can read own data" ON projects
  FOR SELECT USING (auth.uid() = user_id);

-- UPDATE/DELETE: user can only modify own rows
CREATE POLICY "Users can modify own data" ON projects
  FOR UPDATE USING (auth.uid() = user_id);
```

## Exception: Auth Router

The `/auth/claim-anonymous-data` endpoint intentionally uses the global service-role client to migrate DUMMY_USER_ID records to the authenticated user. This is the only endpoint that bypasses RLS, and it requires full authentication to execute.

## Security Invariants

1. No data router imports or uses the global `supabase` client directly
2. All data operations go through `db: Client = Depends(get_db)`
3. `get_db` returns the global client only when no JWT is present (local dev fallback)
4. Cross-user data access is blocked by RLS at the database level
5. Service-role bypass is limited to the auth migration endpoint
6. `get_current_user` raises 401 (not silent fallback) when a token is present but invalid — prevents `user_id`/`auth.uid()` mismatch
7. All date/datetime fields are serialized to ISO strings before passing to Supabase client
