/**
 * Repro for RetryService.run: when the handler throws, the promise returned by
 * run() resolves instead of rejecting. The job status in the DB is correct
 * ("failed"), but the caller has no way to know the job failed.
 *
 * Run: npx ts-node repro-retry-service.ts
 * Or use "Debug: Script" to step through.
 */
import { InMemoryDatabase } from './src/db/db';
import { RetryService } from './src/services/retryService';
import type { Job } from './src/types';

function makeJob(overrides: Partial<Job> = {}): Job {
  const now = new Date();
  return {
    id: 'repro-job-1',
    type: 'email',
    status: 'pending',
    priority: 5,
    payload: {},
    attempts: 0,
    maxAttempts: 3,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

async function main(): Promise<void> {
  const db = new InMemoryDatabase();
  const job = makeJob();
  await db.insertJob(job);

  const handlerThatThrows = async (_job: Job): Promise<Record<string, unknown>> => {
    throw new Error('handler failed on purpose');
  };

  const retryService = new RetryService(db, handlerThatThrows);

  console.log('Calling RetryService.run(job) with a handler that throws...\n');

  let promiseResolved = false;
  let promiseRejected = false;
  let rejectionValue: unknown;

  await retryService
    .run(job)
    .then(() => {
      promiseResolved = true;
      console.log('(then) Promise RESOLVED — caller sees success.');
    })
    .catch((err: unknown) => {
      promiseRejected = true;
      rejectionValue = err;
      console.log('(catch) Promise REJECTED — caller sees failure:', err instanceof Error ? err.message : err);
    });

  console.log('\n--- Result ---');
  console.log('Promise resolved?', promiseResolved);
  console.log('Promise rejected?', promiseRejected);
  if (promiseRejected && rejectionValue !== undefined) {
    console.log('Rejection value:', rejectionValue);
  }

  const updated = await db.findJobById(job.id);
  console.log('\nJob in DB after run():');
  console.log('  status:', updated?.status);
  console.log('  error:', updated?.error ?? '(none)');

  if (promiseResolved && updated?.status === 'failed') {
    console.log('\n>>> BUG: Promise resolved but job is failed in DB. Caller cannot know the job failed.');
  }
}

main();
