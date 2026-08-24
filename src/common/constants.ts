import { ColorfulFoldersSettings, AutoIconData } from './types';

export const CF_FOLDER_CLOSED = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M2 10h20"/></svg>');
export const CF_FOLDER_OPEN = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>');
export const CF_FILE_DEFAULT = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>');

export const PALETTES: Record<string, Array<{ rgb: string, hex: string }>> = {
    "Vibrant Rainbow": [
        { rgb: "235, 111, 146", hex: "#eb6f92" },
        { rgb: "196, 167, 231", hex: "#c4a7e7" },
        { rgb: "246, 193, 119", hex: "#f6c177" },
        { rgb: "156, 207, 216", hex: "#9ccfd8" },
        { rgb: "49, 116, 143", hex: "#31748f" },
        { rgb: "234, 154, 151", hex: "#ea9a97" },
        { rgb: "245, 169, 127", hex: "#f5a97f" },
        { rgb: "166, 218, 149", hex: "#a6da95" },
        { rgb: "116, 199, 236", hex: "#74c7ec" },
        { rgb: "202, 158, 230", hex: "#ca9ee6" },
        { rgb: "242, 205, 205", hex: "#f2cdcd" },
        { rgb: "180, 190, 254", hex: "#b4befe" }
    ],
    "Muted Dark Mode": [
        { rgb: "186, 113, 132", hex: "#ba7184" },
        { rgb: "148, 128, 179", hex: "#9480b3" },
        { rgb: "194, 150, 91", hex: "#c2965b" },
        { rgb: "96, 148, 160", hex: "#6094a0" },
        { rgb: "48, 102, 125", hex: "#30667d" },
        { rgb: "191, 120, 117", hex: "#bf7875" },
        { rgb: "199, 138, 105", hex: "#c78a69" },
        { rgb: "128, 171, 115", hex: "#80ab73" },
        { rgb: "91, 159, 189", hex: "#5b9fbd" },
        { rgb: "160, 126, 181", hex: "#a07eb5" },
        { rgb: "186, 156, 156", hex: "#ba9c9c" },
        { rgb: "143, 151, 199", hex: "#8f97c7" }
    ],
    "Pastel Dreams": [
        { rgb: "255, 179, 186", hex: "#ffb3ba" },
        { rgb: "255, 223, 186", hex: "#ffdfba" },
        { rgb: "255, 255, 186", hex: "#ffffba" },
        { rgb: "186, 255, 201", hex: "#baffc9" },
        { rgb: "186, 225, 255", hex: "#bae1ff" },
        { rgb: "219, 186, 255", hex: "#dbbaff" },
        { rgb: "255, 186, 219", hex: "#ffbadb" },
        { rgb: "250, 218, 221", hex: "#fadadd" },
        { rgb: "207, 252, 220", hex: "#cffcdc" },
        { rgb: "204, 237, 255", hex: "#ccedff" },
        { rgb: "240, 217, 255", hex: "#f0d9ff" },
        { rgb: "255, 217, 236", hex: "#ffd9ec" }
    ],
    "Tailwind UI": [
        { rgb: "59, 130, 246", hex: "#3b82f6" },  // Blue
        { rgb: "16, 185, 129", hex: "#10b981" },  // Emerald
        { rgb: "239, 68, 68", hex: "#ef4444" },   // Red
        { rgb: "139, 92, 246", hex: "#8b5cf6" },  // Purple
        { rgb: "245, 158, 11", hex: "#f59e0b" },  // Amber
        { rgb: "6, 182, 212", hex: "#06b6d4" },   // Cyan
        { rgb: "236, 72, 153", hex: "#ec4899" },  // Pink
        { rgb: "99, 102, 241", hex: "#6366f1" },  // Indigo
        { rgb: "244, 63, 94", hex: "#f43f5e" },   // Rose
        { rgb: "20, 184, 166", hex: "#14b8a6" }   // Teal
    ],
    "Tailwind UI Dark": [
        { rgb: "56, 189, 248", hex: "#38bdf8" },  // Sky
        { rgb: "52, 211, 153", hex: "#34d399" },  // Emerald
        { rgb: "248, 113, 113", hex: "#f87171" },  // Red
        { rgb: "192, 132, 252", hex: "#c084fc" },  // Purple
        { rgb: "251, 191, 36", hex: "#fbbf24" },  // Amber
        { rgb: "34, 211, 238", hex: "#22d3ee" },  // Cyan
        { rgb: "244, 114, 182", hex: "#f472b6" },  // Pink
        { rgb: "129, 140, 248", hex: "#818cf8" },  // Indigo
        { rgb: "251, 113, 133", hex: "#fb7185" },  // Rose
        { rgb: "45, 212, 191", hex: "#2dd4bf" }   // Teal
    ]
};

