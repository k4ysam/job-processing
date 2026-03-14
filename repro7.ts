/**
 * Repro for notifyJobEvent with multiple channels. Run with "Debug: Script" to hit
 * breakpoints in src/services/notificationService.ts.
 * Seed gives 2 channels (9000 ok, 9001 fail); we add 2 more for 4 total.
 */
import { InMemoryDatabase } from './src/db/db';
import { NotificationService } from './src/services/notificationService';
import { seedDatabase } from './src/db/seed';
import type { DispatchResult, NotificationChannel } from './src/types';

async function main(): Promise<void> {
  const db = new InMemoryDatabase();
  await seedDatabase(db); // adds ch-webhook-primary (9000) and ch-webhook-secondary (9001)

  // Add more channels: one healthy, one failing (endpoint with localhost:9001 fails)
  const extraChannels: NotificationChannel[] = [
    { id: 'ch-webhook-tertiary', type: 'webhook', endpoint: 'http://localhost:9000/events-2', active: true },
    { id: 'ch-webhook-failing2', type: 'webhook', endpoint: 'http://localhost:9001/events-2', active: true },
  ];
  for (const ch of extraChannels) {
    await db.insertChannel(ch);
  }

  const service = new NotificationService(db);

  const payload = {
    event: 'job.completed' as const,
    job: {
      id: 'j1',
      type: 'email' as const,
      status: 'completed' as const,
      priority: 5,
      payload: {},
      attempts: 1,
      maxAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    timestamp: new Date(),
  };

  console.log('Calling notifyJobEvent (4 active channels: 2 x localhost:9000, 2 x localhost:9001)...');
  try {
    const results = await service.notifyJobEvent(payload);
    const ok = results.filter((r: { success: boolean }) => r.success);
    const failed = results.filter((r: { success: boolean }) => !r.success);
    console.log('Resolved. Succeeded:', ok.length, 'Failed:', failed.length);
    if (failed.length > 0) {
      console.log('Failures (surfaced to caller):', failed);
    }
  } catch (err) {
    console.log('Rejected:', err instanceof Error ? err.message : String(err));
  }
}

main();