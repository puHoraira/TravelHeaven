import dotenv from 'dotenv';
import { DatabaseConnection } from '../config/database.js';

dotenv.config();

const test = async () => {
  const db = DatabaseConnection.getInstance();
  try {
    await db.connect();
    console.log('✅ Successfully connected to MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed to connect to MongoDB', err.message);
    process.exit(1);
  }
};

test();
