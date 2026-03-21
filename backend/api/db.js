import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';

const { Pool } = pkg;

// Shared helper that supports Postgres (if DATABASE_URL set) or SQLite fallback.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// by default the database file lives next to this module. on Vercel
// serverless functions the project directory is read‑only, so writes must go
// into /tmp (which is cleaned on every invocation). users can also override the
// path with DB_PATH or switch to Postgres with DATABASE_URL.
const sqliteDefaultPath = path.join(__dirname, 'messages.sqlite');
const vercelTmpPath = path.join('/tmp', 'messages.sqlite');

let sqlitePromise = null;
let pgPool = null;
let initialized = false;

function convertQuestionToDollar(sql) {
  let i = 0;
  return sql.replace(/\?/g, () => `\$${++i}`);
}

export async function connect() {
  if (!initialized) {
    if (process.env.DATABASE_URL) {
      // Use Postgres (recommended for production deployments)
      pgPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
        connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
      });
      // create table if not exists
      await pgPool.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT NOT NULL,
          message TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
    } else {
      // Use SQLite fallback. choose path carefully so that serverless
      // functions can write to it.
      let filename;
      if (process.env.DB_PATH) {
        filename = process.env.DB_PATH;
      } else if (process.env.VERCEL) {
        // on Vercel the repo is read-only; write to /tmp instead
        filename = vercelTmpPath;
      } else {
        filename = sqliteDefaultPath;
      }

      sqlitePromise = open({ filename, driver: sqlite3.Database }).then(async (db) => {
        await db.run(`
          CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL,
            message TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
        return db;
      });
    }
    initialized = true;
  }

  // Return a unified API
  if (pgPool) {
    return {
      async run(sql, params = []) {
        const pgSql = convertQuestionToDollar(sql);
        const needsReturning = /^\s*INSERT\b/i.test(sql) && !/RETURNING\b/i.test(sql);
        const finalSql = needsReturning ? `${pgSql} RETURNING id` : pgSql;
        const res = await pgPool.query(finalSql, params);
        return { lastID: res.rows?.[0]?.id ?? null, rowCount: res.rowCount };
      },
      async all(sql, params = []) {
        const pgSql = convertQuestionToDollar(sql);
        const res = await pgPool.query(pgSql, params);
        return res.rows;
      }
    };
  }

  // SQLite
  const db = await sqlitePromise;
  return {
    run: (...args) => db.run(...args),
    all: (...args) => db.all(...args)
  };
}
 
