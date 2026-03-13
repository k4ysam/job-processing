# Answers

> **Stop here if you have not attempted the challenges yet.**
> This file contains root causes, explanations, and fixes for all 15 bugs.

---

## Challenge 1 — The first job type is always rejected

**File:** `src/utils/validator.ts`

**Root cause:**
```ts
// Buggy
return VALID_JOB_TYPES.indexOf(type as JobType) > 0;

// Fixed
return VALID_JOB_TYPES.indexOf(type as JobType) >= 0;
```
`Array.prototype.indexOf` returns `0` when the element is the first item in the
array. `0 > 0` is `false`, so `'email'` (index 0) is always rejected.

**Category:** Off-by-one in input validation
**Difficulty:** Easy

---

## Challenge 2 — Retry count looks right in logs, but jobs give up too early

**File:** `src/utils/retry.ts`

**Root cause:**
The loop condition is `attempt < maxRetries` starting from `attempt = 0`.
With `maxRetries = 3` this runs for `attempt = 0, 1, 2` — only **3 total
attempts**. The docstring says `total = maxRetries + 1` (one initial call plus
`maxRetries` retries), so there should be **4 total attempts**.

```ts
// Buggy
for (let attempt = 0; attempt < opts.maxRetries; attempt++) {

// Fixed
for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
```

**Category:** Off-by-one in retry loop
**Difficulty:** Easy

---

## Challenge 3 — Getting a job's result crashes for non-completed jobs

**File:** `src/api/routes/jobs.ts`

**Root cause:**
```ts
// Buggy
result: job.output!.data,

// Fixed — guard the optional field
result: job.output?.data ?? null,
```
`job.output` is `undefined` for jobs that are `pending`, `running`, `failed`, or
`cancelled`. The non-null assertion `!` suppresses TypeScript's warning but
causes `TypeError: Cannot read properties of undefined (reading 'data')` at
runtime.

**Category:** Null / undefined edge case
**Difficulty:** Easy

---

## Challenge 4 — Page 1 of the job list skips the newest jobs

**File:** `src/services/jobService.ts`

**Root cause:**
```ts
// Buggy (treats page as 0-indexed)
const offset = page * limit;

// Fixed (API is 1-indexed)
const offset = (page - 1) * limit;
```
With `page = 1` and `limit = 5`, the offset becomes `5`, skipping the first 5
results. Callers sending `page=1` (the natural first page) always receive the
second "window" of data.

**Category:** Off-by-one in pagination
**Difficulty:** Easy

---

## Challenge 5 — A job appears created, but vanishes when fetched immediately after

**File:** `src/services/jobService.ts`

**Root cause:**
```ts
// Buggy — missing await
this.db.insertJob(job);
return job;

// Fixed
await this.db.insertJob(job);
return job;
```
`db.insertJob` is async (it yields the event loop via `setImmediate` before
writing). Without `await`, the function returns before the write completes.
A subsequent `db.findJobById` call that also yields via `setImmediate` may
run before the insert callback, returning `null`.

**Category:** Missing await
**Difficulty:** Medium

---

## Challenge 6 — Status looks stale after a status update

**File:** `src/services/jobService.ts`

**Root cause:**
`updateJobStatus` updates the database but does not invalidate the in-memory
cache. The next call to `getJob` finds the stale cached entry (TTL is 30 s)
and returns it instead of querying the database.

```ts
// Fixed — add cache invalidation after the update
async updateJobStatus(id: string, status: JobStatus, extra: Partial<Job> = {}): Promise<Job> {
  const updated = await this.db.updateJob(id, { status, ...extra });
  if (!updated) throw new NotFoundError(id);
  this.cache.delete(id);          // ← add this line
  logger.info(`Job ${id} status → ${status}`);
  return updated;
}
```

**Category:** Stale cache / missing invalidation
**Difficulty:** Medium

---

## Challenge 7 — A failing notification channel silently drops the others

**File:** `src/services/notificationService.ts`, method `notifyJobEvent`

