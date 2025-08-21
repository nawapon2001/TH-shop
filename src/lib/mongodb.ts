import mongoose from 'mongoose'
import { MongoClient } from 'mongodb'

// Read from either MONGO_URI or MONGODB_URI for compatibility
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || ''

let mongoosePromise: Promise<typeof mongoose> | null = null
let clientPromise: Promise<MongoClient> | null = null

/**
 * Ensure mongoose is connected. Many models in this repo use mongoose.
 * Safe no-op if MONGO_URI is not provided (so local dev without DB won't crash).
 */
export async function connectToDatabase(): Promise<void> {
  if (!MONGO_URI) {
    // eslint-disable-next-line no-console
    console.warn('connectToDatabase called but MONGO_URI is not set. Set MONGO_URI in .env.local to connect to MongoDB Atlas.')
    return
  }

  if (mongoose.connection && mongoose.connection.readyState === 1) return
  if (!mongoosePromise) {
    // keep default options minimal — adjust as needed for your Atlas cluster
    mongoosePromise = mongoose.connect(MONGO_URI, {
      // use the project's tsconfig / node version defaults; keep options minimal here
      // autoIndex: false, // enable in development only if you want
    })
  }
  await mongoosePromise
}

// Provide a MongoClient promise for code that imports the default export (clientPromise)
if (MONGO_URI) {
  if (!clientPromise) {
    const client = new MongoClient(MONGO_URI)
    clientPromise = client.connect()
  }
} else {
  // fallback to a resolved empty object to keep imports safe when no URI is set
  clientPromise = Promise.resolve({} as any)
}

export default clientPromise
