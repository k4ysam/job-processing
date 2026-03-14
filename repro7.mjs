// If using compiled JS (adjust path/imports to match your project)
import { InMemoryDatabase } from './dist/db/db.js';
import { NotificationService } from './dist/services/notificationService.js';
import { seedDatabase } from './dist/db/seed.js';

const db = new InMemoryDatabase();
await seedDatabase(db);  // adds ch-webhook-primary (9000) and ch-webhook-secondary (9001)

const service = new NotificationService(db);

const payload = {
  event: 'job.completed',
  job: { id: 'j1', type: 'email', status: 'completed', priority: 5, payload: {}, attempts: 1, maxAttempts: 3, createdAt: new Date(), updatedAt: new Date() },
  timestamp: new Date(),
};

console.log('Calling notifyJobEvent (seed has localhost:9000 and localhost:9001)...');
try {
    const results = await service.notifyJobEvent(payload);
    const ok = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    console.log('Resolved. Succeeded:', ok.length, 'Failed:', failed.length);
    if (failed.length > 0) {
      console.log('Failures:', failed);
    }
  } catch (err) {
    console.log('Rejected:', err instanceof Error ? err.message : String(err));
  }