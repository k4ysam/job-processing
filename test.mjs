// repro-challenge5.mjs
const base = 'http://localhost:3000/api/jobs';

const res = await fetch(base, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'email', payload: {} }),
});
const { jobId } = await res.json();
console.log('POST 202, jobId:', jobId);

// No delay — GET immediately
const getRes = await fetch(`${base}/${jobId}`);
console.log('GET status:', getRes.status, getRes.status === 404 ? '(Not Found)' : '');
if (getRes.ok) {
  console.log('GET body:', await getRes.json());
} else {
  console.log('GET body:', await getRes.text());
}