const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// using a local SQLite file; note that Vercel functions have an ephemeral filesystem
const dbPath = path.join(__dirname, '../messages.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS contact_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      message TEXT NOT NULL
    )
  `);
});

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // clear previous messages then insert new one
  db.run('DELETE FROM contact_messages', function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    const stmt = db.prepare(
      'INSERT INTO contact_messages (name, email, message) VALUES (?, ?, ?)',
    );
    stmt.run(name, email, message, function (err) {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Database error' });
      }
      res.json({ message: 'Message saved successfully!', id: this.lastID });
    });
    stmt.finalize();
  });
}
