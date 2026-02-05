const mongoose = require('mongoose');

/**
 * MongoDB Connection Manager
 */
class MongoDB {
  constructor(mongoUri) {
    this.mongoUri = mongoUri;
    this.connection = null;
  }

  async connect() {
    try {
      this.connection = await mongoose.connect(this.mongoUri, {
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      });
      
      console.log('✓ MongoDB connected successfully');
      console.log(`  Database: ${this.connection.connection.name}`);
      
      // Handle connection events
      mongoose.connection.on('error', (err) => {
        console.error('MongoDB connection error:', err);
      });

      mongoose.connection.on('disconnected', () => {
        console.log('MongoDB disconnected');
      });

      return this.connection;
    } catch (error) {
      console.error('MongoDB connection failed:', error.message);
      throw error;
    }
  }

  async disconnect() {
    if (this.connection) {
      await mongoose.disconnect();
      console.log('MongoDB connection closed');
    }
  }

  isConnected() {
    return mongoose.connection.readyState === 1;
  }
}

module.exports = MongoDB;




