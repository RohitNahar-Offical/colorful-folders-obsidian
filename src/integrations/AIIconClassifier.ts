import * as obsidian from 'obsidian';
import { requestUrl, Notice, TFolder, TFile } from 'obsidian';
import { IColorfulFoldersPlugin, ColorfulFoldersSettings } from '../common/types';
import { normalizePathKey } from '../common/utils';

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
            new Notice("Colorful folders AI: Stopping classification process...");
        } else {
            new Notice("Colorful folders AI: No classification is currently running.");
        }
    }

    public async classifyVault(options?: { force?: boolean }): Promise<void> {
        if (this.isClassifying) {
            new Notice("Colorful folders AI: Classification is already in progress...");
            return;
        }

        this.cancelRequested = false;

        const settings = this.plugin.settings;

        this.isClassifying = true;
        const notice = new Notice("Colorful folders AI: Gathering vault items...", 0);

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

                const vectorCandidateMap = this.plugin.embeddingModel?.getBatchVectorCandidatesAsync
                    ? await this.plugin.embeddingModel.getBatchVectorCandidatesAsync(batchTargets, 5)
                    : {};

                const contextPayload = batchTargets.map(t => {
                    const itemObj: Record<string, unknown> = {
                        item_path: t.path,
                        type: t.isFolder ? 'Folder' : 'File'
                    };
                    const vecCandidates = vectorCandidateMap[t.path];
                    if (vecCandidates && vecCandidates.length > 0) {
                        itemObj.candidates = vecCandidates;
                    }
                    if (t.isFolder && t.childSamples && t.childSamples.length > 0) {
                        itemObj.sample_contents = t.childSamples.join(', ');
                    }
                    if (!t.isFolder) {
                        if (t.tags && t.tags.length > 0) itemObj.tags = t.tags.join(', ');
                        const snippet = (t as { contentSnippet?: string }).contentSnippet;
                        if (snippet) itemObj.snippet = snippet;
                    }
                    return itemObj;
                });

                if (settings.iconDebugMode) {
                    console.debug(`🤖 [Colorful Folders AI] Batch ${currentBatch}/${batchChunks.length} Context Payload Sent:`, contextPayload);
                }

                try {
                    const result = await this.queryAI(contextPayload, systemPrompt);
                    let kvPairs: Record<string, unknown> = {};

                    if (Array.isArray(result)) {
                        batchTargets.forEach((t, itemIdx) => {
                            const val = (result as unknown[])[itemIdx];
                            if (val) kvPairs[t.path] = val;
                        });
                    } else if (result && typeof result === 'object') {
                        const keys = Object.keys(result);
                        if (keys.length === 1 && typeof result[keys[0]] === 'object' && !Array.isArray(result[keys[0]])) {
                            kvPairs = result[keys[0]] as Record<string, unknown>;
                        } else {
                            kvPairs = result;
                        }
                    }

                    if (settings.iconDebugMode) {
                        console.debug(`📦 [Colorful Folders AI] Batch ${currentBatch}/${batchChunks.length} Parsed Output:`, kvPairs);
                    }

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
                            const cObj = conceptVal as Record<string, unknown>;
                            const raw = (cObj.icon || cObj.iconId || cObj.concept || '') as string;
                            if (raw) candidatesList.push(String(raw).trim());
                        } else if (conceptVal) {
                            const valStr = (typeof conceptVal === 'string' ? conceptVal
                                : typeof conceptVal === 'number' || typeof conceptVal === 'boolean' ? String(conceptVal)
                                : '').trim();
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
                            const cleanPrefix = lowerClean.replace(/^(lucide|feather|tabler|simple-icons|ri|fa|octicon|bx|ra|bi)-/i, '');
                            const packHit = this.plugin.iconManager.findIconInPacks(lowerClean) ||
                                this.plugin.iconManager.findIconInPacks(hyphenated) ||
                                (cleanPrefix !== lowerClean ? this.plugin.iconManager.findIconInPacks(cleanPrefix) : null) ||
                                this.plugin.iconManager.searchFuzzy(lowerClean, { threshold: 0.5 }) ||
                                this.plugin.iconManager.searchFuzzy(hyphenated, { threshold: 0.5 });
                            if (packHit) return packHit;

                            // 5. Word extraction & relaxed fuzzy search per word (threshold 0.5)
                            const words = hyphenated.split(/[-_:\s]+/).filter(w => w.length >= 3 && !/^\d+$/.test(w));
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
                                .replace(/[^a-z0-9-]/gi, '')
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
                                console.debug(`Colorful Folders AI: "${targetItem.path}" resolved to "${matchedIcon}" via Candidate Tier ${winningTier} fallback.`);
                            }
                        } else {
                            // Layer 4: Fallback to Native Auto-Icon System or Vector Embedding Engine
                            const autoIcon = this.plugin.iconManager.getAutoIconData(targetItem.name, targetItem.path);
                            const fallbackIcon = autoIcon?.lucide || autoIcon?.emoji;
                            if (fallbackIcon) {
                                conceptMap.set(targetItem.path, fallbackIcon);
                                conceptMap.set(normalizeKey(targetItem.path), fallbackIcon);
                            } else {
                                const vectorFallback = this.plugin.embeddingModel?.findBestIcons(targetItem.name || targetItem.path, { topK: 1, isFolder: targetItem.isFolder }) || [];
                                const resolvedFallback = vectorFallback.length > 0 ? vectorFallback[0].iconId : (targetItem.isFolder ? 'folder' : 'file-text');
                                conceptMap.set(targetItem.path, resolvedFallback);
                                conceptMap.set(normalizeKey(targetItem.path), resolvedFallback);
                            }
                        }
                    }
                } catch (err) {
                    const msg = (err as Error)?.message || String(err);
                    console.error(`Colorful Folders AI: Batch ${currentBatch} classification failed`, err as Error);
                    new Notice(`Colorful Folders AI: ${msg}`, 6000);
                } finally {
                    completedBatches++;
                    const pct = Math.round((completedBatches / Math.max(1, batchChunks.length)) * 100);
                    notice.setMessage(`✨ Colorful Folders AI: ${pct}% (${completedBatches}/${batchChunks.length} batches processed)...`);
                }
            });

            // Execute batch tasks with dynamic max concurrency
            const executing: { p: Promise<void> }[] = [];
            for (const task of tasks) {
                if (this.cancelRequested) {
                    notice.setMessage("Colorful Folders AI: Classification cancelled by user.");
                    window.setTimeout(() => notice.hide(), 4000);
                    break;
                }
                const item: { p: Promise<void> } = {
                    p: Promise.resolve()
                };
                item.p = (async (): Promise<void> => {
                    await task();
                    const idx = executing.indexOf(item);
                    if (idx !== -1) executing.splice(idx, 1);
                })();
                void item.p;
                executing.push(item);
                if (executing.length >= maxConcurrent) {
                    await Promise.race(executing.map(x => x.p));
                }
            }
            await Promise.all(executing.map(x => x.p));

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

                const itemSnippet = 'contentSnippet' in item && typeof item.contentSnippet === 'string' ? item.contentSnippet : '';
                if (iconId) {
                    const itemHash = `${item.path}:${itemSnippet}:${(item.tags || []).join(',')}`;
                    const modelLabel = settings.aiProvider === 'ollama'
                        ? `ai-ollama:${settings.aiModelName || 'qwen2.5:1.5b'}`
                        : `ai-custom:${settings.aiModelName || 'local-model'}`;
                    const existing = settings.customFolderColors[item.path];
                    if (typeof existing === 'object' && existing) {
                        existing.iconId = iconId;
                        existing.aiHash = itemHash;
                        existing.iconSource = modelLabel;
                    } else if (typeof existing === 'string') {
                        settings.customFolderColors[item.path] = { hex: existing, iconId, aiHash: itemHash, iconSource: modelLabel };
                    } else {
                        settings.customFolderColors[item.path] = { iconId, aiHash: itemHash, iconSource: modelLabel };
                    }
                    assignedSummary[item.path] = iconId;
                    assignedCount++;
                }
            }

            if (settings.iconDebugMode) {
                console.debug(`✨ [Colorful Folders AI] Successfully Assigned ${assignedCount} Icons directly from AI:`, assignedSummary);
            }

            await this.plugin.saveSettings();
            await this.plugin.generateStyles();

            const modelLabel = settings.aiProvider === 'ollama'
                ? settings.aiModelName || 'qwen2.5:1.5b'
                : settings.aiModelName || 'local-model';
            notice.setMessage(`Colorful Folders AI: Successfully assigned icons to ${assignedCount} vault items via ${modelLabel}! ✨`);
            window.setTimeout(() => notice.hide(), 4000);
        } catch (e) {
            console.error("Colorful Folders AI Classification Error:", e as Error);
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
            const arr = packSamplesMap.get(prefix);
            if (arr && arr.length < 10) {
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

        return `You are an expert AI taxonomist and icon matcher for an Obsidian note-taking app. ${evaluationScope} Your objective is to select 3 CANDIDATE ICON NAMES for each requested vault item ordered from specific to general.

### PRE-VERIFIED VECTOR CANDIDATES RULE (STRICT):
If an item in the JSON request payload contains a 'candidates' list, prioritize selecting from the 'candidates' list.

### PRECISE NAME / BRAND OVERRIDE RULE (CRITICAL):
If the item name contains a precise proper noun, company, software framework, tech brand, or person name (e.g. "OpenAI", "PyTorch", "Kubernetes", "Kafka", "Supabase", "PostgreSQL", "Shakespeare") that vector search missed, the AI MUST OVERRIDE generic candidates and output the exact brand/tool icon ID (e.g. "simple-icons-openai", "simple-icons-kubernetes", "database", "brain")!

### ITEM NAME PRIORITY RULE (STRICT):
1. **FOCUS STICKLY ON THE ITEM NAME FIRST:** Base icon selection 100% on the actual file name or folder name (e.g. for "BAKE/Amazon.md", focus strictly on "Amazon").
2. **DO NOT USE PARENT CONTEXT OR TAGS UNLESS STRUGGLING:** Do NOT look at parent folders, tags, frontmatter, or content snippets UNLESS the file/folder name alone is completely generic, vague, or ambiguous (e.g. "Untitled.md", "Notes.md", "123.md", "exprement.md"). Only fallback to parent context when the filename alone provides no meaningful icon clues.

### 3-CANDIDATE SELECTION RULE (CRITICAL):
For EVERY requested item, output a JSON array of EXACTLY 3 candidate icon names:
- **Candidate 1 (Specific Brand / Precise Icon):** Specific brand, tool, or precise topic icon (e.g. "amazon", "simple-icons-amazon", "python", "react", "youtube", "book-open").
- **Candidate 2 (Core Category Metaphor):** Primary category icon or visual domain metaphor (e.g. "shopping-cart", "shopping-bag", "code", "calendar", "book", "video", "receipt").
- E-Commerce & Retail Brands ("Amazon", "eBay", "Shopify", "Walmart"): Candidate 1 = "amazon" or "simple-icons-amazon", Candidate 2 = "shopping-cart" or "shopping-bag", Candidate 3 = "package" or "store". NEVER assign video or music icons!
- Video/Media Brands ("YouTube", "Netflix"): Candidate 1 = "youtube" or "simple-icons-youtube", Candidate 2 = "video" or "film", Candidate 3 = "play" or "camera".
- Development & Tech Brands ("Python", "React", "Docker", "GitHub"): Candidate 1 = "python" or "simple-icons-python", Candidate 2 = "code", Candidate 3 = "terminal" or "cpu".
- People & Person Names ("John Smith", "Dr. Sarah Conner", "Author", "Client"): Candidate 1 = "user" or "contact" or "id-card", Candidate 2 = "users" or "profile", Candidate 3 = "folder-users" or "file-text".

### PEOPLE & PERSON NAMES RULE (CRITICAL):
If an item is a person's name (e.g. "John Smith", "Dr. Sarah Conner", "Albert Einstein", "Alex Johnson"), a biography, author note, client file, team member, or contact:
- Candidate 1 MUST be a person/contact icon: "user", "contact", "id-card", "user-check", or "profile".
- Candidate 2 MUST be: "users" (for groups/teams) or "user" or "contact".
- Candidate 3 MUST be: "folder-users" (for folders) or "book-open" (for biographies) or "file-text".
- NEVER output tech icons ("code", "terminal"), product icons ("box", "package"), or generic document fallbacks ("file-text") for people/person names!

### FOLDER VS FILE DIFFERENTIATION RULE:
- For FOLDERS: Candidates 2 & 3 MUST be structural container icons (e.g. "folder", "layers", "archive", "box").
- For FILES / NOTES: Candidates 1, 2, and 3 MUST match the note topic. Do NOT output generic document fallbacks ("file-text", "file", "document").

### RECOMMENDED ICON EXAMPLES:
- **People, Contacts & Names**: \`user\`, \`users\`, \`contact\`, \`id-card\`, \`user-check\`, \`user-round\`, \`folder-users\`, \`profile\`
- **E-Commerce & Brands**: \`amazon\`, \`simple-icons-amazon\`, \`shopify\`, \`shopping-cart\`, \`shopping-bag\`, \`store\`, \`package\`, \`credit-card\`
- **Development & Tech**: \`python\`, \`simple-icons-python\`, \`javascript\`, \`docker\`, \`react\`, \`github\`, \`code\`, \`terminal\`, \`cpu\`, \`database\`
- **Writing, Notes & Books**: \`book-open\`, \`book\`, \`pen-tool\`, \`notebook\`, \`quote\`, \`sticky-note\`, \`library\`
- **Tasks, Plans & Projects**: \`check-square\`, \`check-circle\`, \`calendar\`, \`clock\`, \`target\`, \`flag\`, \`layers\`
- **Finance & Business**: \`dollar-sign\`, \`pie-chart\`, \`bar-chart\`, \`coins\`, \`trending-up\`, \`briefcase\`, \`receipt\`

### INSTALLED ICON PACK SAMPLE IDs:
[${sampleIconsStr || 'Lucide, Simple Icons, FontAwesome, Tabler, etc.'}]

### STRICT RULES & CONSTRAINTS:
- Each key in your returned JSON object MUST be the exact 'item_path' string.
- Value MUST be an array of 3 strings: ["Candidate1_BrandOrSpecific", "Candidate2_CategoryMetaphor", "Candidate3_AlternativeTopic"].
- ALWAYS use hyphens ('-') instead of underscores ('_'). Write 'shopping-cart' (NOT 'shopping_cart').
- ALWAYS output standard JSON format.

### EXACT FEW-SHOT EXAMPLES:
Correct Output:
{
  "BAKE/Amazon.md": ["amazon", "shopping-cart", "package"],
  "Development/FastAPI Backend.md": ["python", "code", "terminal"],
  "People/John Smith.md": ["user", "contact", "id-card"],
  "Personal/Reading List.md": ["book-open", "book", "notebook"],
  "Work/Client Meetings 2026/Q3 Planning.md": ["calendar", "clock", "target"],
  "Projects/Website Redesign": ["react", "folder", "layers"]
}`;
    }

    private async queryAI(payload: Record<string, unknown>[], systemPrompt: string): Promise<Record<string, unknown>> {
        const settings = this.plugin.settings;
        const provider = settings.aiProvider;
        const userPrompt = JSON.stringify(payload);

        let lastErr: unknown = null;
        for (let attempt = 1; attempt <= 3; attempt++) {
            try {
                if (provider === 'custom') {
                    return await this.queryCustomLocal(settings, systemPrompt, userPrompt);
                } else {
                    return await this.queryOllama(settings, systemPrompt, userPrompt);
                }
            } catch (err) {
                lastErr = err;
                const errStr = (err as Error)?.message || String(err);

                // Fail fast on HTTP 404 (Not Found) without wasting 3 retries
                const is404 = errStr.includes('status 404') || errStr.includes('404 Not Found') || (err as { status?: number })?.status === 404;

                if (is404) {
                    const modelName = (settings.aiModelName || 'qwen2.5:1.5b').trim();
                    if (provider === 'ollama') {
                        throw new Error(`Ollama model "${modelName}" was not found (HTTP 404). Run 'ollama pull ${modelName}' in your terminal or pick an installed model in AI Settings.`);
                    } else {
                        throw new Error(`Local model "${modelName}" or custom endpoint URL was not found (HTTP 404). Check your settings.`);
                    }
                }

                if (attempt < 3) {
                    console.warn(`Colorful Folders AI: Batch request attempt ${attempt} failed, retrying in ${attempt * 1000}ms...`, err as Error);
                    await new Promise(res => window.setTimeout(res, attempt * 1000));
                }
            }
        }
        throw lastErr;
    }

    private async queryOllama(settings: ColorfulFoldersSettings, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
        const model = (settings.aiModelName || 'qwen2.5:1.5b').trim();
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
            const data = response.json as { choices?: Array<{ message?: { content?: string } }> };
            const textResult = data?.choices?.[0]?.message?.content || "{}";
            return this.parseJsonResponse(textResult);
        } catch (e) {
            const errStr = (e as Error)?.message || String(e);
            if (errStr.includes('net::ERR_CONNECTION_REFUSED') || errStr.includes('Failed to fetch') || errStr.includes('ECONNREFUSED') || errStr.includes('connect')) {
                throw new Error(`Could not connect to Ollama at ${baseUrl}. Please ensure the Ollama desktop app or service is running on your machine.`);
            }
            console.warn("Colorful Folders AI: Ollama /v1/chat/completions failed, trying /api/generate fallback...", e as Error);
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
            const data = response.json as { response?: string };
            const textResult = data?.response || "{}";
            return this.parseJsonResponse(textResult);
        }
    }

    private async queryCustomLocal(settings: ColorfulFoldersSettings, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
        const model = (settings.aiModelName || 'local-model').trim();

        if (!settings.aiCustomEndpoint?.trim()) {
            throw new Error("Please enter a valid Local Custom AI Endpoint URL in Settings -> Icon management -> AI Settings.");
        }

        const url = settings.aiCustomEndpoint.trim();

        // Validate custom endpoint URL scheme
        try {
            const endpointUrl = new URL(url);
            if (endpointUrl.protocol !== 'https:' && !endpointUrl.hostname.includes('localhost') && !endpointUrl.hostname.startsWith('127.')) {
                throw new Error("Custom local AI endpoint must use HTTPS or localhost/127.0.0.1.");
            }
        } catch (e) {
            if (e instanceof Error && e.message.includes("Custom local AI endpoint")) throw e;
            throw new Error("Invalid custom AI endpoint URL format.");
        }

        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (settings.aiApiKey?.trim()) {
            headers['Authorization'] = `Bearer ${settings.aiApiKey.trim()}`;
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

        const data = response.json as { choices?: Array<{ message?: { content?: string } }> } | undefined;
        const textResult = data?.choices?.[0]?.message?.content || "{}";
        return this.parseJsonResponse(textResult);
    }

    private parseJsonResponse(textResult: string): Record<string, unknown> {
        if (!textResult) return {};
        console.debug("🧠 [Colorful Folders AI] Raw LLM Response / Thinking:", textResult);

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
            const parsed = JSON.parse(sanitizedStr) as Record<string, unknown>;
            if (parsed && typeof parsed === 'object') {
                return this.unwrapOuterJsonObject(parsed);
            }
        } catch {
            // Try auto-repairing truncated JSON (strip trailing comma & append missing closing brace/bracket)
            try {
                const repairedStr = sanitizedStr.replace(/,\s*$/, '').trim() + (sanitizedStr.trim().startsWith('[') ? ']' : '}');
                const parsed = JSON.parse(repairedStr) as Record<string, unknown>;
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
                const inlineMatch = line.match(/^[`"*]*([^`"*:->\n]+)[`"*]*\s*(?:->|=>|=|:)\s*(.+)$/i);
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
                        .replace(/[[\]"']/g, '')
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
            console.debug("🧠 [Colorful Folders AI] Extracted key-value pairs via multi-pattern fallback:", extracted);
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
        if (!err || typeof err !== 'object') {
            return typeof err === 'string' ? err
                : typeof err === 'number' || typeof err === 'boolean' ? String(err)
                : 'Unknown error';
        }

        const errObj = err as Record<string, unknown>;
        let bodyText = typeof errObj.text === 'string' ? errObj.text : '';
        if (!bodyText && errObj.json) {
            try { bodyText = JSON.stringify(errObj.json); } catch { bodyText = ''; }
        }

        if (bodyText) {
            try {
                const parsed = (typeof errObj.json === 'object' && errObj.json ? errObj.json : JSON.parse(bodyText)) as Record<string, unknown>;
                const errorObj = parsed.error;
                if (typeof errorObj === 'object' && errorObj && 'message' in errorObj && typeof errorObj.message === 'string') return errorObj.message;
                if (typeof errorObj === 'string') return errorObj;
                if (typeof parsed.message === 'string') return parsed.message;
            } catch {
                // Keep raw text if not JSON
            }
            if (bodyText.length > 0 && bodyText.length < 200) {
                return bodyText.trim();
            }
        }

        const msg = typeof errObj.message === 'string' ? errObj.message : 'Unknown error';
        const status = typeof errObj.status === 'number' ? errObj.status : null;

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
