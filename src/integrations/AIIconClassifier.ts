import { requestUrl, Notice, TFolder, TFile, getIconIds } from 'obsidian';
import { IColorfulFoldersPlugin } from '../common/types';

export class AIIconClassifier {
    private static isClassifying = false;
    private static cancelRequested = false;

    public static stopClassification(): void {
        if (this.isClassifying) {
            this.cancelRequested = true;
            new Notice("Colorful Folders AI: Stopping classification process...");
        } else {
            new Notice("Colorful Folders AI: No classification is currently running.");
        }
    }

    static async classifyVault(plugin: IColorfulFoldersPlugin, options?: { force?: boolean }): Promise<void> {
        if (this.isClassifying) {
            new Notice("Colorful Folders AI: Classification is already in progress...");
            return;
        }

        this.cancelRequested = false;

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

                if (file instanceof TFolder && !file.isRoot()) {
                    const childSamples: string[] = [];
                    for (const child of file.children.slice(0, 5)) {
                        childSamples.push(child.name);
                    }
                    rawTargets.push({
                        fileObj: file,
                        path: file.path,
                        name: file.name,
                        isFolder: true,
                        parentFolder,
                        pathHierarchy,
                        childSamples
                    });
                } else if (settings.aiIncludeFiles && file instanceof TFile) {
                    const tags: string[] = [];
                    const frontmatter: Record<string, string> = {};
                    if (plugin.app?.metadataCache) {
                        const cache = plugin.app.metadataCache.getFileCache(file);
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
                        tags,
                        frontmatter: Object.keys(frontmatter).length > 0 ? frontmatter : undefined
                    });
                }
            }

            if (rawTargets.length === 0) {
                notice.setMessage("Colorful Folders AI: No items found to classify.");
                window.setTimeout(() => notice.hide(), 3000);
                return;
            }

            // Filter out items that already have explicit custom icons unless force is true
            const unassignedTargets = rawTargets.filter(t => {
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

            notice.setMessage(`Colorful Folders AI: Preparing ${unassignedTargets.length} vault items...`);

            // Fast parallel read for markdown snippets (chunks of 50)
            const fileTargets = unassignedTargets.filter(t => !t.isFolder && t.fileObj instanceof TFile) as (typeof unassignedTargets[0] & { fileObj: TFile; contentSnippet?: string })[];
            const chunkSize = 50;
            for (let i = 0; i < fileTargets.length; i += chunkSize) {
                const chunk = fileTargets.slice(i, i + chunkSize);
                await Promise.all(chunk.map(async t => {
                    try {
                        const rawContent = await plugin.app.vault.cachedRead(t.fileObj);
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

            // Construct system prompt ONCE for all batches
            const systemPrompt = this.buildSystemPrompt(plugin);

            notice.setMessage(`Colorful Folders AI: Analyzing ${unassignedTargets.length} vault items...`);

            // Provider-aware dynamic batching and concurrency
            const batchSize = settings.aiProvider === 'ollama' ? 10 : 25;
            const maxConcurrent = settings.aiProvider === 'ollama' ? 1 : 3;

            const conceptMap = new Map<string, string>(); // path/normName -> iconId string
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
                        hierarchy: t.pathHierarchy.slice(0, -1).join(' > '),
                        parent: t.parentFolder
                    };
                    if (t.isFolder && t.childSamples && t.childSamples.length > 0) {
                        itemObj.files = t.childSamples;
                    }
                    if (!t.isFolder) {
                        if (t.tags && t.tags.length > 0) itemObj.tags = t.tags;
                        if (t.frontmatter && Object.keys(t.frontmatter).length > 0) itemObj.properties = t.frontmatter;
                        if ((t as any).contentSnippet) itemObj.contentSnippet = (t as any).contentSnippet;
                    }
                    return itemObj;
                });

                console.log(`🤖 [Colorful Folders AI] Batch ${currentBatch}/${batchChunks.length} Context Payload Sent:`, contextPayload);

                try {
                    const result = await this.queryAI(plugin, contextPayload, systemPrompt);
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
                        let rawIcon = Array.isArray(conceptVal) ? conceptVal[0] : conceptVal;
                        if (typeof rawIcon === 'object' && rawIcon) {
                            rawIcon = (rawIcon as any).icon || (rawIcon as any).iconId || (rawIcon as any).concept || '';
                        }
                        const cleanIcon = String(rawIcon).trim();
                        if (cleanIcon) {
                            const isValid = plugin.iconManager.isEmojiIcon(cleanIcon) ||
                                           Boolean(plugin.iconManager.getIconSvg(cleanIcon)) ||
                                           Boolean(plugin.iconManager.findIconInPacks(cleanIcon));
                            if (isValid) {
                                conceptMap.set(key, cleanIcon);
                                conceptMap.set(normalizeKey(key), cleanIcon);
                            } else {
                                console.warn(`Colorful Folders AI: Skipping invalid icon string "${cleanIcon}" for "${key}"`);
                            }
                        }
                    }
                } catch (err) {
                    console.error(`Colorful Folders AI: Batch ${currentBatch} classification failed`, err);
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
                const iconId = conceptMap.get(item.path) || conceptMap.get(normPath) || conceptMap.get(normName) || conceptMap.get(item.name) || "";
                
                if (iconId) {
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

            console.log(`✨ [Colorful Folders AI] Successfully Assigned ${assignedCount} Icons directly from AI:`, assignedSummary);

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

    private static buildSystemPrompt(plugin: IColorfulFoldersPlugin): string {
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

        return `You are an expert, context-aware AI assistant for an Obsidian note-taking app. Your task is to select the single best icon ID for each vault item based on its full context (title, path hierarchy, tags, frontmatter properties, and content snippet).
${packInfo}

CONTEXT-AWARE ICON SELECTION RULES (TIER SUITABILITY HIERARCHY):
Evaluate the item's title, path hierarchy, tags, frontmatter, and content to pick the highest suitable tier:
- Tier 1 (Exact Entity / Brand / Software): If the item is explicitly about a specific service or software (e.g. Python, Docker, GitHub, React, Amazon), assign exact brand IDs (e.g. 'simple-icons-python', 'simple-icons-docker', 'github').
- Tier 2 (Direct Visual Metaphor): E.g. Ideas/Thinking -> 'lightbulb', Reading/Books -> 'book', Dates/Events -> 'calendar', Music -> 'music', Science -> 'flask-conical'.
- Tier 3 (Functional Category): E.g. General Coding -> 'code' or 'terminal', Finance -> 'banknote', Health/Fitness -> 'activity'.
- Tier 4 (Fallback Concept): Standard general fallback like 'file-text' or 'folder'.
CRITICAL: DO NOT assign Tier 1 brand icons (such as 'simple-icons-amazon' or 'shopping-bag') UNLESS the item is explicitly about that specific brand or shopping topic!

STRICT OUTPUT FORMAT RULES:
- Output MUST be a SINGLE VALID RAW JSON OBJECT ONLY.
- DO NOT INCLUDE ANY PREAMBLE, INTRODUCTORY TEXT, OR EXPLANATIONS.
- Output ONLY raw JSON mapping each file/folder path directly to its assigned icon ID string:
{
  "Notes/Thinking.md": "lightbulb",
  "Development/React.md": "simple-icons-react",
  "Personal/Reading.md": "book"
}`;
    }

    private static async queryAI(plugin: IColorfulFoldersPlugin, payload: any[], systemPrompt: string): Promise<Record<string, unknown>> {
        const settings = plugin.settings;
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
                if (attempt < 3) {
                    console.warn(`Colorful Folders AI: Batch request attempt ${attempt} failed, retrying in ${attempt * 1000}ms...`, err);
                    await new Promise(res => setTimeout(res, attempt * 1000));
                }
            }
        }
        throw lastErr;
    }

    private static async queryGemini(settings: any, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
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

    private static async queryOllama(settings: any, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
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
    }

    private static async queryClaude(settings: any, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
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

    private static async queryOpenAI(settings: any, provider: string, systemPrompt: string, userPrompt: string): Promise<Record<string, unknown>> {
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

    private static parseJsonResponse(textResult: string): Record<string, unknown> {
        if (!textResult) return {};
        console.log("🧠 [Colorful Folders AI] Raw LLM Response / Thinking:", textResult);

        // Step 0: Strip thinking blocks (<think>...</think>), markdown codeblock fences (```json, ```javascript, etc.)
        const cleanText = textResult
            .replace(/<think>[\s\S]*?<\/think>/gi, '')
            .replace(/```json|```javascript|```typescript|```/gi, '')
            .replace(/```/g, '')
            .trim();

        // Step 1: Attempt standard & single-quote JSON parsing after locating outer bounds { ... }
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
            for (const line of lines) {
                const inlineMatch = line.match(/^[`"*]*([^`"*:\->\n]+)[`"*]*\s*(?:->|=>|=|\:)\s*(.+)$/i);
                if (inlineMatch) {
                    const rawKey = inlineMatch[1].trim();
                    const rawVal = inlineMatch[2].trim().replace(/^\[|\]$/g, '');
                    const isPreamble = /^(below|here|based|note|result|response|status|code)/i.test(rawKey);
                    if (rawKey && !isPreamble && rawVal) {
                        const cands = rawVal.split(/[,;\s]+/).map(s => s.replace(/["']/g, '').trim()).filter(s => s.length >= 2);
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

    private static unwrapOuterJsonObject(parsed: Record<string, unknown>): Record<string, unknown> {
        const keys = Object.keys(parsed);
        if (keys.length === 1 && typeof parsed[keys[0]] === 'object' && !Array.isArray(parsed[keys[0]])) {
            return parsed[keys[0]] as Record<string, unknown>;
        }
        return parsed;
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
