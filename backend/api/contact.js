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

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  try {
    await mongoose.connect(mongoUri);

    const { name, email, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    // Delete all previous messages
    await Message.deleteMany({});

    // Create new message
    const newMessage = new Message({ name, email, message });
    await newMessage.save();

    res.status(200).json({ message: 'Message saved successfully!', id: newMessage._id });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Database error', error: error.message });
  } finally {
    await mongoose.disconnect();
  }
}
