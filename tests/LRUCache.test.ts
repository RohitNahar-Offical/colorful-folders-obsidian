import { LRUCache } from '../src/common/LRUCache';

describe('LRUCache', () => {
    it('should store and retrieve values correctly', () => {
        const cache = new LRUCache<string, number>(3);
        cache.set('a', 1);
        cache.set('b', 2);
        expect(cache.get('a')).toBe(1);
        expect(cache.get('b')).toBe(2);
        expect(cache.get('c')).toBeUndefined();
    });

    it('should evict the oldest key when max capacity is exceeded', () => {
        const cache = new LRUCache<string, number>(2);
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3);

        expect(cache.get('a')).toBeUndefined(); // 'a' was evicted O(1)
        expect(cache.get('b')).toBe(2);
        expect(cache.get('c')).toBe(3);
    });

    it('should update key recency on get', () => {
        const cache = new LRUCache<string, number>(2);
        cache.set('a', 1);
        cache.set('b', 2);
        cache.get('a'); // Make 'a' recently accessed
        cache.set('c', 3); // Should evict 'b' instead of 'a'

        expect(cache.get('a')).toBe(1);
        expect(cache.get('b')).toBeUndefined();
        expect(cache.get('c')).toBe(3);
    });
});
