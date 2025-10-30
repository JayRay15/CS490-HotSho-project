import { jest } from '@jest/globals';
import {
  ERROR_CODES,
  createResponse,
  successResponse,
  errorResponse,
  validationErrorResponse,
  sendResponse,
} from '../responseFormat.js';

describe('responseFormat utility', () => {
  describe('ERROR_CODES', () => {
    it('should define authentication error codes', () => {
      expect(ERROR_CODES.UNAUTHORIZED).toBe(1001);
      expect(ERROR_CODES.INVALID_TOKEN).toBe(1002);
      expect(ERROR_CODES.TOKEN_EXPIRED).toBe(1003);
      expect(ERROR_CODES.FORBIDDEN).toBe(1004);
    });

    it('should define validation error codes', () => {
      expect(ERROR_CODES.VALIDATION_ERROR).toBe(2001);
      expect(ERROR_CODES.INVALID_INPUT).toBe(2002);
      expect(ERROR_CODES.MISSING_REQUIRED_FIELD).toBe(2003);
      expect(ERROR_CODES.INVALID_FORMAT).toBe(2004);
    });

    it('should define resource error codes', () => {
      expect(ERROR_CODES.NOT_FOUND).toBe(3001);
      expect(ERROR_CODES.ALREADY_EXISTS).toBe(3002);
      expect(ERROR_CODES.DUPLICATE_ENTRY).toBe(3003);
    });

    it('should define server error codes', () => {
      expect(ERROR_CODES.INTERNAL_ERROR).toBe(5001);
      expect(ERROR_CODES.DATABASE_ERROR).toBe(5002);
      expect(ERROR_CODES.EXTERNAL_SERVICE_ERROR).toBe(5003);
    });

    it('should define file upload error codes', () => {
      expect(ERROR_CODES.INVALID_FILE_TYPE).toBe(4001);
      expect(ERROR_CODES.FILE_TOO_LARGE).toBe(4002);
      expect(ERROR_CODES.UPLOAD_FAILED).toBe(4003);
      expect(ERROR_CODES.NO_FILE_PROVIDED).toBe(4004);
    });

    it('should define network error codes', () => {
      expect(ERROR_CODES.NETWORK_ERROR).toBe(6001);
      expect(ERROR_CODES.TIMEOUT).toBe(6002);
    });
  });

  describe('createResponse', () => {
    it('should create a basic response', () => {
      const { response, statusCode } = createResponse(true, 'Success', null, 200);

      expect(response).toEqual({
        success: true,
        message: 'Success',
        timestamp: expect.any(String),
      });
      expect(statusCode).toBe(200);
    });

    it('should include data if provided', () => {
      const data = { id: 1, name: 'Test' };
      const { response, statusCode } = createResponse(true, 'Success', data, 200);

      expect(response).toEqual({
        success: true,
        message: 'Success',
        timestamp: expect.any(String),
        data,
      });
      expect(statusCode).toBe(200);
    });

    it('should include errorCode if provided', () => {
      const { response, statusCode } = createResponse(
        false,
        'Error',
        null,
        400,
        ERROR_CODES.VALIDATION_ERROR
      );

      expect(response).toEqual({
        success: false,
        message: 'Error',
        timestamp: expect.any(String),
        errorCode: ERROR_CODES.VALIDATION_ERROR,
      });
      expect(statusCode).toBe(400);
    });

    it('should include errors if provided', () => {
      const errors = [{ field: 'email', message: 'Invalid email' }];
      const { response, statusCode } = createResponse(
        false,
        'Validation failed',
        null,
        400,
        ERROR_CODES.VALIDATION_ERROR,
        errors
      );

      expect(response).toEqual({
        success: false,
        message: 'Validation failed',
        timestamp: expect.any(String),
        errorCode: ERROR_CODES.VALIDATION_ERROR,
        errors,
      });
      expect(statusCode).toBe(400);
    });

    it('should generate valid ISO timestamp', () => {
      const { response } = createResponse(true, 'Success', null, 200);

      expect(response.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      );
      expect(() => new Date(response.timestamp)).not.toThrow();
    });
  });

  describe('successResponse', () => {
    it('should create success response with default status code', () => {
      const { response, statusCode } = successResponse('Operation successful');

      expect(response.success).toBe(true);
      expect(response.message).toBe('Operation successful');
      expect(statusCode).toBe(200);
    });

    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const { response, statusCode } = successResponse('Success', data);

      expect(response.success).toBe(true);
      expect(response.data).toEqual(data);
      expect(statusCode).toBe(200);
    });

    it('should create success response with custom status code', () => {
      const { response, statusCode } = successResponse('Resource created', null, 201);

      expect(response.success).toBe(true);
      expect(statusCode).toBe(201);
    });

    it('should not include errorCode or errors', () => {
      const { response } = successResponse('Success');

      expect(response.errorCode).toBeUndefined();
      expect(response.errors).toBeUndefined();
    });
  });

  describe('errorResponse', () => {
    it('should create error response with default status code', () => {
      const { response, statusCode } = errorResponse('Operation failed');

      expect(response.success).toBe(false);
      expect(response.message).toBe('Operation failed');
      expect(statusCode).toBe(400);
    });

    it('should create error response with custom status code', () => {
      const { response, statusCode } = errorResponse('Not found', 404);

      expect(response.success).toBe(false);
      expect(statusCode).toBe(404);
    });

    it('should include errorCode if provided', () => {
      const { response } = errorResponse('Unauthorized', 401, ERROR_CODES.UNAUTHORIZED);

      expect(response.errorCode).toBe(ERROR_CODES.UNAUTHORIZED);
    });

    it('should include errors array if provided', () => {
      const errors = [{ field: 'email', message: 'Invalid' }];
      const { response } = errorResponse('Validation failed', 400, null, errors);

      expect(response.errors).toEqual(errors);
    });

    it('should not include data field', () => {
      const { response } = errorResponse('Error');

      expect(response.data).toBeUndefined();
    });
  });

  describe('validationErrorResponse', () => {
    it('should create validation error response', () => {
      const validationErrors = [
        { field: 'email', message: 'Email is required', value: null },
        { field: 'password', message: 'Password is too short', value: 'abc' },
      ];

      const { response, statusCode } = validationErrorResponse(
        'Validation failed',
        validationErrors
      );

      expect(response.success).toBe(false);
      expect(response.message).toBe('Validation failed');
      expect(response.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
      expect(response.errors).toEqual(validationErrors);
      expect(statusCode).toBe(400);
    });

    it('should map path to field if field is not provided', () => {
      const validationErrors = [
        { path: 'email', message: 'Email is required', value: null },
      ];

      const { response } = validationErrorResponse('Validation failed', validationErrors);

      expect(response.errors[0].field).toBe('email');
    });

    it('should prefer field over path', () => {
      const validationErrors = [
        { field: 'email', path: 'user.email', message: 'Invalid', value: null },
      ];

      const { response } = validationErrorResponse('Validation failed', validationErrors);

      expect(response.errors[0].field).toBe('email');
    });
  });

  describe('sendResponse', () => {
    it('should send response with correct status code', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const response = { success: true, message: 'Success' };
      sendResponse(mockRes, response, 200);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(response);
    });

    it('should chain status and json methods', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };

      const response = { success: false, message: 'Error' };
      sendResponse(mockRes, response, 404);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(response);
      expect(mockRes.status().json).toBe(mockRes.json);
    });

    it('should return the result of res.json', () => {
      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnValue('result'),
      };

      const response = { success: true };
      const result = sendResponse(mockRes, response, 200);

      expect(result).toBe('result');
    });
  });

  describe('Response consistency', () => {
    it('should always include required fields', () => {
      const { response: successResp } = successResponse('Success');
      const { response: errorResp } = errorResponse('Error');

      expect(successResp).toHaveProperty('success');
      expect(successResp).toHaveProperty('message');
      expect(successResp).toHaveProperty('timestamp');

      expect(errorResp).toHaveProperty('success');
      expect(errorResp).toHaveProperty('message');
      expect(errorResp).toHaveProperty('timestamp');
    });

    it('should have consistent timestamp format across response types', () => {
      const { response: success } = successResponse('Success');
      const { response: error } = errorResponse('Error');
      const { response: validation } = validationErrorResponse('Validation', []);

      const timestampPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
      expect(success.timestamp).toMatch(timestampPattern);
      expect(error.timestamp).toMatch(timestampPattern);
      expect(validation.timestamp).toMatch(timestampPattern);
    });
  });
});
