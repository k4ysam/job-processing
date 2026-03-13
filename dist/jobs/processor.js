"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobProcessor = void 0;
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
function simulateWork(job) {
    return new Promise((resolve, reject) => {
        const duration = 10 + Math.floor(Math.random() * 20);
        setTimeout(() => {
            if (job.payload['__fail'] === true) {
                reject(new types_1.RetryableError(`Simulated failure for job ${job.id}`));
            }
            else {
                resolve({ processedAt: new Date().toISOString(), duration });
            }
        }, duration);
    });
}
class JobProcessor {
    constructor(db, workFn = simulateWork) {
        this.db = db;
        this.workFn = workFn;
        this.stats = { processed: 0, succeeded: 0, failed: 0, retried: 0 };
    }
    async execute(job) {
        const alreadyRunning = await this.db.isJobRunning(job.id);
        if (alreadyRunning) {
            logger_1.logger.debug(`Job ${job.id} is already in flight, skipping duplicate dispatch`);
            return { skipped: true };
        }
        await this.db.markJobRunning(job.id);
        try {
            await this.db.updateJob(job.id, { status: 'running', startedAt: new Date() });
            const output = await this.workFn(job);
            await this.db.updateJob(job.id, { status: 'completed', output, completedAt: new Date() });
            this.stats.processed++;
            this.stats.succeeded++;
            logger_1.logger.info(`Job ${job.id} succeeded`);
            return { skipped: false, output };
        }
        catch (err) {
            this.stats.processed++;
            this.stats.failed++;
            await this.db.updateJob(job.id, {
                status: 'failed',
                error: err instanceof Error ? err.message : String(err),
            });
            logger_1.logger.error(`Job ${job.id} failed`, err);
            throw err;
        }
        finally {
            await this.db.clearJobRunning(job.id);
        }
    }
    async processBatch(jobs) {
        logger_1.logger.info(`Processing batch of ${jobs.length} jobs`);
        jobs.forEach(async (job) => {
            try {
                await this.execute(job);
            }
            catch {
                // individual job errors are logged inside execute()
            }
        });
    }
    getStats() {
        return { ...this.stats };
    }
    resetStats() {
        this.stats = { processed: 0, succeeded: 0, failed: 0, retried: 0 };
    }
}
exports.JobProcessor = JobProcessor;
//# sourceMappingURL=processor.js.map