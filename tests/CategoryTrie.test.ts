import { CategoryTrie } from '../src/core/CategoryTrie';
import { AutoIconData } from '../src/common/types';

describe('CategoryTrie', () => {
    it('should build trie and lookup categories correctly', () => {
        const trie = new CategoryTrie();
        const mockData: AutoIconData = {
            tier: 1 as any,
            rex: /finance/,
            emoji: '🧪',
            lucide: 'flask',
            priority: 100
        };

        trie.build([mockData]);
        expect(trie.lookup('finance')).toContain(mockData);
        expect(trie.lookup('xyz')).toEqual([]);
    });
});
