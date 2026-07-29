import { IColorfulFoldersPlugin, FolderStyle, AutoIconData } from '../common/types';
import { IconRepository } from './IconRepository';

export class IconManager {
    plugin: IColorfulFoldersPlugin;
    repository: IconRepository;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
        this.repository = new IconRepository(plugin);
    }

    getAutoIconData(name: string, path?: string): AutoIconData | null {
        return this.repository.getAutoIconData(name, path);
    }

    findIconInPacks(searchKey: string): string | null {
        return this.repository.findIconInPacks(searchKey);
    }

    invalidateCategoryCache(): void {
        this.repository.invalidateCache();
    }

    isEmojiIcon(iconId?: string | null): boolean {
        return this.repository.isEmojiIcon(iconId);
    }

    getIconSvg(iconId: string, shouldEncode = true): string {
        return this.repository.getIconSvg(iconId, shouldEncode);
    }

    getDataUri(iconId: string): string {
        return this.repository.getDataUri(iconId);
    }

    normalizeSvg(svgStr: string, shouldEncode = true): string {
        return this.repository.normalizeSvg(svgStr, shouldEncode);
    }

    preNormalizeIcon(id: string, rawSvg: string): void {
        this.repository.preNormalizeIcon(id, rawSvg);
    }

    searchFuzzy(searchKey: string, options?: { threshold?: number }): string | null {
        return this.repository.searchFuzzy(searchKey, options);
    }
}
