import { InMemoryDatabase } from '../db/db';
import { Job, JobStats } from '../types';
type WorkFn = (job: Job) => Promise<Record<string, unknown>>;
export declare class JobProcessor {
    private readonly db;
    private readonly workFn;
    private stats;
    constructor(db: InMemoryDatabase, workFn?: WorkFn);
    execute(job: Job): Promise<{
        skipped: boolean;
        output?: Record<string, unknown>;
    }>;
    processBatch(jobs: Job[]): Promise<void>;
    getStats(): Readonly<JobStats>;
    resetStats(): void;
}
export {};
