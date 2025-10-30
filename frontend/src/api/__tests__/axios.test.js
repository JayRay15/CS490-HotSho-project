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
});


