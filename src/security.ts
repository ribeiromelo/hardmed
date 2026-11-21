import type { Context } from 'hono';
import { deleteCookie, setCookie } from 'hono/cookie';
import { digest, SESSION_COOKIE, SESSION_SECONDS } from './auth';
import type { Bindings } from './types';

export function setSessionCookie(c: Context, token: string) {
  setCookie(c, SESSION_COOKIE, token, {
    path: '/', httpOnly: true, secure: new URL(c.req.url).protocol === 'https:',
    sameSite: 'Strict', maxAge: SESSION_SECONDS,
  });
  deleteCookie(c, 'auth_token', { path: '/' });
}
export function clearSessionCookie(c: Context) {
  deleteCookie(c, SESSION_COOKIE, { path: '/', httpOnly: true, secure: new URL(c.req.url).protocol === 'https:', sameSite: 'Strict' });
  deleteCookie(c, 'auth_token', { path: '/' });
}

// Atomic per-key fixed-window counters; persisted in D1 across Worker instances.
export async function allowAuthAttempt(c: Context<{ Bindings: Bindings }>, scope: string, identifier: string, limit: number, windowMs: number) {
  const windowStart = Math.floor(Date.now() / windowMs) * windowMs;
  const key = await digest(`${scope}:${identifier}`);
  const result = await c.env.DB.prepare(`INSERT INTO auth_rate_limits (key_hash, window_start, attempts) VALUES (?, ?, 1)
    ON CONFLICT(key_hash) DO UPDATE SET
      attempts = CASE WHEN window_start = excluded.window_start THEN attempts + 1 ELSE 1 END,
      window_start = excluded.window_start
    RETURNING attempts`).bind(key, windowStart).first<{ attempts: number }>();
  if (!result || result.attempts > limit) {
    c.header('Retry-After', String(Math.max(1, Math.ceil((windowStart + windowMs - Date.now()) / 1000))));
    return false;
  }
  return true;
}
