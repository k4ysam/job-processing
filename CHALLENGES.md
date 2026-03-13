# Debugging Challenges

Work through these in order, or jump to whichever interests you. Each challenge
describes only the **symptom** — finding the root cause and the fix is the exercise.

Use breakpoints, the call stack, watch expressions, `debugger` statements, and
strategic `console.log` / logger calls to investigate. The `.vscode/launch.json`
configs will attach your debugger automatically.

---

## Difficulty: Easy

### Challenge 1 — The first job type is always rejected

**Symptom:**
Submitting a job via `POST /api/jobs` with `type: "email"` always returns a
`400 Validation Error` saying the type is invalid — even though `"email"` is
clearly in the list of supported types. Other types work fine.

**Where to start:** `src/utils/validator.ts`

---

### Challenge 2 — Retry count looks right in logs, but jobs give up too early

**Symptom:**
A job configured with `maxRetries: 3` appears to stop retrying after 2 attempts.
The logs print "Attempt 1 failed", "Attempt 2 failed", then the error is thrown —
one fewer retry than expected.

**Where to start:** `src/utils/retry.ts`, the test in `tests/retry.test.ts`

---

### Challenge 3 — Getting a job's result crashes for non-completed jobs

**Symptom:**
`GET /api/jobs/:id/result` throws an unhandled `TypeError` when the job has not
yet completed. The error message references reading a property of `undefined`.
Jobs with `status: "completed"` work fine.

**Where to start:** `src/api/routes/jobs.ts`

---

### Challenge 4 — Page 1 of the job list skips the newest jobs

**Symptom:**
`GET /api/jobs?page=1&limit=5` returns an empty array even when there are 10
jobs in the database. Page 0 returns the first 5 results. The API documentation
says pages are 1-indexed.

**Where to start:** `src/services/jobService.ts`, method `listJobs`

---

## Difficulty: Medium

### Challenge 5 — A job appears created, but vanishes when fetched immediately after

**Symptom:**
`POST /api/jobs` returns `202` with a `jobId`, but a subsequent
`GET /api/jobs/:id` within the same request pipeline returns `404 Not found`.
The job eventually appears if you wait a moment and retry.

**Where to start:** `src/services/jobService.ts`, method `createJob`

---

### Challenge 6 — Status looks stale after a status update

**Symptom:**
Calling `POST /api/jobs/:id/cancel` succeeds (returns `200` with
`status: "cancelled"`), but the very next `GET /api/jobs/:id` still returns the
old status. The correct status appears only after ~30 seconds.

**Where to start:** `src/services/jobService.ts`, cache handling across
`getJob` and `updateJobStatus`

---

### Challenge 7 — A failing notification channel silently drops the others

**Symptom:**
When one webhook channel returns a connection error during `notifyJobEvent`,
no notification is delivered to any channel — including channels that are
healthy. There is no error surfaced to the caller; the promise just resolves.

**Where to start:** `src/services/notificationService.ts`, method `notifyJobEvent`

---

### Challenge 8 — Failed jobs report as successful to the caller

**Symptom:**
When `RetryService.run` is called and the underlying handler throws, the promise
returned by `run` resolves normally. The caller has no way to know the job
failed. The job status in the database is correct (`"failed"`), but the
returned promise never rejects.

**Where to start:** `src/services/retryService.ts`, method `run`

---

### Challenge 9 — Cancelled jobs crash the route handler

**Symptom:**
`GET /api/jobs/:id` returns `500 Internal server error` for any job whose status
is `"cancelled"`. Jobs in every other status are served correctly.

**Where to start:** `src/api/routes/jobs.ts`, function `describeJobStatus`

---

### Challenge 10 — The "processed" counter is 0 right after `processBatch` returns

**Symptom:**
After calling `processor.processBatch(jobs)` and immediately reading
`processor.getStats().processed`, the count is always `0` — regardless of how
many jobs were in the batch. Waiting 200 ms and checking again shows the correct
count.

**Where to start:** `src/jobs/processor.ts`, method `processBatch`; the test in
`tests/jobService.test.ts`

---

## Difficulty: Hard

### Challenge 11 — High-priority jobs are processed last

**Symptom:**
Jobs enqueued with priority `9` or `10` are consistently dequeued after jobs
with priority `1` or `2`. The queue claims to be a max-priority queue (higher
number = higher priority), but behaves as if it is a min-priority queue.
The unit tests in `tests/queue.test.ts` fail to confirm this.

**Where to start:** `src/queue/PriorityQueue.ts`

---

### Challenge 12 — The same job runs twice under concurrent load

**Symptom:**
When two calls to `processor.execute(job)` are fired concurrently for the same
job ID, the underlying work function runs twice. The deduplication guard appears
to be present in the code, but it does not prevent double-execution under
concurrent conditions.

**Where to start:** `src/jobs/processor.ts`, method `execute`; the test
`"does not run the same job twice when called concurrently"` in
`tests/jobService.test.ts`

---

### Challenge 13 — A job timeout leaves the process alive longer than expected

**Symptom:**
When `scheduler.runWithTimeout` is called and the wrapped task throws its own
error (not a timeout), the Node.js process takes an extra `timeoutMs`
milliseconds to exit. In tests using fake timers, this manifests as an
unexpected timer still firing after the task has already rejected.

**Where to start:** `src/jobs/scheduler.ts`, method `runWithTimeout`

---

### Challenge 14 — A retryable error stops being retryable after going through the service layer

**Symptom:**
A handler throws a `RetryableError`. The caller of `RetryService.execute` checks
`err instanceof RetryableError` to decide whether to re-queue the job. That
check always returns `false`, so retryable jobs are permanently failed instead
of being requeued.

**Where to start:** `src/services/retryService.ts`, the `catch` block inside
`execute`; cross-reference with `src/types.ts` → `RetryableError`

---

### Challenge 15 — A test passes unreliably depending on machine speed

**Symptom:**
The test `"processes all jobs in a batch"` in `tests/jobService.test.ts` passes
on fast machines but fails on CI. The assertion fires before the work is
actually complete. Removing the `setTimeout(200)` wait causes it to fail
every time.

**Where to start:** `tests/jobService.test.ts`, the `processBatch` test;
cross-reference with `src/jobs/processor.ts`

---

## General tips

- Use `LOG_LEVEL=debug npm run dev` to see verbose output.
- The in-memory database (`src/db/db.ts`) uses `setImmediate` to simulate async
I/O. This means all DB calls genuinely yield the event loop.
- `ANSWERS.md` is in the project root. **Don't open it yet.**

