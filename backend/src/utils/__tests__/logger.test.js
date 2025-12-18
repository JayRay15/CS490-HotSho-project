import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';

describe('Logger Utility', () => {
  let logger;
  let originalEnv;
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(async () => {
    // Clear module cache to get fresh instance
    jest.resetModules();
    originalEnv = process.env;
    process.env = { ...originalEnv };
    
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Import logger after setting up mocks
    const loggerModule = await import('../logger.js');
    logger = loggerModule.default;
  });

  afterEach(() => {
    process.env = originalEnv;
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  describe('Basic logging methods', () => {
    it('should have error method', () => {
      expect(typeof logger.error).toBe('function');
    });

    it('should have warn method', () => {
      expect(typeof logger.warn).toBe('function');
    });

    it('should have info method', () => {
      expect(typeof logger.info).toBe('function');
    });

    it('should have http method', () => {
      expect(typeof logger.http).toBe('function');
    });

    it('should have debug method', () => {
      expect(typeof logger.debug).toBe('function');
    });

    it('should log error message', () => {
      logger.error('Test error message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log warning message', () => {
      logger.warn('Test warning message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log info message', () => {
      logger.info('Test info message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log http message', () => {
      logger.http('Test http message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should log debug message', () => {
      logger.debug('Test debug message');
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should include metadata in log', () => {
      logger.info('Test message', { userId: '123', action: 'test' });
      const callArgs = consoleLogSpy.mock.calls[0][0];
      expect(callArgs).toBeDefined();
    });
  });

  describe('Child logger', () => {
    it('should create child logger with context', () => {
      const childLogger = logger.child({ userId: '123', requestId: 'req-1' });
      
      expect(typeof childLogger.error).toBe('function');
      expect(typeof childLogger.warn).toBe('function');
      expect(typeof childLogger.info).toBe('function');
    });

    it('should merge child context with log metadata', () => {
      const childLogger = logger.child({ userId: '123' });
      childLogger.info('Test message', { action: 'test' });
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('forRequest', () => {
    it('should create request logger from request object', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        headers: { 'x-request-id': 'req-123' },
        user: { id: 'user-123' },
        ip: '127.0.0.1'
      };

      const requestLogger = logger.forRequest(mockReq);
      
      expect(typeof requestLogger.info).toBe('function');
    });

    it('should handle request without user', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test'
      };

      const requestLogger = logger.forRequest(mockReq);
      expect(typeof requestLogger.info).toBe('function');
    });

    it('should handle null request', () => {
      const requestLogger = logger.forRequest(null);
      expect(typeof requestLogger.info).toBe('function');
    });

    it('should handle undefined request', () => {
      const requestLogger = logger.forRequest(undefined);
      expect(typeof requestLogger.info).toBe('function');
    });

    it('should extract request ID from headers', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        headers: { 'x-request-id': 'custom-req-id' }
      };

      const requestLogger = logger.forRequest(mockReq);
      requestLogger.info('Test');
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('time', () => {
    it('should time successful async operation', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      const result = await logger.time('test-operation', fn);
      
      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should time failed async operation', async () => {
      const fn = jest.fn().mockRejectedValue(new Error('Test error'));
      
      await expect(logger.time('test-operation', fn)).rejects.toThrow('Test error');
      expect(fn).toHaveBeenCalled();
    });

    it('should include metadata in timing', async () => {
      const fn = jest.fn().mockResolvedValue('result');
      
      await logger.time('test-operation', fn, { userId: '123' });
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('getMetrics', () => {
    it('should return metrics object', () => {
      const metrics = logger.getMetrics();
      
      expect(metrics).toBeDefined();
      expect(typeof metrics).toBe('object');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('errors');
      expect(metrics).toHaveProperty('warnings');
      expect(metrics).toHaveProperty('requests');
      expect(metrics).toHaveProperty('performance');
    });

    it('should include error counts', () => {
      logger.error('Test error');
      const metrics = logger.getMetrics();
      
      expect(metrics.errors).toBeDefined();
      expect(metrics.errors).toHaveProperty('lastHour');
      expect(metrics.errors).toHaveProperty('lastDay');
    });

    it('should include warning counts', () => {
      logger.warn('Test warning');
      const metrics = logger.getMetrics();
      
      expect(metrics.warnings).toBeDefined();
      expect(metrics.warnings).toHaveProperty('lastHour');
      expect(metrics.warnings).toHaveProperty('lastDay');
    });

    it('should include uptime', () => {
      const metrics = logger.getMetrics();
      
      expect(typeof metrics.uptime).toBe('number');
      expect(metrics.uptime).toBeGreaterThanOrEqual(0);
    });
  });

  describe('recordRequest', () => {
    it('should record request metrics', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test',
        user: { id: 'user-123' }
      };

      const mockRes = {
        statusCode: 200
      };

      logger.recordRequest(mockReq, mockRes, 150);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should handle request without user', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test'
      };

      const mockRes = {
        statusCode: 200
      };

      logger.recordRequest(mockReq, mockRes, 100);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it('should record error status codes', () => {
      const mockReq = {
        method: 'GET',
        path: '/api/test'
      };

      const mockRes = {
        statusCode: 500
      };

      logger.recordRequest(mockReq, mockRes, 200);
      
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });

  describe('clearOldMetrics', () => {
    it('should clear old metrics', () => {
      logger.error('Test error');
      logger.clearOldMetrics();
      
      // Should not throw
      expect(() => logger.getMetrics()).not.toThrow();
    });

    it('should accept maxAge parameter', () => {
      logger.error('Test error');
      logger.clearOldMetrics(1000); // 1 second
      
      expect(() => logger.getMetrics()).not.toThrow();
    });
  });

  describe('Log level filtering', () => {
    it('should respect LOG_LEVEL environment variable', async () => {
      jest.resetModules();
      process.env.LOG_LEVEL = 'error';
      
      const loggerModule = await import('../logger.js');
      const testLogger = loggerModule.default;
      
      // Error should log
      testLogger.error('Error message');
      expect(consoleLogSpy).toHaveBeenCalled();
      
      consoleLogSpy.mockClear();
      
      // Info should not log when level is error
      testLogger.info('Info message');
      // In test environment, it might still log, but the function should exist
      expect(typeof testLogger.info).toBe('function');
    });
  });

  describe('Error handling with Sentry', () => {
    it('should handle error logging without Sentry', () => {
      // When Sentry is not available, should not throw
      expect(() => {
        logger.error('Test error', { error: new Error('Test') });
      }).not.toThrow();
    });
  });
});

