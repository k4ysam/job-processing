import { v4 as uuidv4 } from 'uuid';
import { InMemoryDatabase } from '../db/db';
import {
  CreateJobInput,
  Job,
  JobStatus,
  NotFoundError,
  PaginatedResult,
} from '../types';
import { logger } from '../utils/logger';

interface CacheEntry {
  job: Job;
  cachedAt: number;
}

export class JobService {
  private readonly cacheTtlMs = 30_000;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(private readonly db: InMemoryDatabase) {}

  async createJob(input: CreateJobInput): Promise<Job> {
    const job: Job = {
      id: uuidv4(),
      type: input.type,
      status: 'pending',
      priority: input.priority ?? 5,
      payload: input.payload,
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 3,
      scheduledAt: input.scheduledAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await this.db.insertJob(job);
    logger.info(`Job created: ${job.id} type=${job.type} priority=${job.priority}`);
    return job;
  }

  async getJob(id: string): Promise<Job | null> {
    const cached = this.cache.get(id);
    if (cached && Date.now() - cached.cachedAt < this.cacheTtlMs) {
      logger.debug(`Cache hit for job ${id}`);
      return cached.job;
    }

    const job = await this.db.findJobById(id);
    if (job) {
      this.cache.set(id, { job, cachedAt: Date.now() });
    }
    return job;
  }

  async updateJobStatus(
    id: string,
    status: JobStatus,
    extra: Partial<Job> = {}
  ): Promise<Job> {
    const updated = await this.db.updateJob(id, { status, ...extra });
    if (!updated) throw new NotFoundError(id);
    logger.info(`Job ${id} status → ${status}`);
    return updated;
  }

  async listJobs(
    page: number,
    limit: number
  ): Promise<PaginatedResult<Job>> {
    const all = await this.db.findAllJobs();
    const total = all.length;
    const offset = (page - 1) * limit;

    return {
      data: all.slice(offset, offset + limit),
      total,
      page,
      limit,
      pages: Math.ceil(total / limit),
    };
  }

  async deleteJob(id: string): Promise<void> {
    const deleted = await this.db.deleteJob(id);
    if (!deleted) throw new NotFoundError(id);
    this.cache.delete(id);
    logger.info(`Job ${id} deleted`);
  }

  async getStats(): Promise<Record<JobStatus, number>> {
    const all = await this.db.findAllJobs();
    const counts: Record<JobStatus, number> = {
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      cancelled: 0,
    };
    for (const job of all) {
      counts[job.status]++;
    }
    return counts;
  }

  invalidateCache(id: string): void {
    this.cache.delete(id);
  }
}
