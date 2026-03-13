"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Scheduler = void 0;
const types_1 = require("../types");
const logger_1 = require("../utils/logger");
class Scheduler {
    constructor() {
        this.pendingTimers = new Set();
    }
    async runWithTimeout(task, timeoutMs, label = 'task') {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                logger_1.logger.warn(`${label} timed out after ${timeoutMs}ms`);
                reject(new types_1.TimeoutError(`${label} exceeded ${timeoutMs}ms limit`));
            }, timeoutMs);
            this.pendingTimers.add(timer);
            task()
                .then(result => {
                clearTimeout(timer);
                this.pendingTimers.delete(timer);
                resolve(result);
            })
                .catch(err => {
                this.pendingTimers.delete(timer);
                reject(err);
            });
        });
    }
    async scheduleJob(job, task, opts = {}) {
        const { timeoutMs = 30000, label = `job:${job.id}` } = opts;
        logger_1.logger.info(`Scheduling ${label} with ${timeoutMs}ms timeout`);
        return this.runWithTimeout(task, timeoutMs, label);
    }
    async runDelayed(fn, delayMs) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(async () => {
                this.pendingTimers.delete(timer);
                try {
                    await fn();
                    resolve();
                }
                catch (err) {
                    reject(err);
                }
            }, delayMs);
            this.pendingTimers.add(timer);
        });
    }
    drainPending() {
        for (const timer of this.pendingTimers) {
            clearTimeout(timer);
        }
        this.pendingTimers.clear();
        logger_1.logger.debug('Scheduler: all pending timers cleared');
    }
}
exports.Scheduler = Scheduler;
//# sourceMappingURL=scheduler.js.map