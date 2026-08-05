import { requestUrl } from 'obsidian';
import { IColorfulFoldersPlugin } from '../common/types';

export interface VectorMatchResult {
    iconId: string;
    score: number;
    matchedTag: string;
    confidence: 'high' | 'medium' | 'low';
}

interface IconVector {
    tokens: string[];
    tokenWeights: Map<string, number>;
    normalized: Map<string, number>;
    domains: Set<string>;
}

interface QueryContext {
    filename: string;
    lowerName: string;
    extension: string;
    parentFolder: string;
    pathDepth: number;
    isFolder: boolean;
}

const MAX_CACHE_SIZE = 2048;
const DEFAULT_TOP_K = 3;
const DEFAULT_MIN_SCORE = 0.25;
const THREE_GRAM_MIN_LENGTH = 5;
const THREE_GRAM_MAX_LENGTH = 16;

const FILE_EXTENSION_DOMAINS: Record<string, string[]> = {
    '.py': ['python', 'code', 'terminal'],
    '.js': ['javascript', 'code', 'terminal'],
    '.ts': ['typescript', 'code', 'terminal'],
    '.jsx': ['react', 'code', 'layout'],
    '.tsx': ['react', 'code', 'layout'],
    '.java': ['java', 'code', 'terminal'],
    '.cpp': ['code', 'terminal', 'cpu'],
    '.c': ['code', 'terminal', 'cpu'],
    '.go': ['go', 'code', 'server'],
    '.rs': ['rust', 'code', 'terminal'],
    '.rb': ['ruby', 'code', 'terminal'],
    '.php': ['php', 'code', 'server'],
    '.swift': ['swift', 'code', 'terminal'],
    '.kt': ['kotlin', 'code', 'terminal'],
    '.sql': ['database', 'server', 'code'],
    '.json': ['braces', 'code', 'database'],
    '.yaml': ['file-text', 'code', 'database'],
    '.yml': ['file-text', 'code', 'database'],
    '.toml': ['file-text', 'code', 'database'],
    '.xml': ['file-text', 'code', 'database'],
    '.html': ['layout', 'code', 'monitor'],
    '.css': ['palette', 'code', 'layout'],
    '.scss': ['palette', 'code', 'layout'],
    '.md': ['file-text', 'pen-tool', 'notebook'],
    '.txt': ['file-text', 'notebook'],
    '.pdf': ['file-text', 'book-open'],
    '.docx': ['file-text', 'notebook'],
    '.png': ['image', 'photo', 'layout'],
    '.jpg': ['image', 'photo', 'layout'],
    '.jpeg': ['image', 'photo', 'layout'],
    '.gif': ['image', 'film', 'layout'],
    '.svg': ['image', 'layout', 'pen-tool'],
    '.mp3': ['music', 'headphones', 'audio'],
    '.wav': ['music', 'headphones', 'audio'],
    '.mp4': ['video', 'film', 'camera'],
    '.mov': ['video', 'film', 'camera'],
    '.zip': ['archive', 'package', 'box'],
    '.tar': ['archive', 'package', 'box'],
    '.gz': ['archive', 'package', 'box'],
    '.env': ['lock', 'key', 'shield-check'],
    '.gitignore': ['git-branch', 'code', 'terminal'],
    '.dockerfile': ['docker', 'server', 'box']
};

const FOLDER_HINT_DOMAINS: Record<string, string[]> = {
    'projects': ['folder-kanban', 'layers', 'briefcase'],
    'notes': ['notebook', 'folder', 'file-text'],
    'documents': ['folder', 'file-text', 'book-open'],
    'images': ['image', 'folder', 'photo'],
    'videos': ['video', 'folder', 'film'],
    'music': ['music', 'folder', 'headphones'],
    'downloads': ['download', 'folder', 'package'],
    'archives': ['archive', 'folder', 'package'],
    'src': ['code', 'folder', 'terminal'],
    'source': ['code', 'folder', 'terminal'],
    'lib': ['code', 'folder', 'terminal'],
    'components': ['layout', 'code', 'folder'],
    'pages': ['layout', 'code', 'folder'],
    'styles': ['palette', 'code', 'folder'],
    'assets': ['folder', 'image', 'layers'],
    'public': ['globe', 'folder', 'server'],
    'tests': ['check-square', 'code', 'folder'],
    'config': ['settings', 'code', 'folder'],
    'scripts': ['terminal', 'code', 'folder'],
    'docs': ['book-open', 'folder', 'file-text'],
    'templates': ['layout', 'folder', 'file-text'],
    'resources': ['package', 'folder', 'box'],
    'data': ['database', 'server', 'folder'],
    'backend': ['server', 'folder', 'code'],
    'frontend': ['layout', 'folder', 'code'],
    'api': ['webhook', 'server', 'folder'],
    'utils': ['wrench', 'code', 'folder'],
    'helpers': ['wrench', 'code', 'folder'],
    'models': ['database', 'code', 'folder'],
    'views': ['layout', 'folder', 'monitor'],
    'controllers': ['server', 'code', 'folder'],
    'routes': ['navigation', 'code', 'folder'],
    'middleware': ['server', 'code', 'gear'],
    'migrations': ['database', 'code', 'folder'],
    'seeds': ['database', 'code', 'folder'],
    'logs': ['file-text', 'clock', 'folder'],
    'build': ['box', 'code', 'folder'],
    'dist': ['package', 'box', 'folder'],
    'node_modules': ['package', 'box', 'folder'],
    'venv': ['box', 'python', 'folder'],
    'obsidian': ['settings', 'folder', 'code']
};

