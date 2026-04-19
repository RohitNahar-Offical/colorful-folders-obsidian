import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, FolderStyle } from '../common/types';
import { DividerModal } from '../ui/modals/DividerModal';
import { safeEscape } from '../common/utils';

/**
 * DividerManager — Complete rewrite for stability.
 */
export class DividerManager {
    plugin: IColorfulFoldersPlugin;
    app: obsidian.App;

    // eslint-disable-next-line obsidianmd/prefer-active-doc
    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
        this.app = plugin.app;
    }

    // ─── Divider Node Factory ───────────────────────────────────────────

    private buildDividerNode(path: string, conf: FolderStyle): HTMLElement {
        const dividerThickness = this.plugin.settings.dividerThickness || 1.5;
        const globalLineStyle = this.plugin.settings.dividerLineStyle || 'solid';

        const div = activeDocument.createElement('div');
        div.className = 'cf-interactive-divider';
        div.dataset.dividerTarget = path;
        
        // Resolve per-divider config with fallbacks
        const name = conf.dividerText || 'Section';
        const color = conf.dividerColor || 'var(--interactive-accent)';
        const isUpper = conf.dividerUpper !== false;
        const alignment = conf.dividerAlignment || 'center';
        const useGlass = conf.dividerGlass !== undefined
            ? conf.dividerGlass
            : this.plugin.settings.glassmorphism;
        const lineStyle = conf.dividerLineStyle && conf.dividerLineStyle !== 'global'
            ? conf.dividerLineStyle
            : globalLineStyle;

        // ── Bridge (flex row: line — chip — line) ───────────────────────
        const bridge = div.createDiv({ cls: 'cf-divider-bridge' });
        bridge.setCssStyles({
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: '8px'
        });

        const makeLine = (side: 'left' | 'right') => {
            const line = bridge.createDiv({ cls: `cf-divider-line cf-divider-line-${side}` });
            line.setCssStyles({
                flexGrow: '1',
                height: `${dividerThickness}px`
            });

            const gradDir = side === 'left' ? 'right' : 'left';
            if (lineStyle === 'solid') {
                line.setCssStyles({ background: `linear-gradient(to ${gradDir}, transparent, ${color})` });
            } else {
                const thick = (lineStyle === 'dotted' || lineStyle === 'dashed') ? dividerThickness + 1 : dividerThickness;
                line.setCssStyles({
                    borderBottom: `${thick}px ${lineStyle} ${color}`,
                    opacity: '0.5'
                });
                const mask = `linear-gradient(to ${gradDir}, transparent, black)`;
                line.setCssStyles({
                    maskImage: mask,
                    webkitMaskImage: mask
                });
            }
            return line;
        };

        if (alignment === 'center' || alignment === 'right') makeLine('left');

        // ── Chip (pill label) ───────────────────────────────────────────
        const chip = bridge.createDiv({ cls: 'cf-divider-chip' });
        // Use CSS variables for dynamic properties to comply with Obsidian guidelines
        chip.setCssProps({
            '--cf-divider-color': color,
            '--cf-divider-font-size': isUpper ? '10px' : '12px',
            '--cf-divider-font-weight': isUpper ? '800' : '600',
            '--cf-divider-text-transform': isUpper ? 'uppercase' : 'none',
            '--cf-divider-letter-spacing': isUpper ? '1px' : 'normal'
        });

        if (this.plugin.settings.dividerPillMode !== false) {
            chip.setCssStyles({
                padding: '2px 10px',
                borderRadius: '10px'
            });
            if (useGlass) {
                chip.setCssStyles({
                    backgroundColor: 'rgba(var(--mono-rgb-100), 0.04)',
                    backdropFilter: 'blur(16px)'
                });
            } else {
                chip.setCssStyles({ backgroundColor: 'var(--background-secondary-alt)' });
            }
        } else {
            chip.setCssStyles({
                backgroundColor: 'transparent',
                backdropFilter: 'none',
                padding: '0'
            });
        }

        // Icon (Lucide or emoji)
        let labelText = isUpper ? name.toUpperCase() : name;
        const rawIcon = conf.dividerIcon ? conf.dividerIcon.trim() : '';
        if (rawIcon) {
            const iconIds: string[] = (obsidian as { getIconIds?: () => string[] }).getIconIds?.() || [];
            const isLucide = iconIds.includes(`lucide-${rawIcon}`) || iconIds.includes(rawIcon);
            if (isLucide) {
                const iconWrap = chip.createSpan({ cls: 'cf-divider-icon' });
                obsidian.setIcon(iconWrap, rawIcon);
                const svg = iconWrap.querySelector('svg') as unknown as HTMLElement | null;
                if (svg) {
                    svg.setCssStyles({
                        width: '14px',
                        height: '14px',
                        stroke: color,
                        strokeWidth: '2.5px'
                    });
                }
            } else {
                // Treat as emoji — prepend to label
                labelText = `${rawIcon} ${name}`;
            }
        }

        chip.createSpan({ text: labelText, cls: 'cf-divider-label' });

        if (alignment === 'center' || alignment === 'left') makeLine('right');

        // ── Event handlers ──────────────────────────────────────────────
        div.oncontextmenu = (e) => {
            e.preventDefault();
            const menu = new obsidian.Menu();

            menu.addItem((item) => {
                item.setTitle('Edit divider')
                    .setIcon('settings-2')
                    .onClick(() => {
                        const file = this.app.vault.getAbstractFileByPath(path);
                        if (file) new DividerModal(this.app, this.plugin, file).open();
                    });
            });

            menu.addItem((item) => {
                item.setTitle('Remove divider')
                    .setIcon('trash-2')
                    .setWarning(true)
                    .onClick(async () => {
                        if (path === 'cf-global-files-separator') {
                            this.plugin.settings.showFileDivider = false;
                        } else {
                            const style = this.plugin.settings.customFolderColors[path];
                            if (style && typeof style === 'object') {
                                style.hasDivider = false;
                                delete style.dividerText;
                                delete style.dividerColor;
                                delete style.dividerIcon;
                                delete style.dividerAlignment;
                                delete style.dividerLineStyle;
                                delete style.dividerUpper;
                                delete style.dividerGlass;
                            }
                        }
                        await this.plugin.saveSettings();
                        this.plugin.generateStyles();
                        this.syncDividers();
                    });
            });

            menu.showAtMouseEvent(e);
        };

        return div;
    }

    // ─── Core Reconciliation ────────────────────────────────────────────

    syncDividers() {
        if (this.plugin.isSyncingDividers) return;

        const container = activeDocument.querySelector('.nav-files-container');
        if (!container) return;

        this.plugin.isSyncingDividers = true;

        try {
            // ── Step 1: Collect desired dividers ────────────────────────
            const desired = new Map<string, { conf: FolderStyle; isGlobal: boolean }>();

            // Per-folder dividers
            const colors = this.plugin.settings.customFolderColors;
            if (colors) {
                for (const path in colors) {
                    const conf = colors[path];
                    if (typeof conf === 'object' && conf && conf.hasDivider) {
                        desired.set(path, { conf, isGlobal: false });
                    }
                }
            }

            // Global "Files" separator
            if (this.plugin.settings.showFileDivider) {
                const rootChildren = Array.from(container.children);
                let seenFolder = false;
                let hasFileAfterFolder = false;
                for (const node of rootChildren) {
                    if ((node).classList.contains('nav-folder')) {
                        seenFolder = true;
                    } else if (seenFolder && (node).classList.contains('nav-file')) {
                        hasFileAfterFolder = true;
                        break;
                    }
                }
                if (hasFileAfterFolder) {
                    desired.set('cf-global-files-separator', {
                        isGlobal: true,
                        conf: {
                            dividerText: this.plugin.settings.fileDividerText || 'Files',
                            dividerColor: this.plugin.settings.separatorColor || 'var(--text-muted)',
                            hasDivider: true,
                        },
                    });
                }
            }

            // ── Step 2: Index existing divider nodes by target path ─────
            const existingByPath = new Map<string, HTMLElement>();
            container.querySelectorAll('.cf-interactive-divider').forEach((el) => {
                const target = (el as HTMLElement).dataset.dividerTarget;
                if (target) {
                    if (existingByPath.has(target)) {
                        el.remove();
                    } else {
                        existingByPath.set(target, el as HTMLElement);
                    }
                } else {
                    el.remove();
                }
            });

            // ── Step 3: Reconcile — add, update, or keep ───────────────
            const kept = new Set<string>();

            for (const [path, { conf, isGlobal }] of desired) {
                kept.add(path);

                const targetEl = this.findTargetElement(container, path, isGlobal);
                if (!targetEl) {
                    const stale = existingByPath.get(path);
                    if (stale) stale.remove();
                    continue;
                }

                const existing = existingByPath.get(path);

                if (existing) {
                    // Re-build and replace to ensure fresh config is applied (name, color, etc.)
                    const newNode = this.buildDividerNode(path, conf);
                    existing.replaceWith(newNode);
                } else {
                    const node = this.buildDividerNode(path, conf);
                    targetEl.prepend(node);
                }

            }

            for (const [path, el] of existingByPath) {
                if (!kept.has(path)) {
                    el.remove();
                }
            }
        } finally {
            this.plugin.isSyncingDividers = false;
        }
    }

    /**
     * Remove all divider nodes from the explorer.
     */
    clean() {
        const container = activeDocument.querySelector('.nav-files-container');
        if (container) {
            container.querySelectorAll('.cf-interactive-divider').forEach(el => el.remove());
        }
    }

    // ─── Helpers ────────────────────────────────────────────────────────

    /**
     * Find the DOM element that should CONTAIN the divider.
     * Returns null if the target isn't currently rendered in the DOM.
     */
    private findTargetElement(
        container: Element,
        path: string,
        isGlobal: boolean
    ): HTMLElement | null {
        if (isGlobal) {
            let seenFolder = false;
            for (const node of Array.from(container.children)) {
                if (node.classList.contains('cf-interactive-divider')) continue;
                if (node.classList.contains('nav-file-ghost') || node.classList.contains('nav-folder-ghost')) continue;

                if (node.classList.contains('nav-folder')) {
                    seenFolder = true;
                } else if (seenFolder && node.classList.contains('nav-file')) {
                    return node as HTMLElement;
                }
            }
            return null;
        }

        const safePath = safeEscape(path);
        const titleEl = container.querySelector(
            `.nav-folder-title[data-path="${safePath}"], .nav-file-title[data-path="${safePath}"]`
        );
        if (!titleEl) return null;

        const wrapper = titleEl.closest('.nav-folder, .nav-file');
        if (!wrapper) return null;
        if (wrapper.classList.contains('nav-file-ghost') || wrapper.classList.contains('nav-folder-ghost')) return null;

        return wrapper as HTMLElement;
    }
}
