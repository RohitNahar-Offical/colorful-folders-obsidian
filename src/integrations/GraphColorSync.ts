import { TFolder } from 'obsidian';
import { IColorfulFoldersPlugin } from '../common/types';

/** Tag appended to CF-generated graph group queries so we never overwrite user groups. */
const CF_GROUP_TAG = ' [cf-sync]';

/** Converts a hex color string to the integer RGB format Obsidian's graph.json expects. */
function hexToGraphRgb(hex: string): number {
    const clean = hex.replace('#', '');
    const r = parseInt(clean.substring(0, 2), 16);
    const g = parseInt(clean.substring(2, 4), 16);
    const b = parseInt(clean.substring(4, 6), 16);
    return (r << 16) | (g << 8) | b;
}

interface GraphColorGroup {
    query: string;
    color: { a: number; rgb: number };
}

interface GraphJson {
    colorGroups?: GraphColorGroup[];
    [key: string]: unknown;
}

/**
 * GraphColorSync Integration
 *
 * Syncs Colorful Folders' per-folder colors into Obsidian's native Graph View
 * by writing path-based colorGroups to .obsidian/graph.json.
 *
 * Strategy:
 * - Only syncs folders that have a custom/explicit color set via the plugin,
 *   plus all top-level folders using the active palette.
 * - All CF-generated groups are tagged with CF_GROUP_TAG in their query string
 *   so they can be identified and replaced without touching user-created groups.
 * - User-created groups are NEVER modified or deleted.
 */
export class GraphColorSync {

    /**
     * Builds the array of CF-owned colorGroups from the current plugin state.
     * Walks all top-level folders and any folder with an explicit custom style.
     */
    static buildColorGroups(plugin: IColorfulFoldersPlugin): GraphColorGroup[] {
        const groups: GraphColorGroup[] = [];
        const seen = new Set<string>();
        const root = plugin.app.vault.getRoot();

        const processFolder = (folder: TFolder) => {
            if (seen.has(folder.path)) return;
            seen.add(folder.path);

            // Skip root itself
            if (folder.path === '/') {
                for (const child of folder.children) {
                    if (child instanceof TFolder) processFolder(child);
                }
                return;
            }

            const style = plugin.getEffectiveStyle(folder);
            if (!style?.hex) {
                // Still walk children for explicit custom-color descendants
                for (const child of folder.children) {
                    if (child instanceof TFolder) processFolder(child);
                }
                return;
            }

            const hex = style.hex;
            if (!hex || hex.length < 4) {
                for (const child of folder.children) {
                    if (child instanceof TFolder) processFolder(child);
                }
                return;
            }

            // Use the folder name for the query when it's a top-level folder,
            // use path: for deeper folders to be precise
            const isTopLevel = folder.parent?.path === '/';
            const query = isTopLevel
                ? `path:"${folder.name}"${CF_GROUP_TAG}`
                : `path:"${folder.path}"${CF_GROUP_TAG}`;

            groups.push({
                query,
                color: { a: 1, rgb: hexToGraphRgb(hex) }
            });

            // Walk children to pick up any explicitly styled subfolders
            for (const child of folder.children) {
                if (child instanceof TFolder) {
                    // Only recurse into children that have explicit custom styles
                    const childRawStyle = plugin.settings.customFolderColors[child.path];
                    if (childRawStyle) {
                        processFolder(child);
                    }
                }
            }
        };

        for (const child of root.children) {
            if (child instanceof TFolder) processFolder(child);
        }

        return groups;
    }

    /** Returns the path to graph.json inside the vault's config directory. */
    private static getGraphJsonPath(plugin: IColorfulFoldersPlugin): string {
        // app.vault.configDir is the ".obsidian" directory path
        return `${plugin.app.vault.configDir}/graph.json`;
    }

    /** Safely reads and parses graph.json. Returns an empty object if it doesn't exist. */
    private static async readGraphJson(plugin: IColorfulFoldersPlugin): Promise<GraphJson> {
        const path = this.getGraphJsonPath(plugin);
        try {
            const exists = await plugin.app.vault.adapter.exists(path);
            if (!exists) return {};
            const raw = await plugin.app.vault.adapter.read(path);
            return JSON.parse(raw) as GraphJson;
        } catch (e) {
            console.warn('[Colorful Folders] Could not read graph.json:', e);
            return {};
        }
    }

    /** Writes the modified graph.json back to disk. */
    private static async writeGraphJson(plugin: IColorfulFoldersPlugin, data: GraphJson): Promise<void> {
        const path = this.getGraphJsonPath(plugin);
        try {
            await plugin.app.vault.adapter.write(path, JSON.stringify(data, null, 2));
        } catch (e) {
            console.error('[Colorful Folders] Could not write graph.json:', e);
        }
    }

    /**
     * Main sync entry point.
     * Builds CF groups and merges them into graph.json, preserving user-created groups.
     */
    static async syncGraphColors(plugin: IColorfulFoldersPlugin): Promise<void> {
        if (!plugin.settings.graphColorSync) return;

        const cfGroups = this.buildColorGroups(plugin);
        const graphData = await this.readGraphJson(plugin);

        // Separate user-created groups from CF-owned ones
        const existingGroups: GraphColorGroup[] = graphData.colorGroups ?? [];
        const userGroups = existingGroups.filter(g => !g.query.endsWith(CF_GROUP_TAG));

        // Merge: user groups first (higher visual priority in graph), then CF groups
        graphData.colorGroups = [...userGroups, ...cfGroups];

        await this.writeGraphJson(plugin, graphData);
    }

    /**
     * Removes all CF-generated groups from graph.json.
     * Called when the feature is disabled or the plugin unloads.
     */
    static async clearGraphColors(plugin: IColorfulFoldersPlugin): Promise<void> {
        const graphData = await this.readGraphJson(plugin);
        if (!graphData.colorGroups) return;

        const userGroups = graphData.colorGroups.filter(g => !g.query.endsWith(CF_GROUP_TAG));

        // Only write if we actually removed something
        if (userGroups.length === graphData.colorGroups.length) return;

        graphData.colorGroups = userGroups;
        await this.writeGraphJson(plugin, graphData);
    }
}
