import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    'Please define the MONGODB_URI environment variable inside .env.local'
  );
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during development.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  // If we already have a connection, return it
  if (cached.conn) {
    console.log('Using existing database connection');
    return cached.conn;
  }

  // Only create a new connection promise if one doesn't exist already
  if (!cached.promise) {
    console.log('Creating new database connection');
    const opts = {
      bufferCommands: false,
      connectTimeoutMS: 30000, // Increased to 30 seconds
      socketTimeoutMS: 45000,
      serverSelectionTimeoutMS: 30000, // Added server selection timeout
      retryWrites: true,
      retryReads: true,
      maxPoolSize: 10,
      minPoolSize: 5,
      maxIdleTimeMS: 60000,
      family: 4 // Force IPv4
    };

    // Store the connection promise
    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('Database connected successfully');
        
        // Add connection event listeners for better diagnostics
        mongoose.connection.on('disconnected', () => {
          console.warn('Database connection disconnected');
          cached.conn = null;
        });
        
        mongoose.connection.on('error', (err) => {
          console.error('Database connection error:', err);
        });
        
        return mongoose;
      })
      .catch((error) => {
        console.error('Failed to connect to database:', error);
        // Clear the promise so we can retry next time
        cached.promise = null;
        throw error;
      });
  }

  try {
    // Wait for the connection to be established
    cached.conn = await cached.promise;
    return cached.conn;
  } catch (e) {
    console.error('Error resolving database connection:', e);
    cached.promise = null;
    throw e;
  }
}

export default dbConnect;
