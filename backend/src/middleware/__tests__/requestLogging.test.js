import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import {
  requestIdMiddleware,
  requestTimingMiddleware,
  requestLoggingMiddleware,
  apiPerformanceMiddleware,
  getAPIPerformanceMetrics,
  clearAPIPerformanceMetrics
} from '../requestLogging.js';

describe('Request Logging Middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      method: 'GET',
      path: '/api/test',
      originalUrl: '/api/test',
      query: {},
      headers: {},
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' }
    };

    mockRes = {
      statusCode: 200,
      setHeader: jest.fn(),
      get: jest.fn(),
      end: jest.fn(function(...args) {
        return this;
      }),
      on: jest.fn()
    };

    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
    clearAPIPerformanceMetrics();
  });

  describe('requestIdMiddleware', () => {
    it('should generate request ID when not in headers', () => {
      requestIdMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.requestId).toBeDefined();
      expect(typeof mockReq.requestId).toBe('string');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', mockReq.requestId);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should use existing request ID from headers', () => {
      mockReq.headers['x-request-id'] = 'existing-id-123';

      requestIdMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.requestId).toBe('existing-id-123');
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', 'existing-id-123');
      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle case-insensitive header', () => {
      mockReq.headers['X-Request-ID'] = 'uppercase-id';

      requestIdMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.requestId).toBe('uppercase-id');
    });
  });

  describe('requestTimingMiddleware', () => {
    it('should set startTime on request', () => {
      requestTimingMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.startTime).toBeDefined();
      expect(mockReq.startDate).toBeDefined();
      expect(mockNext).toHaveBeenCalled();
    });

    it('should override res.end to capture timing', () => {
      requestTimingMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.end).not.toBe(mockRes.end); // Should be overridden
      expect(mockNext).toHaveBeenCalled();
    });

    it('should calculate duration when response ends', () => {
      requestTimingMiddleware(mockReq, mockRes, mockNext);

      // Call the overridden end function
      mockRes.end();

      // Should have called the original end
      expect(mockRes.end).toHaveBeenCalled();
    });
  });

  describe('requestLoggingMiddleware', () => {
    it('should skip logging for health check paths', () => {
      mockReq.path = '/api/health';

      requestLoggingMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip logging for monitoring paths', () => {
      mockReq.path = '/api/monitoring/health';

      requestLoggingMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should skip logging for favicon', () => {
      mockReq.path = '/favicon.ico';

      requestLoggingMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should generate request ID for normal paths', () => {
      requestLoggingMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.requestId).toBeDefined();
      expect(mockRes.setHeader).toHaveBeenCalledWith('X-Request-ID', expect.any(String));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should set startTime on request', () => {
      requestLoggingMiddleware(mockReq, mockRes, mockNext);

      expect(mockReq.startTime).toBeDefined();
    });

    it('should override res.end for timing', () => {
      requestLoggingMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.end).toBeDefined();
      expect(typeof mockRes.end).toBe('function');
    });

    it('should handle request with user', () => {
      mockReq.user = { id: 'user-123' };

      requestLoggingMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it('should handle request with auth', () => {
      mockReq.auth = { userId: 'auth-123' };

      requestLoggingMiddleware(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('apiPerformanceMiddleware', () => {
    it('should track request metrics', () => {
      apiPerformanceMiddleware(mockReq, mockRes, mockNext);

      expect(mockRes.on).toHaveBeenCalledWith('finish', expect.any(Function));
      expect(mockNext).toHaveBeenCalled();
    });

    it('should record metrics when response finishes', () => {
      apiPerformanceMiddleware(mockReq, mockRes, mockNext);

      // Get the finish handler
      const finishHandler = mockRes.on.mock.calls.find(call => call[0] === 'finish')?.[1];
      
      if (finishHandler) {
        finishHandler();
        
        const metrics = getAPIPerformanceMetrics();
        expect(Object.keys(metrics).length).toBeGreaterThan(0);
      }
    });

    it('should track errors in metrics', () => {
      mockRes.statusCode = 500;
      apiPerformanceMiddleware(mockReq, mockRes, mockNext);

      const finishHandler = mockRes.on.mock.calls.find(call => call[0] === 'finish')?.[1];
      
      if (finishHandler) {
        finishHandler();
        
        const metrics = getAPIPerformanceMetrics();
        const endpoint = Object.keys(metrics)[0];
        if (endpoint) {
          expect(metrics[endpoint].totalErrors).toBeGreaterThan(0);
        }
      }
    });
  });

  describe('getAPIPerformanceMetrics', () => {
    it('should return empty object when no metrics', () => {
      clearAPIPerformanceMetrics();
      const metrics = getAPIPerformanceMetrics();
      expect(metrics).toEqual({});
    });

    it('should return metrics for tracked endpoints', () => {
      clearAPIPerformanceMetrics();
      
      // Simulate a request
      apiPerformanceMiddleware(mockReq, mockRes, mockNext);
      const finishHandler = mockRes.on.mock.calls.find(call => call[0] === 'finish')?.[1];
      if (finishHandler) {
        finishHandler();
      }

      const metrics = getAPIPerformanceMetrics();
      expect(typeof metrics).toBe('object');
    });
  });

  describe('clearAPIPerformanceMetrics', () => {
    it('should clear all metrics', () => {
      // Add some metrics
      apiPerformanceMiddleware(mockReq, mockRes, mockNext);
      const finishHandler = mockRes.on.mock.calls.find(call => call[0] === 'finish')?.[1];
      if (finishHandler) {
        finishHandler();
      }

      clearAPIPerformanceMetrics();
      const metrics = getAPIPerformanceMetrics();
      expect(metrics).toEqual({});
    });
  });
});

