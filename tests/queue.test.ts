import { PriorityQueue } from '../src/queue/PriorityQueue';
import { Queue } from '../src/queue/Queue';

describe('Queue (FIFO)', () => {
  it('returns items in insertion order', () => {
    const q = new Queue<number>();
    q.enqueue(1);
    q.enqueue(2);
    q.enqueue(3);
    expect(q.dequeue()).toBe(1);
    expect(q.dequeue()).toBe(2);
    expect(q.dequeue()).toBe(3);
  });

  it('returns undefined when empty', () => {
    const q = new Queue<string>();
    expect(q.dequeue()).toBeUndefined();
    expect(q.peek()).toBeUndefined();
  });

  it('tracks size correctly', () => {
    const q = new Queue<number>();
    expect(q.size).toBe(0);
    q.enqueue(1);
    expect(q.size).toBe(1);
    q.dequeue();
    expect(q.size).toBe(0);
  });
});

describe('PriorityQueue', () => {
  it('dequeues the highest-priority item first', () => {
    const pq = new PriorityQueue<string>();
    pq.enqueue('low',    1);
    pq.enqueue('high',   9);
    pq.enqueue('medium', 5);

    expect(pq.dequeue()).toBe('high');
    expect(pq.dequeue()).toBe('medium');
    expect(pq.dequeue()).toBe('low');
  });

  it('handles equal priorities in FIFO order', () => {
    const pq = new PriorityQueue<string>();
    pq.enqueue('first',  5);
    pq.enqueue('second', 5);
    pq.enqueue('third',  5);

    expect(pq.dequeue()).toBe('first');
    expect(pq.dequeue()).toBe('second');
    expect(pq.dequeue()).toBe('third');
  });

  it('interleaves priorities correctly', () => {
    const pq = new PriorityQueue<string>();
    pq.enqueue('b', 2);
    pq.enqueue('c', 1);
    pq.enqueue('a', 3);

    const order: string[] = [];
    while (!pq.isEmpty()) {
      order.push(pq.dequeue()!);
    }

    expect(order).toEqual(['a', 'b', 'c']);
  });

  it('processes 10 high-priority jobs before any low-priority job', () => {
    const pq = new PriorityQueue<string>();

    for (let i = 0; i < 5; i++) {
      pq.enqueue(`low-${i}`,  1);
    }
    for (let i = 0; i < 5; i++) {
      pq.enqueue(`high-${i}`, 10);
    }

    const results: string[] = [];
    while (!pq.isEmpty()) {
      results.push(pq.dequeue()!);
    }

    const highJobs = results.filter(r => r.startsWith('high'));
    const lowJobs  = results.filter(r => r.startsWith('low'));

    expect(highJobs).toHaveLength(5);
    expect(lowJobs).toHaveLength(5);

    const lastHighIndex = results.lastIndexOf(highJobs[highJobs.length - 1]);
    const firstLowIndex = results.indexOf(lowJobs[0]);
    expect(lastHighIndex).toBeLessThan(firstLowIndex);
  });

  it('returns undefined when dequeuing from empty queue', () => {
    const pq = new PriorityQueue<number>();
    expect(pq.dequeue()).toBeUndefined();
    expect(pq.peek()).toBeUndefined();
  });

  it('peek does not remove the element', () => {
    const pq = new PriorityQueue<number>();
    pq.enqueue(42, 10);
    expect(pq.peek()).toBe(42);
    expect(pq.size).toBe(1);
    expect(pq.dequeue()).toBe(42);
    expect(pq.size).toBe(0);
  });
});
