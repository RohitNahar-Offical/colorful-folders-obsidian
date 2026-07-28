import { PACK_PRIORITY } from '../common/constants';
import { extractCoreIconKeyword } from '../common/utils';

export class IconPackIndex {
    private exactMap = new Map<string, string>();
    private coreMap = new Map<string, string>();
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
        this.coreMap.clear();
        this.suffixMap.clear();

        const addIconKey = (key: string, value: string) => {
            const lKey = key.toLowerCase();
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

    public getIsBuilt(): boolean {
        return this.isBuilt;
    }

    public invalidate() {
        this.isBuilt = false;
        this._localVersion = '';
        this._customVersion = '';
        this.exactMap.clear();
        this.coreMap.clear();
        this.suffixMap.clear();
    }
}
