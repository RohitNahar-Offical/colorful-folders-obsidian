import { PACK_PRIORITY } from '../common/constants';

export class IconPackIndex {
    private exactMap = new Map<string, string>();
    private suffixMap = new Map<string, string>();
    private isBuilt = false;
    private _localVersion = '';
    private _customVersion = '';

    private getPackPriority(iconKey: string): number {
        const lower = iconKey.toLowerCase();
        for (const [pack, prio] of Object.entries(PACK_PRIORITY)) {
            if (lower.startsWith(pack) || lower.includes(`-${pack}-`) || lower.includes(`/${pack}/`)) {
                return prio;
            }
        }
        return 10;
    }

    public build(localIcons: Record<string, string | null> | undefined, customIcons: Record<string, string> | undefined) {
        const localVersion = localIcons ? JSON.stringify(Object.keys(localIcons)) : '';
        const customVersion = customIcons ? JSON.stringify(Object.keys(customIcons)) : '';

        if (this.isBuilt && this._localVersion === localVersion && this._customVersion === customVersion) {
            return; // No change — skip rebuild
        }

        this.exactMap.clear();
        this.suffixMap.clear();

        const addIconKey = (key: string, value: string) => {
            const lKey = key.toLowerCase();
            if (!this.exactMap.has(lKey)) {
                this.exactMap.set(lKey, value);
            }
            
            const lastDash = lKey.lastIndexOf('-');
            const lastSlash = lKey.lastIndexOf('/');
            const splitIdx = Math.max(lastDash, lastSlash);
            if (splitIdx > 0 && splitIdx < lKey.length - 1) {
                const suffix = lKey.substring(splitIdx + 1);
                const existing = this.suffixMap.get(suffix);
                if (!existing) {
                    this.suffixMap.set(suffix, value);
                } else {
                    const existingPrio = this.getPackPriority(existing);
                    const newPrio = this.getPackPriority(value);
                    if (newPrio > existingPrio) {
                        this.suffixMap.set(suffix, value);
                    }
                }
            }
        };

        if (customIcons) {
            for (const key of Object.keys(customIcons)) {
                addIconKey(key, key);
            }
        }

        if (localIcons) {
            for (const key of Object.keys(localIcons)) {
                if (localIcons[key]) {
                    addIconKey(key, key);
                }
            }
        }

        this._localVersion = localVersion;
        this._customVersion = customVersion;
        this.isBuilt = true;
    }

    public findIcon(searchKey: string): string | null {
        if (!this.isBuilt) return null;
        const s = searchKey.toLowerCase().replace(/[\s_:]+/g, '-').replace(/\//g, '-');
        const cleanS = s.replace(/^(si|simple|simple-icons|simpleicons|feather|fa|fas|far|fab|fontawesome|ri|remix|remixicons|tb|tabler|mdi|material|oct|octicons|lucide)[-_:]/, '');

        // 1. Exact match
        if (this.exactMap.has(s)) return this.exactMap.get(s) || null;
        if (this.exactMap.has(cleanS)) return this.exactMap.get(cleanS) || null;

        // 2. Known prefixes
        const featherKey = `feather-${cleanS}`;
        if (this.exactMap.has(featherKey)) return this.exactMap.get(featherKey) || null;

        const simpleKey = `simple-icons-${cleanS}`;
        if (this.exactMap.has(simpleKey)) return this.exactMap.get(simpleKey) || null;

        // 3. O(1) Suffix map lookup
        if (this.suffixMap.has(cleanS)) {
            return this.suffixMap.get(cleanS) || null;
        }
        if (this.suffixMap.has(s)) {
            return this.suffixMap.get(s) || null;
        }

        return null;
    }

    public getIsBuilt(): boolean {
        return this.isBuilt;
    }

    public invalidate() {
        this.isBuilt = false;
        this._localVersion = '';
        this._customVersion = '';
        this.exactMap.clear();
        this.suffixMap.clear();
    }
}
