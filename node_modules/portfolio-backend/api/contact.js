import mongoose from 'mongoose';
import { connect } from './db.js';

const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // connect will throw if MONGODB_URI missing
    await connect();

    // don't delete existing messages; just insert the new one
    const newMessage = new Message({ name, email, message });
    await newMessage.save();

    return res.status(200).json({ message: 'Message saved successfully!', id: newMessage._id });
  } catch (error) {
    console.error('Contact API Error:', error.message);
    return res.status(500).json({ message: 'Error saving message', error: error.message });
  }
}
