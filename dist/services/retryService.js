"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetryService = void 0;
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class RetryService {
    constructor(db, handler) {
        this.db = db;
        this.handler = handler;
    }
    async run(job) {
        logger_1.logger.info(`RetryService: starting job ${job.id} (attempt ${job.attempts + 1}/${job.maxAttempts})`);
        try {
            await this.execute(job);
        }
        catch (err) {
            logger_1.logger.error(`RetryService: job ${job.id} encountered an error`, err);
        }
    }
    async execute(job) {
        await this.db.updateJob(job.id, {
            status: 'running',
            attempts: job.attempts + 1,
            startedAt: new Date(),
        });
        try {
            const output = await this.dispatchToHandler(job);
            await this.db.updateJob(job.id, {
                status: 'completed',
                output,
                completedAt: new Date(),
            });
            logger_1.logger.info(`Job ${job.id} completed successfully`);
        }
        catch (rawErr) {
            const message = rawErr instanceof Error ? rawErr.message : String(rawErr);
            const wrapped = new Error(`Job ${job.id} handler failed: ${message}`);
            const canRetry = job.attempts < job.maxAttempts &&
                rawErr instanceof types_1.RetryableError;
            if (canRetry) {
                await this.db.updateJob(job.id, { status: 'pending', error: message });
                logger_1.logger.warn(`Job ${job.id} will be retried (${job.attempts}/${job.maxAttempts} attempts)`);
            }
            else {
                await this.db.updateJob(job.id, { status: 'failed', error: message });
                logger_1.logger.error(`Job ${job.id} failed permanently`);
            }
            throw wrapped;
        }
    }
    async dispatchToHandler(job) {
        return this.handler(job);
    }
}
exports.RetryService = RetryService;
//# sourceMappingURL=retryService.js.map