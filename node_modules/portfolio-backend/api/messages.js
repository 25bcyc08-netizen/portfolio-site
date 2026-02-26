import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI;

const messageSchema = new mongoose.Schema({
  name: String,
  email: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Message = mongoose.model('Message', messageSchema);

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

  let connection;
  try {
    if (!mongoUri) {
      console.error('MONGODB_URI not set');
      return res.status(500).json({ message: 'Server error: Missing MongoDB URI' });
    }

    connection = mongoose.connection.readyState;
    if (connection === 0) {
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
    }

    const messages = await Message.find();
    return res.status(200).json(messages);
  } catch (error) {
    console.error('Messages API Error:', error.message);
    return res.status(500).json({ message: 'Error fetching messages', error: error.message });
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}
