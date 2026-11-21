import { scrypt, timingSafeEqual } from 'node:crypto';
import type { User, UserPublic } from './types';

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 5;
export const SESSION_SECONDS = 7 * 24 * 60 * 60;
export const SESSION_COOKIE = 'hardmed_session';

export async function digest(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), b => b.toString(16).padStart(2, '0')).join('');
}
const hex = (bytes: Uint8Array) => Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
const derive = (password: string, salt: string): Promise<Buffer> => new Promise((resolve, reject) => {
  scrypt(password, Buffer.from(salt, 'hex'), 32,
    { N: SCRYPT_N, r: SCRYPT_R, p: SCRYPT_P, maxmem: 32 * 1024 * 1024 },
    (error, key) => error ? reject(error) : resolve(key));
});
export async function hashPassword(password: string): Promise<string> {
  // Policy for new passwords lives at the API boundary; preserve valid legacy
  // passwords during migration, including ones created under an older policy.
  if (typeof password !== 'string' || !password.length || new TextEncoder().encode(password).length > 1024) throw new Error('Invalid password length');
  const salt = hex(crypto.getRandomValues(new Uint8Array(16)));
  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${hex(await derive(password, salt))}`;
}
export function isLegacyPasswordHash(hash: string): boolean { return /^[a-f0-9]{64}$/.test(hash); }
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (typeof password !== 'string' || new TextEncoder().encode(password).length > 1024) return false;
  if (isLegacyPasswordHash(hash)) {
    const actual = await digest(password + 'hardmedicina-salt');
    return timingSafeEqual(Buffer.from(actual, 'hex'), Buffer.from(hash, 'hex'));
  }
  const parts = hash.split('$');
  if (parts.length !== 6 || parts[0] !== 'scrypt' || Number(parts[1]) !== SCRYPT_N || Number(parts[2]) !== SCRYPT_R || Number(parts[3]) !== SCRYPT_P || !/^[a-f0-9]{32}$/.test(parts[4]) || !/^[a-f0-9]{64}$/.test(parts[5])) return false;
  return timingSafeEqual(await derive(password, parts[4]), Buffer.from(parts[5], 'hex'));
}
// Opaque session tokens contain no user identity or role. Only a hash is persisted.
export async function generateToken(user: User, DB: D1Database): Promise<string> {
  const token = hex(crypto.getRandomValues(new Uint8Array(32)));
  const result = await DB.prepare(`INSERT INTO auth_sessions (token_hash, user_id, expires_at)
    SELECT ?, id, ? FROM users WHERE id = ? AND password_hash = ? AND is_active = 1`)
    .bind(await digest(token), Date.now() + SESSION_SECONDS * 1000, user.id, user.password_hash).run();
  if (result.meta.changes !== 1) throw new Error('Credentials changed while signing in');
  return token;
}
export async function verifyToken(token: string, DB: D1Database): Promise<User | null> {
  if (!/^[a-f0-9]{64}$/.test(token)) return null;
  return DB.prepare(`SELECT u.* FROM auth_sessions s JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.expires_at > ? AND u.is_active = 1`)
    .bind(await digest(token), Date.now()).first<User>();
}
export async function revokeToken(token: string | undefined, DB: D1Database): Promise<void> {
  if (token && /^[a-f0-9]{64}$/.test(token)) await DB.prepare('DELETE FROM auth_sessions WHERE token_hash = ?').bind(await digest(token)).run();
}
export function sanitizeUser(user: User): UserPublic {
  const { id, name, email, role, avatar_url, created_at } = user;
  return { id, name, email, role, avatar_url, created_at };
}
export function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
export function isValidPassword(password: unknown): password is string {
  return typeof password === 'string' && password.length >= 8 && new TextEncoder().encode(password).length <= 1024;
}
