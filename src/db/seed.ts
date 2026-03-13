import { v4 as uuidv4 } from 'uuid';
import { InMemoryDatabase } from './db';
import { Job, NotificationChannel } from '../types';

export async function seedDatabase(db: InMemoryDatabase): Promise<void> {
  const now = new Date();

  const jobs: Job[] = [
    {
      id: uuidv4(),
      type: 'email',
      status: 'completed',
      priority: 5,
      payload: { to: 'alice@example.com', subject: 'Welcome', body: 'Hello!' },
      attempts: 1,
      maxAttempts: 3,
      output: { messageId: 'msg-001', delivered: true },
      createdAt: new Date(now.getTime() - 60_000 * 10),
      updatedAt: new Date(now.getTime() - 60_000 * 9),
      startedAt: new Date(now.getTime() - 60_000 * 9),
      completedAt: new Date(now.getTime() - 60_000 * 8),
    },
    {
      id: uuidv4(),
      type: 'webhook',
      status: 'failed',
      priority: 8,
      payload: { url: 'https://hooks.example.com/notify', method: 'POST' },
      attempts: 3,
      maxAttempts: 3,
      error: 'Connection refused: hooks.example.com',
      createdAt: new Date(now.getTime() - 60_000 * 5),
      updatedAt: new Date(now.getTime() - 60_000 * 1),
      startedAt: new Date(now.getTime() - 60_000 * 5),
    },
    {
      id: uuidv4(),
      type: 'transform',
      status: 'pending',
      priority: 3,
      payload: { inputKey: 's3://bucket/raw/data.csv', format: 'parquet' },
      attempts: 0,
      maxAttempts: 5,
      createdAt: new Date(now.getTime() - 60_000 * 2),
      updatedAt: new Date(now.getTime() - 60_000 * 2),
    },
    {
      id: uuidv4(),
      type: 'aggregate',
      status: 'running',
      priority: 7,
      payload: { window: '24h', metrics: ['p50', 'p95', 'p99'] },
      attempts: 1,
      maxAttempts: 2,
      createdAt: new Date(now.getTime() - 60_000 * 1),
      updatedAt: new Date(now.getTime() - 30_000),
      startedAt: new Date(now.getTime() - 30_000),
    },
    {
      id: uuidv4(),
      type: 'email',
      status: 'cancelled',
      priority: 2,
      payload: { to: 'bob@example.com', subject: 'Digest', body: 'Weekly update' },
      attempts: 0,
      maxAttempts: 1,
      createdAt: new Date(now.getTime() - 60_000 * 30),
      updatedAt: new Date(now.getTime() - 60_000 * 25),
    },
  ];

  const channels: NotificationChannel[] = [
    {
      id: 'ch-webhook-primary',
      type: 'webhook',
      endpoint: 'http://localhost:9000/events',
      active: true,
    },
    {
      id: 'ch-webhook-secondary',
      type: 'webhook',
      endpoint: 'http://localhost:9001/events',
      active: true,
    },
    {
      id: 'ch-email-ops',
      type: 'email',
      endpoint: 'ops@internal.example.com',
      active: false,
    },
  ];

  for (const job of jobs) {
    await db.insertJob(job);
  }

  for (const channel of channels) {
    await db.insertChannel(channel);
  }
}
