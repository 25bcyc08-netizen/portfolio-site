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
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,PUT,DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    if (!mongoUri) {
      console.error('MONGODB_URI is not set in environment variables');
      return res.status(500).json({ message: 'Server configuration error: Missing MONGODB_URI' });
    }

    console.log('Connecting to MongoDB for messages...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB successfully');

    const messages = await Message.find();
    console.log(`Found ${messages.length} messages`);
    res.status(200).json(messages);
  } catch (error) {
    console.error('Messages API Error:', error);
    res.status(500).json({ message: 'Database error', errorDetails: error.message });
  } finally {
    try {
      await mongoose.disconnect();
    } catch (e) {
      console.error('Disconnect error:', e);
    }
  }
}
