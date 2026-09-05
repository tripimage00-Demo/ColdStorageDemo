const mongoose = require('mongoose');

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null, mongoServer: null };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  const primaryURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cold_storage_db';

  if (!cached.promise) {
    cached.promise = (async () => {
      // 1. Try connecting to configured MongoDB (Atlas or Local) with 3s timeout
      try {
        console.log(`[MongoDB] Attempting connection to MongoDB...`);
        const conn = await mongoose.connect(primaryURI, {
          serverSelectionTimeoutMS: 3000,
        });
        console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
        return conn;
      } catch (err) {
        console.warn(`[MongoDB] Configured URI connection failed (${err.message}). Falling back to in-memory MongoDB for zero-friction demo...`);
      }

      // 2. Fallback to MongoMemoryServer
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        if (!cached.mongoServer) {
          cached.mongoServer = await MongoMemoryServer.create({
            instance: { dbName: 'cold_storage_db' },
          });
        }
        const memoryUri = cached.mongoServer.getUri();
        console.log(`[MongoDB] In-memory MongoDB started at: ${memoryUri}`);
        const conn = await mongoose.connect(memoryUri);
        console.log(`[MongoDB] In-memory database connected successfully.`);
        return conn;
      } catch (memErr) {
        console.error(`[MongoDB] Critical: Failed to start in-memory MongoDB:`, memErr);
        throw memErr;
      }
    })();
  }

  try {
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
};

module.exports = connectDB;
