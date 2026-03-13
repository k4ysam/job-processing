import { withRetry } from '../src/utils/retry';
import { RetryOptions } from '../src/types';

function makeOpts(overrides: Partial<RetryOptions> = {}): RetryOptions {
  return { maxRetries: 3, delayMs: 0, backoffFactor: 1, ...overrides };
}

describe('withRetry', () => {
  it('returns the result on the first successful call', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn, makeOpts());
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries until success', async () => {
    let calls = 0;
    const fn = jest.fn(async () => {
      calls++;
      if (calls < 3) throw new Error('not yet');
      return 'done';
    });

    const result = await withRetry(fn, makeOpts({ maxRetries: 3 }));
    expect(result).toBe('done');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('exhausts all retries and throws the last error', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));
    console.log('About to call withRetry with maxRetries=3');

    await expect(withRetry(fn, makeOpts({ maxRetries: 3 }))).rejects.toThrow('always fails');
    console.log('Expectation resolved');
    console.log('fn call count after withRetry:', fn.mock.calls.length);

    expect(fn).toHaveBeenCalledTimes(4);
  });

  it('respects maxRetries = 1 (one attempt, no retries)', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('boom'));

    await expect(withRetry(fn, makeOpts({ maxRetries: 1 }))).rejects.toThrow('boom');

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('does not retry on immediate success', async () => {
    const fn = jest.fn().mockResolvedValue(42);
    await withRetry(fn, makeOpts({ maxRetries: 5 }));
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('propagates the error from the last attempt, not an earlier one', async () => {
    let call = 0;
    const fn = jest.fn(async () => {
      call++;
      throw new Error(`error-${call}`);
    });

    await expect(withRetry(fn, makeOpts({ maxRetries: 3 }))).rejects.toThrow('error-3');
  });
});