export const DEFAULT_SETTINGS: ColorfulFoldersSettings = {
    paletteLight: "Tailwind UI",
    paletteDark: "Pastel Dreams",
    customPalette: "",
    colorMode: "cycle",
    exclusionList: "",
    outlineOnly: false,
    activeGlow: true,
    rootStyle: "translucent",
    rootOpacity: 0.548,
    subfolderOpacity: 0.201,
    tintOpacity: 0.028,
    customFolderColors: {},
    presets: {},
    recentlyUsedIcons: [],
    glassmorphism: true,

    autoIcons: true,
    iconPackPriorityOrder: ['custom', 'lucide', 'bootstrap', 'simple-icons', 'tabler', 'remix', 'font-awesome', 'material', 'feather', 'emoji'],
    autoIconVariety: true,
    varietySeed: 0,
    wideAutoIcons: true,
    rainbowRootText: true,
    rainbowRootBgTransparent: false,
    rainbowGradientAngle: 135,
    autoColorFiles: false,
    fileColorMode: "mixed",
    colorText: "all",
    showItemCounters: true,
    rootTintOpacity: 0.06,
    lightModeBrightness: 0,
    darkModeBrightness: 0,
    customIconRules: "",
    iconDebugMode: false,
    notebookNavigatorSupport: true,
    notebookNavigatorFileBackground: true,
    iconScale: 1.1,
    notebookNavigatorIconScale: 1.0,
    customIcons: {},
    cycleOffset: 0,
    showFileDivider: false,

    fileDividerText: "Files",
    dividerThickness: 1.5,
    dividerSpacing: 16,
    dividerLineStyle: "solid",
    separatorColor: "var(--text-muted)",
    dividerPillMode: true,
    dividerIconPosition: "left",
    fileBackgroundOpacity: 0.1,
    notebookNavigatorOutlineOnly: true,
    graphColorSync: false,
    vaultPassword: "",
    isVaultLocked: false,
    showHiddenItems: false,
    showRibbonIcon: true,
    lastVersion: "",
    globalBackgroundColor: "",
    dividerLinePadding: 8,
    dividerLinePaddingLeft: 8,
    dividerLinePaddingRight: 8,
    dividerPillColor: "",
    useCustomActiveColor: false,
    customActiveBg: "",
    customActiveText: "",
    pathLineThickness: 3,
    wrapMetadata: false,
    tagSyncEnabled: false,
    tagSyncMatchFolders: true,
    tagSyncRules: "",
    spacedTextMode: "folders",
    indentSubfolderPills: false,
    folderSpacing: false,
    defaultClosedFolderIcon: "lucide-folder",
    defaultOpenFolderIcon: "lucide-folder-open",
    showCollapseIndicator: true,
    folderBorderRadius: 10,
    enableStaircaseHack: false,
    aiProvider: "ollama",
    aiApiKey: "",
    aiCustomEndpoint: "",
    aiOllamaEndpoint: "http://localhost:11434",
    aiModelName: "qwen2.5:1.5b",
    aiIncludeFiles: false,
    aiIncludeContentContext: true,
    aiKeyConfirmed: false,
    embeddingEngine: "builtin",
    embeddingCustomModel: "bge-m3",
    embeddingCustomEndpoint: "http://localhost:11434",
};

