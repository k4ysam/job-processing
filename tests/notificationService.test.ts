import { InMemoryDatabase } from '../src/db/db';
import { NotificationService } from '../src/services/notificationService';
import { NotificationChannel, NotificationPayload } from '../src/types';
import { seedDatabase } from '../src/db/seed';

function makePayload(overrides: Partial<NotificationPayload> = {}): NotificationPayload {
  return {
    event: 'job.completed',
    job: {
      id: 'test-job-1',
      type: 'email',
      status: 'completed',
      priority: 5,
      payload: {},
      attempts: 1,
      maxAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    timestamp: new Date(),
    ...overrides,
  };
}

async function addChannel(
  db: InMemoryDatabase,
  overrides: Partial<NotificationChannel> = {}
): Promise<NotificationChannel> {
  const ch: NotificationChannel = {
    id: `ch-${Math.random().toString(36).slice(2)}`,
    type: 'webhook',
    endpoint: 'http://localhost:9000/events',
    active: true,
    ...overrides,
  };
  await db.insertChannel(ch);
  return ch;
}

describe('NotificationService', () => {
  let db: InMemoryDatabase;
  let service: NotificationService;

  beforeEach(() => {
    db = new InMemoryDatabase();
    service = new NotificationService(db);
  });

  it('returns an empty array when no channels are configured', async () => {
    const results = await service.dispatch(makePayload());
    expect(results).toEqual([]);
  });

  it('returns an empty array when all channels are inactive', async () => {
    await addChannel(db, { active: false });
    const results = await service.dispatch(makePayload());
    expect(results).toEqual([]);
  });

  it('dispatches to all active channels', async () => {
    await addChannel(db, { endpoint: 'http://localhost:9000/a' });
    await addChannel(db, { endpoint: 'http://localhost:9000/b' });

    const results = await service.dispatch(makePayload());
    expect(results).toHaveLength(2);
    expect(results.every(r => r.success)).toBe(true);
  });

  it('continues delivering to remaining channels when one channel fails', async () => {
    await addChannel(db, { endpoint: 'http://localhost:9000/good' });
    await addChannel(db, { endpoint: 'http://localhost:9001/bad' });

    const results = await service.notifyJobEvent(makePayload());
    const successes = results.filter(r => r.success);
    const failures = results.filter(r => !r.success);
    expect(results).toHaveLength(2);
    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].error).toContain('connection refused');
  });

  it('reports partial failures without throwing', async () => {
    await addChannel(db, { endpoint: 'http://localhost:9000/ok' });
    await addChannel(db, { endpoint: 'http://localhost:9001/fail' });

    const results = await service.dispatch(makePayload());

    const successes = results.filter(r => r.success);
    const failures  = results.filter(r => !r.success);

    expect(successes).toHaveLength(1);
    expect(failures).toHaveLength(1);
    expect(failures[0].error).toBeTruthy();
  });
});
