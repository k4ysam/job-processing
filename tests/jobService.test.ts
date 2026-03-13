import { InMemoryDatabase } from '../src/db/db';
import { JobService } from '../src/services/jobService';
import { JobProcessor } from '../src/jobs/processor';
import { CreateJobInput } from '../src/types';

function makeInput(overrides: Partial<CreateJobInput> = {}): CreateJobInput {
  return {
    type: 'email',
    payload: { to: 'test@example.com', subject: 'Hi' },
    priority: 5,
    maxAttempts: 3,
    ...overrides,
  };
}

describe('JobService', () => {
  let db: InMemoryDatabase;
  let service: JobService;

  beforeEach(() => {
    db = new InMemoryDatabase();
    service = new JobService(db);
  });

  describe('createJob', () => {
    it('returns a job with the expected fields', async () => {
      const job = await service.createJob(makeInput({ type: 'webhook', priority: 8 }));
      expect(job.id).toBeTruthy();
      expect(job.type).toBe('webhook');
      expect(job.priority).toBe(8);
      expect(job.status).toBe('pending');
    });

    it('persists the job so it can be retrieved by id', async () => {
      const created = await service.createJob(makeInput());
      const fetched = await service.getJob(created.id);
      expect(fetched).not.toBeNull();
      expect(fetched!.id).toBe(created.id);
    });

    it('persists all concurrently created jobs', async () => {
      const inputs = Array.from({ length: 5 }, () => makeInput());
      const jobs = await Promise.all(inputs.map(i => service.createJob(i)));

      const fetched = await Promise.all(jobs.map(j => service.getJob(j.id)));
      const missing = fetched.filter(j => j === null);
      expect(missing).toHaveLength(0);
    });
  });

  describe('listJobs', () => {
    it('returns the first page starting from the first item', async () => {
      for (let i = 0; i < 5; i++) {
        await service.createJob(makeInput());
      }

      const page1 = await service.listJobs(1, 3);
      expect(page1.data).toHaveLength(3);
      expect(page1.total).toBe(5);
    });

    it('page 1 and page 2 return non-overlapping jobs', async () => {
      for (let i = 0; i < 6; i++) {
        await service.createJob(makeInput());
      }

      const page1 = await service.listJobs(1, 3);
      const page2 = await service.listJobs(2, 3);

      const ids1 = new Set(page1.data.map(j => j.id));
      const overlap = page2.data.filter(j => ids1.has(j.id));
      expect(overlap).toHaveLength(0);
    });
  });

  describe('updateJobStatus', () => {
    it('reflects the new status when the job is re-fetched', async () => {
      const job = await service.createJob(makeInput());
      await service.updateJobStatus(job.id, 'running');

      const fetched = await service.getJob(job.id);
      expect(fetched!.status).toBe('running');
    });

    it('reflects an updated status even when the result is cached', async () => {
      const job = await service.createJob(makeInput());

      await service.getJob(job.id);

      await service.updateJobStatus(job.id, 'completed');

      const refetched = await service.getJob(job.id);
      expect(refetched!.status).toBe('completed');
    });
  });
});

describe('JobProcessor', () => {
  let db: InMemoryDatabase;
  let processor: JobProcessor;

  beforeEach(() => {
    db = new InMemoryDatabase();
    processor = new JobProcessor(db);
  });

  describe('processBatch', () => {
    it('processes all jobs in the batch', async () => {
      const service = new JobService(db);
      const jobs = await Promise.all([
        service.createJob(makeInput()),
        service.createJob(makeInput()),
        service.createJob(makeInput()),
      ]);

      // Wait for all jobs to be persisted
      await new Promise(resolve => setImmediate(resolve));

      processor.processBatch(jobs);

      // Allow the batch to fully drain before checking stats
      await new Promise(resolve => setTimeout(resolve, 200));

      expect(processor.getStats().processed).toBe(3);
    });
  });

  describe('execute', () => {
    it('does not run the same job twice when called concurrently', async () => {
      const service = new JobService(db);
      const job = await service.createJob(makeInput());

      await new Promise(resolve => setImmediate(resolve));

      const fetched = await db.findJobById(job.id);
      if (!fetched) throw new Error('Job not found in DB');

      const execCount = { value: 0 };
      const countingProcessor = new JobProcessor(db, async () => {
        execCount.value++;
        await new Promise(resolve => setTimeout(resolve, 50));
        return { done: true };
      });

      await Promise.all([
        countingProcessor.execute(fetched),
        countingProcessor.execute(fetched),
      ]);

      expect(execCount.value).toBe(1);
    });
  });
});
