import { AutoIconData } from '../common/types';

interface TrieNode {
    children: Map<string, TrieNode>;
    categories: AutoIconData[];
}

function createTrieNode(): TrieNode {
    return { children: new Map(), categories: [] };
}

export class CategoryTrie {
    private root: TrieNode = createTrieNode();
    private fallbackCategories: AutoIconData[] = [];

    public build(categories: AutoIconData[]) {
        this.root = createTrieNode();
        this.fallbackCategories = [];

        for (const cat of categories) {
            const source = cat.rex.source.toLowerCase();
            let isLiteralInserted = false;

            // Handle numeric / digit regex patterns
            if (source.includes('\\d') || source.includes('0-9') || /19\|20/.test(source)) {
                for (let d = 0; d <= 9; d++) {
                    this.insertWord(String(d), cat);
                }
                isLiteralInserted = true;
            }

            // Extract literal word tokens (e.g., from "journal|daily|notes")
            const wordTokens = source.match(/[a-z0-9]+/g);
            if (wordTokens && wordTokens.length > 0 && !source.startsWith('.') && !source.startsWith('\\')) {
                for (const word of wordTokens) {
                    if (word.length >= 2 && !['or', 'and', 'in', 'of', 'to', 'for'].includes(word)) {
                        this.insertWord(word, cat);
                        isLiteralInserted = true;
                    }
                }
            }

            if (!isLiteralInserted) {
                this.fallbackCategories.push(cat);
            }
        }
    }

    private insertWord(word: string, cat: AutoIconData) {
        let node = this.root;
        for (let i = 0; i < word.length; i++) {
            const ch = word.charAt(i);
            let child = node.children.get(ch);
            if (!child) {
                child = createTrieNode();
                node.children.set(ch, child);
            }
            node = child;
            if (!node.categories.includes(cat)) {
                node.categories.push(cat);
            }
        }
    }

    public lookup(name: string): AutoIconData[] {
        if (!name) return this.fallbackCategories;
        const words = name.toLowerCase().split(/[^\p{L}\p{N}]+/gu);

        const matchedSet = new Set<AutoIconData>();

        for (const word of words) {
            if (!word) continue;
            let node = this.root;
            for (let i = 0; i < word.length; i++) {
                const ch = word.charAt(i);
                const nextNode = node.children.get(ch);
                if (!nextNode) break;
                node = nextNode;
                for (const cat of node.categories) {
                    matchedSet.add(cat);
                }
            }
        }

        const results = Array.from(matchedSet);
        for (const fb of this.fallbackCategories) {
            if (!matchedSet.has(fb)) {
                results.push(fb);
            }
        }
        results.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return results;
    }
}
