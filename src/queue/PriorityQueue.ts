interface HeapNode<T> {
  item: T;
  priority: number;
  insertedAt: number;
}

/**
 * A max-priority queue: dequeue always returns the item with the highest priority.
 * Items with equal priority are returned in insertion order (FIFO).
 */
export class PriorityQueue<T> {
  private heap: HeapNode<T>[] = [];
  private counter = 0;

  enqueue(item: T, priority: number): void {
    this.heap.push({ item, priority, insertedAt: this.counter++ });
    this.bubbleUp(this.heap.length - 1);
  }

  dequeue(): T | undefined {
    if (this.heap.length === 0) return undefined;
    this.swap(0, this.heap.length - 1);
    const node = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.sinkDown(0);
    }
    return node.item;
  }

  peek(): T | undefined {
    return this.heap[0]?.item;
  }

  get size(): number {
    return this.heap.length;
  }

  isEmpty(): boolean {
    return this.heap.length === 0;
  }

  private dominates(a: HeapNode<T>, b: HeapNode<T>): boolean {
    if (a.priority !== b.priority) return a.priority > b.priority;
    return a.insertedAt < b.insertedAt;
  }

  private bubbleUp(index: number): void {
    while (index > 0) {
      const parent = Math.floor((index - 1) / 2);
      if (this.heap[parent].priority > this.heap[index].priority) {
        this.swap(parent, index);
        index = parent;
      } else {
        break;
      }
    }
  }

  private sinkDown(index: number): void {
    const length = this.heap.length;
    while (true) {
      const left = 2 * index + 1;
      const right = 2 * index + 2;
      let target = index;

      if (left < length && this.heap[left].priority < this.heap[target].priority) {
        target = left;
      }
      if (right < length && this.heap[right].priority < this.heap[target].priority) {
        target = right;
      }

      if (target === index) break;
      this.swap(target, index);
      index = target;
    }
  }

  private swap(i: number, j: number): void {
    [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
  }
}
