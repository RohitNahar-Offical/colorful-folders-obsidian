import * as obsidian from 'obsidian';
import { requestUrl, Notice, TFolder, TFile, getIconIds, getIcon } from 'obsidian';
import { IColorfulFoldersPlugin } from '../common/types';
import { normalizePathKey, normalizeIconName } from '../common/utils';

export class AIIconClassifier {
    private isClassifying = false;
    private cancelRequested = false;
    private plugin: IColorfulFoldersPlugin;

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    public stopClassification(): void {
        if (this.isClassifying) {
            this.cancelRequested = true;
            new Notice("Colorful Folders AI: Stopping classification process...");
        } else {
            new Notice("Colorful Folders AI: No classification is currently running.");
        }
    }

    public async classifyVault(options?: { force?: boolean }): Promise<void> {
        if (this.isClassifying) {
            new Notice("Colorful Folders AI: Classification is already in progress...");
            return;
        }

        this.cancelRequested = false;

        const settings = this.plugin.settings;
        if (!settings.aiApiKey && settings.aiProvider !== 'custom' && settings.aiProvider !== 'ollama') {
            new Notice("Colorful Folders AI: Please enter an API key in Settings -> Icon management -> AI Settings.");
            return;
        }

        this.isClassifying = true;
        const notice = new Notice("Colorful Folders AI: Gathering vault items...", 0);

        try {
            // 1. Gather all vault folders and (optionally) markdown files with rich context
            const allFiles = this.plugin.app.vault.getAllLoadedFiles();
            const rawTargets: {
                fileObj: TFolder | TFile;
                path: string;
                name: string;
                isFolder: boolean;
                parentFolder: string;
                pathHierarchy: string[];
                childSamples?: string[];
                tags?: string[];
                frontmatter?: Record<string, string>;
            }[] = [];

            for (const file of allFiles) {
                if (file.path.startsWith('.') || file.path.includes('/.')) continue;
                
                let parentFolder = "Root";
                if (file.parent && !file.parent.isRoot()) {
                    parentFolder = file.parent.name;
                }
                const pathHierarchy = file.path.split('/');

                const includeContext = settings.aiIncludeContentContext !== false;

                if (file instanceof TFolder && !file.isRoot()) {
                    const childSamples: string[] = [];
                    if (includeContext) {
                        for (const child of file.children.slice(0, 5)) {
                            childSamples.push(child.name);
                        }
                    }
                    rawTargets.push({
                        fileObj: file,
                        path: file.path,
                        name: file.name,
                        isFolder: true,
                        parentFolder,
                        pathHierarchy,
                        childSamples: includeContext && childSamples.length > 0 ? childSamples : undefined
                    });
                } else if (settings.aiIncludeFiles && file instanceof TFile) {
                    const tags: string[] = [];
                    const frontmatter: Record<string, string> = {};
                    if (includeContext && this.plugin.app?.metadataCache) {
                        const cache = this.plugin.app.metadataCache.getFileCache(file);
                        if (cache?.tags) {
                            tags.push(...cache.tags.map(t => t.tag));
                        }
                        if (cache?.frontmatter) {
                            if (cache.frontmatter.tags) {
                                const fmTags = Array.isArray(cache.frontmatter.tags)
                                    ? cache.frontmatter.tags
                                    : typeof cache.frontmatter.tags === 'string'
                                        ? cache.frontmatter.tags.split(',')
                                        : [];
                                tags.push(...fmTags.map(t => String(t).trim()));
                            }
                            for (const [k, v] of Object.entries(cache.frontmatter)) {
                                if (['position', 'tags', 'cssclasses', 'cssClass'].includes(k)) continue;
                                if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
                                    frontmatter[k] = String(v).substring(0, 100);
                                }
                            }
                        }
                    }

                    rawTargets.push({
                        fileObj: file,
                        path: file.path,
                        name: file.basename,
                        isFolder: false,
                        parentFolder,
                        pathHierarchy,
                        tags: includeContext && tags.length > 0 ? tags : undefined,
                        frontmatter: includeContext && Object.keys(frontmatter).length > 0 ? frontmatter : undefined
                    });
                }
            }

            if (rawTargets.length === 0) {
                notice.setMessage("Colorful Folders AI: No items found to classify.");
                window.setTimeout(() => notice.hide(), 3000);
                return;
            }

            // Filter out items that have custom assigned icons or match custom user rules (unless force is true)
            const computeHash = (t: any) => `${t.path}:${(t as any).contentSnippet || ''}:${(t.tags || []).join(',')}`;
            const unassignedTargets = rawTargets.filter(t => {
                if (options?.force) return true;

                // 1. Exclude items with manually assigned custom icons
                const existing = settings.customFolderColors[t.path];
                if (existing) {
                    if (typeof existing === 'string') return false;
                    if (typeof existing === 'object' && (existing.iconId || existing.icon)) return false;
                }

                // 2. Exclude items matching Custom User Rules (e.g. pattern = icon @ priority)
                const customRule = this.plugin.iconManager.getAutoIconData(t.name, t.path);
                if (customRule && (customRule.packSource === 'custom-rule' || customRule.isCustom)) {
                    return false; // User custom rule match — do NOT send to AI
                }

                return true;
            });

            if (unassignedTargets.length === 0) {
                notice.setMessage("Colorful Folders AI: All items already have custom icons assigned!");
                window.setTimeout(() => notice.hide(), 3000);
                return;
            }

            notice.setMessage(`Colorful Folders AI: Preparing ${unassignedTargets.length} vault items...`);

            // Fast parallel read for markdown snippets (chunks of 50) - ONLY if content context is enabled
            if (settings.aiIncludeContentContext !== false) {
                const fileTargets = unassignedTargets.filter(t => !t.isFolder && t.fileObj instanceof TFile) as (typeof unassignedTargets[0] & { fileObj: TFile; contentSnippet?: string })[];
                const chunkSize = 50;
                for (let i = 0; i < fileTargets.length; i += chunkSize) {
                    const chunk = fileTargets.slice(i, i + chunkSize);
                    await Promise.all(chunk.map(async t => {
                        try {
                            const rawContent = await this.plugin.app.vault.cachedRead(t.fileObj);
                            const cleanContent = rawContent
                                .replace(/^---[\s\S]*?---/, '')
                                .replace(/#+\s+/g, '')
                                .replace(/\[\[(.*?)\]\]/g, '$1')
                                .replace(/`{1,3}[\s\S]*?`{1,3}/g, '')
                                .replace(/\s+/g, ' ')
                                .trim();
                            if (cleanContent) {
                                t.contentSnippet = cleanContent.substring(0, 150);
                            }
                        } catch {
                            // ignore read error
                        }
                    }));
                }
            }

            // Construct system prompt ONCE for all batches
            const systemPrompt = this.buildSystemPrompt();

            notice.setMessage(`Colorful Folders AI: Analyzing ${unassignedTargets.length} vault items...`);

            // Provider-aware dynamic batching and concurrency
            const batchSize = settings.aiProvider === 'ollama' ? 10 : 25;
            const maxConcurrent = settings.aiProvider === 'ollama' ? 1 : 3;

            const conceptMap = new Map<string, string>(); // path/normName -> iconId string
            const normalizeKey = (str: string) => normalizePathKey(str);

            const batchChunks: (typeof unassignedTargets)[] = [];
            for (let i = 0; i < unassignedTargets.length; i += batchSize) {
                batchChunks.push(unassignedTargets.slice(i, i + batchSize));
            }

            let completedBatches = 0;
            const tasks = batchChunks.map((batchTargets, idx) => async () => {
                const currentBatch = idx + 1;
                const contextPayload = batchTargets.map(t => {
                    const itemObj: Record<string, any> = {
                        item_path: t.path,
                        type: t.isFolder ? 'Folder' : 'File'
                    };
                    if (t.isFolder && t.childSamples && t.childSamples.length > 0) {
                        itemObj.sample_contents = t.childSamples.join(', ');
                    }
                    if (!t.isFolder) {
                        if (t.tags && t.tags.length > 0) itemObj.tags = t.tags.join(', ');
                        if ((t as any).contentSnippet) itemObj.snippet = (t as any).contentSnippet;
                    }
                    return itemObj;
                });

                console.log(`🤖 [Colorful Folders AI] Batch ${currentBatch}/${batchChunks.length} Context Payload Sent:`, contextPayload);

                try {
                    const result = await this.queryAI(contextPayload, systemPrompt);
                    let kvPairs: Record<string, unknown> = {};

                    if (Array.isArray(result)) {
                        batchTargets.forEach((t, itemIdx) => {
                            const val = result[itemIdx];
                            if (val) kvPairs[t.path] = val;
                        });
                    } else if (result && typeof result === 'object') {
                        const keys = Object.keys(result);
                        if (keys.length === 1 && typeof result[keys[0]] === 'object' && !Array.isArray(result[keys[0]])) {
                            kvPairs = result[keys[0]] as Record<string, unknown>;
                        } else {
                            kvPairs = result as Record<string, unknown>;
                        }
                    }

                    console.log(`📦 [Colorful Folders AI] Batch ${currentBatch}/${batchChunks.length} Parsed Output:`, kvPairs);

                    const RESERVED_KEYS = new Set([
                        'created', 'contentsnippet', 'snippet', 'rank', 'tags', 'properties',
                        'parentfolder', 'parent', 'fileobj', 'pathhierarchy', 'hierarchy',
                        'isfolder', 'cssclasses', 'position', 'name', 'title', 'path',
                        'type', 'details', 'sample_contents', 'context', 'item_path', 'itempath',
                        'files', 'file', ''
                    ]);

                    const COMPOUND_SUBSTRINGS = [
                        // Navigation & location
                        'map', 'pin', 'marker', 'location', 'geo', 'globe', 'compass', 'direction', 'route', 'navigation', 'atlas',
                        // Objects & items
                        'book', 'file', 'folder', 'document', 'note', 'text', 'write', 'pen', 'pencil', 'paper',
                        // Technology & code
                        'code', 'terminal', 'cpu', 'chip', 'dev', 'gear', 'settings', 'wrench', 'tool', 'build', 'plug', 'api',
                        // Media
                        'image', 'photo', 'video', 'music', 'audio', 'sound', 'play', 'film', 'camera', 'microphone', 'speaker',
                        // Data & analytics
                        'data', 'chart', 'graph', 'analytics', 'stats', 'number', 'calc', 'math', 'formula', 'function',
                        // People & social
                        'user', 'people', 'team', 'group', 'chat', 'message', 'comment', 'social', 'contact', 'account', 'profile',
                        // Actions & status
                        'download', 'upload', 'share', 'sync', 'export', 'import', 'copy', 'paste', 'delete', 'trash', 'add', 'create',
                        // States, layout & qualities
                        'layout', 'panel', 'sidebar', 'window', 'grid', 'column', 'row', 'table',
                        'lock', 'unlock', 'shield', 'security', 'key', 'password', 'safe', 'check', 'checkmark', 'done', 'complete',
                        'alert', 'warn', 'error', 'help', 'info', 'question', 'search', 'filter', 'sort', 'view', 'eye', 'visible',
                        // Time & calendar
                        'calendar', 'clock', 'time', 'date', 'schedule', 'event', 'reminder', 'history', 'archive', 'backup',
                        // Places & spaces
                        'home', 'house', 'building', 'office', 'room', 'place', 'spot', 'area', 'zone', 'floor', 'wall',
                        // Nature & elements
                        'plant', 'leaf', 'tree', 'flower', 'sun', 'moon', 'star', 'weather', 'rain', 'cloud', 'snow', 'wind',
                        // Emotions & abstract
                        'brain', 'think', 'idea', 'lightbulb', 'spark', 'heart', 'love', 'favorite', 'like',
                        // Business & finance
                        'money', 'dollar', 'coin', 'credit', 'bank', 'wallet', 'briefcase', 'work', 'job', 'career', 'meeting',
                        // Health & fitness
                        'health', 'fitness', 'exercise', 'workout', 'gym', 'run', 'walk', 'pulse', 'medical', 'hospital',
                        // Travel & transport
                        'travel', 'flight', 'plane', 'car', 'vehicle', 'drive', 'road', 'trip', 'vacation', 'hotel',
                        // Education
                        'school', 'study', 'learn', 'course', 'class', 'graduation', 'student', 'teacher', 'exam',
                        // Communication
                        'mail', 'email', 'notification', 'bell', 'phone', 'call'
                    ];

                    for (const [key, conceptVal] of Object.entries(kvPairs)) {
                        if (!conceptVal) continue;
                        const cleanKey = key.trim();
                        const normKey = cleanKey.toLowerCase();
                        if (RESERVED_KEYS.has(normKey)) {
                            continue; // Silent drop of metadata key hallucinations
                        }

                        // Flexible target item matching: match full path, normalized path, filename/title, or trailing path segment
                        const normCleanKey = normalizeKey(cleanKey);
                        const targetItem = batchTargets.find(t => 
                            t.path === cleanKey || 
                            normalizeKey(t.path) === normCleanKey || 
                            t.name === cleanKey ||
                            normalizeKey(t.name) === normCleanKey ||
                            normalizeKey(t.path).endsWith(normCleanKey) ||
                            normCleanKey.endsWith(normalizeKey(t.name))
                        );

                        if (!targetItem) {
                            continue; // Skip non-item keys returned by LLM explanations
                        }

                        // Process 3-tier candidate array: [Specific/Brand, Single-Word Visual, General Fallback]
                        const candidatesList: string[] = [];
                        if (Array.isArray(conceptVal)) {
                            candidatesList.push(...conceptVal.map(c => String(c).trim()).filter(Boolean));
                        } else if (typeof conceptVal === 'object' && conceptVal) {
                            const raw = (conceptVal as any).icon || (conceptVal as any).iconId || (conceptVal as any).concept || '';
                            if (raw) candidatesList.push(String(raw).trim());
                        } else if (conceptVal) {
                            const valStr = String(conceptVal).trim();
                            if (valStr.includes(',')) {
                                candidatesList.push(...valStr.split(',').map(s => s.trim()).filter(Boolean));
                            } else {
                                candidatesList.push(valStr);
                            }
                        }

                        // Smart Icon Resolution Pipeline
                        const resolveSmartIcon = (rawStr: string): string | null => {
                            if (!rawStr) return null;
                            const clean = rawStr.trim().replace(/^[\s+:=#]+/, '').trim();
                            if (!clean) return null;
                            const lowerClean = clean.toLowerCase();

                            // 1. Direct emoji or SVG match
                            if (this.plugin.iconManager.isEmojiIcon(clean)) return clean;
                            if (this.plugin.iconManager.getIconSvg(lowerClean)) return lowerClean;
                            if (obsidian.getIcon(lowerClean)) return lowerClean;
                            if (this.plugin.iconManager.getIconSvg(clean)) return clean;

                            // 2. Handle accidental file paths in icon value position
                            if (clean.includes('/') || clean.endsWith('.md')) {
                                const parts = clean.split('/');
                                const lastPart = parts[parts.length - 1].replace(/\.md$/i, '').replace(/[/_]/g, ' ').trim();
                                if (lastPart && lastPart.toLowerCase() !== clean.toLowerCase()) {
                                    const pathHit = resolveSmartIcon(lastPart);
                                    if (pathHit) return pathHit;
                                }
                            }

                            // 3. Hyphenated version (convert underscores to hyphens)
                            const hyphenated = lowerClean.replace(/[\s_]+/g, '-');
                            if (this.plugin.iconManager.getIconSvg(hyphenated)) return hyphenated;
                            if (obsidian.getIcon(hyphenated)) return hyphenated;

                            // 4. Search installed packs / Lucide index + Prefix-stripped fallback + Relaxed Fuzzy Search (threshold 0.5)
                            const cleanPrefix = lowerClean.replace(/^(lucide|feather|tabler|simple-icons|ri|fa|octicon|bx|ra)-/i, '');
                            const packHit = this.plugin.iconManager.findIconInPacks(lowerClean) || 
                                            this.plugin.iconManager.findIconInPacks(hyphenated) ||
                                            (cleanPrefix !== lowerClean ? this.plugin.iconManager.findIconInPacks(cleanPrefix) : null) ||
                                            this.plugin.iconManager.searchFuzzy(lowerClean, { threshold: 0.5 }) ||
                                            this.plugin.iconManager.searchFuzzy(hyphenated, { threshold: 0.5 });
                            if (packHit) return packHit;

                            // 5. Word extraction & relaxed fuzzy search per word (threshold 0.5)
                            const words = hyphenated.split(/[\-_:\s]+/).filter(w => w.length >= 3 && !/^\d+$/.test(w));
                            for (let i = words.length - 1; i >= 0; i--) {
                                const word = words[i];
                                if (this.plugin.iconManager.getIconSvg(word)) return word;
                                if (obsidian.getIcon(word)) return word;
                                const wordHit = this.plugin.iconManager.findIconInPacks(word) || this.plugin.iconManager.searchFuzzy(word, { threshold: 0.5 });
                                if (wordHit) return wordHit;
                            }

                            // 6. Layer 2: Expanded Compound Substring Matching
                            for (const sub of COMPOUND_SUBSTRINGS) {
                                if (lowerClean.includes(sub)) {
                                    const subHit = this.plugin.iconManager.findIconInPacks(sub) || this.plugin.iconManager.searchFuzzy(sub, { threshold: 0.5 });
                                    if (subHit) return subHit;
                                    if (obsidian.getIcon(sub)) return sub;
                                }
                            }

                            return null;
                        };

                        let matchedIcon: string | null = null;
                        let winningTier = 0;
                        for (let cIdx = 0; cIdx < candidatesList.length; cIdx++) {
                            const cleanIcon = candidatesList[cIdx];
                            const normalized = cleanIcon
                                .replace(/[-_]v?\d+(\.\d+)*$/, '')
                                .replace(/[\s_]+/g, '-')
                                .replace(/[^a-z0-9\-]/gi, '')
                                .replace(/-+/g, '-')
                                .replace(/^-+|-+$/g, '')
                                .toLowerCase();

                            const hit = resolveSmartIcon(cleanIcon) || resolveSmartIcon(normalized);
                            if (hit) {
                                matchedIcon = hit;
                                winningTier = cIdx + 1;
                                break; // Stop at first valid candidate!
                            }
                        }

                        if (matchedIcon) {
                            conceptMap.set(targetItem.path, matchedIcon);
                            conceptMap.set(normalizeKey(targetItem.path), matchedIcon);
                            if (winningTier > 1) {
                                console.log(`Colorful Folders AI: "${targetItem.path}" resolved to "${matchedIcon}" via Candidate Tier ${winningTier} fallback.`);
                            }
                        } else {
                            // Layer 4: Final Fallback to Native Auto-Icon System for the item path
                            const autoIcon = this.plugin.iconManager.getAutoIconData(targetItem.name, targetItem.path);
                            if (autoIcon && (autoIcon.lucide || autoIcon.emoji)) {
                                const fallbackIcon = autoIcon.lucide || autoIcon.emoji;
                                if (fallbackIcon) {
                                    conceptMap.set(targetItem.path, fallbackIcon);
                                    conceptMap.set(normalizeKey(targetItem.path), fallbackIcon);
                                }
                            } else {
                                console.warn(`Colorful Folders AI: Skipping invalid candidates for "${targetItem.path}"`);
                            }
                        }
                    }
                } catch (err) {
                    const msg = (err as Error)?.message || String(err);
                    console.error(`Colorful Folders AI: Batch ${currentBatch} classification failed`, err);
                    new Notice(`Colorful Folders AI: ${msg}`, 6000);
                } finally {
                    completedBatches++;
                    notice.setMessage(`Colorful Folders AI: Processed ${completedBatches}/${batchChunks.length} batches...`);
                }
            });

            // Execute batch tasks with dynamic max concurrency
            const executing: Promise<void>[] = [];
            for (const task of tasks) {
                if (this.cancelRequested) {
                    notice.setMessage("Colorful Folders AI: Classification cancelled by user.");
                    window.setTimeout(() => notice.hide(), 4000);
                    break;
                }
                const p: Promise<void> = task().then(() => {
                    const idx = executing.indexOf(p);
                    if (idx !== -1) executing.splice(idx, 1);
                });
                executing.push(p);
                if (executing.length >= maxConcurrent) {
                    await Promise.race(executing);
                }
            }
            await Promise.all(executing);

            if (this.cancelRequested) {
                return;
            }

            // Directly assign the icon returned by the AI for each vault item
            let assignedCount = 0;
            const assignedSummary: Record<string, string> = {};

            for (const item of unassignedTargets) {
                const normName = normalizeKey(item.name);
                const normPath = normalizeKey(item.path);
                let iconId = conceptMap.get(item.path) || conceptMap.get(normPath) || conceptMap.get(normName) || conceptMap.get(item.name) || "";
                
                // Priority 0: Explicit Custom User Rules ALWAYS take top priority over AI suggestions
                const customRule = this.plugin.iconManager.getAutoIconData(item.name, item.path);
                if (customRule && (customRule.packSource === 'custom-rule' || customRule.isCustom)) {
                    const customIcon = customRule.lucide || customRule.emoji;
                    if (customIcon) {
                        iconId = customIcon;
                    }
                } else if (!iconId || iconId === 'file-text' || iconId === 'folder' || iconId === 'file') {
                    // Fallback: If AI returned nothing or a generic icon, resolve auto-icon using native file name & parent context
                    if (customRule && (customRule.lucide || customRule.emoji)) {
                        const fallbackIcon = customRule.lucide || customRule.emoji;
                        if (fallbackIcon) {
                            iconId = fallbackIcon;
                        }
                    }
                }

                if (iconId) {
                    const itemHash = `${item.path}:${(item as any).contentSnippet || ''}:${(item.tags || []).join(',')}`;
                    const existing = settings.customFolderColors[item.path];
                    if (typeof existing === 'object') {
                        existing.iconId = iconId;
                        (existing as any).aiHash = itemHash;
                    } else if (typeof existing === 'string') {
                        settings.customFolderColors[item.path] = { hex: existing, iconId, aiHash: itemHash } as any;
                    } else {
                        settings.customFolderColors[item.path] = { iconId, aiHash: itemHash } as any;
                    }
                    assignedSummary[item.path] = iconId;
                    assignedCount++;
                }
            }

            console.log(`✨ [Colorful Folders AI] Successfully Assigned ${assignedCount} Icons directly from AI:`, assignedSummary);

            await this.plugin.saveSettings();
            await this.plugin.generateStyles();

            notice.setMessage(`Colorful Folders AI: Successfully assigned icons to ${assignedCount} vault items! ✨`);
            window.setTimeout(() => notice.hide(), 4000);
        } catch (e) {
            console.error("Colorful Folders AI Classification Error:", e);
            const friendlyMsg = this.extractHttpErrorMessage(e, settings.aiProvider);
            notice.setMessage(`Colorful Folders AI Error: ${friendlyMsg}`);
            window.setTimeout(() => notice.hide(), 7000);
        } finally {
            this.isClassifying = false;
        }
    }

    private buildSystemPrompt(): string {
        const customKeys = this.plugin.settings.customIcons ? Object.keys(this.plugin.settings.customIcons) : [];
        
        // Sort custom icon keys to prioritize recognizable brand/concept names over numeric keys
        const sortedCustomKeys = [...customKeys].sort((a, b) => {
            const aNum = /^\d+$/.test((a.split('-').pop() || '').trim());
            const bNum = /^\d+$/.test((b.split('-').pop() || '').trim());
            if (aNum && !bNum) return 1;
            if (!aNum && bNum) return -1;
            return a.localeCompare(b);
        });

        // Group custom icon keys by prefix to sample evenly across ALL installed icon packs
        const packSamplesMap = new Map<string, string[]>();
        for (const key of sortedCustomKeys) {
            const parts = key.split('-');
            const prefix = parts.length > 1 ? parts[0] : 'custom';
            if (!packSamplesMap.has(prefix)) {
                packSamplesMap.set(prefix, []);
            }
            const arr = packSamplesMap.get(prefix)!;
            if (arr.length < 10) {
                arr.push(key);
            }
        }

        const sampledIconIDs: string[] = [];
        for (const samples of packSamplesMap.values()) {
            sampledIconIDs.push(...samples);
        }

        const sampleIconsStr = sampledIconIDs.slice(0, 80).join(', ');

        const isContentMode = this.plugin.settings.aiIncludeContentContext !== false;
        const evaluationScope = isContentMode
            ? "Evaluate each item's title, path hierarchy, parent folder, tags, frontmatter, and content snippet to select the single most accurate icon ID."
            : "Evaluate each item's title, path hierarchy, and parent folder to select the single most accurate icon ID.";

        return `You are an expert AI taxonomist and icon matcher for an Obsidian note-taking app. Your objective is to select 3 CANDIDATE ICON NAMES for each requested vault item ordered from specific to general.

${evaluationScope}

### 3-CANDIDATE SELECTION RULE (CRITICAL):
For EVERY requested item, output a JSON array of EXACTLY 3 candidate icon names:
- Candidate 1: Specific Pack Icon ID or Brand Name (e.g. "simple-icons-python", "flask-conical", "simple-icons-youtube", "book-open")
- Candidate 2: Single-Word Core Visual Metaphor (e.g. "code", "book", "video", "map", "bug")
- Candidate 3: General Fallback Icon (e.g. "terminal", "file-text", "folder")

### FOLDER VS FILE DIFFERENTIATION RULE:
- For FOLDERS: Candidates 2 & 3 MUST be structural container icons (e.g. Candidates 2 & 3: "folder-code", "layers", "archive", "folder").
- For FILES / NOTES: Candidates 2 & 3 MUST be topic or document icons (e.g. Candidates 2 & 3: "code", "book", "bug", "file-text").

### FLEXIBILITY NOTE:
The catalog below and installed samples are EXAMPLES to show valid naming styles. You are NOT restricted to only these listed names! You are free and ENCOURAGED to output ANY valid icon ID from any installed icon pack (e.g. 'simple-icons-<name>', 'feather-<name>', 'tabler-<name>', 'ri-<name>', 'octicon-<name>', 'fa-<name>') or standard Lucide icon name (e.g. 'lightbulb', 'database', 'terminal', 'code', 'cpu', 'lock', 'calendar', 'music', 'camera').

### RECOMMENDED ICON CATEGORIES & EXAMPLES:
- **Development & Tech Brands**: \`simple-icons-python\`, \`simple-icons-javascript\`, \`simple-icons-docker\`, \`simple-icons-react\`, \`simple-icons-github\`, \`simple-icons-html5\`, \`simple-icons-css3\`, \`code\`, \`terminal\`, \`cpu\`, \`database\`, \`server\`, \`bug\`, \`globe\`, \`file-code\`, \`git-branch\`, \`shield\`
- **Writing, Notes & Books**: \`book-open\`, \`book\`, \`pen-tool\`, \`file-text\`, \`file\`, \`notebook\`, \`quote\`, \`sticky-note\`, \`library\`
- **Tasks, Plans & Projects**: \`check-square\`, \`check-circle\`, \`calendar\`, \`clock\`, \`target\`, \`flag\`, \`list-todo\`, \`layers\`, \`kanban\`, \`zap\`
- **Science, Ideas & Learning**: \`lightbulb\`, \`brain\`, \`flask-conical\`, \`microscope\`, \`graduation-cap\`, \`atom\`, \`compass\`, \`sparkles\`
- **Media, Audio & Design**: \`image\`, \`video\`, \`music\`, \`camera\`, \`palette\`, \`film\`, \`headphones\`, \`simple-icons-youtube\`, \`simple-icons-spotify\`
- **Finance & Business**: \`dollar-sign\`, \`credit-card\`, \`pie-chart\`, \`bar-chart\`, \`coins\`, \`trending-up\`, \`briefcase\`, \`receipt\`
- **Personal, Organization & Storage**: \`home\`, \`user\`, \`heart\`, \`coffee\`, \`key\`, \`lock\`, \`map-pin\`, \`folder\`, \`archive\`, \`inbox\`, \`copy\`

### INSTALLED ICON PACK SAMPLE IDs:
[${sampleIconsStr || 'Lucide Standard Icons'}]

### STRICT RULES & CONSTRAINTS:
- Each key in your returned JSON object MUST be the exact 'item_path' string.
- Value MUST be an array of 3 strings: ["Candidate1_Specific", "Candidate2_SingleWord", "Candidate3_Fallback"].
- NEVER use field labels like "title", "hierarchy", "path", "parent", "type", or "details" as JSON keys!
- NEVER invent, slugify, or convert file basenames into fake icon names (e.g. NEVER output 'cf_debug', 'quickadd_template', or 'path_hierarchy').
- ALWAYS use hyphens ('-') instead of underscores ('_'). Write 'flask-conical' (NOT 'flask_conical'), 'file-text' (NOT 'file_text').
- ALWAYS output standard double quotes and colon syntax (e.g. "path": ["icon1", "icon2", "icon3"]). NEVER use '=>' or '->' arrow notation!

### EXACT FEW-SHOT EXAMPLES:
Correct Output:
{
  "Admin/CfDebug.txt": ["bug", "terminal", "file-text"],
  "Templates/QuickAdd Template.md": ["zap", "copy", "file-text"],
  "Development/React Notes.md": ["simple-icons-react", "code", "terminal"],
  "Personal/Reading List.md": ["book-open", "book", "file-text"],
  "Projects/Collections": ["layers", "folder", "archive"]
}`;
    }

    private async queryAI(payload: any[], systemPrompt: string): Promise<Record<string, unknown>> {
        const settings = this.plugin.settings;
        const provider = settings.aiProvider;
        const userPrompt = JSON.stringify(payload);

        let lastErr: unknown = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                if (provider === 'gemini') {
                    return await this.queryGemini(settings, systemPrompt, userPrompt);
                } else if (provider === 'ollama') {
                    return await this.queryOllama(settings, systemPrompt, userPrompt);
                } else if (provider === 'claude') {
                    return await this.queryClaude(settings, systemPrompt, userPrompt);
                } else {
                    return await this.queryOpenAI(settings, provider, systemPrompt, userPrompt);
                }
            } catch (err) {
                lastErr = err;
                const errStr = (err as Error)?.message || String(err);

                // Fail fast on HTTP 404 (Not Found) or 401 (Unauthorized) without wasting 3 retries
                const is404 = errStr.includes('status 404') || errStr.includes('404 Not Found') || (err as any)?.status === 404;
                const is401 = errStr.includes('status 401') || errStr.includes('401 Unauthorized') || (err as any)?.status === 401;

                if (is404) {
                    const modelName = (settings.aiModelName || (provider === 'ollama' ? 'llama3' : 'gemini-2.5-flash')).trim();
                    if (provider === 'ollama') {
                        throw new Error(`Ollama model "${modelName}" was not found (HTTP 404). Run 'ollama pull ${modelName}' in your terminal or pick an installed model in AI Settings.`);
                    } else {
                        throw new Error(`AI Model "${modelName}" or endpoint URL was not found (HTTP 404). Check your model name & endpoint URL in AI Settings.`);
                    }
                }

                if (is401) {
                    throw new Error(`AI API Key is invalid or unauthorized (HTTP 401). Check your API Key in AI Settings.`);
                }

                if (attempt < 3) {
                    console.warn(`Colorful Folders AI: Batch request attempt ${attempt} failed, retrying in ${attempt * 1000}ms...`, err);
                    await new Promise(res => window.setTimeout(res, attempt * 1000));
                }
            }
        }
        throw lastErr;
    }

