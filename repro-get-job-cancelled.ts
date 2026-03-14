/**
 * Reproduces: GET /api/jobs/:id returns 500 Internal Server Error when the job
 * status is "cancelled". Other statuses return 200.
 *
 * Run with server already up:
 *   1) npm run dev   (or npm start)
 *   2) npx ts-node repro-get-job-cancelled.ts
 */
const BASE = 'http://localhost:3000/api/jobs';

async function main(): Promise<void> {
  const createRes = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: 'email', payload: {} }),
  });
  if (!createRes.ok) {
    console.error('POST /api/jobs failed:', createRes.status, await createRes.text());
    process.exit(1);
  }
  const { jobId } = (await createRes.json()) as { jobId: string };
  console.log('Created job:', jobId);

  const cancelRes = await fetch(`${BASE}/${jobId}/cancel`, { method: 'POST' });
  if (!cancelRes.ok) {
    console.error('POST /api/jobs/:id/cancel failed:', cancelRes.status, await cancelRes.text());
    process.exit(1);
  }
  const cancelBody = (await cancelRes.json()) as { status: string };
  console.log('Cancelled job, status:', cancelBody.status);

  const getRes = await fetch(`${BASE}/${jobId}`);
  const getBody = await getRes.text();
  console.log('\nGET /api/jobs/:id response:', getRes.status, getRes.statusText);
  console.log('Body:', getBody);

  if (getRes.status === 500) {
    console.log('\n>>> Reproduced: GET /api/jobs/:id returns 500 for a cancelled job.');
  } else {
    console.log('\n>>> Expected 500 for cancelled job, got', getRes.status);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
