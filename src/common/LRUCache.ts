export class LRUCache<K, V> {
    private capacity: number;
    private map: Map<K, V>;

    constructor(capacity: number) {
        this.capacity = capacity;
        this.map = new Map<K, V>();
    }

    public get(key: K): V | undefined {
        const val = this.map.get(key);
        if (val === undefined) return undefined;
        this.map.delete(key);
        this.map.set(key, val);
        return val;
    }

    public set(key: K, value: V): void {
        if (this.map.has(key)) {
            this.map.delete(key);
        } else if (this.map.size >= this.capacity) {
            const firstKey: K | undefined = this.map.keys().next().value as K | undefined;
            if (firstKey !== undefined) {
                this.map.delete(firstKey);
            }
        }
        this.map.set(key, value);
    }

    public has(key: K): boolean {
        return this.map.has(key);
    }

    public delete(key: K): boolean {
        return this.map.delete(key);
    }

    public clear(): void {
        this.map.clear();
    }

    public get size(): number {
        return this.map.size;
    }
}
