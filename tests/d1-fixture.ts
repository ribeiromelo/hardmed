import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';

// Minimal D1 adapter backed by real SQLite, isolated from local/production D1.
export function fixture() {
  const sqlite = new DatabaseSync(':memory:');
  for (const file of ['0001_initial_schema.sql','0002_add_notifications.sql','0003_secure_sessions.sql']) sqlite.exec(fs.readFileSync(new URL('../migrations/'+file,import.meta.url),'utf8'));
  sqlite.exec(fs.readFileSync(new URL('../seed.sql',import.meta.url),'utf8'));
  const prepare = (sql: string) => {
    let parameters: any[] = [];
    const statement = {
      bind(...values: any[]) { parameters=values; return statement; },
      async first() { return sqlite.prepare(sql).get(...parameters) || null; },
      async all() { return { results:sqlite.prepare(sql).all(...parameters),success:true }; },
      async run() {
        const result=sqlite.prepare(sql).run(...parameters);
        return { success:true, meta:{ changes:Number(result.changes),last_row_id:Number(result.lastInsertRowid) } };
      }
    };
    return statement;
  };
  const DB = { prepare, async batch(statements: any[]) {
    sqlite.exec('BEGIN');
    try { const results=[]; for (const statement of statements) results.push(await statement.run()); sqlite.exec('COMMIT'); return results; }
    catch(error) { sqlite.exec('ROLLBACK'); throw error; }
  } };
  return { sqlite, DB:DB as any };
}
