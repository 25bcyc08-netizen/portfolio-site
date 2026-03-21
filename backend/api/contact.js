import { connect } from './db.js';

// Simple in-memory rate limiter for serverless functions
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

export default async function handler(req, res) {
  // Security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // Rate limiting
  const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
  if (!checkRateLimit(clientIP)) {
    res.setHeader('Retry-After', Math.ceil(RATE_LIMIT_WINDOW / 1000));
    return res.status(429).json({
      message: 'Too many requests. Please try again later.',
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000)
    });
  }

  try {
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

    // Sanitize inputs
    const sanitizedData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim()
    };

    const db = await connect();

    const result = await db.run(
      'INSERT INTO messages (name, email, message) VALUES (?, ?, ?)',
      [sanitizedData.name, sanitizedData.email, sanitizedData.message]
    );

    return res.status(200).json({ message: 'Message saved successfully!', id: result.lastID });
  } catch (error) {
    console.error('Contact API Error:', error);
    return res.status(500).json({ message: 'Error saving message', error: String(error) });
  }
} 
