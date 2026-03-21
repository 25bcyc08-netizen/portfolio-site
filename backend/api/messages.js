import { connect } from './db.js';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET' && req.method !== 'DELETE') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const db = await connect();

    if (req.method === 'DELETE') {
      const result = await db.run('DELETE FROM messages');
      return res.status(200).json({ message: 'All messages cleared successfully', deletedCount: result.changes || 0 });
    }

    const rows = await db.all('SELECT * FROM messages ORDER BY created_at DESC');
    return res.status(200).json(rows);
  } catch (error) {
    console.error('Messages API Error:', error);
    return res.status(500).json({ message: 'Error processing request', error: String(error) });
  }
}
