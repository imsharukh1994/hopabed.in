import mongoose from 'mongoose';
import { env } from './env.js';

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(env.MONGODB_URI, {
      dbName: env.MONGODB_DB_NAME,
      serverSelectionTimeoutMS: 10000,
      maxPoolSize: 10,
      socketTimeoutMS: 45000,
      retryWrites: true,
    });

    isConnected = true;
    console.log(`MongoDB connected: ${env.MONGODB_DB_NAME}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    throw error;
  }
};

export const disconnectDatabase = async (): Promise<void> => {
  if (!isConnected) {
    return;
  }

  await mongoose.disconnect();
  isConnected = false;
  console.log('MongoDB disconnected');
};

export const getMongoConnectionStatus = (): boolean => isConnected;
