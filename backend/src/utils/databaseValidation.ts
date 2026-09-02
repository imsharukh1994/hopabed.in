import mongoose from 'mongoose';
import { env } from '../config/env.js';

export async function validateDatabaseConfiguration(): Promise<{ ok: boolean; message: string; }> {
  if (!env.MONGODB_URI || !env.MONGODB_DB_NAME) {
    return {
      ok: false,
      message: 'MongoDB environment variables are not configured.',
    };
  }

  try {
    const readyState = mongoose.connection.readyState;

    if (readyState === 1) {
      return {
        ok: true,
        message: 'MongoDB connection is active.',
      };
    }

    return {
      ok: false,
      message: 'MongoDB is not connected yet. Call connectDatabase() before use.',
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'MongoDB validation failed.',
    };
  }
}