    private async queryGemini(settings: any, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
        const apiKey = settings.aiApiKey?.trim();
        const model = (settings.aiModelName || 'gemini-2.5-flash').trim().replace(/^models\//, '');
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        const response = await requestUrl({
            url,
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: systemPrompt }] },
                contents: [{ role: "user", parts: [{ text: "Items to classify:\n" + userPrompt }] }],
                generationConfig: { responseMimeType: "application/json" }
            })
        });

        const data = response.json;
        const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
        return this.parseJsonResponse(textResult);
    }

    private async queryOllama(settings: any, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
        const model = (settings.aiModelName || 'llama3').trim();
        const baseUrl = (settings.aiOllamaEndpoint || 'http://localhost:11434').trim().replace(/\/$/, '');

        try {
            const response = await requestUrl({
                url: `${baseUrl}/v1/chat/completions`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: userPrompt }
                    ],
                    response_format: { type: "json_object" }
                })
            });
            const data = response.json;
            const textResult = data?.choices?.[0]?.message?.content || "{}";
            return this.parseJsonResponse(textResult);
        } catch (e) {
            const errStr = (e as Error)?.message || String(e);
            if (errStr.includes('net::ERR_CONNECTION_REFUSED') || errStr.includes('Failed to fetch') || errStr.includes('ECONNREFUSED') || errStr.includes('connect')) {
                throw new Error(`Could not connect to Ollama at ${baseUrl}. Please ensure the Ollama desktop app or service is running on your machine.`);
            }
            console.warn("Colorful Folders AI: Ollama /v1/chat/completions failed, trying /api/generate fallback...", e);
            const response = await requestUrl({
                url: `${baseUrl}/api/generate`,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model,
                    prompt: `${systemPrompt}\n\nItems to classify:\n${userPrompt}`,
                    format: "json",
                    stream: false
                })
            });
            const data = response.json;
            const textResult = data?.response || "{}";
            return this.parseJsonResponse(textResult);
        }
    }

    private async queryClaude(settings: any, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
        const apiKey = settings.aiApiKey?.trim();
        const model = (settings.aiModelName || 'claude-3-5-haiku-20241022').trim();
        const url = 'https://api.anthropic.com/v1/messages';

        const response = await requestUrl({
            url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model,
                max_tokens: 4096,
                system: systemPrompt,
                messages: [
                    { role: 'user', content: "Items to classify:\n" + userPrompt },
                    { role: 'assistant', content: "{" }
                ]
            })
        });

        const data = response.json;
        let textResult = data?.content?.[0]?.text || "";
        
        // Claude prefill guarantees the first character was intended to be `{`
        if (textResult && !textResult.trim().startsWith('{')) {
            textResult = "{\n" + textResult;
        } else if (!textResult) {
            textResult = "{}";
        }
        
        return this.parseJsonResponse(textResult);
    }

    private async queryOpenAI(settings: any, provider: string, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
        const apiKey = settings.aiApiKey?.trim() || '';
        const model = (settings.aiModelName || 'gpt-4o-mini').trim();
        
        if (provider === 'custom' && !settings.aiCustomEndpoint?.trim()) {
            throw new Error("Please enter a valid Custom AI Endpoint URL in Settings -> Icon management -> AI Settings.");
        }

        const url = provider === 'custom' && settings.aiCustomEndpoint?.trim()
            ? settings.aiCustomEndpoint.trim()
            : 'https://api.openai.com/v1/chat/completions';

        // Validate custom endpoint URL scheme
        if (provider === 'custom') {
            try {
                const endpointUrl = new URL(url);
                if (endpointUrl.protocol !== 'https:' && !endpointUrl.hostname.includes('localhost') && !endpointUrl.hostname.startsWith('127.')) {
                    throw new Error("Custom AI endpoint must use HTTPS or localhost/127.0.0.1 for security.");
                }
            } catch (e) {
                if (e instanceof Error && e.message.includes("Custom AI endpoint")) throw e;
                throw new Error("Invalid custom AI endpoint URL format.");
            }
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (apiKey) {
            headers['Authorization'] = `Bearer ${apiKey}`;
        }

        const response = await requestUrl({
            url,
            method: 'POST',
            headers,
            body: JSON.stringify({
                model,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                response_format: { type: "json_object" }
            })
        });

        const data = response.json;
        const textResult = data?.choices?.[0]?.message?.content || "{}";
        return this.parseJsonResponse(textResult);
    }

    private parseJsonResponse(textResult: string): Record<string, unknown> {
        if (!textResult) return {};
        console.log("🧠 [Colorful Folders AI] Raw LLM Response / Thinking:", textResult);

        // Step 0: Strip thinking blocks (<think>...</think>), markdown codeblock fences (```json, ```javascript, etc.)
        const cleanText = textResult
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/```json|```javascript|```typescript|```/gi, '')
            .replace(/```/g, '')
            .trim();

        // Pre-sanitize arrow notation (=> or ->) before JSON parsing
        const preSanitizedText = cleanText
            .replace(/"\s*=?>\s*/g, '": ')
            .replace(/'\s*=?>\s*/g, "': ");

        // Step 1: Attempt standard & single-quote JSON parsing after locating outer bounds { ... }
        let jsonStr = preSanitizedText;
        const startObj = preSanitizedText.indexOf('{');
        const startArr = preSanitizedText.indexOf('[');

        if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
            const endArr = preSanitizedText.lastIndexOf(']');
            if (endArr > startArr) {
                jsonStr = preSanitizedText.substring(startArr, endArr + 1);
            }
        } else if (startObj !== -1) {
            const endObj = preSanitizedText.lastIndexOf('}');
            if (endObj > startObj) {
                jsonStr = preSanitizedText.substring(startObj, endObj + 1);
            } else {
                jsonStr = preSanitizedText.substring(startObj);
            }
        }

        // Replace single quotes with double quotes for loose single-quoted JSON e.g. {'key': ['val']}
        const sanitizedStr = jsonStr
            .replace(/,\s*([}\]])/g, '$1')
            .replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, '"$1"');

        try {
            const parsed = JSON.parse(sanitizedStr);
            if (parsed && typeof parsed === 'object') {
                return this.unwrapOuterJsonObject(parsed);
            }
        } catch {
            // Try auto-repairing truncated JSON (strip trailing comma & append missing closing brace/bracket)
            try {
                const repairedStr = sanitizedStr.replace(/,\s*$/, '').trim() + (sanitizedStr.trim().startsWith('[') ? ']' : '}');
                const parsed = JSON.parse(repairedStr);
                if (parsed && typeof parsed === 'object') {
                    return this.unwrapOuterJsonObject(parsed);
                }
            } catch {
                // Fallthrough to Multi-Pattern Extractor
            }
        }

        const extracted: Record<string, unknown> = {};
        let match: RegExpExecArray | null;

        // Pattern A: Key-Array JSON Regex Extractor e.g. "Path/To/Item": ["cand1", "cand2"]
        const kvArrayRegex = /"([^"\n\r:]+?)"\s*:\s*\[([^\]]+)\]/g;
        while ((match = kvArrayRegex.exec(cleanText)) !== null) {
            const rawKey = match[1].trim();
            const rawArray = match[2].split(',').map(s => s.replace(/["']/g, '').trim()).filter(Boolean);
            if (rawArray.length > 0) {
                extracted[rawKey] = rawArray;
            }
        }

        // Pattern B: Standard "Key": "Value" or "Key": "Cand1, Cand2" Regex Extractor
        if (Object.keys(extracted).length === 0) {
            const kvRegex1 = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
            while ((match = kvRegex1.exec(cleanText)) !== null) {
                const rawKey = match[1].trim();
                const valStr = match[2].trim();
                const candArray = valStr.includes(',') ? valStr.split(',').map(s => s.trim()).filter(Boolean) : [valStr];
                extracted[rawKey] = candArray;
            }
        }

        // Pattern C: Markdown Table Extractor e.g. | Path | Candidate 1 | Candidate 2 | ... |
        if (Object.keys(extracted).length === 0 && cleanText.includes('|')) {
            const lines = cleanText.split(/\r?\n/);
            for (const line of lines) {
                if (!line.includes('|') || line.includes('---') || line.toLowerCase().includes('candidate')) continue;
                const cells = line.split('|').map(c => c.trim()).filter(Boolean);
                if (cells.length >= 2) {
                    const keyCell = cells[0].replace(/[`*"]/g, '').trim();
                    const candidates = cells.slice(1).map(c => c.replace(/[`*"]/g, '').trim()).filter(c => c && c.length >= 2 && !c.toLowerCase().includes('n/a'));
                    if (keyCell && candidates.length > 0) {
                        extracted[keyCell] = candidates;
                    }
                }
            }
        }

        // Pattern D: Inline Arrow / Colon List Extractor e.g. "Item Path" -> cand1, cand2, cand3
        if (Object.keys(extracted).length === 0) {
            const lines = cleanText.split(/\r?\n/);
            const isCodeJunk = (s: string) => /\b(return|len|get|count|join|import|def|if|else|self|dict|lambda)\b/i.test(s) || s.includes('(') || s.includes(')');
            for (const line of lines) {
                const inlineMatch = line.match(/^[`"*]*([^`"*:\->\n]+)[`"*]*\s*(?:->|=>|=|\:)\s*(.+)$/i);
                if (inlineMatch) {
                    const rawKey = inlineMatch[1].trim();
                    const rawVal = inlineMatch[2].trim().replace(/^\[|\]$/g, '');
                    const isPreamble = /^(below|here|based|note|result|response|status|code)/i.test(rawKey);
                    if (rawKey && !isPreamble && rawVal && !isCodeJunk(rawKey) && !isCodeJunk(rawVal)) {
                        const cands = rawVal.split(/[,;\s]+/).map(s => s.replace(/["']/g, '').trim()).filter(s => s.length >= 2 && !isCodeJunk(s));
                        if (cands.length > 0) {
                            extracted[rawKey] = cands;
                        }
                    }
                }
            }
        }

        // Pattern E: Freeform Markdown List & Section Header Extractor (Bold Sections, Bullet Lists, Link Extractions)
        if (Object.keys(extracted).length === 0) {
            const lines = cleanText.split(/\r?\n/);
            let currentKey = '';
            let currentCandidates: string[] = [];

            const flushCurrent = () => {
                if (currentKey && currentCandidates.length > 0) {
                    extracted[currentKey] = [...currentCandidates];
                }
                currentKey = '';
                currentCandidates = [];
            };

            const isSkipStr = (str: string) => /^(below are|here are|based on|no direct|failed to|plugin:|candidate|tier \d)/i.test(str);

            for (const rawLine of lines) {
                const line = rawLine.trim();
                if (!line || isSkipStr(line)) continue;

                // Header matching: **Title**, ### Title, 1. Title:, Title:, 1. **Title**:
                const headerMatch =
                    line.match(/^\*\*(.+?)\*\*\s*:?$/) ||
                    line.match(/^#+\s+(.+)$/) ||
                    line.match(/^(?:\d+\.|\*|-)?\s*([^:\n]+):$/i);

                const isBullet = /^(?:[-*+]|\d+\.|\w\.)\s+/.test(line);

                if (headerMatch && !isBullet) {
                    const candidateHeader = headerMatch[1].replace(/^\*\*|\*\*$/g, '').replace(/^\*|\*$/g, '').trim();
                    if (candidateHeader && !isSkipStr(candidateHeader)) {
                        flushCurrent();
                        currentKey = candidateHeader;
                        continue;
                    }
                }

                // Bullet matching: 1. candidate, - candidate, * candidate
                const bulletMatch = line.match(/^(?:[-*+]|\d+\.|\w\.)\s+(.+)$/i);
                if (bulletMatch) {
                    let rawContent = bulletMatch[1].trim();
                    let candidateText = '';

                    // Link extraction e.g. [simple-icons-amazon](url)
                    const linkMatch = rawContent.match(/^\[([^\]]+)\](?:\(([^)]+)\))?/);
                    if (linkMatch) {
                        const bracketVal = linkMatch[1].trim();
                        const urlVal = linkMatch[2]?.trim();

                        if ((bracketVal.endsWith('.md') || bracketVal.includes('/')) && !currentKey) {
                            currentKey = bracketVal;
                        } else if (urlVal && (urlVal.endsWith('.md') || urlVal.includes('/')) && !currentKey && !urlVal.startsWith('http')) {
                            currentKey = urlVal;
                        }

                        if (urlVal && (urlVal.includes('icon') || urlVal.includes('symbol') || urlVal.includes('simple-icons'))) {
                            const urlFilename = urlVal.split('/').pop()?.split('#')[0].split('?')[0] || '';
                            const urlCore = urlFilename
                                .replace(/\.(png|jpg|jpeg|gif|pdf|svg|html|md)$/i, '')
                                .replace(/[-_]symbols?|[-_]icons?|[-_]logo|[-_]brand|[-_]image/gi, '')
                                .replace(/[-_]database|[-_]simple/gi, '')
                                .trim();
                            if (urlCore && urlCore.length >= 3 && !/^\d{4}-\d{2}-\d{2}$/.test(urlCore)) {
                                candidateText = urlCore;
                            }
                        }

                        if (!candidateText) {
                            candidateText = bracketVal;
                        }
                    } else {
                        candidateText = rawContent;
                    }

                    // Strip trailing parenthetical explanations like (exact entity/brand ID)
                    candidateText = candidateText
                        .replace(/\s*\([^)]*\)/g, '')
                        .replace(/[\[\]"']/g, '')
                        .replace(/\.(md|png|svg|pdf|html|jpg)$/i, '')
                        .trim();

                    if (candidateText && candidateText.length >= 2 && !isSkipStr(candidateText)) {
                        currentCandidates.push(candidateText);
                    }
                }
            }
            flushCurrent();
        }

        if (Object.keys(extracted).length > 0) {
            console.log("🧠 [Colorful Folders AI] Extracted key-value pairs via multi-pattern fallback:", extracted);
            return extracted;
        }

        console.error("Colorful Folders AI: Failed to parse JSON response", textResult);
        return {};
    }

    private unwrapOuterJsonObject(parsed: Record<string, unknown>): Record<string, unknown> {
        const result: Record<string, unknown> = {};

        const flatten = (obj: Record<string, unknown>) => {
            for (const [k, v] of Object.entries(obj)) {
                if (v && typeof v === 'object' && v !== null && !Array.isArray(v)) {
                    flatten(v as Record<string, unknown>);
                } else if (typeof v === 'string' || Array.isArray(v)) {
                    result[k] = v;
                }
            }
        };

        flatten(parsed);
        return result;
    }

    private extractHttpErrorMessage(err: unknown, provider: string): string {
        if (!err || typeof err !== 'object') return String(err);

        const errObj = err as any;
        let bodyText = errObj.text || '';
        if (!bodyText && errObj.json) {
            try { bodyText = JSON.stringify(errObj.json); } catch { bodyText = ''; }
        }

        if (bodyText) {
            try {
                const parsed = typeof errObj.json === 'object' ? errObj.json : JSON.parse(bodyText);
                if (parsed?.error?.message) return parsed.error.message;
                if (typeof parsed?.error === 'string') return parsed.error;
                if (parsed?.message) return parsed.message;
            } catch {
                // Keep raw text if not JSON
            }
            if (bodyText.length > 0 && bodyText.length < 200) {
                return bodyText.trim();
            }
        }

        const msg = errObj.message || String(err);
        const status = errObj.status;

        if (status === 401 || status === 403 || msg.includes('401') || msg.includes('403')) {
            return "Invalid API key or unauthorized access (status 401/403). Please verify your API key in settings.";
        }

        if (status === 404 || msg.includes('404')) {
            return "Model or API endpoint not found (status 404). Please verify your model name and endpoint URL in settings.";
        }

        if (status === 429 || msg.includes('429')) {
            return "AI API rate limit exceeded or quota exhausted (status 429). Please wait a moment or check your API quota.";
        }

        if (
            msg.includes('net::ERR_CONNECTION_REFUSED') ||
            msg.includes('Failed to fetch') ||
            msg.includes('ECONNREFUSED') ||
            msg.includes('connect')
        ) {
            if (provider === 'ollama') {
                return "Could not connect to Ollama server at http://localhost:11434. Please ensure the Ollama app or service is started.";
            }
            return "Could not connect to local AI service. Please ensure the server is running.";
        }

        if (status === 500 || msg.includes('status 500') || msg.includes('500')) {
            if (provider === 'ollama') {
                return "Ollama model is not downloaded or service returned an error. Please open terminal and run: 'ollama run <model_name>' (e.g., 'ollama run llama3').";
            }
            return `AI provider returned server error (status 500). Please check your API key, endpoint, or model settings.`;
        }

        return msg;
    }
}
