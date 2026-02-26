import { connect } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const db = await connect();
    const rows = await db.all('SELECT * FROM messages');
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Messages API Error:', error);
    return res.status(500).json({ message: 'Error fetching messages', error: String(error) });
  }
}
