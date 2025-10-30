import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

let mongoServer;
let isDbReady = false;

// Setup before all tests
beforeAll(async () => {
  // Create in-memory MongoDB instance (bind to localhost to avoid EACCES on 0.0.0.0)
  try {
    process.env.MONGOMS_DISABLE_PORT_CHECK = process.env.MONGOMS_DISABLE_PORT_CHECK || '1';
    process.env.MONGOMS_IP = process.env.MONGOMS_IP || '127.0.0.1';
    mongoServer = await MongoMemoryServer.create({ instance: { ip: '127.0.0.1' } });
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    isDbReady = true;
    console.log('🧪 Test database connected');
  } catch (err) {
    console.warn('⚠️  In-memory Mongo failed:', err?.message || err);
    // Fallback: use real MongoDB if provided
    if (process.env.MONGODB_URI) {
      try {
        await mongoose.connect(process.env.MONGODB_URI);
        isDbReady = true;
        console.log('🧪 Connected to real MongoDB via MONGODB_URI');
      } catch (e) {
        console.warn('⚠️  Real MongoDB connection failed:', e?.message || e);
      }
    } else {
      console.warn('⚠️  No MONGODB_URI provided; DB-dependent tests may be skipped or fail.');
    }
  }
});

// Cleanup after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  
  if (isDbReady) {
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }
});

// Cleanup after all tests
afterAll(async () => {
  if (isDbReady) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
  
  console.log('🧪 Test database disconnected');
});
