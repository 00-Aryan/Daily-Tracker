// Token cache — avoids calling getSession() on every API request
let cached = { accessToken: null, expiresAt: 0 };

const REFRESH_BUFFER_MS = 60_000; // refresh 60s before expiry

export function getCachedToken() {
  if (cached.accessToken && Date.now() < cached.expiresAt - REFRESH_BUFFER_MS) {
    return cached.accessToken;
  }
  return null;
}

export function setCachedToken(accessToken, expiresAt) {
  cached = { accessToken, expiresAt: expiresAt * 1000 }; // expiresAt comes as unix seconds
}

export function clearCachedToken() {
  cached = { accessToken: null, expiresAt: 0 };
}