**Root cause:**
```ts
// Buggy
await Promise.all(active.map(ch => this.sendToChannel(ch, payload)));

// Fixed
await Promise.allSettled(active.map(ch => this.sendToChannel(ch, payload)));
```
`Promise.all` short-circuits on the first rejection. When one channel's
`sendToChannel` rejects, the returned promise rejects immediately and the
remaining channels never receive the notification. `Promise.allSettled` waits
for every promise regardless of individual outcomes.

Note: `dispatch` already has the correct `.catch()` handling per channel —
only `notifyJobEvent` has this bug.

**Category:** Promise.all misuse
**Difficulty:** Medium

---

## Challenge 8 — Failed jobs report as successful to the caller

**File:** `src/services/retryService.ts`, method `run`

**Root cause:**
```ts
// Buggy — error is caught and logged but not re-thrown
async run(job: Job): Promise<void> {
  try {
    await this.execute(job);
  } catch (err) {
    logger.error(`RetryService: job ${job.id} encountered an error`, err);
    // error swallowed here — run() resolves normally
  }
}

// Fixed — re-throw after logging
  } catch (err) {
    logger.error(`RetryService: job ${job.id} encountered an error`, err);
    throw err;
  }
```

**Category:** Swallowed error
**Difficulty:** Medium

---

## Challenge 9 — Cancelled jobs crash the route handler

**File:** `src/api/routes/jobs.ts`, function `describeJobStatus`

**Root cause:**
```ts
// Buggy — 'cancelled' is missing from the object literal
const map = {
  pending:   { ... },
  running:   { ... },
  completed: { ... },
  failed:    { ... },
}[status];   // returns undefined when status === 'cancelled'

return { label: map.label, ... };  // TypeError: Cannot read properties of undefined
```

Fix: add the missing case.
```ts
cancelled: { label: 'Cancelled', terminal: true, actionable: false },
```

TypeScript does not catch this because the object literal is not explicitly typed
as `Record<JobStatus, StatusMeta>` — it is typed by inference from the selected
keys, and the indexing with a `JobStatus` value passes without error.

**Category:** Incorrect discriminated union / exhaustive handling
**Difficulty:** Medium

---

## Challenge 10 — The "processed" counter is 0 right after `processBatch` returns

**File:** `src/jobs/processor.ts`, method `processBatch`

**Root cause:**
```ts
// Buggy — async forEach does not block
jobs.forEach(async (job) => {
  await this.execute(job);
});
// returns here before any job has been awaited

// Fixed — for...of with await
for (const job of jobs) {
  try {
    await this.execute(job);
  } catch { /* individual errors logged inside execute */ }
}
```
`Array.prototype.forEach` ignores the promise returned by the async callback.
The method returns immediately, and all jobs run in the background. The stat
counter is therefore still `0` when checked synchronously after the call.

**Category:** async forEach bug
**Difficulty:** Medium

---

## Challenge 11 — High-priority jobs are processed last

**File:** `src/queue/PriorityQueue.ts`

**Root cause:**
Both `bubbleUp` and `sinkDown` use the wrong comparison direction, making the
heap a **min-heap** instead of a **max-heap**.

```ts
// Buggy bubbleUp (promotes the smaller value toward the root)
if (this.heap[parent].priority > this.heap[index].priority) {

// Fixed (promotes the larger value toward the root)
if (this.heap[parent].priority < this.heap[index].priority) {

// Buggy sinkDown (sinks the larger value down)
if (left < length && this.heap[left].priority < this.heap[target].priority) {

// Fixed (sinks the smaller value down)
if (left < length && this.heap[left].priority > this.heap[target].priority) {
// (same change for the right-child comparison)
```

Also delete or replace the unused `dominates` helper — it is correct but
never called, which is misleading.

**Category:** Queue ordering / heap invariant bug
**Difficulty:** Hard

---

## Challenge 12 — The same job runs twice under concurrent load

**File:** `src/jobs/processor.ts`, method `execute`

**Root cause:**
The deduplication guard has a **TOCTOU (time-of-check / time-of-use) race**:

