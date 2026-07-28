import { requestUrl, Notice, TFolder, TFile, getIconIds } from 'obsidian';
import { IColorfulFoldersPlugin } from '../common/types';

export class AIIconClassifier {
    private static isClassifying = false;

    static async classifyVault(plugin: IColorfulFoldersPlugin, options?: { force?: boolean }): Promise<void> {
        if (this.isClassifying) {
            new Notice("Colorful Folders AI: Classification is already in progress...");
            return;
        }

        const settings = plugin.settings;
        if (!settings.aiApiKey && settings.aiProvider !== 'custom' && settings.aiProvider !== 'ollama') {
            new Notice("Colorful Folders AI: Please enter an API key in Settings -> Icon management -> AI Settings.");
            return;
        }

        this.isClassifying = true;
        const notice = new Notice("Colorful Folders AI: Gathering vault items...", 0);

        try {
            // 1. Gather all vault folders and (optionally) markdown files with rich context
            const allFiles = plugin.app.vault.getAllLoadedFiles();
            const targets: {
                path: string;
                name: string;
                isFolder: boolean;
                parentFolder: string;
                childSamples?: string[];
                tags?: string[];
            }[] = [];

            for (const file of allFiles) {
                if (file.path.startsWith('.') || file.path.includes('/.')) continue;
                
                let parentFolder = "Root";
                if (file.parent && !file.parent.isRoot()) {
                    parentFolder = file.parent.name;
                }

                if (file instanceof TFolder && !file.isRoot()) {
                    const childSamples: string[] = [];
                    for (const child of file.children.slice(0, 5)) {
                        childSamples.push(child.name);
                    }
                    targets.push({
                        path: file.path,
                        name: file.name,
                        isFolder: true,
                        parentFolder,
                        childSamples
                    });
                } else if (settings.aiIncludeFiles && file instanceof TFile && file.extension === 'md') {
                    const tags: string[] = [];
                    if (plugin.app?.metadataCache) {
                        const cache = plugin.app.metadataCache.getFileCache(file);
                        if (cache?.tags) {
                            tags.push(...cache.tags.map(t => t.tag));
                        } else if (cache?.frontmatter?.tags) {
                            const fmTags = Array.isArray(cache.frontmatter.tags)
                                ? cache.frontmatter.tags
                                : typeof cache.frontmatter.tags === 'string'
                                    ? cache.frontmatter.tags.split(',')
                                    : [];
                            tags.push(...fmTags.map(t => String(t).trim()));
                        }
                    }
                    targets.push({
                        path: file.path,
                        name: file.basename,
                        isFolder: false,
                        parentFolder,
                        tags
                    });
                }
            }

            if (targets.length === 0) {
                notice.setMessage("Colorful Folders AI: No items found to classify.");
                window.setTimeout(() => notice.hide(), 3000);
                return;
            }

            // Filter out items that already have explicit custom icons unless force is true
            const unassignedTargets = targets.filter(t => {
                if (options?.force) return true;
                const existing = settings.customFolderColors[t.path];
                if (typeof existing === 'object' && existing.iconId) return false;
                return true;
            });

            if (unassignedTargets.length === 0) {
                notice.setMessage("Colorful Folders AI: All items already have custom icons assigned!");
                window.setTimeout(() => notice.hide(), 3000);
                return;
            }

            notice.setMessage(`Colorful Folders AI: Analyzing ${unassignedTargets.length} vault items...`);

            // Batch targets in chunks of 30 for context awareness
            const batchSize = 30;
            const conceptMap = new Map<string, string[]>(); // path/normName -> candidate keywords/iconIds array
            const normalizeKey = (str: string) => str.toLowerCase().replace(/\.md$/i, '').replace(/[^a-z0-9]/gi, '');

            const batchChunks: (typeof unassignedTargets)[] = [];
            for (let i = 0; i < unassignedTargets.length; i += batchSize) {
                batchChunks.push(unassignedTargets.slice(i, i + batchSize));
            }

            let completedBatches = 0;
            const tasks = batchChunks.map((batchTargets, idx) => async () => {
                const currentBatch = idx + 1;
                const contextPayload = batchTargets.map(t => {
                    const itemObj: Record<string, any> = {
                        title: t.name,
                        path: t.path,
                        parent: t.parentFolder
                    };
                    if (t.isFolder && t.childSamples && t.childSamples.length > 0) {
                        itemObj.files = t.childSamples;
                    }
                    if (!t.isFolder && t.tags && t.tags.length > 0) {
                        itemObj.tags = t.tags;
                    }
                    return itemObj;
                });

                console.log(`🤖 [Colorful Folders AI] Batch ${currentBatch}/${batchChunks.length} Context Payload Sent:`, contextPayload);

                try {
                    const result = await this.queryAI(plugin, contextPayload);
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

                    for (const [key, conceptVal] of Object.entries(kvPairs)) {
                        if (!conceptVal) continue;
                        const candidates: string[] = Array.isArray(conceptVal)
                            ? conceptVal.map(s => String(s).trim())
                            : typeof conceptVal === 'object'
                                ? [String((conceptVal as any).icon || (conceptVal as any).iconId || (conceptVal as any).concept || '')]
                                : [String(conceptVal).trim()];

                        const validCandidates = candidates.filter(Boolean);
                        if (validCandidates.length > 0) {
                            conceptMap.set(key, validCandidates);
                            conceptMap.set(normalizeKey(key), validCandidates);
                        }
                    }
                } catch (err) {
                    console.error(`Colorful Folders AI: Batch ${currentBatch} classification failed`, err);
                } finally {
                    completedBatches++;
                    notice.setMessage(`Colorful Folders AI: Processed ${completedBatches}/${batchChunks.length} batches...`);
                }
            });

            // Execute batch tasks with controlled max concurrency (3 parallel requests max to avoid 429 Rate Limits)
            const maxConcurrent = 3;
            const executing: Promise<void>[] = [];
            for (const task of tasks) {
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

            // Apply concept matches to vault items
            let assignedCount = 0;
            const customKeys = plugin.settings.customIcons ? Object.keys(plugin.settings.customIcons) : [];
            const lucideKeys = typeof getIconIds === 'function' ? getIconIds().map(id => id.replace(/^lucide-/, '')) : [];
            const lucideSet = new Set(lucideKeys.map(k => k.toLowerCase()));
            const customKeysSet = new Set(customKeys.map(k => k.toLowerCase()));
            const assignedSummary: Record<string, string> = {};

            // O(1) Pre-built brand lookup map: coreName -> exactKey
            const brandMap = new Map<string, string>();
            for (const k of customKeys) {
                const core = k.toLowerCase().replace(/^(simple-icons|feather|ri|tabler|octicon|fa-regular|fa-solid|ra|bx|bxs|ph)[-_:]/, '');
                if (!brandMap.has(core)) {
                    brandMap.set(core, k);
                }
            }

            for (const item of unassignedTargets) {
                const normName = normalizeKey(item.name);
                const normPath = normalizeKey(item.path);
                const candidateList = conceptMap.get(item.path) || conceptMap.get(normPath) || conceptMap.get(normName) || conceptMap.get(item.name) || [];
                
                let iconId = "";

                // 0. Direct Brand & Title Matcher (O(1) lookup e.g. "Amazon" -> "simple-icons-amazon", "Python" -> "simple-icons-python")
                const lName = item.name.toLowerCase().trim();
                if (brandMap.has(lName)) {
                    iconId = brandMap.get(lName)!;
                }

                if (!iconId && candidateList.length > 0) {
                    for (const candidate of candidateList) {
                        if (!candidate) continue;
                        const lowerConcept = candidate.toLowerCase();

                        // 1. Direct match check against customIcons or Lucide icons (O(1))
                        if (customKeysSet.has(candidate) || customKeysSet.has(lowerConcept)) {
                            iconId = customKeys.find(k => k === candidate || k.toLowerCase() === lowerConcept) || candidate;
                        } else if (lucideSet.has(lowerConcept)) {
                            iconId = lowerConcept;
                        }

                        // 2. AutoIcon rules lookup
                        if (!iconId) {
                            const autoIcon = plugin.iconManager.getAutoIconData(lowerConcept);
                            if (autoIcon) {
                                iconId = autoIcon.lucide || autoIcon.emoji;
                            }
                        }

                        // 3. Fallback search across installed icon packs (IconPackIndex fuzzy/prefix matching)
                        if (!iconId && plugin.iconManager) {
                            const foundInPacks = plugin.iconManager.findIconInPacks(lowerConcept);
                            if (foundInPacks) {
                                iconId = foundInPacks;
                            }
                        }

                        // 4. Word-by-word and compound subword fallback matching
                        if (!iconId && plugin.iconManager) {
                            const rawWords = candidate.split(/[-_\s/:]+/).filter(w => w.length >= 3);
                            const candidateWords = new Set<string>(rawWords);
                            const commonStems = ["clock", "time", "calendar", "archive", "mic", "phone", "file", "folder", "book", "code", "lock", "key", "box", "list", "card", "mark", "tag", "mail", "user", "star", "note"];

                            for (const w of rawWords) {
                                for (const stem of commonStems) {
                                    if (w.includes(stem)) candidateWords.add(stem);
                                }
                            }

                            for (const word of Array.from(candidateWords)) {
                                const lWord = word.toLowerCase();
                                if (customKeysSet.has(word) || customKeysSet.has(lWord)) {
                                    iconId = customKeys.find(k => k === word || k.toLowerCase() === lWord) || word;
                                    break;
                                } else if (lucideSet.has(lWord)) {
                                    iconId = lWord;
                                    break;
                                }
                                const foundWord = plugin.iconManager.findIconInPacks(word);
                                if (foundWord) {
                                    iconId = foundWord;
                                    break;
                                }
                            }
                        }

                        if (iconId) break; // First matching synonym candidate WINS!
                    }
                }

                // 5. Automatic Year / Date / Archive Fallback for 4-digit years (e.g., 2022, 2023, 2024, Taxes 2022)
                if (!iconId && /\b(19|20)\d{2}\b/.test(item.name)) {
                    const yearFallbacks = ["calendar", "clock", "archive", "history"];
                    for (const yf of yearFallbacks) {
                        if (lucideSet.has(yf) || (plugin.iconManager && !!plugin.iconManager.findIconInPacks(yf))) {
                            iconId = yf;
                            break;
                        }
                    }
                }

                // 6. Strict Icon Validation: Only assign iconId if an actual SVG or emoji is renderable!
                const isEmoji = iconId && (iconId.length <= 2 || /[^a-zA-Z0-9\-_/.]/.test(iconId));
                const isValid = iconId && (
                    isEmoji ||
                    customKeysSet.has(iconId.toLowerCase()) ||
                    lucideSet.has(iconId.toLowerCase()) ||
                    (plugin.iconManager && !!plugin.iconManager.findIconInPacks(iconId))
                );

                if (isValid) {
                    const existing = settings.customFolderColors[item.path];
                    if (typeof existing === 'object') {
                        existing.iconId = iconId;
                    } else if (typeof existing === 'string') {
                        settings.customFolderColors[item.path] = { hex: existing, iconId };
                    } else {
                        settings.customFolderColors[item.path] = { iconId };
                    }
                    assignedSummary[item.path] = iconId;
                    assignedCount++;
                }
            }

            console.log(`✨ [Colorful Folders AI] Successfully Assigned ${assignedCount} Icons:`, assignedSummary);

            await plugin.saveSettings();
            await plugin.generateStyles();

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

    private static async queryAI(plugin: IColorfulFoldersPlugin, payload: any[]): Promise<Record<string, unknown>> {
        const settings = plugin.settings;
        const provider = settings.aiProvider;

        const customKeys = plugin.settings.customIcons ? Object.keys(plugin.settings.customIcons) : [];
        
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
            if (arr.length < 8) {
                arr.push(key);
            }
        }

        const sampledIconIDs: string[] = [];
        for (const samples of packSamplesMap.values()) {
            sampledIconIDs.push(...samples);
        }

        const PACK_DESCRIPTIONS: Record<string, string> = {
            'simple-icons': 'Simple Icons: Exact brand, technology, software, and company logos (e.g. Amazon, GitHub, Python, Google, Docker, React, Spotify, Notion, Discord, Apple, Microsoft, YouTube).',
            'feather': 'Feather Icons: Minimal line UI icons for generic concepts (e.g. folder, file-text, lock, key, globe, code, terminal, database, search, user).',
            'ri': 'Remix Icons: Comprehensive category icons for media, finance, health, document types, tools, and UI.',
            'tabler': 'Tabler Icons: Detailed stroke UI icons for workflows, dev tools, and file categories.',
            'octicon': 'Octicons: Developer and repository icons (e.g. repo, git-branch, terminal, issue-opened).',
            'fa': 'FontAwesome: Standard web and solid icons (e.g. file-code, folder-open, star, check).',
            'bx': 'Boxicons: High quality web icons for files, folders, and UI elements.',
            'ra': 'RPG Awesome: Fantasy, gaming, and gaming concept icons.',
            'cf': 'Custom Vault Icons.'
        };

        const packDescriptionsList: string[] = [];
        for (const prefix of packSamplesMap.keys()) {
            const matchedKey = Object.keys(PACK_DESCRIPTIONS).find(k => prefix.startsWith(k));
            if (matchedKey) {
                packDescriptionsList.push(`- ${PACK_DESCRIPTIONS[matchedKey]}`);
            } else {
                packDescriptionsList.push(`- ${prefix}: Installed icon pack (${prefix}-*).`);
            }
        }

        const sampleIconsStr = sampledIconIDs.slice(0, 60).join(', ');

        const packInfo = packSamplesMap.size > 0
            ? `Installed Icon Pack Details & Capabilities:\n${packDescriptionsList.join('\n')}\nSample IDs across packs: [${sampleIconsStr}]. Standard Lucide Icons: [folder, file, server, database, rocket, code, terminal, cpu, book, user, lock, home, key, leaf, music, video, search, mail, calendar, clock, archive, history].`
            : `Available icon library: Lucide standard icons.`;

        const systemPrompt = `You are an expert, context-aware AI assistant for an Obsidian note-taking app. Your task is to select relevant icon candidates for each vault item.
${packInfo}

Context & Pack Selection Instructions:
1. Examine each item's 'title', 'path', 'parent', 'files', and 'tags' to understand its true domain (e.g. finances/taxes, coding/software, school/academics, photography, music, personal, gaming, project management).
2. Select the right icon pack based on full pack details above:
   - Use 'Simple Icons' (e.g. 'simple-icons-amazon', 'simple-icons-github', 'simple-icons-python') for companies, apps, software, brands, or languages.
   - Use 'Feather' / 'Lucide' / 'Remix' / 'Tabler' for generic categories, folders, or document concepts (e.g. 'feather-lock', 'calendar', 'terminal', 'database').
3. SYNONYM CANDIDATE LIST: For each item, output an array of up to 4 candidate keywords or exact icon IDs ordered from most specific to general.
   Example format: { "Path/To/Item": ["simple-icons-amazon", "shopping", "box", "package"] }
4. For year or date numbers (e.g., '2022' under 'Finances/Taxes'), include candidates like ["calendar", "clock", "archive", "history"].
5. Output ONLY valid JSON mapping exact item 'path' to an array of string candidates. Do not include markdown codeblocks or thinking process.`;

        const userPrompt = JSON.stringify(payload);

        if (provider === 'gemini') {
            const apiKey = settings.aiApiKey?.trim();
            const model = (settings.aiModelName || 'gemini-2.5-flash').trim().replace(/^models\//, '');
            const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

            const response = await requestUrl({
                url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                { text: systemPrompt + "\n\nItems to classify:\n" + userPrompt }
                            ]
                        }
                    ],
                    generationConfig: {
                        responseMimeType: "application/json"
                    }
                })
            });

