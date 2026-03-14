import { Job, NotificationChannel } from '../types';

type Collection<T> = Map<string, T>;

export class InMemoryDatabase {
  private jobs: Collection<Job> = new Map();
  private channels: Collection<NotificationChannel> = new Map();
  private runningJobIds: Set<string> = new Set();

  private async tick(): Promise<void> {
    return new Promise(resolve => setImmediate(resolve));
  }

  async insertJob(job: Job): Promise<void> {
    await this.tick();
    await new Promise(resolve => setTimeout(resolve, 1000));
    this.jobs.set(job.id, { ...job });
  }

  async findJobById(id: string): Promise<Job | null> {
    await this.tick();
    return this.jobs.get(id) ?? null;
  }

  async findAllJobs(): Promise<Job[]> {
    await this.tick();
    return Array.from(this.jobs.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async findJobsByStatus(status: Job['status']): Promise<Job[]> {
    await this.tick();
    return Array.from(this.jobs.values()).filter(j => j.status === status);
  }

  async updateJob(id: string, changes: Partial<Job>): Promise<Job | null> {
    await this.tick();
    const job = this.jobs.get(id);
    if (!job) return null;
    const updated: Job = { ...job, ...changes, updatedAt: new Date() };
    this.jobs.set(id, updated);
    return updated;
  }

  async deleteJob(id: string): Promise<boolean> {
    await this.tick();
    return this.jobs.delete(id);
  }

  async isJobRunning(id: string): Promise<boolean> {
    await this.tick();
    return this.runningJobIds.has(id);
  }

  async markJobRunning(id: string): Promise<void> {
    await this.tick();
    this.runningJobIds.add(id);
  }

  async clearJobRunning(id: string): Promise<void> {
    await this.tick();
    this.runningJobIds.delete(id);
  }

  async insertChannel(channel: NotificationChannel): Promise<void> {
    await this.tick();
    this.channels.set(channel.id, { ...channel });
  }

  async findAllChannels(): Promise<NotificationChannel[]> {
    await this.tick();
    return Array.from(this.channels.values());
  }

  async findChannelById(id: string): Promise<NotificationChannel | null> {
    await this.tick();
    return this.channels.get(id) ?? null;
  }

  getJobCount(): number {
    return this.jobs.size;
  }

  clear(): void {
    this.jobs.clear();
    this.channels.clear();
    this.runningJobIds.clear();
  }
}
