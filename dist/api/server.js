"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = createApp;
const express_1 = __importDefault(require("express"));
const jobService_1 = require("../services/jobService");
const notificationService_1 = require("../services/notificationService");
const processor_1 = require("../jobs/processor");
const jobs_1 = require("./routes/jobs");
const logger_1 = require("../utils/logger");
function createApp(db) {
    const app = (0, express_1.default)();
    app.use(express_1.default.json());
    app.use((req, _res, next) => {
        logger_1.logger.debug(`${req.method} ${req.path}`);
        next();
    });
    const jobService = new jobService_1.JobService(db);
    const notificationService = new notificationService_1.NotificationService(db);
    const processor = new processor_1.JobProcessor(db);
    app.get('/health', (_req, res) => {
        res.json({
            status: 'ok',
            uptime: process.uptime(),
            timestamp: new Date().toISOString(),
            jobs: db.getJobCount(),
        });
    });
    app.use('/api/jobs', (0, jobs_1.createJobRouter)(jobService, notificationService, processor));
    app.use((_req, res) => {
        res.status(404).json({ error: 'Not found' });
    });
    app.use((err, _req, res, _next) => {
        logger_1.logger.error('Uncaught application error', err);
        res.status(500).json({ error: 'Internal server error' });
    });
    return app;
}
//# sourceMappingURL=server.js.map