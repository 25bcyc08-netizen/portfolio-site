import express from 'express';
import cors from 'cors';
import { connect } from './api/db.js';

const app = express();
app.use(cors());
app.use(express.json());

// establish connection (ensures schema too)
let db;
connect().then(d => { db = d; }).catch(err => {
  console.error('Failed to open database:', err);
});

app.post('/contact', async (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const result = await db.run(
      'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
      [name, email, message]
    );
    res.json({ message: 'Message saved successfully!', id: result.lastID });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

app.get('/messages', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM messages');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Database error' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
