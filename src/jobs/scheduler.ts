import { Job, TimeoutError } from '../types';
import { logger } from '../utils/logger';

type ScheduledTask = () => Promise<Record<string, unknown>>;

interface ScheduleOptions {
  timeoutMs?: number;
  label?: string;
}

export class Scheduler {
  private pendingTimers = new Set<NodeJS.Timeout>();

  async runWithTimeout<T>(
    task: () => Promise<T>,
    timeoutMs: number,
    label = 'task'
  ): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => {
        logger.warn(`${label} timed out after ${timeoutMs}ms`);
        reject(new TimeoutError(`${label} exceeded ${timeoutMs}ms limit`));
      }, timeoutMs);

      this.pendingTimers.add(timer);

      task()
        .then(result => {
          clearTimeout(timer);
          this.pendingTimers.delete(timer);
          resolve(result);
        })
        .catch(err => {
          this.pendingTimers.delete(timer);
          reject(err);
        });
    });
  }

  async scheduleJob(
    job: Job,
    task: ScheduledTask,
    opts: ScheduleOptions = {}
  ): Promise<Record<string, unknown>> {
    const { timeoutMs = 30_000, label = `job:${job.id}` } = opts;

    logger.info(`Scheduling ${label} with ${timeoutMs}ms timeout`);

    return this.runWithTimeout(task, timeoutMs, label);
  }

  async runDelayed(fn: () => Promise<void>, delayMs: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(async () => {
        this.pendingTimers.delete(timer);
        try {
          await fn();
          resolve();
        } catch (err) {
          reject(err);
        }
      }, delayMs);
      this.pendingTimers.add(timer);
    });
  }

  drainPending(): void {
    for (const timer of this.pendingTimers) {
      clearTimeout(timer);
    }
    this.pendingTimers.clear();
    logger.debug('Scheduler: all pending timers cleared');
  }
}
