/**
 * A max-priority queue: dequeue always returns the item with the highest priority.
 * Items with equal priority are returned in insertion order (FIFO).
 */
export declare class PriorityQueue<T> {
    private heap;
    private counter;
    enqueue(item: T, priority: number): void;
    dequeue(): T | undefined;
    peek(): T | undefined;
    get size(): number;
    isEmpty(): boolean;
    private dominates;
    private bubbleUp;
    private sinkDown;
    private swap;
}
