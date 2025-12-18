import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

/**
 * MongoDB Connection Configuration
 * Implements connection pooling and optimization for scalability
 */

// Connection pool configuration
const connectionOptions = {
  // Connection Pool Settings
  maxPoolSize: 10,           // Maximum number of connections in the pool
  minPoolSize: 2,            // Minimum connections to maintain
  maxIdleTimeMS: 30000,      // Close connections idle for 30 seconds
  
  // Connection Timeout Settings
  serverSelectionTimeoutMS: 5000,  // Timeout for server selection
  socketTimeoutMS: 45000,          // Socket timeout for operations
  connectTimeoutMS: 10000,         // Initial connection timeout
  
  // Performance Settings
  compressors: ['zlib'],           // Enable compression for large data transfers
  
  // Write Concern (ensure data durability)
  w: 'majority',                   // Write to majority of replica set
  wtimeoutMS: 5000,                // Write concern timeout
  
  // Read Preference (for replica sets)
  readPreference: 'primaryPreferred', // Read from primary, fallback to secondary
  
  // Retry Settings
  retryWrites: true,               // Automatically retry failed writes
  retryReads: true,                // Automatically retry failed reads
};

// Connection state tracking
let connectionState = {
  isConnected: false,
  connectionCount: 0,
  lastConnected: null,
  reconnectAttempts: 0
};

/**
 * Connect to MongoDB with connection pooling
 */
export const connectDB = async () => {
  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    console.log("   Pool Size: min=" + connectionOptions.minPoolSize + ", max=" + connectionOptions.maxPoolSize);
    
    const conn = await mongoose.connect(process.env.MONGO_URI, connectionOptions);
    
    connectionState.isConnected = true;
    connectionState.lastConnected = new Date();
    connectionState.reconnectAttempts = 0;
    
    console.log("✅ MongoDB connected successfully!");
    console.log(`   Host: ${conn.connection.host}`);
    console.log(`   Database: ${conn.connection.name}`);
    
    // Monitor connection events
    mongoose.connection.on('connected', () => {
      connectionState.connectionCount++;
      console.log('📊 MongoDB connection established');
    });
    
    mongoose.connection.on('disconnected', () => {
      connectionState.isConnected = false;
      console.log('⚠️ MongoDB disconnected');
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('❌ MongoDB connection error:', err.message);
    });
    
    mongoose.connection.on('reconnected', () => {
      connectionState.isConnected = true;
      connectionState.reconnectAttempts++;
      console.log('🔄 MongoDB reconnected');
    });
    
    // Return connection for reference
    return conn;
  } catch (err) {
    console.error("❌ MongoDB connection failed:", err.message);
    console.error("Full error:", err);
    process.exit(1);
  }
};

/**
 * Get current connection state and pool statistics
 */
export const getConnectionStats = () => {
  const mongoState = mongoose.connection.readyState;
  const stateNames = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };
  
  return {
    state: stateNames[mongoState] || 'unknown',
    isConnected: connectionState.isConnected,
    connectionCount: connectionState.connectionCount,
    lastConnected: connectionState.lastConnected,
    reconnectAttempts: connectionState.reconnectAttempts,
    poolSize: connectionOptions.maxPoolSize,
    minPoolSize: connectionOptions.minPoolSize
  };
};

/**
 * Gracefully close MongoDB connection
 */
export const closeDB = async () => {
  try {
    await mongoose.connection.close();
    connectionState.isConnected = false;
    console.log('MongoDB connection closed gracefully');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
    throw err;
  }
};

/**
 * Check if database is healthy
 */
export const healthCheck = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return { healthy: false, message: 'Not connected to database' };
    }
    
    // Ping the database
    await mongoose.connection.db.admin().ping();
    
    return {
      healthy: true,
      message: 'Database connection healthy',
      stats: getConnectionStats()
    };
  } catch (err) {
    return {
      healthy: false,
      message: err.message,
      stats: getConnectionStats()
    };
  }
};
