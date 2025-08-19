import { MongoClient } from 'mongodb'

// รองรับทั้ง MONGODB_URI / MONGODB_DB และ MONGO_URI / MONGO_DB
const uri = process.env.MONGODB_URI || process.env.MONGO_URI || ''
const dbName = process.env.MONGODB_DB || process.env.MONGO_DB || undefined

if (!uri) {
  // ไม่โยน error เพื่อไม่ให้ dev server แตก แต่แจ้งเตือนใน log
  // ตั้งค่า MONGODB_URI หรือ MONGO_URI ใน .env.local
  console.warn('MongoDB URI not set (MONGODB_URI or MONGO_URI). Database calls will fail.')
}

declare global {
  // allow global caching across module reloads in development
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined
}

let clientPromise: Promise<MongoClient>

if (!global.__mongoClientPromise) {
  const client = new MongoClient(uri, {
    // เพิ่ม options ถ้าต้องการ
    // useNewUrlParser: true, useUnifiedTopology: true  // not needed with modern driver types
  })
  global.__mongoClientPromise = client.connect()
}

clientPromise = global.__mongoClientPromise!

export async function getDb() {
  const client = await clientPromise
  return dbName ? client.db(dbName) : client.db()
}
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  global.mongoose = cached;
  return cached.conn;
}

export async function disconnectFromDatabase() {
  if (cached.conn) {
    await mongoose.disconnect();
    cached.conn = null;
    cached.promise = null;
    global.mongoose = undefined;
    console.log('🔌 Disconnected from MongoDB Atlas');
  }
}