```ts
const alreadyRunning = await this.db.isJobRunning(job.id);  // ← yields here
// ↑ Two concurrent callers both see false here
if (alreadyRunning) return { skipped: true };

await this.db.markJobRunning(job.id);  // ← both then mark running separately
```

Between the `await isJobRunning` and the `await markJobRunning`, another
`execute` call for the same job ID can slip through the check, because both
yield the event loop (via `setImmediate`) before either has written the guard.

**Fix:** Use an in-process `Set` for the fast-path check so the check-and-set
is synchronous before the first `await`:

```ts
private readonly inFlight = new Set<string>();

async execute(job: Job): Promise<...> {
  if (this.inFlight.has(job.id)) return { skipped: true };
  this.inFlight.add(job.id);  // synchronous — no yield between check and set
  try {
    await this.db.markJobRunning(job.id);
    // ... rest of execution
  } finally {
    this.inFlight.delete(job.id);
    await this.db.clearJobRunning(job.id);
  }
}
```

**Category:** Race condition from shared mutable state
**Difficulty:** Hard

---

## Challenge 13 — A job timeout leaves the process alive longer than expected

**File:** `src/jobs/scheduler.ts`, method `runWithTimeout`

**Root cause:**
In the `.catch()` branch of the promise chain, `clearTimeout(timer)` is never
called. If the wrapped `task()` rejects for a non-timeout reason, the timer
continues running for the full `timeoutMs` duration.

```ts
// Buggy
.catch(err => {
  this.pendingTimers.delete(timer);
  reject(err);             // timer is NOT cleared
});

// Fixed
.catch(err => {
  clearTimeout(timer);     // ← add this
  this.pendingTimers.delete(timer);
  reject(err);
});
```

In production this keeps the Node.js event loop alive, delays graceful shutdown,
and may fire a confusing "timed out" log after the job has already failed.
In tests with fake timers the unfired callback fires unexpectedly after the
test ends.

**Category:** Timeout handle not cleared / resource leak
**Difficulty:** Hard

---

## Challenge 14 — A retryable error stops being retryable after going through the service layer

**File:** `src/services/retryService.ts`, method `execute`

**Root cause:**
```ts
// Buggy — wraps the original error in a plain Error, losing its type
const wrapped = new Error(`Job ${job.id} handler failed: ${message}`);
throw wrapped;

// Callers check:
if (err instanceof RetryableError) { ... }  // always false for plain Error
```

The `instanceof` check fails because the original `RetryableError` has been
replaced with a generic `Error`. The chain of prototype checks no longer
includes `RetryableError`.

**Fix — option A:** Re-throw the original error:
```ts
throw rawErr;
```

**Fix — option B:** Preserve the original type:
```ts
import { RetryableError } from '../types';
if (rawErr instanceof RetryableError) throw rawErr;
throw new Error(`Job ${job.id} handler failed: ${message}`);
```

**Category:** Incorrect error propagation / error wrapping
**Difficulty:** Hard

---

## Challenge 15 — A test passes unreliably depending on machine speed

**File:** `tests/jobService.test.ts`, test `"processes all jobs in a batch"`

**Root cause:**
The test calls `processor.processBatch(jobs)` **without** `await`. Because
`processBatch` uses an async `forEach` internally (Bug 10), it returns
immediately. The test then waits 200 ms via `setTimeout` hoping the jobs
finish — which works on fast machines but not on slow CI runners.

There are actually two compounding bugs:
1. **Bug 10** (`processBatch` uses async forEach internally, so it never
   actually `await`s its own work).
2. **This test** does not `await processBatch(...)`, so even if Bug 10 were
   fixed, the test would still be racy.

**Fix:** Fix Bug 10 first (`for...of` with `await`), then add `await` in the
test:
```ts
await processor.processBatch(jobs);
// Now safe to assert immediately — no setTimeout needed
expect(processor.getStats().processed).toBe(3);
```

**Category:** Flaky test caused by async timing + async forEach
**Difficulty:** Medium (the fix itself is simple; diagnosing the two-layer cause is the challenge)
