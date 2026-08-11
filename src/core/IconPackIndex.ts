import { PACK_PRIORITY, DEFAULT_ICON_PACK_ORDER } from '../common/constants';
import { extractCoreIconKeyword } from '../common/utils';

export class IconPackIndex {
    private static readonly ALPHA_REGEX = /[a-zA-Z]/;
    private exactMap = new Map<string, string>();
    private coreMap = new Map<string, string>();
    private suffixMap = new Map<string, string>();
    private allKeys: string[] = [];
    private isBuilt = false;
    private _localRef: Record<string, string | null> | undefined = undefined;
    private _customRef: Record<string, string> | undefined = undefined;
    private _localCount = -1;
    private _customCount = -1;
    private _priorityOrder: string[] = DEFAULT_ICON_PACK_ORDER;
    private _effectiveOrder: string[] = DEFAULT_ICON_PACK_ORDER;
    private _priorityOrderKey: string = '';
    private _wideAutoIcons: boolean = false;

    public matchesPackId(iconKey: string, packId: string): boolean {
        if (!iconKey) return false;
        const lower = iconKey.toLowerCase();
        if (packId === 'custom') return lower.startsWith('custom-');
        if (packId === 'emoji') return !IconPackIndex.ALPHA_REGEX.test(iconKey);
        if (packId === 'bootstrap' || packId === 'bi') return lower.startsWith('bi-') || lower.includes('bootstrap');
        if (packId === 'simple-icons') return lower.startsWith('simple-') || lower.startsWith('si-');
        if (packId === 'tabler' || packId === 'tb') return lower.startsWith('tb-') || lower.startsWith('tabler-');
        if (packId === 'remix' || packId === 'ri') return lower.startsWith('ri-') || lower.startsWith('remix-');
        if (packId === 'font-awesome' || packId === 'fa') return lower.startsWith('fa-') || lower.startsWith('fas-') || lower.startsWith('fab-') || lower.startsWith('far-') || lower.includes('font-awesome');
        if (packId === 'material' || packId === 'mdi') return lower.startsWith('mdi-') || lower.includes('material');
        if (packId === 'feather') return lower.startsWith('feather-');
        if (packId === 'lucide') {
            if (lower.startsWith('lucide-')) return true;
            const isOtherPack = lower.startsWith('bi-') || lower.startsWith('fa-') || lower.startsWith('fas-') ||
                lower.startsWith('far-') || lower.startsWith('fab-') || lower.startsWith('tb-') ||
                lower.startsWith('tabler-') || lower.startsWith('ri-') || lower.startsWith('remix-') ||
                lower.startsWith('simple-') || lower.startsWith('si-') || lower.startsWith('mdi-') ||
                lower.startsWith('feather-') || lower.startsWith('custom-');
            return !isOtherPack && IconPackIndex.ALPHA_REGEX.test(iconKey);
        }
        return false;
    }

    private getPackPriority(iconKey: string): number {
        const lower = iconKey.toLowerCase();
        const userOrder = this._effectiveOrder;
        for (let i = 0; i < userOrder.length; i++) {
            if (this.matchesPackId(lower, userOrder[i])) {
                return (userOrder.length - i) * 100;
            }
        }
        for (const [pack, prio] of Object.entries(PACK_PRIORITY)) {
            if (lower.startsWith(pack) || lower.includes(`-${pack}-`) || lower.includes(`/${pack}/`)) {
                return prio;
            }
        }
        return 10;
    }

    public build(
        localIcons: Record<string, string | null> | undefined,
        customIcons: Record<string, string> | undefined,
        priorityOrder: string[] = DEFAULT_ICON_PACK_ORDER,
        wideAutoIcons: boolean = false
    ) {
        const localCount = localIcons ? Object.keys(localIcons).length : 0;
        const customCount = customIcons ? Object.keys(customIcons).length : 0;
        const orderKey = (priorityOrder || []).join(',');

        if (
            this.isBuilt &&
            this._localRef === localIcons &&
            this._customRef === customIcons &&
            this._localCount === localCount &&
            this._customCount === customCount &&
            this._priorityOrderKey === orderKey &&
            this._wideAutoIcons === wideAutoIcons
        ) {
            return; // No change — skip rebuild
        }

        this._priorityOrder = priorityOrder;
        this._priorityOrderKey = orderKey;
        this._wideAutoIcons = wideAutoIcons;

        let effective = [...(priorityOrder || DEFAULT_ICON_PACK_ORDER)];
        if (wideAutoIcons) {
            effective = effective.filter(p => p !== 'emoji').concat(['emoji']);
        }
        this._effectiveOrder = effective;

        this._localRef = localIcons;
        this._customRef = customIcons;
        this._localCount = localCount;
        this._customCount = customCount;

        this.exactMap.clear();
        this.coreMap.clear();
        this.suffixMap.clear();
        this.allKeys = [];

        const addIconKey = (key: string, value: string) => {
            const lKey = key.toLowerCase();
            this.allKeys.push(value);
            if (!this.exactMap.has(lKey)) {
                this.exactMap.set(lKey, value);
            }

            const { noPrefix, core } = extractCoreIconKeyword(lKey);

            if (noPrefix && !this.exactMap.has(noPrefix)) {
                this.exactMap.set(noPrefix, value);
            }

            if (core) {
                const existing = this.coreMap.get(core);
                if (!existing) {
                    this.coreMap.set(core, value);
                } else {
                    const existingPrio = this.getPackPriority(existing);
                    const newPrio = this.getPackPriority(value);
                    if (newPrio > existingPrio) {
                        this.coreMap.set(core, value);
                    }
                }
            }

            const lastDash = lKey.lastIndexOf('-');
            const lastSlash = lKey.lastIndexOf('/');
            const splitIdx = Math.max(lastDash, lastSlash);
            if (splitIdx > 0 && splitIdx < lKey.length - 1) {
                const suffix = lKey.substring(splitIdx + 1);
                if (!this.suffixMap.has(suffix)) {
                    this.suffixMap.set(suffix, value);
                }
            }
        };

        if (customIcons) {
            const customKeys = Object.keys(customIcons).sort();
            for (let i = 0; i < customKeys.length; i++) {
                const key = customKeys[i];
                addIconKey(key, key);
            }
        }

        if (localIcons) {
            const localKeys = Object.keys(localIcons).sort();
            for (let i = 0; i < localKeys.length; i++) {
                const key = localKeys[i];
                if (localIcons[key]) {
                    addIconKey(key, key);
                }
            }
        }

        this.isBuilt = true;
    }

