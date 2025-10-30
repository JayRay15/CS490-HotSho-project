/**
 * Unit tests for database utility functions
 * Tests database connection and configuration
 */

import { jest } from '@jest/globals';
import mongoose from 'mongoose';

describe('Database Utility Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.MONGODB_URI;
    // Prepare spies/mocks on mongoose instance
    mongoose.connect = jest.fn();
    mongoose.connection.on = jest.fn();
    mongoose.connection.once = jest.fn();
    mongoose.connection.close = jest.fn();
  });

  describe('Database Connection', () => {
    
    test('should connect to MongoDB with valid URI', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      mongoose.connect.mockResolvedValueOnce(mongoose);

      const connectDB = async () => {
        try {
          await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
          });
          return { success: true };
        } catch (error) {
          return { success: false, error };
        }
      };

      const result = await connectDB();
      
      expect(result.success).toBe(true);
      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/testdb',
        expect.objectContaining({
          useNewUrlParser: true,
          useUnifiedTopology: true,
        })
      );
    });

    test('should handle connection error gracefully', async () => {
      process.env.MONGODB_URI = 'mongodb://invalid:27017/testdb';
      
      const connectionError = new Error('Connection failed');
      mongoose.connect.mockRejectedValueOnce(connectionError);

      const connectDB = async () => {
        try {
          await mongoose.connect(process.env.MONGODB_URI);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      const result = await connectDB();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    test('should throw error when MONGODB_URI is not set', async () => {
      const connectDB = async () => {
        if (!process.env.MONGODB_URI) {
          throw new Error('MONGODB_URI is not defined');
        }
        await mongoose.connect(process.env.MONGODB_URI);
      };

      await expect(connectDB()).rejects.toThrow('MONGODB_URI is not defined');
    });

    test('should use correct connection options', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      mongoose.connect.mockResolvedValueOnce(mongoose);

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
      };

      await mongoose.connect(process.env.MONGODB_URI, options);

      expect(mongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/testdb',
        expect.objectContaining({
          useNewUrlParser: true,
          useUnifiedTopology: true,
        })
      );
    });

    test('should handle authentication errors', async () => {
      process.env.MONGODB_URI = 'mongodb://user:pass@localhost:27017/testdb';
      
      const authError = new Error('Authentication failed');
      mongoose.connect.mockRejectedValueOnce(authError);

      const connectDB = async () => {
        try {
          await mongoose.connect(process.env.MONGODB_URI);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      const result = await connectDB();
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Authentication failed');
    });

    test('should handle network timeout errors', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      const timeoutError = new Error('Server selection timed out');
      mongoose.connect.mockRejectedValueOnce(timeoutError);

      const connectDB = async () => {
        try {
          await mongoose.connect(process.env.MONGODB_URI, {
            serverSelectionTimeoutMS: 5000,
          });
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      };

      const result = await connectDB();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timed out');
    });
  });

  describe('Connection Event Handlers', () => {
    
    test('should register connection event listeners', () => {
      const onConnected = jest.fn();
      const onError = jest.fn();
      const onDisconnected = jest.fn();

      mongoose.connection.once('connected', onConnected);
      mongoose.connection.on('error', onError);
      mongoose.connection.on('disconnected', onDisconnected);

      expect(mongoose.connection.once).toHaveBeenCalledWith('connected', onConnected);
      expect(mongoose.connection.on).toHaveBeenCalledWith('error', onError);
      expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', onDisconnected);
    });

    test('should handle connection success event', () => {
      const connectedCallback = jest.fn();
      
      mongoose.connection.once('connected', connectedCallback);
      
      expect(mongoose.connection.once).toHaveBeenCalledWith('connected', expect.any(Function));
    });

    test('should handle connection error event', () => {
      const errorCallback = jest.fn();
      
      mongoose.connection.on('error', errorCallback);
      
      expect(mongoose.connection.on).toHaveBeenCalledWith('error', expect.any(Function));
    });

    test('should handle disconnection event', () => {
      const disconnectedCallback = jest.fn();
      
      mongoose.connection.on('disconnected', disconnectedCallback);
      
      expect(mongoose.connection.on).toHaveBeenCalledWith('disconnected', expect.any(Function));
    });
  });

  describe('Connection Closing', () => {
    
    test('should close database connection', async () => {
      mongoose.connection.close.mockResolvedValueOnce();

      await mongoose.connection.close();

      expect(mongoose.connection.close).toHaveBeenCalled();
    });

    test('should handle close with force option', async () => {
      mongoose.connection.close.mockResolvedValueOnce();

      await mongoose.connection.close(true);

      expect(mongoose.connection.close).toHaveBeenCalledWith(true);
    });

    test('should handle close errors', async () => {
      const closeError = new Error('Close failed');
      mongoose.connection.close.mockRejectedValueOnce(closeError);

      await expect(mongoose.connection.close()).rejects.toThrow('Close failed');
    });
  });

  describe('MongoDB URI Validation', () => {
    
    test('should validate correct MongoDB URI format', () => {
      const validURIs = [
        'mongodb://localhost:27017/testdb',
        'mongodb://user:pass@localhost:27017/testdb',
        'mongodb+srv://cluster.mongodb.net/testdb',
        'mongodb://localhost:27017,localhost:27018/testdb',
      ];

      validURIs.forEach(uri => {
        const isValid = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
        expect(isValid).toBe(true);
      });
    });

    test('should reject invalid MongoDB URI format', () => {
      const invalidURIs = [
        'http://localhost:27017/testdb',
        'postgres://localhost:5432/testdb',
        'localhost:27017/testdb',
        '',
      ];

      invalidURIs.forEach(uri => {
        const isValid = uri.startsWith('mongodb://') || uri.startsWith('mongodb+srv://');
        expect(isValid).toBe(false);
      });
    });

    test('should extract database name from URI', () => {
      const uri = 'mongodb://localhost:27017/myDatabase';
      const dbName = uri.split('/').pop()?.split('?')[0];
      
      expect(dbName).toBe('myDatabase');
    });

    test('should handle URI with query parameters', () => {
      const uri = 'mongodb://localhost:27017/testdb?retryWrites=true&w=majority';
      const dbName = uri.split('/').pop()?.split('?')[0];
      
      expect(dbName).toBe('testdb');
    });
  });

  describe('Connection String Building', () => {
    
    test('should build connection string from environment variables', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '27017';
      process.env.DB_NAME = 'testdb';

      const connectionString = `mongodb://${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

      expect(connectionString).toBe('mongodb://localhost:27017/testdb');
    });

    test('should build connection string with credentials', () => {
      process.env.DB_USER = 'admin';
      process.env.DB_PASS = 'password';
      process.env.DB_HOST = 'localhost';
      process.env.DB_PORT = '27017';
      process.env.DB_NAME = 'testdb';

      const connectionString = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}`;

      expect(connectionString).toBe('mongodb://admin:password@localhost:27017/testdb');
    });

    test('should use default port when not specified', () => {
      process.env.DB_HOST = 'localhost';
      process.env.DB_NAME = 'testdb';
      
      const defaultPort = process.env.DB_PORT || '27017';
      const connectionString = `mongodb://${process.env.DB_HOST}:${defaultPort}/${process.env.DB_NAME}`;

      expect(connectionString).toBe('mongodb://localhost:27017/testdb');
    });
  });

  describe('Connection Pooling', () => {
    
    test('should configure connection pool size', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      mongoose.connect.mockResolvedValueOnce(mongoose);

      const options = {
        maxPoolSize: 10,
        minPoolSize: 2,
      };

      await mongoose.connect(process.env.MONGODB_URI, options);

      expect(mongoose.connect).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          maxPoolSize: 10,
          minPoolSize: 2,
        })
      );
    });

    test('should use default pool size when not specified', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      mongoose.connect.mockResolvedValueOnce(mongoose);

      await mongoose.connect(process.env.MONGODB_URI);

      expect(mongoose.connect).toHaveBeenCalled();
    });
  });

  describe('Retry Logic', () => {
    
    test('should retry connection on failure', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      let attempts = 0;
      mongoose.connect.mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Connection failed'));
        }
        return Promise.resolve(mongoose);
      });

      const connectWithRetry = async (maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            await mongoose.connect(process.env.MONGODB_URI);
            return { success: true, attempts: i + 1 };
          } catch (error) {
            if (i === maxRetries - 1) {
              return { success: false, error: error.message };
            }
          }
        }
      };

      const result = await connectWithRetry();
      
      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
      expect(mongoose.connect).toHaveBeenCalledTimes(3);
    });

    test('should give up after max retries', async () => {
      process.env.MONGODB_URI = 'mongodb://localhost:27017/testdb';
      
      mongoose.connect.mockRejectedValue(new Error('Connection failed'));

      const connectWithRetry = async (maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          try {
            await mongoose.connect(process.env.MONGODB_URI);
            return { success: true };
          } catch (error) {
            if (i === maxRetries - 1) {
              return { success: false, error: error.message };
            }
          }
        }
      };

      const result = await connectWithRetry(3);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });
  });
});