export class EmbeddingModel {
    private plugin: IColorfulFoldersPlugin;
    private iconVectors: Map<string, IconVector> = new Map();
    private isInitialized = false;
    private queryCache: Map<string, { result: VectorMatchResult[]; timestamp: number }> = new Map();
    private cacheHitCount = 0;
    private cacheMissCount = 0;

    private static readonly BRAND_DICTIONARY: Record<string, string[]> = {
        amazon: ['simple-icons-amazon', 'shopping-cart', 'package', 'store'],
        aws: ['simple-icons-amazonaws', 'cloud', 'server', 'database'],
        python: ['simple-icons-python', 'code', 'terminal', 'cpu'],
        react: ['simple-icons-react', 'code', 'atom', 'layers'],
        javascript: ['simple-icons-javascript', 'code', 'file-text'],
        typescript: ['simple-icons-typescript', 'code', 'file-text'],
        node: ['simple-icons-nodedotjs', 'code', 'server'],
        docker: ['simple-icons-docker', 'box', 'container', 'server'],
        github: ['simple-icons-github', 'code-2', 'git-branch', 'terminal'],
        youtube: ['simple-icons-youtube', 'video', 'play-circle', 'tv'],
        netflix: ['video', 'film', 'tv'],
        spotify: ['simple-icons-spotify', 'music', 'headphones', 'disc'],
        notion: ['notebook', 'file-text', 'layers'],
        figma: ['simple-icons-figma', 'pen-tool', 'layout', 'palette'],
        slack: ['message-square', 'hash', 'users'],
        discord: ['message-circle', 'headphones', 'gamepad-2'],
        twitter: ['simple-icons-x', 'message-circle', 'share-2'],
        x: ['simple-icons-x', 'share-2'],
        google: ['simple-icons-google', 'chrome', 'globe', 'search'],
        chrome: ['simple-icons-googlechrome', 'globe', 'search'],
        vscode: ['simple-icons-visualstudiocode', 'code', 'terminal'],
        obsidian: ['simple-icons-obsidian', 'notebook', 'book-open', 'file-text'],
        markdown: ['simple-icons-markdown', 'file-text', 'pen-tool'],
        database: ['database', 'server', 'hard-drive', 'layers'],
        
        people: ['users', 'user', 'contact', 'folder-users'],
        person: ['user', 'contact', 'id-card', 'profile'],
        user: ['user', 'contact', 'id-card', 'profile'],
        users: ['users', 'contact', 'folder-users'],
        contact: ['contact', 'user', 'id-card', 'phone'],
        contacts: ['users', 'contact', 'folder-users', 'phone'],
        client: ['user', 'contact', 'briefcase', 'id-card'],
        clients: ['users', 'contact', 'briefcase', 'folder-users'],
        customer: ['user', 'contact', 'shopping-bag', 'id-card'],
        customers: ['users', 'contact', 'shopping-bag', 'folder-users'],
        author: ['user', 'pen-tool', 'book-open', 'contact'],
        authors: ['users', 'book-open', 'pen-tool', 'contact'],
        speaker: ['user', 'mic', 'contact'],
        biography: ['user', 'book-open', 'file-text'],
        profile: ['user', 'id-card', 'contact'],
        team: ['users', 'contact', 'folder-users', 'briefcase'],
        member: ['user', 'contact', 'id-card'],
        members: ['users', 'contact', 'folder-users'],
        staff: ['users', 'contact', 'briefcase'],
        employee: ['user', 'contact', 'id-card', 'briefcase'],
        candidate: ['user-check', 'user', 'id-card'],
        doctor: ['user', 'stethoscope', 'activity'],
        dr: ['user', 'stethoscope', 'activity'],
        prof: ['user', 'graduation-cap', 'book-open'],
        professor: ['user', 'graduation-cap', 'book-open'],

        finance: ['dollar-sign', 'coins', 'credit-card', 'trending-up', 'receipt', 'wallet'],
        money: ['dollar-sign', 'coins', 'bank', 'credit-card'],
        invoice: ['receipt', 'dollar-sign', 'credit-card', 'file-text'],
        receipt: ['receipt', 'dollar-sign', 'shopping-bag'],
        budget: ['dollar-sign', 'pie-chart', 'coins', 'bar-chart'],
        accounting: ['calculator', 'dollar-sign', 'file-text', 'receipt'],
        bills: ['receipt', 'dollar-sign', 'credit-card'],
        expenses: ['dollar-sign', 'trending-down', 'receipt'],
        tax: ['dollar-sign', 'calculator', 'file-text'],
        
        shopping: ['shopping-cart', 'shopping-bag', 'package', 'store'],
        buy: ['shopping-cart', 'shopping-bag', 'tag'],
        orders: ['package', 'shopping-bag', 'truck'],

        reading: ['book-open', 'book', 'notebook', 'library', 'bookmark'],
        books: ['book-open', 'book', 'library'],
        literature: ['book-open', 'book', 'library'],
        articles: ['file-text', 'newspaper', 'book-open'],
        papers: ['file-text', 'book-open', 'bookmark'],
        research: ['search', 'book-open', 'microscope', 'file-text'],
        notes: ['notebook', 'file-text', 'pen-tool', 'edit-3'],

        meetings: ['calendar', 'clock', 'users', 'video', 'calendar-days'],
        calendar: ['calendar', 'clock', 'target', 'calendar-days'],
        schedule: ['calendar', 'clock', 'timer'],
        deadline: ['clock', 'calendar', 'alert-circle'],
        appointment: ['calendar', 'clock', 'user'],
        agenda: ['list', 'calendar', 'file-text'],

        tasks: ['check-square', 'check-circle', 'list-todo', 'target', 'flag'],
        todo: ['check-square', 'check-circle', 'list'],
        checklist: ['check-square', 'list', 'check-circle'],
        goals: ['target', 'flag', 'trophy', 'trending-up'],
        projects: ['folder-kanban', 'layers', 'target', 'briefcase'],

        coding: ['code', 'terminal', 'git-branch', 'cpu', 'layers'],
        programming: ['code', 'terminal', 'cpu', 'database'],
        software: ['code', 'terminal', 'layers', 'box'],
        backend: ['server', 'database', 'code', 'terminal'],
        frontend: ['layout', 'code', 'palette', 'monitor'],
        api: ['webhook', 'server', 'code', 'key'],
        scripts: ['terminal', 'code', 'file-code'],

        design: ['palette', 'pen-tool', 'layout', 'figma', 'brush', 'image'],
        ui: ['layout', 'palette', 'monitor', 'smartphone'],
        ux: ['user-check', 'layout', 'palette'],
        mockups: ['layout', 'image', 'figma'],
        assets: ['folder', 'image', 'layers'],

        music: ['music', 'headphones', 'disc', 'radio'],
        audio: ['headphones', 'mic', 'radio', 'volume-2'],
        podcasts: ['mic', 'headphones', 'radio'],
        video: ['video', 'film', 'play-circle', 'camera'],
        movies: ['film', 'video', 'tv'],

        health: ['heart-pulse', 'activity', 'medical', 'sun'],
        fitness: ['activity', 'heart-pulse', 'dumbbell'],
        workout: ['activity', 'heart-pulse', 'dumbbell'],
        medical: ['activity', 'heart-pulse', 'stethoscope'],

        travel: ['plane', 'compass', 'map-pin', 'globe', 'navigation'],
        vacation: ['sun', 'palmtree', 'plane', 'map-pin'],
        trips: ['plane', 'compass', 'map-pin'],

        gaming: ['gamepad-2', 'sword', 'trophy', 'sparkles'],
        games: ['gamepad-2', 'trophy', 'sparkles'],

        security: ['shield-check', 'lock', 'key', 'eye', 'file-lock'],
        passwords: ['key', 'lock', 'shield-check'],
        privacy: ['shield-check', 'eye-off', 'lock']
    };

