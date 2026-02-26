const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

const dbPath = path.join(__dirname, 'messages.db');
const db = new sqlite3.Database(dbPath);
// create table if it doesn't exist
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

app.post('/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  // Delete all previous messages first
  db.run('DELETE FROM contact_messages', function (err) {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Database error' });
    }

    // Then insert the new message
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
});

app.get('/messages', (req, res) => {
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
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
