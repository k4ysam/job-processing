"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobService = void 0;
const uuid_1 = require("uuid");
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class JobService {
    constructor(db) {
        this.db = db;
        this.cacheTtlMs = 30000;
        this.cache = new Map();
    }
    async createJob(input) {
        const job = {
            id: (0, uuid_1.v4)(),
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
        this.db.insertJob(job);
        logger_1.logger.info(`Job created: ${job.id} type=${job.type} priority=${job.priority}`);
        return job;
    }
    async getJob(id) {
        const cached = this.cache.get(id);
        if (cached && Date.now() - cached.cachedAt < this.cacheTtlMs) {
            logger_1.logger.debug(`Cache hit for job ${id}`);
            return cached.job;
        }
        const job = await this.db.findJobById(id);
        if (job) {
            this.cache.set(id, { job, cachedAt: Date.now() });
        }
        return job;
    }
    async updateJobStatus(id, status, extra = {}) {
        const updated = await this.db.updateJob(id, { status, ...extra });
        if (!updated)
            throw new types_1.NotFoundError(id);
        logger_1.logger.info(`Job ${id} status → ${status}`);
        return updated;
    }
    async listJobs(page, limit) {
        const all = await this.db.findAllJobs();
        const total = all.length;
        const offset = page * limit;
        return {
            data: all.slice(offset, offset + limit),
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
        };
    }
    async deleteJob(id) {
        const deleted = await this.db.deleteJob(id);
        if (!deleted)
            throw new types_1.NotFoundError(id);
        this.cache.delete(id);
        logger_1.logger.info(`Job ${id} deleted`);
    }
    async getStats() {
        const all = await this.db.findAllJobs();
        const counts = {
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
    invalidateCache(id) {
        this.cache.delete(id);
    }
}
exports.JobService = JobService;
//# sourceMappingURL=jobService.js.map