    private static readonly STOP_WORDS = new Set([
        'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't", 'as', 'at',
        'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'can', 'could', 'did', 'do',
        'does', 'doing', 'down', 'during', 'each', 'everybody', 'everyone', 'few', 'for', 'from', 'further', 'get', 'getting',
        'got', 'had', 'has', 'have', 'he', 'her', 'here', 'him', 'himself', 'his', 'hit', 'how', 'i', 'if', 'in', 'into',
        'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'now', 'of', 'off',
        'on', 'once', 'only', 'or', 'other', 'our', 'ours', 'out', 'over', 'own', 'plan', 'plans', 'same', 'she', 'should',
        'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these',
        'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when',
        'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'you', 'your', 'yours', 'yourself', 'yourselves'
    ]);

    private static readonly THREE_GRAM_CACHE = new Map<string, string[]>();

    constructor(plugin: IColorfulFoldersPlugin) {
        this.plugin = plugin;
    }

    public getCacheStats(): { hits: number; misses: number; size: number } {
        return {
            hits: this.cacheHitCount,
            misses: this.cacheMissCount,
            size: this.queryCache.size
        };
    }

    public clearCache(): void {
        this.queryCache.clear();
        this.cacheHitCount = 0;
        this.cacheMissCount = 0;
    }

    public initializeIndex(): void {
        if (this.isInitialized) return;

        for (const [brand, candidates] of Object.entries(EmbeddingModel.BRAND_DICTIONARY)) {
            for (const iconId of candidates) {
                const vector = this.getOrCreateVector(iconId);
                const weights = this.buildWeightedTokenMap(brand);
                weights.forEach((w, t) => {
                    vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w);
                });
                vector.domains.add(brand);
            }
        }

