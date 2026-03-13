import { InMemoryDatabase } from './db/db';
import { seedDatabase } from './db/seed';
import { createApp } from './api/server';
import { logger } from './utils/logger';

const PORT = parseInt(process.env.PORT ?? '3000', 10);

async function main(): Promise<void> {
  const db = new InMemoryDatabase();

  logger.info('Seeding database...');
  await seedDatabase(db);
  logger.info(`Seeded ${db.getJobCount()} jobs`);

  const app = createApp(db);

  app.listen(PORT, () => {
    logger.info(`Flowmatic listening on http://localhost:${PORT}`);
    logger.info('Routes: GET /health  |  GET/POST /api/jobs  |  GET /api/jobs/:id');
  });
}

main().catch(err => {
  logger.error('Fatal startup error', err);
  process.exit(1);
});
