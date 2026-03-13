import { Job } from '../types';
type ScheduledTask = () => Promise<Record<string, unknown>>;
interface ScheduleOptions {
    timeoutMs?: number;
    label?: string;
}
export declare class Scheduler {
    private pendingTimers;
    runWithTimeout<T>(task: () => Promise<T>, timeoutMs: number, label?: string): Promise<T>;
    scheduleJob(job: Job, task: ScheduledTask, opts?: ScheduleOptions): Promise<Record<string, unknown>>;
    runDelayed(fn: () => Promise<void>, delayMs: number): Promise<void>;
    drainPending(): void;
}
export {};
