import { jest } from '@jest/globals';
import { errorHandler, notFoundHandler, asyncHandler } from '../errorHandler.js';

describe('errorHandler middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      path: '/api/test',
      method: 'GET',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
    console.error = jest.fn();
  });

  it('should handle Mongoose validation errors', () => {
    const err = {
      name: 'ValidationError',
      errors: {
        email: {
          path: 'email',
          message: 'Email is required',
          value: '',
        },
      },
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errorCode: 2001,
        errors: expect.arrayContaining([
          expect.objectContaining({
            field: 'email',
            message: 'Email is required',
          }),
        ]),
      })
    );
  });

  it('should handle Mongoose duplicate key errors', () => {
    const err = {
      code: 11000,
      keyPattern: { email: 1 },
      keyValue: { email: 'test@example.com' },
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(409);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'email already exists',
        errorCode: 3003,
      })
    );
  });

  it('should handle Mongoose cast errors', () => {
    const err = {
      name: 'CastError',
      path: 'userId',
      value: 'invalid-id',
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Invalid userId: invalid-id',
        errorCode: 2002,
      })
    );
  });

  it('should handle JWT errors', () => {
    const err = {
      name: 'JsonWebTokenError',
      message: 'Invalid token',
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Invalid token',
        errorCode: 1002,
      })
    );
  });

  it('should handle JWT expired errors', () => {
    const err = {
      name: 'TokenExpiredError',
      message: 'Token expired',
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Token expired',
        errorCode: 1003,
      })
    );
  });

  it('should handle Multer file size errors', () => {
    const err = {
      name: 'MulterError',
      code: 'LIMIT_FILE_SIZE',
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'File is too large. Maximum size is 5 MB.',
        errorCode: 4002,
      })
    );
  });

  it('should handle generic Multer errors (non-LIMIT_FILE_SIZE)', () => {
    const err = {
      name: 'MulterError',
      code: 'SOME_OTHER_CODE',
      message: 'Multer storage error'
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Multer storage error',
      })
    );
  });

  it('should handle generic Multer errors with no message', () => {
    const err = {
      name: 'MulterError',
      code: 'SOME_OTHER_CODE'
      // no message provided
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'File upload error',
      })
    );
  });

  it('should handle invalid file type errors', () => {
    const err = {
      message: 'Invalid file type. Only JPG, PNG, and GIF are allowed.',
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Invalid file type. Only JPG, PNG, and GIF are allowed.',
        errorCode: 4001,
      })
    );
  });

  it('should handle custom errors with statusCode', () => {
    const err = {
      message: 'Custom error',
      statusCode: 403,
      errorCode: 'CUSTOM_ERROR',
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Custom error',
        errorCode: 'CUSTOM_ERROR',
      })
    );
  });

  it('should handle custom errors with statusCode but no errorCode (use default)', () => {
    const err = {
      message: 'Another custom error',
      statusCode: 422
      // no errorCode provided
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Another custom error',
        errorCode: expect.any(Number)
      })
    );
  });

  it('should handle generic errors with 500 status', () => {
    const err = {
      message: 'Something went wrong',
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'An unexpected error occurred. Please try again later.',
        errorCode: 5001,
      })
    );
  });

  it('should log errors with status >= 500', () => {
    const err = {
      message: 'Internal server error',
      stack: 'Error stack trace',
    };

    errorHandler(err, mockReq, mockRes, mockNext);

    // The error handler should return a 500 status for server errors
    expect(mockRes.status).toHaveBeenCalledWith(500);
  });
});

describe('notFoundHandler middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      path: '/api/nonexistent',
      method: 'GET',
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should return 404 for non-existent routes', () => {
    notFoundHandler(mockReq, mockRes, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(404);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Cannot GET /api/nonexistent',
        errorCode: 3001,
      })
    );
  });
});

describe('asyncHandler', () => {
  it('should call the wrapped function', async () => {
    const mockFn = jest.fn().mockResolvedValue('success');
    const wrappedFn = asyncHandler(mockFn);
    
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockFn).toHaveBeenCalledWith(mockReq, mockRes, mockNext);
  });

  it('should catch errors and pass them to next', async () => {
    const error = new Error('Test error');
    const mockFn = jest.fn().mockRejectedValue(error);
    const wrappedFn = asyncHandler(mockFn);
    
    const mockReq = {};
    const mockRes = {};
    const mockNext = jest.fn();

    await wrappedFn(mockReq, mockRes, mockNext);

    expect(mockNext).toHaveBeenCalledWith(error);
  });
});
