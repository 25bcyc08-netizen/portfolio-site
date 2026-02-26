import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

// open a database connection, creating the file if necessary.  When running in
// a serverless environment the file will live in a temporary directory, which
// is fine for lightweight message storage.  You can override the path via the
// DB_PATH environment variable (useful for local development).
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const defaultPath = path.join(__dirname, 'messages.sqlite');
let dbPromise;

export async function connect() {
  if (!dbPromise) {
    dbPromise = open({
      filename: process.env.DB_PATH || defaultPath,
      driver: sqlite3.Database
    }).then(async (db) => {
      // ensure table exists
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
  return dbPromise;
} 
