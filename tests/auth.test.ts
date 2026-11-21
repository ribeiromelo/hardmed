import test from 'node:test';
import assert from 'node:assert/strict';
import { Hono } from 'hono';
import { hashPassword, verifyPassword, verifyToken, digest, sanitizeUser } from '../src/auth';
import { setSessionCookie, clearSessionCookie } from '../src/security';

test('scrypt salts are unique and wrong, oversized or malformed credentials fail', async () => {
  const password = 'Senha de teste com acentos: ação!42';
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.match(first, /^scrypt\$16384\$8\$5\$/);
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword('senha errada', first), false);
  assert.equal(await verifyPassword('a'.repeat(1025), first), false);
  assert.equal(await verifyPassword(password, 'scrypt$999999999$8$5$bad$bad'), false);
});
test('legacy hashes remain verifiable for migration without accepting wrong passwords', async () => {
  const legacy = await digest('admin123hardmedicina-salt');
  assert.equal(await verifyPassword('admin123', legacy), true);
  assert.equal(await verifyPassword('wrong-password', legacy), false);
});
test('legacy forged tokens and arbitrary input are rejected before querying D1', async () => {
  const DB = { prepare() { throw new Error('Must not query for malformed tokens'); } } as any;
  for (const token of ['', 'a'.repeat(63), 'g'.repeat(64), btoa(JSON.stringify({ id:1, role:'admin',exp:Date.now()+60000 }))+'.invalid']) {
    assert.equal(await verifyToken(token, DB), null);
  }
});
test('session cookies are HttpOnly, host-only, Strict, Secure on HTTPS and can be deleted', async () => {
  const app = new Hono();
  app.get('/set', c => { setSessionCookie(c, 'a'.repeat(64)); return c.text('ok'); });
  app.get('/clear', c => { clearSessionCookie(c); return c.text('ok'); });
  const response = await app.request('https://example.test/set');
  const cookie = response.headers.getSetCookie().find(value => value.startsWith('hardmed_session='))!;
  assert.match(cookie, /HttpOnly/i); assert.match(cookie, /Secure/i); assert.match(cookie, /SameSite=Strict/i);
  assert.match(cookie, /Path=\//i); assert.doesNotMatch(cookie, /Domain=/i);
  const clear = (await app.request('https://example.test/clear')).headers.getSetCookie().find(value => value.startsWith('hardmed_session='))!;
  assert.match(clear, /Max-Age=0/i);
});
test('public user output explicitly excludes credentials and session metadata', () => {
  const result = sanitizeUser({id:1,name:'Nome',email:'test@example.invalid',role:'student',password_hash:'secret',is_active:1,created_at:'2026-11-21'});
  assert.equal('password_hash' in result, false);
  assert.equal('is_active' in result, false);
});
