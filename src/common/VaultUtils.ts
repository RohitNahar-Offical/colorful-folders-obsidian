import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin } from './types';

export function countItems(folderItem: obsidian.TFolder, plugin: IColorfulFoldersPlugin): { files: number, folders: number } {
    if (!plugin.folderCountCache) {
        plugin.folderCountCache = new Map<string, { files: number, folders: number }>();
    }
    const countCache = plugin.folderCountCache;
    const cached = countCache.get(folderItem.path);
    if (cached) return cached;

    let files = 0;
    let folders = 0;
    if (folderItem.children) {
        for (const child of folderItem.children) {
            if (child.name.startsWith('.')) continue;
            if (child instanceof obsidian.TFile) files++;
            else if (child instanceof obsidian.TFolder) folders++;
        }
    }
    const res = { files, folders };
    countCache.set(folderItem.path, res);
    return res;
}
