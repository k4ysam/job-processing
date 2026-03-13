"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryDatabase = void 0;
class InMemoryDatabase {
    constructor() {
        this.jobs = new Map();
        this.channels = new Map();
        this.runningJobIds = new Set();
    }
    async tick() {
        return new Promise(resolve => setImmediate(resolve));
    }
    async insertJob(job) {
        await this.tick();
        this.jobs.set(job.id, { ...job });
    }
    async findJobById(id) {
        await this.tick();
        return this.jobs.get(id) ?? null;
    }
    async findAllJobs() {
        await this.tick();
        return Array.from(this.jobs.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async findJobsByStatus(status) {
        await this.tick();
        return Array.from(this.jobs.values()).filter(j => j.status === status);
    }
    async updateJob(id, changes) {
        await this.tick();
        const job = this.jobs.get(id);
        if (!job)
            return null;
        const updated = { ...job, ...changes, updatedAt: new Date() };
        this.jobs.set(id, updated);
        return updated;
    }
    async deleteJob(id) {
        await this.tick();
        return this.jobs.delete(id);
    }
    async isJobRunning(id) {
        await this.tick();
        return this.runningJobIds.has(id);
    }
    async markJobRunning(id) {
        await this.tick();
        this.runningJobIds.add(id);
    }
    async clearJobRunning(id) {
        await this.tick();
        this.runningJobIds.delete(id);
    }
    async insertChannel(channel) {
        await this.tick();
        this.channels.set(channel.id, { ...channel });
    }
    async findAllChannels() {
        await this.tick();
        return Array.from(this.channels.values());
    }
    async findChannelById(id) {
        await this.tick();
        return this.channels.get(id) ?? null;
    }
    getJobCount() {
        return this.jobs.size;
    }
    clear() {
        this.jobs.clear();
        this.channels.clear();
        this.runningJobIds.clear();
    }
}
exports.InMemoryDatabase = InMemoryDatabase;
//# sourceMappingURL=db.js.map