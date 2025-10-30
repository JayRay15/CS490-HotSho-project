import { jest } from '@jest/globals';

// Create a mock middleware function that will be returned by requireAuth()
const mockClerkMiddleware = jest.fn();

// Mock requireAuth to return our mock middleware
const mockRequireAuth = jest.fn(() => mockClerkMiddleware);

jest.unstable_mockModule('@clerk/express', () => ({
  requireAuth: mockRequireAuth,
}));

const { checkJwt } = await import('../../middleware/checkJwt.js');

describe('checkJwt middleware', () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    mockReq = {
      auth: {
        userId: 'test-user-id',
        payload: { sub: 'test-user-id' },
      },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  it('should call next if authentication is successful', async () => {
    // Mock Clerk middleware to call next() successfully
    mockClerkMiddleware.mockImplementation((req, res, next) => next());

    checkJwt(mockReq, mockRes, mockNext);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockNext).toHaveBeenCalled();
  });

  it('should return 401 if Clerk authentication fails', async () => {
    // Mock Clerk middleware to call next() with an error
    mockClerkMiddleware.mockImplementation((req, res, next) => next(new Error('Auth failed')));

    checkJwt(mockReq, mockRes, mockNext);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Unauthorized: Invalid or missing authentication token',
      })
    );
  });

  it('should return 401 if userId is missing', async () => {
    mockReq.auth = {};
    // Mock Clerk middleware to call next() successfully but userId missing
    mockClerkMiddleware.mockImplementation((req, res, next) => next());

    checkJwt(mockReq, mockRes, mockNext);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Unauthorized: Unable to identify user',
      })
    );
  });

  it('should accept userId from payload.sub', async () => {
    mockReq.auth = { payload: { sub: 'test-user-id' } };
    // Mock Clerk middleware to call next() successfully
    mockClerkMiddleware.mockImplementation((req, res, next) => next());

    checkJwt(mockReq, mockRes, mockNext);
    await new Promise(resolve => setImmediate(resolve));

    expect(mockNext).toHaveBeenCalled();
  });
});
