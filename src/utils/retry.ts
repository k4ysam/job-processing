import { RetryOptions } from '../types';
import { logger } from './logger';

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff.
 *
 * @param fn          - Function to attempt
 * @param opts.maxRetries     - Number of retry attempts after the initial call (total = maxRetries + 1)
 * @param opts.delayMs        - Base delay in milliseconds between retries
 * @param opts.backoffFactor  - Multiplier applied to delay on each subsequent retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  opts: RetryOptions
): Promise<T> {
  const { maxRetries, delayMs, backoffFactor } = opts;
  let lastErr: Error = new Error('No attempts made');

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err instanceof Error ? err : new Error(String(err));
      logger.debug(`Attempt ${attempt + 1} failed: ${lastErr.message}`);

      if (attempt < maxRetries - 1) {
        const delay = delayMs * Math.pow(backoffFactor, attempt);
        logger.debug(`Retrying in ${delay}ms...`);
        await sleep(delay);
      }
    }
  }

  throw lastErr;
}
