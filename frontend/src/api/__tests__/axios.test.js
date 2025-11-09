import api, { setAuthToken, getErrorMessage, getValidationErrors, isErrorCode, retryRequest } from '../axios';

describe('api axios helpers', () => {
  test('setAuthToken sets and clears Authorization header', () => {
    setAuthToken('TOKEN');
    expect(api.defaults.headers.common['Authorization']).toBe('Bearer TOKEN');
    setAuthToken();
    expect(api.defaults.headers.common['Authorization']).toBeUndefined();
  });

  test('getErrorMessage prefers custom error message', () => {
    const err = { customError: { message: 'X' } };
    expect(getErrorMessage(err)).toBe('X');
    expect(getErrorMessage({ message: 'Y' })).toBe('Y');
  });

  test('getValidationErrors returns array or empty', () => {
    expect(getValidationErrors({ customError: { errors: [{ field: 'a' }] } })).toEqual([{ field: 'a' }]);
    expect(getValidationErrors({})).toEqual([]);
  });

  test('isErrorCode checks custom error code', () => {
    expect(isErrorCode({ customError: { errorCode: 100 } }, 100)).toBe(true);
    expect(isErrorCode({ customError: { errorCode: 101 } }, 100)).toBe(false);
  });

  test('retryRequest retries then succeeds', async () => {
    let count = 0;
    const fn = vi.fn(async () => {
      count += 1;
      if (count < 2) {
        const e = new Error('fail');
        // @ts-ignore
        e.customError = { canRetry: true };
        throw e;
      }
      return 'ok';
    });
    const res = await retryRequest(fn, 3);
    expect(res).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(2);
  }, 10000);

  test('retryRequest does not retry non-retryable', async () => {
    const fn = vi.fn(async () => {
      const e = new Error('fail');
      // @ts-ignore
      e.customError = { canRetry: false };
      throw e;
    });
    await expect(retryRequest(fn, 3)).rejects.toThrow('fail');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  test('response interceptor shapes server error and handles account deletion', async () => {
    // find the response rejected handler
    const respHandlers = api.interceptors.response.handlers;
    const rejected = respHandlers.find(h => !!h.rejected).rejected;

    // Simulate 403 deletion response
    const err403 = { response: { status: 403, data: { message: 'Account deletion detected', errorCode: 4001, errors: [{ field: 'email', message: 'bad' }] } } };
    // Clear sessionStorage first
    sessionStorage.removeItem('logoutMessage');

    await expect(rejected(err403)).rejects.toThrow();
    try {
      await rejected(err403);
    } catch (e) {
      expect(e.customError).toBeDefined();
      expect(e.customError.statusCode).toBe(403);
      expect(e.customError.isAccountDeleted).toBe(true);
      expect(sessionStorage.getItem('logoutMessage')).toBe('Account deletion detected');
      expect(e.customError.errorCode).toBe(4001);
      expect(Array.isArray(e.customError.errors)).toBe(true);
    }
  });

  test('response interceptor marks retryable for server errors and network errors', async () => {
    const respHandlers = api.interceptors.response.handlers;
    const rejected = respHandlers.find(h => !!h.rejected).rejected;

    // Simulate 500 server error -> canRetry true
    const err500 = { response: { status: 500, data: { message: 'Server boom' } } };
    await expect(rejected(err500)).rejects.toThrow();
    try { await rejected(err500); } catch (e) { expect(e.customError.canRetry).toBe(true); expect(e.customError.statusCode).toBe(500); }

    // Simulate network error (request made but no response)
    const errNet = { request: {} };
    await expect(rejected(errNet)).rejects.toThrow();
    try { await rejected(errNet); } catch (e) { expect(e.customError.isNetworkError).toBe(true); expect(e.customError.errorCode).toBe(6001); expect(e.customError.canRetry).toBe(true); }
  });

  test('request interceptor adds X-Request-Time header', () => {
    const reqHandlers = api.interceptors.request.handlers;
    const fulfilled = reqHandlers.find(h => !!h.fulfilled).fulfilled;

    const cfg = { headers: {} };
    const out = fulfilled(cfg);
    expect(out.headers['X-Request-Time']).toBeDefined();
  });
});


