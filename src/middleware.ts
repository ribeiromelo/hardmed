import type { Context } from 'hono';
import { getCookie } from 'hono/cookie';
import * as auth from './auth';
import type { Bindings } from './types';

export async function getUserFromToken(c: Context<{ Bindings: Bindings }>) {
  c.header('Cache-Control', 'private, no-store');
  const token = getCookie(c, auth.SESSION_COOKIE);
  if (!token) return null;
  const user = await auth.verifyToken(token, c.env.DB);
  return user ? auth.sanitizeUser(user) : null;
}