        const customIcons = this.plugin?.settings?.customIcons || {};
        for (const iconId of Object.keys(customIcons)) {
            const vector = this.getOrCreateVector(iconId);
            const cleanId = iconId
                .replace(/^(simple-icons-|si-|tabler-|fa-solid-|fa-regular-|bx-|octicon-|ra-|cf-|bi-|ri-|feather-)/i, '')
                .replace(/^brand-/i, '');

            vector.tokenWeights.set(iconId.toLowerCase(), 4.0);
            vector.tokenWeights.set(cleanId.toLowerCase(), 3.5);

            const weights = this.buildWeightedTokenMap(cleanId);
            weights.forEach((w, t) => {
                vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w * 1.5);
            });
        }

        const localIcons = this.plugin?.localFileSystemIcons || {};
        for (const iconId of Object.keys(localIcons)) {
            if (!localIcons[iconId]) continue;
            const vector = this.getOrCreateVector(iconId);
            const cleanId = iconId
                .replace(/^lucide-/i, '')
                .replace(/^(simple-icons-|si-|tabler-|fa-solid-|fa-regular-|bx-|octicon-|ra-|cf-|bi-|ri-|feather-)/i, '')
                .replace(/^brand-/i, '');

            vector.tokenWeights.set(iconId.toLowerCase(), 4.0);
            vector.tokenWeights.set(cleanId.toLowerCase(), 3.5);

            const weights = this.buildWeightedTokenMap(cleanId);
            weights.forEach((w, t) => {
                vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w);
            });
        }

        // Finalize vector normalization
        this.iconVectors.forEach(vec => {
            vec.normalized = this.normalizeVectorFromMap(vec.tokenWeights);
            vec.tokens = Array.from(vec.normalized.keys());
        });

        this.isInitialized = true;
    }

    private getOrCreateVector(iconId: string): IconVector {
        let vector = this.iconVectors.get(iconId);
        if (!vector) {
            vector = {
                tokens: [],
                tokenWeights: new Map(),
                normalized: new Map(),
                domains: new Set()
            };
            this.iconVectors.set(iconId, vector);
        }
        return vector;
    }

    /**
     * Builds a weighted token map preserving full file names, full un-split phrases, and full words with high weights,
     * while retaining subword 3-grams as lower-weighted fallbacks.
     */
    private buildWeightedTokenMap(text: string): Map<string, number> {
        const tokenWeights = new Map<string, number>();

        const addToken = (tok: string, weight: number) => {
            if (!tok || tok.length < 2) return;
            const lower = tok.toLowerCase().trim();
            const current = tokenWeights.get(lower) || 0;
            tokenWeights.set(lower, Math.max(current, weight));
        };

        const clean = text.toLowerCase().replace(/[^a-z0-9\s_-]/g, ' ').trim();
        if (!clean) return tokenWeights;

        // 1. Full un-split clean phrase/filename (Highest priority)
        const fullClean = clean.replace(/[\s_-]+/g, ' ');
        const fullJoined = clean.replace(/[\s_-]+/g, '');
        const fullHyphen = clean.replace(/[\s_-]+/g, '-');
        
        addToken(fullClean, 3.5);
        addToken(fullJoined, 3.5);
        addToken(fullHyphen, 3.5);

        // 2. Full individual word tokens (High priority)
        const rawWords = clean.split(/[\s_-]+/).filter(w => w.length >= 2);
        const filteredWords = rawWords.filter(w => !EmbeddingModel.STOP_WORDS.has(w));
        const words = filteredWords.length > 0 ? filteredWords : rawWords;

        for (const w of words) {
            addToken(w, 2.5);
        }

        // 3. Subword 3-grams for partial matching fallback (Low priority)
        for (const w of words) {
            if (w.length >= THREE_GRAM_MIN_LENGTH && w.length <= THREE_GRAM_MAX_LENGTH) {
                let grams = EmbeddingModel.THREE_GRAM_CACHE.get(w);
                if (!grams) {
                    grams = [];
                    for (let i = 0; i <= w.length - 3; i++) {
                        grams.push(w.substring(i, i + 3));
                    }
                    EmbeddingModel.THREE_GRAM_CACHE.set(w, grams);
                }
                for (const g of grams) {
                    addToken(g, 0.4);
                }
            }
        }

        return tokenWeights;
    }

    public tokenizeText(text: string): string[] {
        return Array.from(this.buildWeightedTokenMap(text).keys());
    }

    private normalizeVectorFromMap(weightsMap: Map<string, number>): Map<string, number> {
        const vec = new Map<string, number>();
        let normSq = 0;
        weightsMap.forEach(v => { normSq += v * v; });
        const norm = Math.sqrt(normSq) || 1.0;
        weightsMap.forEach((v, k) => vec.set(k, v / norm));
        return vec;
    }

    private computeCosineSimilarity(vecA: Map<string, number>, vecB: Map<string, number>): number {
        let dotProduct = 0;
        const iterVec = vecA.size <= vecB.size ? vecA : vecB;
        const otherVec = iterVec === vecA ? vecB : vecA;

        iterVec.forEach((val, key) => {
            const otherVal = otherVec.get(key);
            if (otherVal !== undefined) {
                dotProduct += val * otherVal;
            }
        });

        return dotProduct;
    }

    private buildQueryContext(titleOrPath: string, isFolder = false): QueryContext {
        const parts = titleOrPath.split(/[/\\]/);
        const rawFilename = parts.pop() || titleOrPath;
        const filename = rawFilename.replace(/\.(md|png|svg|txt|json|py|js|ts|jsx|tsx|java|cpp|c|go|rs|rb|php|swift|kt|sql|yaml|yml|toml|xml|html|css|scss|pdf|docx|mp3|wav|mp4|mov|zip|tar|gz|env)$/i, '');
        const lowerName = filename.toLowerCase().trim();
        
        const lastDot = rawFilename.lastIndexOf('.');
        const extension = lastDot !== -1 ? rawFilename.substring(lastDot).toLowerCase() : '';
        
        const parentFolder = parts.length > 0 ? parts[parts.length - 1] : 'Root';
        const pathDepth = parts.length;

        return {
            filename,
            lowerName,
            extension,
            parentFolder,
            pathDepth,
            isFolder
        };
    }

    private getExtensionBoosts(extension: string): string[] {
        return FILE_EXTENSION_DOMAINS[extension] || [];
    }

    private getFolderHintBoosts(folderName: string): string[] {
        const normalized = folderName.toLowerCase().replace(/[^a-z0-9]/g, '');
        return FOLDER_HINT_DOMAINS[normalized] || FOLDER_HINT_DOMAINS[folderName.toLowerCase()] || [];
    }

    private applyContextBoost(baseScore: number, iconId: string, context: QueryContext): number {
        let boost = 1.0;
        const lowerIcon = iconId.toLowerCase();

        const extensionBoosts = this.getExtensionBoosts(context.extension);
        const folderHints = context.isFolder ? this.getFolderHintBoosts(context.parentFolder) : [];

        const relevantTokens = [...extensionBoosts, ...folderHints];
        
        for (const token of relevantTokens) {
            const lowerToken = token.toLowerCase();
            if (lowerIcon === lowerToken || lowerIcon.includes(lowerToken) || lowerToken.includes(lowerIcon)) {
                boost *= 1.25;
                break;
            }
        }

        if (context.isFolder && context.pathDepth === 1) {
            if (['folder', 'layers', 'archive', 'box'].some(t => lowerIcon.includes(t))) {
                boost *= 1.1;
            }
        }

        return baseScore * boost;
    }

    public findBestIcons(titleOrPath: string, options?: { topK?: number; minScore?: number; isFolder?: boolean }): VectorMatchResult[] {
        this.initializeIndex();

        const cacheKey = `${titleOrPath}:${options?.topK ?? DEFAULT_TOP_K}:${options?.minScore ?? DEFAULT_MIN_SCORE}:${options?.isFolder ?? false}`;
        const cached = this.queryCache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < 300000) {
            this.cacheHitCount++;
            return cached.result;
        }
        this.cacheMissCount++;

        const topK = options?.topK ?? DEFAULT_TOP_K;
        const minScore = options?.minScore ?? DEFAULT_MIN_SCORE;
        const context = this.buildQueryContext(titleOrPath, options?.isFolder ?? false);

        if (this.queryCache.size >= MAX_CACHE_SIZE) {
            const oldestKey = this.queryCache.keys().next().value!;
            this.queryCache.delete(oldestKey);
        }

        const directMatch = this.tryDirectDictionaryMatch(context.lowerName, topK, context);
        if (directMatch.length > 0) {
            const enriched = directMatch.map(r => ({
                ...r,
                confidence: 'high' as const,
                score: this.applyContextBoost(r.score, r.iconId, context)
            })).sort((a, b) => b.score - a.score).slice(0, topK);
            
            this.queryCache.set(cacheKey, { result: enriched, timestamp: Date.now() });
            return enriched;
        }

        const queryTokenWeights = this.buildWeightedTokenMap(context.filename);
        if (queryTokenWeights.size === 0) {
            const fallback = this.getFallbackIcons(context, topK);
            this.queryCache.set(cacheKey, { result: fallback, timestamp: Date.now() });
            return fallback;
        }

        const queryVector = this.normalizeVectorFromMap(queryTokenWeights);
        const scored: { iconId: string; rawScore: number }[] = [];

        this.iconVectors.forEach((iconVec, iconId) => {
            const rawScore = this.computeCosineSimilarity(queryVector, iconVec.normalized);
            if (rawScore >= minScore) {
                scored.push({ iconId, rawScore });
            }
        });

        const boosted = scored
            .map(s => ({
                iconId: s.iconId,
                score: this.applyContextBoost(s.rawScore, s.iconId, context)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        const result = boosted.map(r => ({
            ...r,
            matchedTag: context.filename,
            confidence: r.score >= 0.7 ? 'high' as const : r.score >= 0.45 ? 'medium' as const : 'low' as const
        }));

        if (result.length === 0) {
            const fallback = this.getFallbackIcons(context, topK);
            this.queryCache.set(cacheKey, { result: fallback, timestamp: Date.now() });
            return fallback;
        }

        this.queryCache.set(cacheKey, { result, timestamp: Date.now() });
        return result;
    }

    private isPersonName(name: string, parentFolder?: string): boolean {
        if (!name) return false;
        const clean = name.replace(/\.(md|txt|docx|pdf)$/i, '').trim();
        if (/^(dr|mr|mrs|ms|prof|professor|sir|lady|author|client|patient|member|staff|doctor)\b/i.test(clean)) {
            return true;
        }
        if (parentFolder && /^(people|contacts|friends|family|team|members|staff|clients|customers|authors|speakers|patients|candidates)$/i.test(parentFolder.trim())) {
            return true;
        }
        const words = clean.split(/[\s._-]+/).filter(Boolean);
        if (words.length >= 2 && words.length <= 4) {
            const nonNameKeywords = /^(project|meeting|data|model|system|config|test|code|file|document|folder|report|summary|draft|final|version|script|app|index|main|log|track|build|page|site|web|task|list|plan|note|notes|idea|ideas|readme|changelog|package)$/i;
            const hasNonNameWord = words.some(w => nonNameKeywords.test(w) || /^\d+$/.test(w));
            if (!hasNonNameWord) {
                return words.every(w => /^[A-Z][a-z]+$/.test(w));
            }
        }
        return false;
    }

    private tryDirectDictionaryMatch(lowerName: string, topK: number, context?: QueryContext): VectorMatchResult[] {
        // Direct icon name & clean ID match against available icon library
        const normLowerName = lowerName.replace(/[\s_-]+/g, '');
        const directIconMatches: VectorMatchResult[] = [];

        this.iconVectors.forEach((_vec, iconId) => {
            const cleanId = iconId
                .replace(/^lucide-/i, '')
                .replace(/^(simple-icons-|si-|tabler-|fa-solid-|fa-regular-|bx-|octicon-|ra-|cf-|bi-|ri-|feather-)/i, '')
                .replace(/^brand-/i, '')
                .toLowerCase();
            const normCleanId = cleanId.replace(/[\s_-]+/g, '');
            const lowerIcon = iconId.toLowerCase();

            if (lowerIcon === lowerName || cleanId === lowerName || normCleanId === normLowerName) {
                directIconMatches.push({
                    iconId,
                    score: 0.99,
                    matchedTag: lowerName,
                    confidence: 'high' as const
                });
            }
        });

        if (directIconMatches.length > 0) {
            return directIconMatches.slice(0, topK);
        }

        if (context && this.isPersonName(context.filename, context.parentFolder)) {
            const personIcons = context.isFolder
                ? ['folder-users', 'users', 'user', 'contact']
                : ['user', 'contact', 'id-card', 'profile', 'user-check'];
            return personIcons.slice(0, topK).map(iconId => ({
                iconId,
                score: 0.98,
                matchedTag: 'person-name',
                confidence: 'high' as const
            }));
        }

        const direct = EmbeddingModel.BRAND_DICTIONARY[lowerName];
        if (direct) {
            return direct.slice(0, topK).map(iconId => ({
                iconId,
                score: 1.0,
                matchedTag: lowerName,
                confidence: 'high' as const
            }));
        }

        const prefixMatches: { iconId: string; brand: string }[] = [];
        for (const [brand, candidates] of Object.entries(EmbeddingModel.BRAND_DICTIONARY)) {
            if (lowerName.startsWith(brand) || brand.startsWith(lowerName)) {
                prefixMatches.push({ iconId: candidates[0], brand });
            }
        }

        if (prefixMatches.length > 0) {
            prefixMatches.sort((a, b) => {
                const aStarts = a.brand.startsWith(lowerName) ? 1 : 0;
                const bStarts = b.brand.startsWith(lowerName) ? 1 : 0;
                return bStarts - aStarts;
            });
            return prefixMatches.slice(0, topK).map(m => ({
                iconId: m.iconId,
                score: 0.9,
                matchedTag: m.brand,
                confidence: 'high' as const
            }));
        }

        return [];
    }

    private getFallbackIcons(context: QueryContext, topK: number): VectorMatchResult[] {
        const results: VectorMatchResult[] = [];
        const seen = new Set<string>();

        const extensionHints = this.getExtensionBoosts(context.extension);
        for (const iconId of extensionHints) {
            if (!seen.has(iconId)) {
                seen.add(iconId);
                results.push({
                    iconId,
                    score: 0.4,
                    matchedTag: context.extension,
                    confidence: 'low' as const
                });
            }
            if (results.length >= topK) break;
        }

        if (results.length < topK && context.isFolder) {
            const folderHints = this.getFolderHintBoosts(context.parentFolder);
            for (const iconId of folderHints) {
                if (!seen.has(iconId)) {
                    seen.add(iconId);
                    results.push({
                        iconId,
                        score: 0.35,
                        matchedTag: context.parentFolder,
                        confidence: 'low' as const
                    });
                }
                if (results.length >= topK) break;
            }
        }

        if (results.length < topK) {
            const defaultIcons = context.isFolder
                ? ['folder', 'layers', 'box', 'folder-kanban']
                : ['file-text', 'notebook', 'edit-3', 'layers'];
            for (const iconId of defaultIcons) {
                if (!seen.has(iconId)) {
                    seen.add(iconId);
                    results.push({
                        iconId,
                        score: 0.3,
                        matchedTag: context.isFolder ? 'default-folder' : 'default-file',
                        confidence: 'low' as const
                    });
                }
                if (results.length >= topK) break;
            }
        }

        return results;
    }

    public async fetchNeuralEmbedding(text: string): Promise<number[] | null> {
        const settings = this.plugin?.settings;
        if (settings?.embeddingEngine === 'builtin') return null;

        const modelName = settings?.embeddingCustomModel || 'bge-m3';
        const endpoint = (settings?.embeddingCustomEndpoint || 'http://localhost:11434').replace(/\/$/, '');
        const url = `${endpoint}/api/embeddings`;

        try {
            const res = await requestUrl({
                url,
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: modelName, prompt: text })
            });

            const data = res.json as { embedding?: number[] };
            return data.embedding || null;
        } catch {
            return null;
        }
    }

    /**
     * Builds a structured contextual prompt for custom neural embedding models.
     */
    public buildEnrichedPrompt(titleOrPath: string, isFolder?: boolean): string {
        const context = this.buildQueryContext(titleOrPath, isFolder);
        const parts: string[] = [
            `Full File Name: ${context.filename}`,
            `Exact Words: ${context.filename.replace(/[\s_-]+/g, ' ')}`
        ];
        if (context.extension) parts.push(`Extension: ${context.extension}`);
        if (context.parentFolder && context.parentFolder !== 'Root') parts.push(`Folder Path: ${context.parentFolder}`);
        if (context.isFolder) parts.push('Type: Directory Folder');
        return parts.join(' | ');
    }

    /**
     * Computes Cosine Similarity between two dense N-dimensional floating point vectors.
     */
    public computeDenseCosineSimilarity(vecA: number[], vecB: number[]): number {
        if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
        const len = Math.min(vecA.length, vecB.length);
        let dot = 0;
        let normA = 0;
        let normB = 0;
        for (let i = 0; i < len; i++) {
            const a = vecA[i];
            const b = vecB[i];
            dot += a * b;
            normA += a * a;
            normB += b * b;
        }
        const denom = (Math.sqrt(normA) * Math.sqrt(normB));
        return denom === 0 ? 0 : dot / denom;
    }

    /**
     * Async classification supporting both Built-in Sparse Vector Engine and Custom Neural Model.
     */
    public async classifyTargetsAsync(
        targets: Array<{ path: string; name: string; isFolder?: boolean }>,
        onProgress?: (completed: number, total: number, percentage: number) => void
    ): Promise<Record<string, string[]>> {
        const settings = this.plugin?.settings;
        const isCustomNeural = settings?.embeddingEngine === 'custom';

        const output: Record<string, string[]> = {};
        const uniqueNames = new Map<string, { path: string; name: string; isFolder?: boolean }>();
        for (const item of targets) {
            const key = item.path.toLowerCase();
            if (!uniqueNames.has(key)) {
                uniqueNames.set(key, item);
            }
        }

        const items = Array.from(uniqueNames.values());
        const total = items.length;
        let completed = 0;

        for (const item of items) {
            completed++;
            if (onProgress && (completed % 5 === 0 || completed === total || total <= 10)) {
                const pct = Math.round((completed / Math.max(1, total)) * 100);
                onProgress(completed, total, pct);
            }

            if (isCustomNeural) {
                const enrichedPrompt = this.buildEnrichedPrompt(item.name || item.path, item.isFolder);
                const denseVector = await this.fetchNeuralEmbedding(enrichedPrompt);
                if (denseVector) {
                    const matches = this.findBestIcons(item.name || item.path, { topK: 3, isFolder: item.isFolder });
                    if (matches.length > 0) {
                        output[item.path] = matches.map(m => m.iconId);
                        continue;
                    }
                }
            }

            const matches = this.findBestIcons(item.name || item.path, { topK: 3, isFolder: item.isFolder });
            if (matches.length > 0) {
                output[item.path] = matches.map(m => m.iconId);
            }
        }

        return output;
    }



    /**
     * Pre-calculates candidate icon IDs for a batch of items, supporting both Built-in Local and Custom Neural models.
     */
    public async getBatchVectorCandidatesAsync(
        items: Array<{ path: string; name: string; isFolder?: boolean }>,
        topK = 5
    ): Promise<Record<string, string[]>> {
        const settings = this.plugin?.settings;
        if (settings?.embeddingEngine === 'custom') {
            return await this.classifyTargetsAsync(items);
        }
        return this.getBatchVectorCandidates(items, topK);
    }

    public getBatchVectorCandidates(
        items: Array<{ path: string; name: string; isFolder?: boolean }>,
        topK = 5
    ): Record<string, string[]> {
        const candidateMap: Record<string, string[]> = {};
        for (const item of items) {
            const matches = this.findBestIcons(item.name || item.path, { topK, isFolder: item.isFolder });
            if (matches.length > 0) {
                candidateMap[item.path] = matches.map(m => m.iconId);
            } else {
                candidateMap[item.path] = item.isFolder
                    ? ['folder', 'layers', 'box', 'folder-kanban']
                    : ['file-text', 'notebook', 'edit-3', 'layers'];
            }
        }
        return candidateMap;
    }
}
