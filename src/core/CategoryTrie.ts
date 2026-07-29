import { AutoIconData } from '../common/types';

export class CategoryTrie {
    private trieMap = new Map<string, AutoIconData[]>();
    private fallbackCategories: AutoIconData[] = [];
    private _lookupArray: AutoIconData[] | null = null;

    public build(categories: AutoIconData[]) {
        this.trieMap.clear();
        this.fallbackCategories = [];
        this._lookupArray = null;

        for (const cat of categories) {
            const source = cat.rex.source.toLowerCase();
            // Handle numeric and date regexes (e.g. \d+, 19|20)
            if (source.includes('\\d') || source.includes('0-9') || /19\|20/.test(source)) {
                for (let d = 0; d <= 9; d++) {
                    const char = String(d);
                    if (!this.trieMap.has(char)) {
                        this.trieMap.set(char, []);
                    }
                    this.trieMap.get(char)!.push(cat);
                }
            }

            // Extract initial literal letter tokens from regex source (e.g., "journal|daily" -> "j", "d")
            const matches = source.match(/[a-z0-9]/g);
            if (matches && matches.length > 0 && !source.startsWith('.') && !source.startsWith('\\')) {
                const uniqueChars = new Set(matches.slice(0, 5));
                for (const char of uniqueChars) {
                    if (!this.trieMap.has(char)) {
                        this.trieMap.set(char, []);
                    }
                    this.trieMap.get(char)!.push(cat);
                }
            } else {
                this.fallbackCategories.push(cat);
            }
        }

        // Pre-compute the flattened lookup array to avoid Set/Array allocation on every lookup
        this._lookupArray = [...this.fallbackCategories];
        for (const [_, cats] of this.trieMap) {
            for (const cat of cats) {
                this._lookupArray.push(cat);
            }
        }
    }

    public lookup(name: string): AutoIconData[] {
        if (!name) return this.fallbackCategories;
        const words = name.toLowerCase().split(/[\s_.-]+/);

        if (!this._lookupArray) return this.fallbackCategories;

        // Use pre-computed array instead of building a Set on every call
        let result: AutoIconData[] | null = null;
        for (const word of words) {
            if (!word) continue;
            const firstChar = word.charAt(0);
            const candidates = this.trieMap.get(firstChar);
            if (candidates) {
                if (result === null) {
                    result = [...this._lookupArray];
                }
                for (const cat of candidates) {
                    if (!result.includes(cat)) {
                        result.push(cat);
                    }
                }
            }
        }
        return result ?? this._lookupArray;
    }
}
