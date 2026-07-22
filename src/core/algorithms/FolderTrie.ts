import { FolderStyle } from '../../common/types';

export class FolderTrieNode {
    segment: string;
    style: FolderStyle | null = null;
    children: Map<string, FolderTrieNode> = new Map();

    constructor(segment: string) {
        this.segment = segment;
    }
}

export class FolderTrie {
    root: FolderTrieNode = new FolderTrieNode('');

    /**
     * Inserts a path and its style into the Trie in O(K) time (K = depth).
     */
    insert(path: string, style: FolderStyle): void {
        if (!path) return;
        const segments = path.split('/').filter(Boolean);
        let curr = this.root;

        for (const seg of segments) {
            let child = curr.children.get(seg);
            if (!child) {
                child = new FolderTrieNode(seg);
                curr.children.set(seg, child);
            }
            curr = child;
        }

        curr.style = style;
    }

    /**
     * Removes a path from the Trie in O(K) time.
     */
    delete(path: string): void {
        if (!path) return;
        const segments = path.split('/').filter(Boolean);
        this.deleteRecursive(this.root, segments, 0);
    }

    private deleteRecursive(node: FolderTrieNode, segments: string[], index: number): boolean {
        if (index === segments.length) {
            node.style = null;
            return node.children.size === 0;
        }

        const seg = segments[index];
        const child = node.children.get(seg);
        if (!child) return false;

        const shouldDeleteChild = this.deleteRecursive(child, segments, index + 1);
        if (shouldDeleteChild) {
            node.children.delete(seg);
            return node.style === null && node.children.size === 0;
        }

        return false;
    }

    /**
     * Gets direct style stored at path in O(K) time.
     */
    getDirectStyle(path: string): FolderStyle | null {
        if (!path) return null;
        const segments = path.split('/').filter(Boolean);
        let curr = this.root;

        for (const seg of segments) {
            const child = curr.children.get(seg);
            if (!child) return null;
            curr = child;
        }

        return curr.style;
    }

    /**
     * Resolves effective style and inherited style along the path ancestry in O(K) time.
     */
    resolveEffectiveStyle(path: string): {
        directStyle: FolderStyle | null;
        inheritedStyle: FolderStyle | null;
    } {
        if (!path) {
            return { directStyle: null, inheritedStyle: null };
        }

        const segments = path.split('/').filter(Boolean);
        let curr = this.root;
        let directStyle: FolderStyle | null = null;
        let inheritedStyle: FolderStyle | null = null;

        for (let i = 0; i < segments.length; i++) {
            const seg = segments[i];
            const child = curr.children.get(seg);
            if (!child) break;

            if (child.style) {
                if (i === segments.length - 1) {
                    directStyle = child.style;
                } else if (child.style.applyToSubfolders || child.style.applyToFiles) {
                    inheritedStyle = child.style;
                }
            }
            curr = child;
        }

        return { directStyle, inheritedStyle };
    }

    /**
     * Rebuilds the entire Trie from settings customFolderColors object.
     */
    rebuildFromSettings(customFolderColors: Record<string, FolderStyle | string>): void {
        this.root = new FolderTrieNode('');
        for (const path in customFolderColors) {
            const val = customFolderColors[path];
            if (!val) continue;
            const styleObj: FolderStyle = typeof val === 'string' ? { hex: val } : val;
            this.insert(path, styleObj);
        }
    }
}
