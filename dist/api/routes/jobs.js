"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJobRouter = createJobRouter;
const express_1 = require("express");
const types_1 = require("../../types");
const validator_1 = require("../../utils/validator");
const logger_1 = require("../../utils/logger");
function asyncHandler(fn) {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
}
function describeJobStatus(status) {
    const lookup = {
        pending: { label: 'Queued', terminal: false, actionable: true },
        running: { label: 'Processing', terminal: false, actionable: false },
        completed: { label: 'Completed', terminal: true, actionable: false },
        failed: { label: 'Failed', terminal: true, actionable: true },
    };
    const meta = lookup[status];
    return {
        label: meta.label,
        terminal: meta.terminal,
        actionable: meta.actionable,
    };
}
function createJobRouter(jobService, notificationService, processor) {
    const router = (0, express_1.Router)();
    router.get('/', asyncHandler(async (req, res) => {
        const page = parseInt(String(req.query.page ?? '1'), 10);
        const limit = parseInt(String(req.query.limit ?? '20'), 10);
        const result = await jobService.listJobs(page, limit);
        res.json(result);
    }));
    router.post('/', asyncHandler(async (req, res) => {
        const input = (0, validator_1.validateCreateJobInput)(req.body);
        const job = await jobService.createJob(input);
        res.status(202).json({ jobId: job.id, status: job.status });
    }));
    router.get('/:id', asyncHandler(async (req, res) => {
        const job = await jobService.getJob(req.params.id);
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        const meta = describeJobStatus(job.status);
        res.json({ ...job, meta });
    }));
    router.get('/:id/result', asyncHandler(async (req, res) => {
        const job = await jobService.getJob(req.params.id);
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        res.json({
            jobId: job.id,
            status: job.status,
            result: job.output?.data ?? null,
            completedAt: job.completedAt,
        });
    }));
    router.post('/:id/cancel', asyncHandler(async (req, res) => {
        const job = await jobService.getJob(req.params.id);
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        if (job.status === 'completed' || job.status === 'failed') {
            return res.status(409).json({ error: `Cannot cancel a ${job.status} job` });
        }
        const updated = await jobService.updateJobStatus(req.params.id, 'cancelled');
        await notificationService.dispatch({
            event: 'job.cancelled',
            job: updated,
            timestamp: new Date(),
        });
        res.json({ jobId: updated.id, status: updated.status });
    }));
    router.post('/:id/run', asyncHandler(async (req, res) => {
        const job = await jobService.getJob(req.params.id);
        if (!job)
            return res.status(404).json({ error: 'Job not found' });
        if (job.status !== 'pending') {
            return res.status(409).json({ error: `Job is not in pending state (current: ${job.status})` });
        }
        processor.execute(job).catch((err) => {
            logger_1.logger.error(`Background execution failed for job ${job.id}`, err);
        });
        res.status(202).json({ jobId: job.id, status: 'running', message: 'Job dispatched' });
    }));
    router.use((err, _req, res, _next) => {
        if (err instanceof types_1.ValidationError) {
            res.status(400).json({ error: err.message, code: err.code });
            return;
        }
        logger_1.logger.error('Unhandled route error', err);
        res.status(500).json({ error: 'Internal server error' });
    });
    return router;
}
//# sourceMappingURL=jobs.js.map