    public findIcon(searchKey: string): string | null {
        if (!this.isBuilt) return null;
        const s = searchKey.toLowerCase().replace(/[\s_:]+/g, '-').replace(/\//g, '-');
        const { noPrefix, core } = extractCoreIconKeyword(s);

        // 1. Exact match
        if (this.exactMap.has(s)) return this.exactMap.get(s) || null;
        if (noPrefix && this.exactMap.has(noPrefix)) return this.exactMap.get(noPrefix) || null;
        if (core && this.exactMap.has(core)) return this.exactMap.get(core) || null;

        // 2. Core Keyword match (handles prefix + variant suffix combinations like ri-server-line or tb-server-2)
        if (core && this.coreMap.has(core)) {
            return this.coreMap.get(core) || null;
        }

        if (noPrefix && this.coreMap.has(noPrefix)) {
            return this.coreMap.get(noPrefix) || null;
        }

        // 3. Fallback suffix map lookup
        if (core && this.suffixMap.has(core)) {
            return this.suffixMap.get(core) || null;
        }
        if (noPrefix && this.suffixMap.has(noPrefix)) {
            return this.suffixMap.get(noPrefix) || null;
        }
        if (this.suffixMap.has(s)) {
            return this.suffixMap.get(s) || null;
        }

        return null;
    }

    public searchFuzzy(searchKey: string, options?: { threshold?: number }): string | null {
        if (!this.isBuilt || !searchKey) return null;
        
        // Fast-path: O(1) exact or core keyword match
        const exact = this.findIcon(searchKey);
        if (exact) return exact;

        if (searchKey.length < 3) return null;

        const threshold = options?.threshold ?? 0.8;
        const normKey = searchKey.toLowerCase().trim();
        const maxLenDiffRatio = 1 - threshold;

        let bestMatch: string | null = null;
        let bestScore = 0;

        for (const candidateKey of this.allKeys) {
            const candidateLower = candidateKey.toLowerCase();
            const lenA = normKey.length;
            const lenB = candidateLower.length;
            const maxLen = Math.max(lenA, lenB);
            
            // Length-difference pruning
            if (Math.abs(lenA - lenB) / maxLen > maxLenDiffRatio) {
                continue;
            }

            const score = this.calculateSimilarity(normKey, candidateLower);
            if (score >= threshold && score > bestScore) {
                bestScore = score;
                bestMatch = candidateKey;
                if (bestScore >= 0.95) break; // Early termination on near-exact match
            }
        }

        return bestMatch;
    }

    private calculateSimilarity(a: string, b: string): number {
        if (a === b) return 1.0;
        if (!a || !b) return 0;
        const { core: coreA, noPrefix: npA } = extractCoreIconKeyword(a);
        const { core: coreB, noPrefix: npB } = extractCoreIconKeyword(b);

        if (coreA && coreB && coreA === coreB) return 0.95;
        if (npA && npB && npA === npB) return 0.95;

        // Word boundary / prefix alignment check (prevents false substring matches like "cat" in "communication-category")
        const wordsB = b.split(/[-_: ]+/);
        if (b.startsWith(a) || a.startsWith(b) || wordsB.includes(a)) {
            const minLen = Math.min(a.length, b.length);
            if (minLen >= 4) return 0.85;
        }

        const dist = this.levenshteinDistance(a, b);
        const maxLen = Math.max(a.length, b.length);
        return maxLen === 0 ? 1 : 1 - dist / maxLen;
    }

    private levenshteinDistance(a: string, b: string): number {
        if (a === b) return 0;
        const lenA = a.length;
        const lenB = b.length;
        if (lenA === 0) return lenB;
        if (lenB === 0) return lenA;

        let prev = new Int32Array(lenB + 1);
        let curr = new Int32Array(lenB + 1);

        for (let j = 0; j <= lenB; j++) prev[j] = j;

        for (let i = 1; i <= lenA; i++) {
            curr[0] = i;
            const charA = a.charCodeAt(i - 1);
            for (let j = 1; j <= lenB; j++) {
                const cost = charA === b.charCodeAt(j - 1) ? 0 : 1;
                curr[j] = Math.min(
                    curr[j - 1] + 1,
                    prev[j] + 1,
                    prev[j - 1] + cost
                );
            }
            const temp = prev;
            prev = curr;
            curr = temp;
        }
        return prev[lenB];
    }

    public getIsBuilt(): boolean {
        return this.isBuilt;
    }

    public invalidate() {
        this.isBuilt = false;
        this._localRef = undefined;
        this._customRef = undefined;
        this._localCount = -1;
        this._customCount = -1;
        this.exactMap.clear();
        this.coreMap.clear();
        this.suffixMap.clear();
        this.allKeys = [];
    }
}
