import * as obsidian from 'obsidian';
import { IColorfulFoldersPlugin, FolderStyle } from '../common/types';
import { DividerModal } from '../ui/modals/DividerModal';
import { HoverMessageModal } from '../ui/modals/HoverMessageModal';
import { safeEscape, hexToRgbObj } from '../common/utils';
import { NotebookNavigatorIntegration } from '../integrations/NotebookNavigator';

interface InternalPlugins {
    getPluginById(id: string): { instance: { openGlobalSearch(q: string): void } } | null;
}
interface ObsidianApp extends obsidian.App {
    internalPlugins: InternalPlugins;
}

/**
 * DividerManager — Complete rewrite for stability.
 */
export class DividerManager {
    plugin: IColorfulFoldersPlugin;
    app: obsidian.App;
    static activePopover: HTMLElement | null = null;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
        this.app = plugin.app;
    }

    // ─── Divider Node Factory ───────────────────────────────────────────

    public buildDividerNode(path: string, conf: FolderStyle, doc: Document): HTMLElement {
        const dividerThickness = this.plugin.settings.dividerThickness || 1.5;
        const globalLineStyle = this.plugin.settings.dividerLineStyle || 'solid';

        const div = doc.createElement('div');
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
        const iconPosition = conf.dividerIconPosition || 'left';
        const pillMode = conf.dividerPillMode 
            ? (conf.dividerPillMode === 'on') 
            : (this.plugin.settings.dividerPillMode !== false);

        // ── Bridge (flex row: line — chip — line) ───────────────────────
        const bridge = div.createDiv({ cls: 'cf-divider-bridge' });
        bridge.setCssStyles({
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            gap: `${this.plugin.settings.dividerLinePadding ?? 8}px`
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
            '--cf-divider-letter-spacing': isUpper ? '0.15em' : 'normal'
        });

        if (pillMode) {
            let pillBg = useGlass ? 'rgba(var(--mono-rgb-100), 0.04)' : 'var(--background-secondary-alt)';
            const customPillColor = conf.dividerPillColor || this.plugin.settings.dividerPillColor;

            if (customPillColor) {
                pillBg = customPillColor;
            } else {
                // Fallback: Inherit from divider color with transparency
                const rgb = hexToRgbObj(color);
                if (rgb) {
                    pillBg = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;
                }
            }

            chip.setCssStyles({
                padding: '6px 16px',
                borderRadius: '40px',
                backgroundColor: pillBg,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(var(--mono-rgb-100), 0.15)',
                backdropFilter: useGlass ? 'blur(16px)' : 'none'
            });
        } else {
            chip.setCssStyles({
                backgroundColor: 'transparent',
                backdropFilter: 'none',
                boxShadow: 'none',
                border: 'none',
                padding: '0'
            });
        }

        // Icon (Lucide or emoji)
        const rawIcon = conf.dividerIcon ? conf.dividerIcon.trim() : '';
        const iconIds: string[] = (obsidian as { getIconIds?: () => string[] }).getIconIds?.() || [];
        const isLucide = iconIds.includes(`lucide-${rawIcon}`) || iconIds.includes(rawIcon);

        const addIcon = () => {
            if (!rawIcon) return;

            const iconColor = conf.dividerIconColor || color;

            const isCustom = !!(this.plugin.settings.customIcons && this.plugin.settings.customIcons[rawIcon]);

            if (isCustom) {
                // Custom SVG Icon - Use masking strategy for consistency and to override hardcoded SVG styles
                const svgStr = this.plugin.settings.customIcons[rawIcon];
                const normalized = this.plugin.iconManager.normalizeSvg(svgStr);
                const iconWrap = chip.createSpan({ cls: 'cf-divider-custom-icon' });
                iconWrap.setCssStyles({
                    display: 'inline-block',
                    width: '14px',
                    height: '14px',
                    backgroundColor: iconColor,
                    maskImage: `url("data:image/svg+xml,${normalized}")`,
                    webkitMaskImage: `url("data:image/svg+xml,${normalized}")`,
                    maskRepeat: 'no-repeat',
                    webkitMaskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    webkitMaskPosition: 'center',
                    maskSize: 'contain',
                    webkitMaskSize: 'contain',
                    verticalAlign: 'middle',
                    marginRight: '0px'
                });
            } else if (isLucide) {
                const iconWrap = chip.createSpan({ cls: 'cf-divider-icon' });
                obsidian.setIcon(iconWrap, rawIcon);
                const svg = iconWrap.querySelector('svg') as unknown as HTMLElement | null;
                if (svg) {
                    const finalColor = iconColor;
                    svg.setCssStyles({
                        width: '14px',
                        height: '14px',
                        stroke: finalColor,
                        fill: 'none',
                        strokeWidth: '2.5px'
                    });
                    // Force color on all internal paths to override hardcoded SVG colors
                    svg.querySelectorAll('path, circle, rect, ellipse, polyline, polygon').forEach((child) => {
                        (child as HTMLElement).setCssStyles({
                            stroke: finalColor,
                            fill: 'none'
                        });
                    });
                }
            } else {
                // Emoji or unknown
                chip.createSpan({ text: rawIcon, cls: 'cf-divider-emoji-icon' });
            }
        };

        if (iconPosition === 'left' || iconPosition === 'both') {
            addIcon();
        }

        chip.createSpan({ text: isUpper ? name.toUpperCase() : name, cls: 'cf-divider-label' });

        if (iconPosition === 'right' || iconPosition === 'both') {
            addIcon();
        }

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
                item.setTitle(conf.dividerDescription ? 'Edit hover message' : 'Add hover message')
                    .setIcon('message-square')
                    .onClick(() => {
                        new HoverMessageModal(this.app, this.plugin, path, conf.dividerDescription || "", (newDesc) => {
                            void (async () => {
                                const style = this.plugin.settings.customFolderColors[path];
                                if (typeof style === 'object') {
                                    style.dividerDescription = newDesc;
                                } else {
                                    this.plugin.settings.customFolderColors[path] = {
                                        hex: style || '',
                                        dividerDescription: newDesc,
                                        hasDivider: true
                                    };
                                }
                                await this.plugin.saveSettings();
                                this.plugin.generateStyles();
                                this.syncDividers();
                            })();
                        }).open();
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
                                delete style.dividerIconPosition;
                                delete style.dividerPillMode;
                                delete style.dividerDescription;
                            }
                        }
                        await this.plugin.saveSettings();
                        this.plugin.generateStyles();
                        this.syncDividers();
                    });
            });

            menu.showAtMouseEvent(e);
        };

        // ── Hover Message (Premium Markdown Popover) ──────────────────
        if (conf.dividerDescription && conf.dividerDescription.trim()) {
            chip.addClass('cf-has-description');
            
            let popover: HTMLElement | null = null;
            let timeout: number | null = null;

            const showPopover = async () => {
                if (popover) return;
                
                // Kill any existing global popover first
                if (DividerManager.activePopover) {
                    DividerManager.activePopover.remove();
                    DividerManager.activePopover = null;
                }
                
                popover = activeDocument.body.createDiv({ cls: 'cf-premium-popover' });
                DividerManager.activePopover = popover;
                const content = popover.createDiv({ cls: 'cf-popover-content' });
                
                // Render Markdown
                await obsidian.MarkdownRenderer.render(
                    this.plugin.app,
                    conf.dividerDescription || "",
                    content,
                    path,
                    this.plugin as unknown as obsidian.Component
                );

                // --- Activate Links & Tags ---
                content.querySelectorAll('.internal-link').forEach((link: HTMLElement) => {
                    link.onclick = (e: MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const dest = link.getAttribute('data-href');
                        if (dest) {
                            void this.app.workspace.openLinkText(dest, path, e.ctrlKey || e.metaKey);
                            if (popover) { popover.remove(); popover = null; DividerManager.activePopover = null; }
                        }
                    };
                });

                content.querySelectorAll('.tag').forEach((tag: HTMLElement) => {
                    tag.onclick = (e: MouseEvent) => {
                        e.preventDefault();
                        e.stopPropagation();
                        const tagText = tag.innerText;
                        // Trigger search for the tag (Safe access to internal plugin)
                        const internalPlugins = (this.app as ObsidianApp).internalPlugins;
                        const searchPlugin = internalPlugins?.getPluginById('global-search');
                        if (searchPlugin && searchPlugin.instance) {
                            searchPlugin.instance.openGlobalSearch(tagText);
                        }
                        if (popover) { popover.remove(); popover = null; DividerManager.activePopover = null; }
                    };
                });

                // Position popover
                const rect = chip.getBoundingClientRect();
                const popWidth = popover.offsetWidth;
                const popHeight = popover.offsetHeight;
                
                // Smart Adaptive Vertical Positioning
                const spaceAbove = rect.top;
                const needsFlip = spaceAbove < (popHeight + 40);
                
                if (needsFlip) {
                    popover.addClass('is-below');
                    popover.style.top = `${rect.bottom + 12}px`;
                } else {
                    popover.style.top = `${rect.top - 12}px`;
                }

                // Smart Adaptive Horizontal Positioning
                let targetLeft = rect.left + rect.width / 2;
                const minPadding = 20;
                
                // Ensure doesn't go off right
                if (targetLeft + popWidth / 2 > activeWindow.innerWidth - minPadding) {
                    targetLeft = activeWindow.innerWidth - popWidth / 2 - minPadding;
                }
                // Ensure doesn't go off left
                if (targetLeft - popWidth / 2 < minPadding) {
                    targetLeft = popWidth / 2 + minPadding;
                }
                
                popover.style.left = `${targetLeft}px`;
                
                // Keep open on popover hover (The Bridge)
                popover.onmouseenter = () => {
                    if (timeout) { 
                        activeWindow.clearTimeout(timeout); 
                        timeout = null; 
                    }
                };
                popover.onmouseleave = () => hidePopover();
            };

            const hidePopover = () => {
                if (timeout) activeWindow.clearTimeout(timeout);
                timeout = activeWindow.setTimeout(() => {
                    if (popover) {
                        if (DividerManager.activePopover === popover) DividerManager.activePopover = null;
                        popover.remove();
                        popover = null;
                    }
                }, 150); // Slightly longer delay for easier "bridging"
            };

            chip.onmouseenter = () => {
                const win = doc.defaultView || activeWindow;
                if (timeout) win.clearTimeout(timeout);
                timeout = win.setTimeout(() => {
                    void showPopover();
                }, 250); // Faster trigger
            };
            
            chip.onmouseleave = () => hidePopover();
        }

        return div;
    }

    // ─── Core Reconciliation ────────────────────────────────────────────

    syncDividers() {
        if (this.plugin.isSyncingDividers) return;

        // Iterate over all windows to find file explorers
        const explorers: HTMLElement[] = [];
        this.app.workspace.iterateAllLeaves(leaf => {
            const view = leaf.view as obsidian.View & { getViewType(): string; containerEl: HTMLElement };
            if (view.getViewType() === 'file-explorer' || view.getViewType() === 'nav-files') {
                const container = view.containerEl.querySelector('.nav-files-container');
                if (container) explorers.push(container as HTMLElement);
            }
        });

        // Also check Notebook Navigator extra containers in all open documents
        const docs = new Set<Document>();
        explorers.forEach(e => docs.add(e.ownerDocument));
        docs.add(activeDocument); // Fallback
        
        const allContainers = [...explorers];
        docs.forEach(doc => {
            const extra = NotebookNavigatorIntegration.getExtraContainers(doc);
            if (extra) extra.forEach(e => allContainers.push(e as HTMLElement));
        });

        if (allContainers.length === 0) return;

        this.plugin.isSyncingDividers = true;

        try {
            allContainers.forEach(container => {
                this.syncContainer(container);
            });
        } finally {
            this.plugin.isSyncingDividers = false;
        }
    }

    private syncContainer(container: Element) {
        if (!NotebookNavigatorIntegration.shouldRenderDividers(container, this.plugin.settings)) return;
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
                    if (NotebookNavigatorIntegration.isFolder(node)) {
                        seenFolder = true;
                    } else if (seenFolder && NotebookNavigatorIntegration.isFile(node)) {
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
                    const newNode = this.buildDividerNode(path, conf, container.ownerDocument);
                    existing.replaceWith(newNode);
                } else {
                    const node = this.buildDividerNode(path, conf, container.ownerDocument);
                    targetEl.prepend(node);
                }

            }

            for (const [path, el] of existingByPath) {
                if (!kept.has(path)) {
                    el.remove();
                }
            }
        } catch (e) {
            console.error("Colorful Folders: Failed to sync dividers for container", e);
        }
    }

    /**
     * Remove all divider nodes from the explorer.
     */
    clean() {
        if (DividerManager.activePopover) {
            DividerManager.activePopover.remove();
            DividerManager.activePopover = null;
        }
        const containers = Array.from(activeDocument.querySelectorAll('.nav-files-container'));
        const extraContainers = Array.from(NotebookNavigatorIntegration.getExtraContainers(activeDocument));
        [...containers, ...extraContainers].forEach(container => {
            container.querySelectorAll('.cf-interactive-divider').forEach(el => el.remove());
        });
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

                if (NotebookNavigatorIntegration.isFolder(node)) {
                    seenFolder = true;
                } else if (seenFolder && NotebookNavigatorIntegration.isFile(node)) {
                    return node as HTMLElement;
                }
            }
            return null;
        }

        const safePath = safeEscape(path);
        const titleEl = container.querySelector(`.nav-folder-title[data-path="${safePath}"], .nav-file-title[data-path="${safePath}"]`) ||
                        NotebookNavigatorIntegration.findItemInDOM(container, path);
        
        if (!titleEl) return null;

        const wrapper = titleEl.closest(`.nav-folder, .nav-file, .nn-navitem, .nn-file`);
        if (!wrapper) return null;
        if (wrapper.classList.contains('nav-file-ghost') || wrapper.classList.contains('nav-folder-ghost')) return null;

        return wrapper as HTMLElement;
    }
}
