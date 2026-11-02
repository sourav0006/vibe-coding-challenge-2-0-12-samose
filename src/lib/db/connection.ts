import mongoose from "mongoose";

/**
 * MongoDB connection cache interface for Next.js hot-reloading
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongooseConnectionCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseConnectionCache ?? {
  conn: null,
  promise: null,
};

if (!globalThis.mongooseConnectionCache) {
  globalThis.mongooseConnectionCache = cached;
}

/**
 * Connects to MongoDB Atlas using Mongoose with connection pooling and Next.js hot-reload caching.
 * Guaranteed to execute only in the Node.js runtime.
 */
export async function connectToDatabase(): Promise<typeof mongoose> {
  if (typeof window !== "undefined") {
    throw new Error("connectToDatabase must only be called in a server-side Node.js environment");
  }

  const uri = process.env.MONGODB_URI;

  if (!uri || !uri.trim()) {
    throw new Error(
      "Server Configuration Error: Missing MONGODB_URI environment variable. Please configure it in .env.local"
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose
      .connect(uri, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      })
      .catch((error) => {
        cached.promise = null;
        // Never log connection strings or credentials
        const safeMessage = error instanceof Error ? error.message : "Unknown database connection error";
        console.error("Database connection failure:", safeMessage);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Returns the current database connection state.
 */
export function getDatabaseConnectionState(): "connected" | "connecting" | "disconnecting" | "disconnected" {
  const readyState = mongoose.connection.readyState;

  switch (readyState) {
    case 1:
      return "connected";
    case 2:
      return "connecting";
    case 3:
      return "disconnecting";
    default:
      return "disconnected";
  }
}
