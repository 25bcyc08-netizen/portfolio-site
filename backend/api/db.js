import mongoose from 'mongoose';

const mongoUri = process.env.MONGODB_URI;
let isConnected = false;

export async function connect() {
  if (isConnected) {
    return mongoose;
  }
  if (!mongoUri) {
    throw new Error('MONGODB_URI not set');
  }

  // you can adjust options as needed
  await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 });
  isConnected = true;
  return mongoose;
}
