import express, { Request, Response, NextFunction } from 'express';
import { InMemoryDatabase } from '../db/db';
import { JobService } from '../services/jobService';
import { NotificationService } from '../services/notificationService';
import { JobProcessor } from '../jobs/processor';
import { createJobRouter } from './routes/jobs';
import { logger } from '../utils/logger';

export function createApp(db: InMemoryDatabase) {
  const app = express();

  app.use(express.json());
  app.use((req, _res, next) => {
    logger.debug(`${req.method} ${req.path}`);
    next();
  });

  const jobService = new JobService(db);
  const notificationService = new NotificationService(db);
  const processor = new JobProcessor(db);

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      jobs: db.getJobCount(),
    });
  });

  app.use('/api/jobs', createJobRouter(jobService, notificationService, processor));

  app.use((_req, res) => {
    res.status(404).json({ error: 'Not found' });
  });

  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    logger.error('Uncaught application error', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}
