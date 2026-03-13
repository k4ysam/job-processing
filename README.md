# Flowmatic

A compact async job-processing service used as a debugging practice environment.

## Setup

```bash
# Install dependencies
npm install

# Run in development mode (auto-restarts on change)
npm run dev

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Debugging

### Attach a debugger to the server

```bash
npm run debug
```

Then in VS Code: **Run → Start Debugging → "Debug: Server"**
Or connect Chrome DevTools at `chrome://inspect`.

### Debug tests

```bash
npm run debug:test
```

In VS Code: **Run → Start Debugging → "Debug: Jest (all tests)"**
Or target a single file with **"Debug: Jest (current file)"**.

### VS Code launch configs

Three pre-configured launch configurations are included in `.vscode/launch.json`:

| Name | Description |
|---|---|
| Debug: Server | Starts the HTTP server with `--inspect` |
| Debug: Jest (all tests) | Runs the full test suite paused at the first line |
| Debug: Jest (current file) | Runs only the open test file |

## Project layout

```
src/
  api/
    routes/jobs.ts    REST endpoints for job management
    server.ts         Express app factory
  db/
    db.ts             In-memory database (simulates async I/O)
    seed.ts           Fixture data loaded on startup
  jobs/
    processor.ts      Executes individual jobs and batches
    scheduler.ts      Timeout-aware job scheduling
  queue/
    Queue.ts          FIFO queue
    PriorityQueue.ts  Max-priority queue (higher number = higher priority)
  services/
    jobService.ts     CRUD + caching layer over the DB
    notificationService.ts  Fan-out notifications to webhook/email channels
    retryService.ts   Executes jobs with retry policy
  utils/
    logger.ts         Structured console logger
    retry.ts          Generic exponential-backoff retry utility
    validator.ts      Input validation helpers
  types.ts            Shared types and error classes
  index.ts            Entry point

tests/
  queue.test.ts
  retry.test.ts
  jobService.test.ts
  validator.test.ts
  notificationService.test.ts
```

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port |
| `LOG_LEVEL` | `info` | One of: `debug`, `info`, `warn`, `error` |

## Debugging challenge

See **CHALLENGES.md** for the list of symptoms to investigate.

> **Spoiler warning**: `ANSWERS.md` contains root causes and fixes.
> It is in the project root. **Do not open it until you are done.**
