import { InMemoryDatabase } from '../db/db';
import { Job, JobStats, RetryableError } from '../types';
import { logger } from '../utils/logger';

type WorkFn = (job: Job) => Promise<Record<string, unknown>>;

function simulateWork(job: Job): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const duration = 10 + Math.floor(Math.random() * 20);
    setTimeout(() => {
      if (job.payload['__fail'] === true) {
        reject(new RetryableError(`Simulated failure for job ${job.id}`));
      } else {
        resolve({ processedAt: new Date().toISOString(), duration });
      }
    }, duration);
  });
}

export class JobProcessor {
  private stats: JobStats = { processed: 0, succeeded: 0, failed: 0, retried: 0 };

  constructor(
    private readonly db: InMemoryDatabase,
    private readonly workFn: WorkFn = simulateWork
  ) {}

  async execute(job: Job): Promise<{ skipped: boolean; output?: Record<string, unknown> }> {
    const alreadyRunning = await this.db.isJobRunning(job.id);
    if (alreadyRunning) {
      logger.debug(`Job ${job.id} is already in flight, skipping duplicate dispatch`);
      return { skipped: true };
    }

    await this.db.markJobRunning(job.id);

    try {
      await this.db.updateJob(job.id, { status: 'running', startedAt: new Date() });
      const output = await this.workFn(job);
      await this.db.updateJob(job.id, { status: 'completed', output, completedAt: new Date() });

      this.stats.processed++;
      this.stats.succeeded++;

      logger.info(`Job ${job.id} succeeded`);
      return { skipped: false, output };
    } catch (err) {
      this.stats.processed++;
      this.stats.failed++;

      await this.db.updateJob(job.id, {
        status: 'failed',
        error: err instanceof Error ? err.message : String(err),
      });

      logger.error(`Job ${job.id} failed`, err);
      throw err;
    } finally {
      await this.db.clearJobRunning(job.id);
    }
  }

  async processBatch(jobs: Job[]): Promise<void> {
    logger.info(`Processing batch of ${jobs.length} jobs`);

    jobs.forEach(async (job) => {
      try {
        await this.execute(job);
      } catch {
        // individual job errors are logged inside execute()
      }
    });
  }

  getStats(): Readonly<JobStats> {
    return { ...this.stats };
  }

  resetStats(): void {
    this.stats = { processed: 0, succeeded: 0, failed: 0, retried: 0 };
  }
}
