const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../messages.db');
const db = new sqlite3.Database(dbPath);

export default function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  db.all('SELECT * FROM contact_messages', [], (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }
    const messages = rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      message: row.message,
    }));
    res.json(messages);
  });
}
