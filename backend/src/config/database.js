import mongoose from 'mongoose';

/**
 * Singleton Pattern - Database Connection
 * Ensures only one database connection instance exists
 */
export class DatabaseConnection {
  static #instance = null;
  #connection = null;

  constructor() {
    if (DatabaseConnection.#instance) {
      return DatabaseConnection.#instance;
    }
    DatabaseConnection.#instance = this;
  }

  static getInstance() {
    if (!DatabaseConnection.#instance) {
      DatabaseConnection.#instance = new DatabaseConnection();
    }
    return DatabaseConnection.#instance;
  }

  async connect() {
    if (this.#connection) {
      console.log('📦 Using existing database connection');
      return this.#connection;
    }

    try {
      this.#connection = await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log('✅ MongoDB connected successfully');
      return this.#connection;
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      process.exit(1);
    }
  }

  async disconnect() {
    if (this.#connection) {
      await mongoose.disconnect();
      this.#connection = null;
      console.log('🔌 MongoDB disconnected');
    }
  }

  getConnection() {
    return this.#connection;
  }
}
