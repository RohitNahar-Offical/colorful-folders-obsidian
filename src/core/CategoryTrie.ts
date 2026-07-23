import { AutoIconData } from '../common/types';

export class CategoryTrie {
    private trieMap = new Map<string, AutoIconData[]>();
    private fallbackCategories: AutoIconData[] = [];

    public build(categories: AutoIconData[]) {
        this.trieMap.clear();
        this.fallbackCategories = [];

        for (const cat of categories) {
            const source = cat.rex.source.toLowerCase();
            // Extract initial literal letter tokens from regex source (e.g., "journal|daily" -> "j", "d")
            const matches = source.match(/[a-z0-9]/g);
            if (matches && matches.length > 0 && !source.startsWith('.') && !source.startsWith('\\')) {
                const uniqueChars = new Set(matches.slice(0, 5));
                for (const char of uniqueChars) {
                    let list = this.trieMap.get(char);
                    if (!list) {
                        list = [];
                        this.trieMap.set(char, list);
                    }
                    list.push(cat);
                }
            } else {
                this.fallbackCategories.push(cat);
            }
        }
    }

    public lookup(name: string): AutoIconData[] {
        if (!name) return this.fallbackCategories;
        const words = name.toLowerCase().split(/[\s_.-]+/);
        const resultSet = new Set<AutoIconData>(this.fallbackCategories);

        for (const word of words) {
            if (!word) continue;
            const firstChar = word.charAt(0);
            const candidates = this.trieMap.get(firstChar);
            if (candidates) {
                for (const cat of candidates) {
                    resultSet.add(cat);
                }
            }
        }
        return Array.from(resultSet);
    }
}
