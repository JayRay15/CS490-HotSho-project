import { describe, it, expect, vi, beforeEach } from 'vitest';

// Import the actual axios module under test (bypass any global mock from setup)
let apiModule;
let api;

beforeEach(async () => {
  vi.resetModules();
  apiModule = await vi.importActual('../../api/axios.js');
  api = apiModule.default;
  // Clear auth header if set by previous tests
  if (api.defaults?.headers?.common) {
    delete api.defaults.headers.common['Authorization'];
  }
});

describe('api/axios utilities', () => {
  it('setAuthToken should set Authorization header when token provided', () => {
    apiModule.setAuthToken('abc123');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer abc123');
  });

  it('setAuthToken should remove Authorization header when token is falsy', () => {
    apiModule.setAuthToken('abc123');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer abc123');
    apiModule.setAuthToken(null);
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });

  it('retryRequest should retry on retryable errors and eventually succeed', async () => {
    const err = new Error('temp');
    err.customError = { canRetry: true };

    const callOrder = [];
    const fn = vi.fn()
      .mockImplementationOnce(() => {
        callOrder.push('fail1');
        return Promise.reject(err);
      })
      .mockImplementationOnce(() => {
        callOrder.push('fail2');
        return Promise.reject(err);
      })
      .mockImplementationOnce(() => {
        callOrder.push('success');
        return Promise.resolve('ok');
      });

    // Speed up backoff waits
    vi.useFakeTimers();
    const p = apiModule.retryRequest(fn, 3);
    // Advance timers for 1s + 2s backoffs
    await vi.advanceTimersByTimeAsync(3000);
    const result = await p;
    vi.useRealTimers();

    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(callOrder).toEqual(['fail1', 'fail2', 'success']);
  });

  it('retryRequest should stop when error is not retryable', async () => {
    const err = new Error('bad');
    err.customError = { canRetry: false };
    const fn = vi.fn().mockRejectedValue(err);

    await expect(apiModule.retryRequest(fn, 3)).rejects.toBe(err);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('getErrorMessage returns customError message when present', () => {
    const err = { customError: { message: 'Nice error' } };
    expect(apiModule.getErrorMessage(err)).toBe('Nice error');
  });

  it('getValidationErrors returns errors array from customError', () => {
    const err = { customError: { errors: [{ field: 'name', message: 'Required' }] } };
    expect(apiModule.getValidationErrors(err)).toEqual([{ field: 'name', message: 'Required' }]);
  });

  it('isErrorCode compares errorCode correctly', () => {
    const err = { customError: { errorCode: 3001 } };
    expect(apiModule.isErrorCode(err, 3001)).toBe(true);
    expect(apiModule.isErrorCode(err, 4000)).toBe(false);
  });
});


