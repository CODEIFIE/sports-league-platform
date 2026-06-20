/**
 * Creates the database and loads schema -> views -> procedures -> triggers -> seed.
 * Delimiter-aware so stored procedures / triggers load correctly without the mysql CLI.
 *
 *   npm run db:setup
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import { env } from '../src/config/env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_DIR = path.resolve(__dirname, '../../database');
const FILES = ['schema.sql', 'views.sql', 'procedures.sql', 'triggers.sql', 'seed.sql'];

/** Split a SQL script into executable statements, honouring DELIMITER changes. */
function splitStatements(sql: string): string[] {
  const out: string[] = [];
  let delimiter = ';';
  let buffer = '';
  const lines = sql.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    // skip blank lines and full-line comments so they don't pollute statements
    if (trimmed === '' || trimmed.startsWith('--')) continue;
    if (/^DELIMITER\s+/i.test(trimmed)) {
      delimiter = trimmed.split(/\s+/)[1];
      continue;
    }
    buffer += line + '\n';
    if (buffer.trimEnd().endsWith(delimiter)) {
      const stmt = buffer.trimEnd();
      out.push(stmt.slice(0, stmt.length - delimiter.length).trim());
      buffer = '';
    }
  }
  if (buffer.trim()) out.push(buffer.trim());
  return out.filter((s) => s.length > 0);
}

async function run() {
  // connect without a database first so CREATE DATABASE works
  const conn = await mysql.createConnection({
    host: env.db.host,
    port: env.db.port,
    user: env.db.user,
    password: env.db.password,
    multipleStatements: false,
  });
  console.log(`Connected to MySQL at ${env.db.host}:${env.db.port}`);

  for (const file of FILES) {
    const full = path.join(DB_DIR, file);
    const sql = fs.readFileSync(full, 'utf8');
    const statements = splitStatements(sql);
    process.stdout.write(`→ ${file} (${statements.length} statements) ... `);
    for (const stmt of statements) {
      await conn.query(stmt);
    }
    console.log('done');
  }

  await conn.end();
  console.log('\n✓ Database setup complete.');
}

run().catch((err) => {
  console.error('✗ Setup failed:', err.message);
  process.exit(1);
});