export const AUTO_ICON_CATEGORIES: AutoIconData[] = [
    // =========================================================================
    // 1. EXPLICIT STRUCTURAL SYMBOLS, DATES & NUMERICS (Priority 150 - 130)
    // =========================================================================
    { rex: /^\+$/, emoji: "📥", lucide: "inbox", priority: 150, emojis: ["📥", "➕", "✨"], lucides: ["inbox", "plus-circle", "sparkles"] },
    { rex: /^(19|20)\d{2}$/, emoji: "📅", lucide: "calendar", priority: 150, emojis: ["📅", "📆", "⏳"], lucides: ["calendar", "calendar-days", "clock"] },
    { rex: /^\d{4}-\d{2}(-\d{2})?$/, emoji: "📅", lucide: "calendar-days", priority: 150, emojis: ["📅", "📆"], lucides: ["calendar-days", "calendar-clock"] },
    { rex: /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*$/i, emoji: "📅", lucide: "calendar", priority: 140 },
    { rex: /^\d+$/, emoji: "🔢", lucide: "hash", priority: 130 },
    { rex: /^\d+%$/, emoji: "📊", lucide: "percent", priority: 130 },
    { rex: /^#\d+$/, emoji: "🏷️", lucide: "hash", priority: 130 },

    // =========================================================================
    // 2. PKM VAULT STRUCTURES, MENTAL MODELS & PHILOSOPHY (Priority 140 - 120)
    // =========================================================================
    { rex: /\b(?:ideation|brainstorm|ideas?|brainstorming|new\s*ideas?)\b/i, emoji: "💡", lucide: "lightbulb", priority: 140, emojis: ["💡", "✨", "🧠"], lucides: ["lightbulb", "brain", "sparkles"] },
    { rex: /\b(?:home\s*base|home\s*pro|dashboard|hub)\b/i, emoji: "🏠", lucide: "home", priority: 135, emojis: ["🏠", "🧭", "📊"], lucides: ["home", "layout", "compass"] },
    { rex: /\b(?:spark\s*list|ideaverse|eureka|epiphany|new\s*spark)\b/i, emoji: "✨", lucide: "sparkles", priority: 135, emojis: ["✨", "💡", "🧠"], lucides: ["sparkles", "lightbulb", "brain"] },
    { rex: /\b(?:think|thinking|mindset|cognit|cognitive|mental|brain|intellect|ponder|reasoning|critical-thinking)\b/i, emoji: "🧠", lucide: "brain", priority: 130, emojis: ["🧠", "💡", "✨"], lucides: ["brain", "lightbulb", "sparkles", "compass"] },
    { rex: /\b(?:remember|mnemonic|memory\s*technique|recall|memories)\b/i, emoji: "🧠", lucide: "brain", priority: 130, emojis: ["🧠", "💡", "💾"], lucides: ["brain", "brain-circuit", "lightbulb"] },
    { rex: /\b(?:higher-order|higher\s*order|order\s*of\s*magnitude|structural\s*order)\b/i, emoji: "🥞", lucide: "layers", priority: 130, emojis: ["🥞", "🕸️", "🌳"], lucides: ["layers", "git-branch", "network", "list-tree"] },
    { rex: /\b(?:underestimate|how\s*long.*takes|time\s*estimate|estimation\s*fallacy|chronically)\b/i, emoji: "⏳", lucide: "hourglass", priority: 130, emojis: ["⏳", "🕒", "⏱️"], lucides: ["hourglass", "clock", "calendar-clock", "timer"] },
    { rex: /\b(?:yin\s*(?:and|&)?\s*yang|dualism|balance)\b/i, emoji: "☯️", lucide: "yin-yang", priority: 130, emojis: ["☯️", "⚖️", "🌓"], lucides: ["yin-yang", "sun-moon", "circle-dot", "scale"] },
    { rex: /\b(?:wu\s*wei|daoism|effortless\s*action)\b/i, emoji: "✨", lucide: "sparkles", priority: 130, emojis: ["✨", "🧭", "🍃"], lucides: ["sparkles", "compass", "wind", "leaf"] },
    { rex: /\b(?:hormetic|hormesis|stressor|stressors|resilience|resiliency)\b/i, emoji: "⚡", lucide: "zap", priority: 130, emojis: ["⚡", "📈", "🛡️"], lucides: ["zap", "activity", "flame", "shield"] },
    { rex: /\b(?:habit|habits|routine|routines|cue|cycle)\b/i, emoji: "🔄", lucide: "repeat", priority: 125, emojis: ["🔄", "📅", "⚡"], lucides: ["repeat", "calendar-check", "activity", "target"] },
    { rex: /^(?:how\s*do\s*i|what\s*is|why\s*am\s*i|why\s*do|can\s*we|is\s*lyt)\b|\b(?:questions?|inquiry|inquiries|faq|curiosity)\b/i, emoji: "❓", lucide: "help-circle", priority: 125, emojis: ["❓", "💡", "🧭"], lucides: ["help-circle", "lightbulb", "compass"] },
    { rex: /\b(?:dragon\s*(?:and|&)?\s*phoenix|phoenix|mythology|myth|legend)\b/i, emoji: "🐉", lucide: "dragon", priority: 125, emojis: ["🐉", "🔥", "✨"], lucides: ["dragon", "flame", "sparkles"] },
    { rex: /\b(?:earthquake|earthquakes|tsunami|disaster|hazard|avalanche)\b/i, emoji: "🌊", lucide: "activity", priority: 125, emojis: ["🌊", "⚠️", "💨"], lucides: ["activity", "alert-triangle", "wind"] },
    { rex: /\b(?:enso|ouroboros|eternity|infinity|cycle|cyclic)\b/i, emoji: "⭕", lucide: "circle-dot", priority: 125, emojis: ["⭕", "🔄", "✨"], lucides: ["circle-dot", "repeat", "sparkles"] },
    { rex: /\b(?:pkm|personal\s*knowledge|planet\s*survey|survey|questionnaire)\b/i, emoji: "🪐", lucide: "globe", priority: 125, emojis: ["🪐", "📊", "🌐"], lucides: ["globe", "bar-chart-2", "compass"] },
    { rex: /\b(?:flow|flowcreation|in-the-flow|state-of-flow)\b/i, emoji: "🌊", lucide: "activity", priority: 120, emojis: ["🌊", "💨", "⚡"], lucides: ["activity", "wind", "zap", "compass"] },
    { rex: /\b(?:practice|deliberate-practice|training|exercise|skills?)\b/i, emoji: "🎯", lucide: "target", priority: 120, emojis: ["🎯", "⚡", "🏋️"], lucides: ["target", "activity", "award", "zap"] },
    { rex: /\b(?:effort|mastery|maestro|discipline|focus|concentration)\b/i, emoji: "⚡", lucide: "zap", priority: 120, emojis: ["⚡", "✨", "🏆"], lucides: ["zap", "sparkles", "award", "target"] },
    { rex: /\b(?:convergence|divergence|synthesis|emerge|emergence|complexity)\b/i, emoji: "🔀", lucide: "git-merge", priority: 120, emojis: ["🔀", "🕸️", "✨"], lucides: ["git-merge", "git-branch", "share-2", "workflow"] },
    { rex: /\b(?:dimension|dimensions|reality|perspective|levels|scale)\b/i, emoji: "📐", lucide: "maximize-2", priority: 120, emojis: ["📐", "🔀", "🌐"], lucides: ["maximize-2", "scale", "compass", "layers"] },
    { rex: /\b(?:direction|compass|orientation|wayfinding|path)\b/i, emoji: "🧭", lucide: "compass", priority: 120, emojis: ["🧭", "📍", "🗺️"], lucides: ["compass", "chevrons-up-down", "map-pin", "route"] },
    { rex: /\b(?:theme|themes|styling|appearance|color-scheme)\b/i, emoji: "🎨", lucide: "palette", priority: 120, emojis: ["🎨", "✨", "💅"], lucides: ["palette", "brush", "layout", "sparkles"] },
    { rex: /\b(?:defn|definitions?|terminology|glossary|concept|concepts)\b/i, emoji: "📖", lucide: "book-open", priority: 120, emojis: ["📖", "💡", "📝"], lucides: ["book-open", "file-text", "lightbulb", "quote"] },
    { rex: /\b(?:things?|objects?|entities|stuff|dots?)\b/i, emoji: "⭕", lucide: "circle-dot", priority: 85, emojis: ["⭕", "📦", "✨"], lucides: ["circle-dot", "layers", "box", "package"] },
    { rex: /\b(?:journal|daily|diary|morning\s*pages|logbook)\b/i, emoji: "📅", lucide: "calendar", priority: 120, emojis: ["📅", "📆", "📝", "📔"], lucides: ["calendar", "calendar-days", "book", "pencil"] },
    { rex: /\b(?:atlas|moc|map\s*of\s*contents?|index|directory|table-of-contents|toc)\b/i, emoji: "🗺️", lucide: "map", priority: 120, lucides: ["map", "list-tree", "network"] },
    { rex: /\b(?:zettel|zettelkasten|slipbox|card-index|permanent\s*notes?|fleeting\s*notes?)\b/i, emoji: "🗂️", lucide: "library", priority: 120, lucides: ["library", "layout-grid", "scroll-text"] },
    { rex: /\b(?:canvas|whiteboard|draw|excalidraw)\b/i, emoji: "🎨", lucide: "frame", priority: 120, lucides: ["frame", "shapes", "pencil-ruler"] },
    { rex: /\b(?:graph|graph-view|link|relation|node|network)\b/i, emoji: "🕸️", lucide: "share-2", priority: 120, lucides: ["share-2", "git-branch", "workflow"] },
    { rex: /\b(?:plugin|plugins|extension|extensions|addon|addons|widget|widgets)\b/i, emoji: "🧩", lucide: "puzzle", priority: 120, emojis: ["🧩", "🔌"], lucides: ["puzzle", "plugin", "simple-icons-wxt"] },

    // =========================================================================
    // 3. CORE CONTENT TYPES, READING, WRITING & WISDOM (Priority 115 - 105)
    // =========================================================================
    { rex: /\b(?:quote|quotes|saying|sayings|proverb|aphorism|wisdom|philosophy|reflection|mindset|lesson)\b/i, emoji: "💬", lucide: "quote", priority: 115, emojis: ["💬", "💡", "✨"], lucides: ["quote", "sparkles", "lightbulb", "compass", "book-open", "brain"] },
    { rex: /\b(?:read|reading|books?|literature|library|novel|publications?|papers?|articles?)\b/i, emoji: "📚", lucide: "book-open", priority: 110, emojis: ["📚", "📖", "📜"], lucides: ["book-open", "book", "library"] },
    { rex: /\b(?:write|writing|author|story|stories|narrative|tale|prose|fiction|manuscript|screenplay|playwright)\b/i, emoji: "📜", lucide: "pen-tool", priority: 110, emojis: ["📜", "🪶", "📖"], lucides: ["pen-tool", "book-open", "feather", "scroll", "file-text"] },
    { rex: /\b(?:templates?|boilerplate|preset|layout-template|blueprint)\b/i, emoji: "📝", lucide: "layout-template", priority: 110, emojis: ["📝", "📋", "📐"], lucides: ["layout-template", "copy", "ruler"] },
    { rex: /\b(?:archive|archived|archives|past|history|dump|backups?)\b/i, emoji: "📦", lucide: "archive", priority: 105, emojis: ["📦", "🗄️"], lucides: ["archive", "box", "package"] },
    { rex: /\b(?:thesaurus|dictionary|vocabulary|definitions?|glossary)\b/i, emoji: "📖", lucide: "book-open-check", priority: 105, emojis: ["📖", "📚", "🔤"], lucides: ["book-open-check", "spell-check", "languages"] },
    { rex: /\b(?:metadata|attribute|attributes|properties|property|tags?)\b/i, emoji: "🏷️", lucide: "tags", priority: 105, emojis: ["🏷️", "🔖", "🔑"], lucides: ["tags", "tag", "file-key"] },

    // =========================================================================
    // 4. TECH, PLATFORMS, BRANDS & DEV TOOLS (Priority 110 - 95)
    // =========================================================================
    { rex: /\b(?:twitter|x\.com|tweet|tweets)\b/i, emoji: "🐦", lucide: "simple-icons-twitter", priority: 110 },
    { rex: /\b(?:facebook)\b|\bfb\b/i, emoji: "👥", lucide: "simple-icons-facebook", priority: 110 },
    { rex: /\b(?:instagram|insta)\b|\big\b/i, emoji: "📸", lucide: "simple-icons-instagram", priority: 110 },
    { rex: /\b(?:youtube)\b|\byt\b/i, emoji: "📺", lucide: "simple-icons-youtube", priority: 110 },
    { rex: /\b(?:discord)\b/i, emoji: "💬", lucide: "simple-icons-discord", priority: 110 },
    { rex: /\b(?:reddit)\b/i, emoji: "🤖", lucide: "simple-icons-reddit", priority: 110 },
    { rex: /\b(?:whatsapp)\b|\bwa\b/i, emoji: "💬", lucide: "simple-icons-whatsapp", priority: 110 },
    { rex: /\b(?:telegram)\b|\btg\b/i, emoji: "✈️", lucide: "simple-icons-telegram", priority: 110 },
    { rex: /\b(?:slack)\b/i, emoji: "💬", lucide: "simple-icons-slack", priority: 110 },
    { rex: /\b(?:github|gitlab|git)\b/i, emoji: "🐙", lucide: "simple-icons-github", priority: 110 },
    { rex: /\b(?:linkedin)\b/i, emoji: "💼", lucide: "simple-icons-linkedin", priority: 110 },
    { rex: /\b(?:tiktok)\b/i, emoji: "🎵", lucide: "simple-icons-tiktok", priority: 110 },
    { rex: /\b(?:pinterest)\b|\bpin\b/i, emoji: "📌", lucide: "simple-icons-pinterest", priority: 110 },
    { rex: /\b(?:snapchat)\b/i, emoji: "👻", lucide: "simple-icons-snapchat", priority: 110 },
    { rex: /\b(?:twitch)\b/i, emoji: "🎮", lucide: "simple-icons-twitch", priority: 110 },
    { rex: /\b(?:spotify)\b/i, emoji: "🎧", lucide: "simple-icons-spotify", priority: 110 },
    { rex: /\b(?:docker|k8s|kubernetes|containers?|pod|pods)\b/i, emoji: "🐳", lucide: "ship", priority: 105, lucides: ["ship", "container", "box"] },
    { rex: /\b(?:code|coding|dev|developer|script|scripts|programs?|programming|syntax|ast)\b/i, emoji: "💻", lucide: "code", priority: 105, emojis: ["💻", "🖥️", "⌨️", "👨‍💻"], lucides: ["code", "terminal", "cpu", "laptop"] },
    { rex: /\b(?:server|servers|database|databases|infra|infrastructure|sql|nosql|postgres|mysql|redis|mongodb)\b/i, emoji: "🖧", lucide: "server", priority: 105, emojis: ["🖧", "🖥️", "🗄️"], lucides: ["server", "database", "hard-drive"] },
    { rex: /\b(?:terminal|bash|shell|zsh|cli|command-line|cmd)\b/i, emoji: "🐚", lucide: "terminal", priority: 100 },
    { rex: /\b(?:ai|ml|machine-learning|deep-learning|neural-net|llm|gpt|model-weights|weights)\b/i, emoji: "🤖", lucide: "cpu", priority: 100 },
    { rex: /\b(?:aws|cloud|azure|gcp|lambda|serverless|s3-backup|terraform)\b/i, emoji: "☁️", lucide: "cloud-lightning", priority: 100, lucides: ["cloud-lightning", "flame", "hard-drive"] },
    { rex: /\b(?:api|apis|json|yaml|xml|graphql|rest-api|webhook|endpoint)\b/i, emoji: "🔌", lucide: "plug", priority: 100, lucides: ["plug", "webhook", "bracket"] },
    { rex: /\b(?:cybersecurity|hacker|exploit|firewall|pentest|security-audit)\b/i, emoji: "🕵️", lucide: "shield-alert", priority: 95, lucides: ["shield-alert", "spy", "fingerprint"] },

    // =========================================================================
    // 5. PROFESSIONAL, WORK, FINANCE, LAW & HEALTH (Priority 100 - 90)
    // =========================================================================
    { rex: /\b(?:finance|financial|money|bank|banking|invoice|receipt|tax|taxes|wallet|currency|crypto|bitcoin|ethereum)\b/i, emoji: "💸", lucide: "banknote", priority: 100, emojis: ["💸", "💰", "💳"], lucides: ["banknote", "dollar-sign", "receipt", "wallet"] },
    { rex: /\b(?:law|legal|court|justice|contract|contracts|nda|agreement|agreements|clause)\b/i, emoji: "⚖️", lucide: "scale", priority: 100, lucides: ["scale", "gavel", "scroll"] },
    { rex: /\b(?:health|doctor|clinic|hospital|surgery|medical|stethoscope|blood-test|wellness)\b/i, emoji: "🏥", lucide: "stethoscope", priority: 100, lucides: ["stethoscope", "pill", "heart-pulse", "activity"] },
    { rex: /\b(?:school|study|studies|class|classes|course|courses|exam|exams|lecture|university|uni|academic)\b/i, emoji: "🎓", lucide: "graduation-cap", priority: 95 },
    { rex: /\b(?:project|projects|tasks?|todo|todos|roadmap|milestone|deliverable)\b/i, emoji: "🚀", lucide: "rocket", priority: 95, emojis: ["🚀", "🎯", "✅", "⚡"], lucides: ["rocket", "target", "check-circle", "zap"] },
    { rex: /\b(?:career|job|jobs|resume|cv|portfolio|work|workspace)\b/i, emoji: "💼", lucide: "briefcase", priority: 95 },
    { rex: /\b(?:meeting|meetings|interview|interviews|zoom|teams|call|conference|conferences|summit|meetup)\b/i, emoji: "🤝", lucide: "video", priority: 95, lucides: ["video", "presentation", "users", "phone-call"] },
    { rex: /\b(?:megaphone|megaphones|loudspeaker|broadcast|announcement|marketing)\b/i, emoji: "📣", lucide: "megaphone", priority: 95, emojis: ["📣", "📢", "⚡"], lucides: ["megaphone", "volume-2", "radio"] },
    { rex: /\b(?:newsletter|newsletters|bulletin|press|digest|dispatch)\b/i, emoji: "📰", lucide: "newspaper", priority: 95, emojis: ["📰", "📧", "📝"], lucides: ["newspaper", "mail", "send"] },
    { rex: /\b(?:product|products|merchandise|goods|inventory)\b/i, emoji: "📦", lucide: "package", priority: 95, emojis: ["📦", "🛍️", "🏷️"], lucides: ["package", "box", "shopping-bag", "tag"] },
    { rex: /\b(?:workshop|workshops|seminar|masterclass|bootcamp|lab)\b/i, emoji: "🛠️", lucide: "hammer", priority: 95, emojis: ["🛠️", "🔨", "🎓"], lucides: ["hammer", "wrench", "presentation", "graduation-cap"] },
    { rex: /\b(?:life|lifestyle|living|wellness|vitality|daily-life)\b/i, emoji: "❤️", lucide: "heart", priority: 95, emojis: ["❤️", "🌱", "✨"], lucides: ["heart", "sun", "sparkles", "compass"] },
    { rex: /\b(?:data|analytics|statistics|metrics|stats|spreadsheet|sheets?|tables?)\b/i, emoji: "📊", lucide: "bar-chart-2", priority: 95 },
    { rex: /\b(?:presentation|slides|keynote|pitch|deck)\b/i, emoji: "📽️", lucide: "presentation", priority: 90 },
    { rex: /\b(?:design|ui|ux|figma|sketch|mockup|wireframe|components?)\b/i, emoji: "✨", lucide: "layout", priority: 90, emojis: ["✨", "🎨", "📐"], lucides: ["layout", "palette", "brush"] },

    // =========================================================================
    // 6. LIFESTYLE, MEDIA, HOBBIES & DOMAINS (Priority 90 - 80)
    // =========================================================================
    { rex: /\b(?:music|audio|song|songs|playlist|soundtrack|melody|track)\b/i, emoji: "🎵", lucide: "music", priority: 90, emojis: ["🎵", "🎶", "🎧"], lucides: ["music", "headphones", "mic"] },
    { rex: /\b(?:video|videos|movie|movies|film|films|cinema|stream|streaming)\b/i, emoji: "🎬", lucide: "clapperboard", priority: 90, emojis: ["🎬", "🍿", "📺"], lucides: ["clapperboard", "video", "film"] },
    { rex: /\b(?:photos?|images?|pics?|gallery|album|photography|camera)\b/i, emoji: "🖼️", lucide: "image", priority: 90, emojis: ["🖼️", "📷", "📸", "🎨"], lucides: ["image", "camera", "aperture", "palette"] },
    { rex: /\b(?:cook|cooking|recipe|recipes|baking|kitchen|meal|meals|diet|bake)\b/i, emoji: "🍳", lucide: "utensils", priority: 90, emojis: ["🍳", "🍽️", "🍲", "🍕"], lucides: ["utensils", "chef-hat", "soup"] },
    { rex: /\b(?:shopping|cart|store|shop|buy|checkout|purchases?|order|orders)\b/i, emoji: "🛒", lucide: "shopping-cart", priority: 90, emojis: ["🛒", "🛍️", "📦"], lucides: ["shopping-cart", "shopping-bag", "tag"] },
    { rex: /\b(?:fitness|workout|gym|exercise|running|marathon|lift|lifting)\b/i, emoji: "🏃", lucide: "dumbbell", priority: 85, emojis: ["🏃", "🏋️", "🚴"], lucides: ["dumbbell", "activity", "heart"] },
    { rex: /\b(?:travel|travels|vacation|flight|trip|trips|itinerary|journey|voyage)\b/i, emoji: "✈️", lucide: "plane", priority: 85, emojis: ["✈️", "🧭", "🗺️"], lucides: ["plane", "compass", "map-pin"] },
    { rex: /\b(?:games?|gaming|gameplay|steam|console|gamer)\b/i, emoji: "🎮", lucide: "gamepad-2", priority: 85, emojis: ["🎮", "🕹️", "🎲"], lucides: ["gamepad-2", "dices", "sword"] },
    { rex: /\b(?:people|contacts?|friends?|family|team|members)\b/i, emoji: "👥", lucide: "users", priority: 85 },
    { rex: /\b(?:pets?|dogs?|cats?|puppy|kitten|animals?|veterinary)\b/i, emoji: "🐾", lucide: "dog", priority: 85, emojis: ["🐾", "🐕", "🐈"], lucides: ["dog", "cat", "paw-print"] },
    { rex: /\b(?:nature|forest|plants?|gardens?|trees?|eco|botany)\b/i, emoji: "🌱", lucide: "leaf", priority: 85, emojis: ["🌱", "🌻", "🌳"], lucides: ["leaf", "tree-pine", "flower-2"] },
    { rex: /\b(?:transport|transportation|vehicle|vehicles|car|cars|automobile|bike|bicycle|bus|subway|railway|locomotive|commute)\b/i, emoji: "🚗", lucide: "car", priority: 80, lucides: ["car", "bus", "bike"] },

    // =========================================================================
    // 7. SYSTEM UTILITIES, FILES & SETTINGS (Priority 80 - 70)
    // =========================================================================
    { rex: /\b(?:settings?|config|configuration|preferences|options|setup)\b/i, emoji: "⚙️", lucide: "settings", priority: 80 },
    { rex: /\b(?:security|auth|authentication|passwords?|keys?|vault|locks?)\b/i, emoji: "🔒", lucide: "lock", priority: 80, emojis: ["🔒", "🔑"], lucides: ["lock", "key", "shield"] },
    { rex: /\b(?:search|query|find|explore|lookup)\b/i, emoji: "🔍", lucide: "search", priority: 80 },
    { rex: /\b(?:mail|letter|letters|messages?|email|inbox)\b/i, emoji: "📧", lucide: "mail", priority: 80 },
    { rex: /\b(?:document|documents|report|reports|pdf|ebook|text)\b/i, emoji: "📄", lucide: "file-text", priority: 75, emojis: ["📄", "📕"], lucides: ["file-text", "file", "scroll"] },
    { rex: /\b(?:alert|alerts|warning|warnings|error|errors|bugs?|issues?)\b/i, emoji: "⚠️", lucide: "alert-triangle", priority: 75 },
    { rex: /\b(?:trash|delete|deleted|remove|bin|recycle-bin)\b/i, emoji: "🗑️", lucide: "trash", priority: 70 }
];

export const DEFAULT_ICON_PACK_ORDER: string[] = [
    'custom',
    'lucide',
    'bootstrap',
    'simple-icons',
    'tabler',
    'remix',
    'font-awesome',
    'material',
    'feather',
    'emoji'
];

export const PACK_PRIORITY: Record<string, number> = {
    'custom': 100,       // 1. Unique brand assets
    'lucide': 90,        // 2. Main UI baseline (Modern, sharp, highly consistent)
    'tabler': 80,        // 3. Main UI fallback (Massive library, same aesthetic)
    'simple-icons': 70,  // 4. Brands only (Logos for Google, GitHub, etc.)
    'remix': 60,         // 5. Secondary fallback
    'bi': 55,            // 6. Bootstrap Icons (large general-purpose library)
    'feather': 50,       // 7. Deprecated (Lucide is the upgraded version)
    'font-awesome': 40,  // 8. Utility fallback (Heavy, traditional style)
    'material': 30       // 9. Geometric fallback (Different design language)
};

export const PACK_PREFIXES: string[] = [
    'custom', 'simple-icons', 'simple', 'lucide', 'feather',
    'fa', 'fas', 'far', 'fab', 'fontawesome', 'ri', 'remix',
    'tb', 'tabler', 'mdi', 'material', 'oct', 'octicons', 'bi', 'bootstrap'
];

export const STOP_WORDS = new Set([
    'a', 'an', 'the', 'and', 'or', 'but', 'if', 'because', 'as', 'until', 'while',
    'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through',
    'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'upon', 'down',
    'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once',
    'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each',
    'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
    'own', 'same', 'so', 'than', 'too', 'very', 's', 't', 'can', 'will', 'just',
    'don', 'should', 'now', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'works', 'worked',
    'working', 'work', 'folder', 'file', 'notes', 'thoughts', 'draft', 'list', 'page',
    'doc', 'text', 'directory', 'items', 'item'
]);

export const GENERIC_SUFFIX_WORDS = new Set([
    'programming', 'program', 'project', 'projects', 'notes', 'note', 'thoughts',
    'draft', 'drafts', 'tutorial', 'tutorials', 'guide', 'guides', 'course', 'courses',
    'class', 'classes', 'management', 'system', 'systems', 'app', 'apps', 'application',
    'applications', 'service', 'services', 'module', 'modules', 'repo', 'repository',
    'structure', 'architecture', 'overview', 'summary', 'basics', 'advanced', 'intro',
    'introduction', 'practice', 'exercise', 'exercises', 'examples', 'example', 'demo',
    'test', 'tests', 'testing', 'doc', 'docs', 'document', 'documents', 'file', 'files',
    'folder', 'folders', 'list', 'page', 'pages', 'item', 'items', 'stuff', 'misc'
]);