            const data = response.json;
            const textResult = data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
            return this.parseJsonResponse(textResult);
        } else if (provider === 'ollama') {
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
                        ]
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
                        stream: false
                    })
                });
                const data = response.json;
                const textResult = data?.response || "{}";
                return this.parseJsonResponse(textResult);
            }
        } else if (provider === 'claude') {
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
                    messages: [
                        { role: 'user', content: systemPrompt + "\n\nItems to classify:\n" + userPrompt }
                    ]
                })
            });

            const data = response.json;
            const textResult = data?.content?.[0]?.text || "{}";
            return this.parseJsonResponse(textResult);
        } else {
            // OpenAI / Custom Endpoint
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
    }

    private static parseJsonResponse(textResult: string): Record<string, unknown> {
        if (!textResult) return {};
        console.log("🧠 [Colorful Folders AI] Raw LLM Response / Thinking:", textResult);

        const cleanText = textResult
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/```json|```/g, '')
            .replace(/```/g, '')
            .trim();

        let jsonStr = cleanText;
        const startObj = cleanText.indexOf('{');
        const startArr = cleanText.indexOf('[');

        if (startArr !== -1 && (startObj === -1 || startArr < startObj)) {
            const endArr = cleanText.lastIndexOf(']');
            if (endArr > startArr) {
                jsonStr = cleanText.substring(startArr, endArr + 1);
            }
        } else if (startObj !== -1) {
            const endObj = cleanText.lastIndexOf('}');
            if (endObj > startObj) {
                jsonStr = cleanText.substring(startObj, endObj + 1);
            } else {
                jsonStr = cleanText.substring(startObj);
            }
        }

        // 1. Try standard JSON.parse after stripping trailing commas before braces
        const sanitizedStr = jsonStr.replace(/,\s*([}\]])/g, '$1');
        try {
            return JSON.parse(sanitizedStr) as Record<string, unknown>;
        } catch {
            // 2. Try auto-repairing truncated response (strip trailing comma & append closing brace/bracket)
            try {
                const repairedStr = sanitizedStr.replace(/,\s*$/, '').trim() + (sanitizedStr.trim().startsWith('[') ? ']' : '}');
                return JSON.parse(repairedStr) as Record<string, unknown>;
            } catch {
                // 3. Multi-Pattern Regex Extractor for LLM JSON quirks
                const extracted: Record<string, unknown> = {};

                // Pattern 3A: Standard "Key": "Value"
                const kvRegex1 = /"([^"\\]*(?:\\.[^"\\]*)*)"\s*:\s*"([^"\\]*(?:\\.[^"\\]*)*)"/g;
                let match;
                while ((match = kvRegex1.exec(cleanText)) !== null) {
                    extracted[match[1]] = match[2];
                }

                // Pattern 3B: Malformed single-quoted key-colon-value lines e.g. "Key: Value", or "Path/Item: icon-id,
                if (Object.keys(extracted).length === 0) {
                    const kvRegex2 = /"([^"\n\r:]+?)\s*:\s*([a-zA-Z0-9\-_]+)"?/g;
                    while ((match = kvRegex2.exec(cleanText)) !== null) {
                        extracted[match[1].trim()] = match[2].trim();
                    }
                }

                // Pattern 3C: Key mapping to array e.g. "Path/To/Item": ["cand1", "cand2"]
                if (Object.keys(extracted).length === 0) {
                    const kvRegex3 = /"([^"\n\r:]+?)"\s*:\s*\[([^\]]+)\]/g;
                    while ((match = kvRegex3.exec(cleanText)) !== null) {
                        const rawKey = match[1].trim();
                        const rawArray = match[2].split(',').map(s => s.replace(/["']/g, '').trim()).filter(Boolean);
                        if (rawArray.length > 0) {
                            extracted[rawKey] = rawArray;
                        }
                    }
                }

                if (Object.keys(extracted).length > 0) {
                    console.log("🧠 [Colorful Folders AI] Extracted key-value pairs via regex fallback:", extracted);
                    return extracted;
                }

                console.error("Colorful Folders AI: Failed to parse JSON response", textResult);
                return {};
            }
        }
    }

    public static extractHttpErrorMessage(e: unknown, provider?: string): string {
        if (!e || typeof e !== 'object') return String(e);

        const errObj = e as any;
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

        const msg = errObj.message || String(e);
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
