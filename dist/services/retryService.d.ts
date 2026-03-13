import { InMemoryDatabase } from '../db/db';
import { Job } from '../types';
type JobHandler = (job: Job) => Promise<Record<string, unknown>>;
export declare class RetryService {
    private readonly db;
    private readonly handler;
    constructor(db: InMemoryDatabase, handler: JobHandler);
    run(job: Job): Promise<void>;
    private execute;
    private dispatchToHandler;
}
export {};
