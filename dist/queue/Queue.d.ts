export declare class Queue<T> {
    private items;
    enqueue(item: T): void;
    dequeue(): T | undefined;
    peek(): T | undefined;
    get size(): number;
    isEmpty(): boolean;
    toArray(): T[];
    clear(): void;
}
