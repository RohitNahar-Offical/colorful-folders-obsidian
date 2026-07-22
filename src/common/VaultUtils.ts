import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin } from './types';

export function countItems(folderItem: obsidian.TFolder, plugin: IColorfulFoldersPlugin, deep = true): { files: number, folders: number } {
    if (!plugin.folderCountCache) {
        plugin.folderCountCache = new Map<string, { files: number, folders: number }>();
    }
    const countCache = plugin.folderCountCache;
    const cached = countCache.get(folderItem.path);
    if (cached) return cached;

    let files = 0;
    let folders = 0;

    const countRecursive = (folder: obsidian.TFolder) => {
        if (!folder.children) return;
        for (const child of folder.children) {
            if (child.name.startsWith('.')) continue;
            if (child instanceof obsidian.TFile) {
                files++;
            } else if (child instanceof obsidian.TFolder) {
                folders++;
                if (deep) {
                    countRecursive(child);
                }
            }
        }
    };

    countRecursive(folderItem);
    const res = { files, folders };
    countCache.set(folderItem.path, res);
    return res;
}
