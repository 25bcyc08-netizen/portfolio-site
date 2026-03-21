import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { connect } from './api/db.js';

// Simple in-memory rate limiter
const rateLimit = new Map();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5; // 5 requests per window

function checkRateLimit(ip) {
  const now = Date.now();
  const userRequests = rateLimit.get(ip) || [];

  // Remove old requests outside the window
  const validRequests = userRequests.filter(time => now - time < RATE_LIMIT_WINDOW);

  if (validRequests.length >= RATE_LIMIT_MAX) {
    return false; // Rate limit exceeded
  }

  validRequests.push(now);
  rateLimit.set(ip, validRequests);
  return true; // Request allowed
}

const app = express();

// Serve static files from frontend directory in production
if (process.env.NODE_ENV === 'production') {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  app.use(express.static(path.join(__dirname, '../frontend')));
}

app.use(cors({
  origin: process.env.NODE_ENV === 'production' ? false : true, // Allow all in development
  methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json({ limit: '10mb' }));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: db ? 'connected' : 'disconnected'
  });
});

// establish connection (ensures schema too)
let db;
connect().then(d => {
  db = d;
  console.log('Database connected successfully');
}).catch(err => {
  console.error('Failed to open database:', err);
  console.error('Server will continue but database operations will fail');
});

// Middleware to check database connection
const requireDatabase = (req, res, next) => {
  if (!db) {
    return res.status(503).json({ message: 'Database not available. Please try again later.' });
  }
  req.db = db;
  next();
};

// expose the same endpoints used by the serverless functions on Vercel
// this keeps the frontend code unchanged whether running locally or in
// production (both use `/api/contact` and `/api/messages`).
app.post('/api/contact', requireDatabase, (req, res, next) => {
  const clientIP = req.ip || req.connection.remoteAddress || 'unknown';

  if (!checkRateLimit(clientIP)) {
    return res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }

  next();
}, async (req, res) => {
  const { name, email, message } = req.body;

  // Server-side validation
  const errors = [];
  if (!name || typeof name !== 'string' || name.trim().length < 2 || name.length > 100) {
    errors.push('Name must be between 2 and 100 characters');
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || email.length > 254) {
    errors.push('Please provide a valid email address (max 254 characters)');
  }
  if (!message || typeof message !== 'string' || message.trim().length < 10 || message.length > 1000) {
    errors.push('Message must be between 10 and 1000 characters');
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: 'Validation failed', errors });
  }

  try {
    // Sanitize inputs
    const sanitizedData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim()
    };

    const result = await req.db.run(
      'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
      [sanitizedData.name, sanitizedData.email, sanitizedData.message]
    );
    res.json({ message: 'Message saved successfully!', id: result.lastID });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Database error occurred' });
  }
});

app.get('/api/messages', requireDatabase, async (req, res) => {
  try {
    const rows = await req.db.all('SELECT * FROM messages ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Database error occurred' });
  }
});

app.delete('/api/messages', requireDatabase, async (req, res) => {
  try {
    const result = await req.db.run('DELETE FROM messages');
    res.json({ message: 'All messages cleared successfully', deletedCount: result.changes || 0 });
  } catch (err) {
    console.error('Database error:', err);
    res.status(500).json({ message: 'Database error occurred' });
  }
});

// Serve index.html for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  });
}

const port = process.env.PORT || 5000;
app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
