import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import api from '../src/api-routes';
import { fixture } from './d1-fixture';
import { digest } from '../src/auth';

const origin = 'https://hardmed.example';
const headers = { 'Content-Type':'application/json', 'X-HardMed-Request':'1', Origin:origin };
const sessionCookie = (response: Response) => response.headers.getSetCookie().find(value => value.startsWith('hardmed_session='))?.split(';')[0] || '';

test('authentication, permissions and data validation against isolated SQLite', async t => {
  const {sqlite,DB}=fixture();
  const call=(path:string, method='GET', body?:any, cookie='',extra:Record<string,string>={}) => api.request(origin+path,{method,headers:{...headers,...(cookie?{Cookie:cookie}:{}),...extra},...(body!==undefined?{body:JSON.stringify(body)}:{})},{DB, ALLOW_DEMO_LOGIN:'1'});
  let student='', admin='';
  try {
    await t.test('rejects the original forged token and header-only credentials', async () => {
      const forged=btoa(JSON.stringify({id:1,role:'admin',exp:Date.now()+60000}))+'.invalid';
      assert.equal((await call('/admin/users','GET',undefined,'auth_token='+forged)).status,401);
      assert.equal((await call('/admin/users','GET',undefined,'hardmed_session='+forged)).status,401);
      assert.equal((await call('/admin/users','GET',undefined,'',{Authorization:'Bearer '+forged})).status,401);
    });
    await t.test('published demo credentials are disabled without the local-only flag', async () => {
      const response=await api.request(origin+'/auth/login',{method:'POST',headers,body:JSON.stringify({email:'admin@hardmedicina.com',password:'admin123'})},{DB});
      assert.equal(response.status,403);
      assert.equal(sessionCookie(response),'');
    });
    await t.test('login upgrades legacy hashes and does not return credentials in JSON', async () => {
      const response=await call('/auth/login','POST',{email:'erique@exemplo.com',password:'admin123'});
      assert.equal(response.status,200); student=sessionCookie(response); assert.ok(student);
      assert.equal('token' in await response.json(),false);
      const row=sqlite.prepare('SELECT password_hash FROM users WHERE id=2').get() as any;
      assert.match(row.password_hash,/^scrypt\$/);
      const stored=sqlite.prepare('SELECT token_hash FROM auth_sessions WHERE user_id=2').get() as any;
      assert.notEqual(stored.token_hash,student.split('=')[1]);
      assert.equal((await call('/user/me','GET',undefined,student)).status,200);
    });
    await t.test('student cannot call any administrative write endpoints', async () => {
      for (const path of ['/admin/users','/admin/stats','/admin/notifications']) assert.equal((await call(path,'GET',undefined,student)).status,403,path);
      for (const path of ['/tracks','/seasons','/lessons']) assert.equal((await call(path,'POST',{},student)).status,403,path);
      const response=await call('/auth/login','POST',{email:'admin@hardmedicina.com',password:'admin123'});
      assert.equal(response.status,200); admin=sessionCookie(response);
      assert.equal((await call('/admin/users','GET',undefined,admin)).status,200);
    });
    await t.test('rejects cross-origin mutations, absent CSRF marker and oversized bodies', async () => {
      assert.equal((await call('/user/profile','PUT',{name:'Outro Nome'},student,{Origin:'https://evil.invalid'})).status,403);
      assert.equal((await call('/user/profile','PUT',{name:'Outro Nome'},student,{'X-HardMed-Request':''})).status,403);
      assert.equal((await call('/user/profile','PUT',{name:'x'.repeat(20000)},student)).status,413);
      assert.equal((await call('/user/profile','PUT',{name:{toString:'invalid'}},student)).status,400);
    });
    await t.test('rejects SQL injection in query parameters and unsafe URL/number fields', async () => {
      for (const query of ['1 OR 1=1','1 UNION SELECT * FROM users','-1','1;DROP TABLE users']) assert.equal((await call('/lessons?track_id='+encodeURIComponent(query),'GET',undefined,admin)).status,400);
      assert.equal((await call('/lessons?track_id=1','GET',undefined,admin)).status,200);
      assert.equal((await call('/tracks','POST',{title:'Teste',specialty_id:1,cover_image:'javascript:alert(1)'},admin)).status,400);
      assert.equal((await call('/seasons','POST',{title:'Teste',track_id:1,order_index:'<svg onload=alert(1)>'},admin)).status,400);
    });
    await t.test('current database role and active state override previously issued sessions', async () => {
      sqlite.prepare("UPDATE users SET role='student' WHERE id=1").run();
      assert.equal((await call('/admin/users','GET',undefined,admin)).status,403);
      sqlite.prepare("UPDATE users SET role='admin' WHERE id=1").run();
      sqlite.prepare('UPDATE users SET is_active=0 WHERE id=2').run();
      assert.equal((await call('/user/me','GET',undefined,student)).status,401);
      sqlite.prepare('UPDATE users SET is_active=1 WHERE id=2').run();
    });
    await t.test('expired sessions, modified cookies and logout cannot be reused', async () => {
      assert.equal((await call('/user/me','GET',undefined,student+'f')).status,401);
      const hash=await digest(student.split('=')[1]);
      sqlite.prepare('UPDATE auth_sessions SET expires_at=0 WHERE token_hash=?').run(hash);
      assert.equal((await call('/user/me','GET',undefined,student)).status,401);
      const response=await call('/auth/logout','POST',{},admin); assert.equal(response.status,200);
      assert.equal((await call('/admin/users','GET',undefined,admin)).status,401);
    });
    await t.test('password change invalidates all other sessions and preserves the new one', async () => {
      const login=()=>call('/auth/login','POST',{email:'erique@exemplo.com',password:'admin123'});
      const first=sessionCookie(await login()), second=sessionCookie(await login());
      const response=await call('/user/password','PUT',{currentPassword:'admin123',newPassword:'Nova senha de teste!42'},first);
      assert.equal(response.status,200); const replacement=sessionCookie(response);
      assert.ok(replacement); assert.notEqual(replacement,first);
      assert.equal((await call('/user/me','GET',undefined,first)).status,401);
      assert.equal((await call('/user/me','GET',undefined,second)).status,401);
      assert.equal((await call('/user/me','GET',undefined,replacement)).status,200);
      assert.equal((await login()).status,401);
    });
    await t.test('login attempts are limited persistently across requests', async () => {
      for (let i=0;i<10;i++) assert.equal((await call('/auth/login','POST',{email:'not-found@example.invalid',password:'wrong-password'})).status,401);
      const response=await call('/auth/login','POST',{email:'not-found@example.invalid',password:'wrong-password'});
      assert.equal(response.status,429); assert.ok(Number(response.headers.get('Retry-After'))>0);
    });
    await t.test('registration binds hostile text as data and cannot grant an admin role', async () => {
      const name="<img src=x onerror=alert(1)> '; DROP TABLE users; --";
      const response=await call('/auth/register','POST',{name,email:'new-user@example.invalid',password:'Uma senha de teste!2026',role:'admin'});
      assert.equal(response.status,201);
      const {user}=await response.json() as any;
      assert.equal(user.name,name); assert.equal(user.role,'student'); assert.equal('password_hash' in user,false);
      assert.ok(sqlite.prepare('SELECT COUNT(*) AS n FROM users').get());
      assert.equal((await call('/auth/register','POST',{name:'Duplicado',email:'NEW-USER@example.invalid',password:'Uma senha de teste!2026'})).status,400);
    });
    await t.test('students cannot read lessons belonging to inactive tracks', async () => {
      const login=await call('/auth/login','POST',{email:'new-user@example.invalid',password:'Uma senha de teste!2026'});
      const cookie=sessionCookie(login);
      sqlite.prepare('UPDATE tracks SET is_active=0 WHERE id=1').run();
      const response=await call('/lessons?track_id=1','GET',undefined,cookie);
      assert.equal(response.status,200); assert.deepEqual(await response.json(),[]);
      assert.equal((await call('/lessons/iam-diagnostico','GET',undefined,cookie)).status,404);
    });
  } finally { sqlite.close(); }
});

test('output encoding makes hostile text inert and rejects executable URLs/icons', () => {
  const context={window:{},location:{origin},URL};
  vm.runInNewContext(fs.readFileSync(new URL('../public/static/security-ui.js',import.meta.url),'utf8'),context);
  const ui=(context.window as any).uiSecurity;
  assert.equal(ui.escape('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
  assert.equal(ui.url('javascript:alert(1)'),''); assert.equal(ui.url('data:text/html,test'),'');
  assert.equal(ui.icon('fa-bell" onclick="alert(1)'),'fa-info-circle');
});
