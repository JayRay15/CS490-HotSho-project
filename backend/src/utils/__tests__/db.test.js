import { jest } from '@jest/globals';

const mockConnect = jest.fn();

jest.unstable_mockModule('mongoose', () => ({
  default: {
    connect: mockConnect,
  },
}));

const { connectDB } = await import('../../utils/db.js');
const mockMongoose = { connect: mockConnect };

describe('db utility', () => {
  let originalEnv;
  let consoleLogSpy;
  let consoleErrorSpy;
  let processExitSpy;

  beforeEach(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, MONGO_URI: 'mongodb://localhost:27017/test' };
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    processExitSpy = jest.spyOn(process, 'exit').mockImplementation();
    jest.clearAllMocks();
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe('connectDB', () => {
    it('should connect to MongoDB successfully', async () => {
      mockMongoose.connect.mockResolvedValue();

      await connectDB();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        'mongodb://localhost:27017/test',
        expect.objectContaining({
          serverSelectionTimeoutMS: 5000,
          minPoolSize: 2,
          maxPoolSize: 10,
          maxIdleTimeMS: 30000,
        })
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('Attempting to connect')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('connected successfully')
      );
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockMongoose.connect.mockRejectedValue(error);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('connection failed'),
        'Connection failed'
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it('should use correct timeout configuration', async () => {
      mockMongoose.connect.mockResolvedValue();

      await connectDB();

      expect(mockMongoose.connect).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          serverSelectionTimeoutMS: 5000,
        })
      );
    });

    it('should log full error details on failure', async () => {
      const error = new Error('Detailed error');
      error.stack = 'Error stack trace';
      mockMongoose.connect.mockRejectedValue(error);

      await connectDB();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Full error:', error);
    });
  });
});
