"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityQueue = void 0;
/**
 * A max-priority queue: dequeue always returns the item with the highest priority.
 * Items with equal priority are returned in insertion order (FIFO).
 */
class PriorityQueue {
    constructor() {
        this.heap = [];
        this.counter = 0;
    }
    enqueue(item, priority) {
        this.heap.push({ item, priority, insertedAt: this.counter++ });
        this.bubbleUp(this.heap.length - 1);
    }
    dequeue() {
        if (this.heap.length === 0)
            return undefined;
        this.swap(0, this.heap.length - 1);
        const node = this.heap.pop();
        if (this.heap.length > 0) {
            this.sinkDown(0);
        }
        return node.item;
    }
    peek() {
        return this.heap[0]?.item;
    }
    get size() {
        return this.heap.length;
    }
    isEmpty() {
        return this.heap.length === 0;
    }
    dominates(a, b) {
        if (a.priority !== b.priority)
            return a.priority > b.priority;
        return a.insertedAt < b.insertedAt;
    }
    bubbleUp(index) {
        while (index > 0) {
            const parent = Math.floor((index - 1) / 2);
            if (this.heap[parent].priority > this.heap[index].priority) {
                this.swap(parent, index);
                index = parent;
            }
            else {
                break;
            }
        }
    }
    sinkDown(index) {
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
            if (target === index)
                break;
            this.swap(target, index);
            index = target;
        }
    }
    swap(i, j) {
        [this.heap[i], this.heap[j]] = [this.heap[j], this.heap[i]];
    }
}
exports.PriorityQueue = PriorityQueue;
//# sourceMappingURL=PriorityQueue.js.map