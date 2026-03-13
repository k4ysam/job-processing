import { RetryOptions } from '../types';
/**
 * Retry an async function with exponential backoff.
 *
 * @param fn          - Function to attempt
 * @param opts.maxRetries     - Number of retry attempts after the initial call (total = maxRetries + 1)
 * @param opts.delayMs        - Base delay in milliseconds between retries
 * @param opts.backoffFactor  - Multiplier applied to delay on each subsequent retry
 */
export declare function withRetry<T>(fn: () => Promise<T>, opts: RetryOptions): Promise<T>;
