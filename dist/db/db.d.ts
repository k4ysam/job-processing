import { Job, NotificationChannel } from '../types';
export declare class InMemoryDatabase {
    private jobs;
    private channels;
    private runningJobIds;
    private tick;
    insertJob(job: Job): Promise<void>;
    findJobById(id: string): Promise<Job | null>;
    findAllJobs(): Promise<Job[]>;
    findJobsByStatus(status: Job['status']): Promise<Job[]>;
    updateJob(id: string, changes: Partial<Job>): Promise<Job | null>;
    deleteJob(id: string): Promise<boolean>;
    isJobRunning(id: string): Promise<boolean>;
    markJobRunning(id: string): Promise<void>;
    clearJobRunning(id: string): Promise<void>;
    insertChannel(channel: NotificationChannel): Promise<void>;
    findAllChannels(): Promise<NotificationChannel[]>;
    findChannelById(id: string): Promise<NotificationChannel | null>;
    getJobCount(): number;
    clear(): void;
}
