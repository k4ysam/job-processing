import { InMemoryDatabase } from '../db/db';
import { CreateJobInput, Job, JobStatus, PaginatedResult } from '../types';
export declare class JobService {
    private readonly db;
    private readonly cacheTtlMs;
    private readonly cache;
    constructor(db: InMemoryDatabase);
    createJob(input: CreateJobInput): Promise<Job>;
    getJob(id: string): Promise<Job | null>;
    updateJobStatus(id: string, status: JobStatus, extra?: Partial<Job>): Promise<Job>;
    listJobs(page: number, limit: number): Promise<PaginatedResult<Job>>;
    deleteJob(id: string): Promise<void>;
    getStats(): Promise<Record<JobStatus, number>>;
    invalidateCache(id: string): void;
}
