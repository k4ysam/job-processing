import { InMemoryDatabase } from '../db/db';
import { Job, RetryableError } from '../types';
import { logger } from '../utils/logger';

type JobHandler = (job: Job) => Promise<Record<string, unknown>>;

export class RetryService {
  constructor(
    private readonly db: InMemoryDatabase,
    private readonly handler: JobHandler
  ) {}

  async run(job: Job): Promise<void> {
    logger.info(`RetryService: starting job ${job.id} (attempt ${job.attempts + 1}/${job.maxAttempts})`);

    try {
      await this.execute(job);
    } catch (err) {
      logger.error(`RetryService: job ${job.id} encountered an error`, err);
      throw err;
    }
  }

  private async execute(job: Job): Promise<void> {
    await this.db.updateJob(job.id, {
      status: 'running',
      attempts: job.attempts + 1,
      startedAt: new Date(),
    });

    try {
      const output = await this.dispatchToHandler(job);
      await this.db.updateJob(job.id, {
        status: 'completed',
        output,
        completedAt: new Date(),
      });
      logger.info(`Job ${job.id} completed successfully`);
    } catch (rawErr) {
      const message = rawErr instanceof Error ? rawErr.message : String(rawErr);
      const wrapped = new Error(`Job ${job.id} handler failed: ${message}`);

      const canRetry =
        job.attempts < job.maxAttempts &&
        rawErr instanceof RetryableError;

      if (canRetry) {
        await this.db.updateJob(job.id, { status: 'pending', error: message });
        logger.warn(`Job ${job.id} will be retried (${job.attempts}/${job.maxAttempts} attempts)`);
      } else {
        await this.db.updateJob(job.id, { status: 'failed', error: message });
        logger.error(`Job ${job.id} failed permanently`);
      }

      throw wrapped;
    }
  }

  private async dispatchToHandler(job: Job): Promise<Record<string, unknown>> {
    return this.handler(job);
  }
}
