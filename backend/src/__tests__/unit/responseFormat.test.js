import { jest } from '@jest/globals';
import { ERROR_CODES, successResponse, errorResponse, validationErrorResponse, sendResponse } from '../../utils/responseFormat.js';

describe('responseFormat utilities', () => {
  test('successResponse returns standardized object with status', () => {
    const { response, statusCode } = successResponse('OK', { a: 1 }, 201);
    expect(statusCode).toBe(201);
    expect(response.success).toBe(true);
    expect(response.message).toBe('OK');
    expect(response.data).toEqual({ a: 1 });
    expect(response.timestamp).toBeDefined();
  });

  test('errorResponse returns standardized error with code', () => {
    const { response, statusCode } = errorResponse('Bad', 400, ERROR_CODES.INVALID_INPUT);
    expect(statusCode).toBe(400);
    expect(response.success).toBe(false);
    expect(response.message).toBe('Bad');
    expect(response.errorCode).toBe(ERROR_CODES.INVALID_INPUT);
  });

  test('validationErrorResponse maps errors to expected format', () => {
    const validationErrors = [
      { field: 'email', message: 'Invalid', value: 'x' },
      { path: 'name', message: 'Required', value: '' },
    ];
    const { response, statusCode } = validationErrorResponse('Validation failed', validationErrors);
    expect(statusCode).toBe(400);
    expect(response.success).toBe(false);
    expect(response.errorCode).toBe(ERROR_CODES.VALIDATION_ERROR);
    expect(response.errors).toHaveLength(2);
    expect(response.errors[0].field).toBe('email');
    expect(response.errors[1].field).toBe('name');
  });

  test('sendResponse writes status and json', () => {
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
    const { response, statusCode } = successResponse('OK');
    sendResponse(res, response, statusCode);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true, message: 'OK' }));
  });
});


