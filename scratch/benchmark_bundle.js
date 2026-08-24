var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/integrations/embedingmodel.ts
var embedingmodel_exports = {};
__export(embedingmodel_exports, {
  EmbeddingModel: () => EmbeddingModel,
  ICON_SYNONYMS: () => ICON_SYNONYMS,
  cleanSemanticTitle: () => cleanSemanticTitle
});
module.exports = __toCommonJS(embedingmodel_exports);
var import_obsidian = require("obsidian");

// src/common/constants.ts
var CF_FOLDER_CLOSED = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M2 10h20"/></svg>');
var CF_FOLDER_OPEN = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>');
var CF_FILE_DEFAULT = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>');
var AUTO_ICON_CATEGORIES = [
  // =========================================================================
  // 1. EXPLICIT STRUCTURAL SYMBOLS, DATES & NUMERICS (Priority 150 - 130)
  // =========================================================================
  { rex: /^\+$/, emoji: "\u{1F4E5}", lucide: "inbox", priority: 150, emojis: ["\u{1F4E5}", "\u2795", "\u2728"], lucides: ["inbox", "plus-circle", "sparkles"] },
  { rex: /^(19|20)\d{2}$/, emoji: "\u{1F4C5}", lucide: "calendar", priority: 150, emojis: ["\u{1F4C5}", "\u{1F4C6}", "\u23F3"], lucides: ["calendar", "calendar-days", "clock"] },
  { rex: /^\d{4}-\d{2}(-\d{2})?$/, emoji: "\u{1F4C5}", lucide: "calendar-days", priority: 150, emojis: ["\u{1F4C5}", "\u{1F4C6}"], lucides: ["calendar-days", "calendar-clock"] },
  { rex: /^(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*$/i, emoji: "\u{1F4C5}", lucide: "calendar", priority: 140 },
  { rex: /^\d+$/, emoji: "\u{1F522}", lucide: "hash", priority: 130 },
  { rex: /^\d+%$/, emoji: "\u{1F4CA}", lucide: "percent", priority: 130 },
  { rex: /^#\d+$/, emoji: "\u{1F3F7}\uFE0F", lucide: "hash", priority: 130 },
  // =========================================================================
  // 2. PKM VAULT STRUCTURES, MENTAL MODELS & PHILOSOPHY (Priority 140 - 120)
  // =========================================================================
  { rex: /\b(?:ideation|brainstorm|ideas?|brainstorming|new\s*ideas?)\b/i, emoji: "\u{1F4A1}", lucide: "lightbulb", priority: 140, emojis: ["\u{1F4A1}", "\u2728", "\u{1F9E0}"], lucides: ["lightbulb", "brain", "sparkles"] },
  { rex: /\b(?:home\s*base|home\s*pro|dashboard|hub)\b/i, emoji: "\u{1F3E0}", lucide: "home", priority: 135, emojis: ["\u{1F3E0}", "\u{1F9ED}", "\u{1F4CA}"], lucides: ["home", "layout", "compass"] },
  { rex: /\b(?:spark\s*list|ideaverse|eureka|epiphany|new\s*spark)\b/i, emoji: "\u2728", lucide: "sparkles", priority: 135, emojis: ["\u2728", "\u{1F4A1}", "\u{1F9E0}"], lucides: ["sparkles", "lightbulb", "brain"] },
  { rex: /\b(?:think|thinking|mindset|cognit|cognitive|mental|brain|intellect|ponder|reasoning|critical-thinking)\b/i, emoji: "\u{1F9E0}", lucide: "brain", priority: 130, emojis: ["\u{1F9E0}", "\u{1F4A1}", "\u2728"], lucides: ["brain", "lightbulb", "sparkles", "compass"] },
  { rex: /\b(?:remember|mnemonic|memory\s*technique|recall|memories)\b/i, emoji: "\u{1F9E0}", lucide: "brain", priority: 130, emojis: ["\u{1F9E0}", "\u{1F4A1}", "\u{1F4BE}"], lucides: ["brain", "brain-circuit", "lightbulb"] },
  { rex: /\b(?:higher-order|higher\s*order|order\s*of\s*magnitude|structural\s*order)\b/i, emoji: "\u{1F95E}", lucide: "layers", priority: 130, emojis: ["\u{1F95E}", "\u{1F578}\uFE0F", "\u{1F333}"], lucides: ["layers", "git-branch", "network", "list-tree"] },
  { rex: /\b(?:underestimate|how\s*long.*takes|time\s*estimate|estimation\s*fallacy|chronically)\b/i, emoji: "\u23F3", lucide: "hourglass", priority: 130, emojis: ["\u23F3", "\u{1F552}", "\u23F1\uFE0F"], lucides: ["hourglass", "clock", "calendar-clock", "timer"] },
  { rex: /\b(?:yin\s*(?:and|&)?\s*yang|dualism|balance)\b/i, emoji: "\u262F\uFE0F", lucide: "yin-yang", priority: 130, emojis: ["\u262F\uFE0F", "\u2696\uFE0F", "\u{1F313}"], lucides: ["yin-yang", "sun-moon", "circle-dot", "scale"] },
  { rex: /\b(?:wu\s*wei|daoism|effortless\s*action)\b/i, emoji: "\u2728", lucide: "sparkles", priority: 130, emojis: ["\u2728", "\u{1F9ED}", "\u{1F343}"], lucides: ["sparkles", "compass", "wind", "leaf"] },
  { rex: /\b(?:hormetic|hormesis|stressor|stressors|resilience|resiliency)\b/i, emoji: "\u26A1", lucide: "zap", priority: 130, emojis: ["\u26A1", "\u{1F4C8}", "\u{1F6E1}\uFE0F"], lucides: ["zap", "activity", "flame", "shield"] },
  { rex: /\b(?:habit|habits|routine|routines|cue|cycle)\b/i, emoji: "\u{1F504}", lucide: "repeat", priority: 125, emojis: ["\u{1F504}", "\u{1F4C5}", "\u26A1"], lucides: ["repeat", "calendar-check", "activity", "target"] },
  { rex: /^(?:how\s*do\s*i|what\s*is|why\s*am\s*i|why\s*do|can\s*we|is\s*lyt)\b|\b(?:questions?|inquiry|inquiries|faq|curiosity)\b/i, emoji: "\u2753", lucide: "help-circle", priority: 125, emojis: ["\u2753", "\u{1F4A1}", "\u{1F9ED}"], lucides: ["help-circle", "lightbulb", "compass"] },
  { rex: /\b(?:dragon\s*(?:and|&)?\s*phoenix|phoenix|mythology|myth|legend)\b/i, emoji: "\u{1F409}", lucide: "dragon", priority: 125, emojis: ["\u{1F409}", "\u{1F525}", "\u2728"], lucides: ["dragon", "flame", "sparkles"] },
  { rex: /\b(?:earthquake|earthquakes|tsunami|disaster|hazard|avalanche)\b/i, emoji: "\u{1F30A}", lucide: "activity", priority: 125, emojis: ["\u{1F30A}", "\u26A0\uFE0F", "\u{1F4A8}"], lucides: ["activity", "alert-triangle", "wind"] },
  { rex: /\b(?:enso|ouroboros|eternity|infinity|cycle|cyclic)\b/i, emoji: "\u2B55", lucide: "circle-dot", priority: 125, emojis: ["\u2B55", "\u{1F504}", "\u2728"], lucides: ["circle-dot", "repeat", "sparkles"] },
  { rex: /\b(?:pkm|personal\s*knowledge|planet\s*survey|survey|questionnaire)\b/i, emoji: "\u{1FA90}", lucide: "globe", priority: 125, emojis: ["\u{1FA90}", "\u{1F4CA}", "\u{1F310}"], lucides: ["globe", "bar-chart-2", "compass"] },
  { rex: /\b(?:flow|flowcreation|in-the-flow|state-of-flow)\b/i, emoji: "\u{1F30A}", lucide: "activity", priority: 120, emojis: ["\u{1F30A}", "\u{1F4A8}", "\u26A1"], lucides: ["activity", "wind", "zap", "compass"] },
  { rex: /\b(?:practice|deliberate-practice|training|exercise|skills?)\b/i, emoji: "\u{1F3AF}", lucide: "target", priority: 120, emojis: ["\u{1F3AF}", "\u26A1", "\u{1F3CB}\uFE0F"], lucides: ["target", "activity", "award", "zap"] },
  { rex: /\b(?:effort|mastery|maestro|discipline|focus|concentration)\b/i, emoji: "\u26A1", lucide: "zap", priority: 120, emojis: ["\u26A1", "\u2728", "\u{1F3C6}"], lucides: ["zap", "sparkles", "award", "target"] },
  { rex: /\b(?:convergence|divergence|synthesis|emerge|emergence|complexity)\b/i, emoji: "\u{1F500}", lucide: "git-merge", priority: 120, emojis: ["\u{1F500}", "\u{1F578}\uFE0F", "\u2728"], lucides: ["git-merge", "git-branch", "share-2", "workflow"] },
  { rex: /\b(?:dimension|dimensions|reality|perspective|levels|scale)\b/i, emoji: "\u{1F4D0}", lucide: "maximize-2", priority: 120, emojis: ["\u{1F4D0}", "\u{1F500}", "\u{1F310}"], lucides: ["maximize-2", "scale", "compass", "layers"] },
  { rex: /\b(?:direction|compass|orientation|wayfinding|path)\b/i, emoji: "\u{1F9ED}", lucide: "compass", priority: 120, emojis: ["\u{1F9ED}", "\u{1F4CD}", "\u{1F5FA}\uFE0F"], lucides: ["compass", "chevrons-up-down", "map-pin", "route"] },
  { rex: /\b(?:theme|themes|styling|appearance|color-scheme)\b/i, emoji: "\u{1F3A8}", lucide: "palette", priority: 120, emojis: ["\u{1F3A8}", "\u2728", "\u{1F485}"], lucides: ["palette", "brush", "layout", "sparkles"] },
  { rex: /\b(?:defn|definitions?|terminology|glossary|concept|concepts)\b/i, emoji: "\u{1F4D6}", lucide: "book-open", priority: 120, emojis: ["\u{1F4D6}", "\u{1F4A1}", "\u{1F4DD}"], lucides: ["book-open", "file-text", "lightbulb", "quote"] },
  { rex: /\b(?:things?|objects?|entities|stuff|dots?)\b/i, emoji: "\u2B55", lucide: "circle-dot", priority: 85, emojis: ["\u2B55", "\u{1F4E6}", "\u2728"], lucides: ["circle-dot", "layers", "box", "package"] },
  { rex: /\b(?:journal|daily|diary|morning\s*pages|logbook)\b/i, emoji: "\u{1F4C5}", lucide: "calendar", priority: 120, emojis: ["\u{1F4C5}", "\u{1F4C6}", "\u{1F4DD}", "\u{1F4D4}"], lucides: ["calendar", "calendar-days", "book", "pencil"] },
  { rex: /\b(?:atlas|moc|map\s*of\s*contents?|index|directory|table-of-contents|toc)\b/i, emoji: "\u{1F5FA}\uFE0F", lucide: "map", priority: 120, lucides: ["map", "list-tree", "network"] },
  { rex: /\b(?:zettel|zettelkasten|slipbox|card-index|permanent\s*notes?|fleeting\s*notes?)\b/i, emoji: "\u{1F5C2}\uFE0F", lucide: "library", priority: 120, lucides: ["library", "layout-grid", "scroll-text"] },
  { rex: /\b(?:canvas|whiteboard|draw|excalidraw)\b/i, emoji: "\u{1F3A8}", lucide: "frame", priority: 120, lucides: ["frame", "shapes", "pencil-ruler"] },
  { rex: /\b(?:graph|graph-view|link|relation|node|network)\b/i, emoji: "\u{1F578}\uFE0F", lucide: "share-2", priority: 120, lucides: ["share-2", "git-branch", "workflow"] },
  { rex: /\b(?:plugin|plugins|extension|extensions|addon|addons|widget|widgets)\b/i, emoji: "\u{1F9E9}", lucide: "puzzle", priority: 120, emojis: ["\u{1F9E9}", "\u{1F50C}"], lucides: ["puzzle", "plugin", "simple-icons-wxt"] },
  // =========================================================================
  // 3. CORE CONTENT TYPES, READING, WRITING & WISDOM (Priority 115 - 105)
  // =========================================================================
  { rex: /\b(?:quote|quotes|saying|sayings|proverb|aphorism|wisdom|philosophy|reflection|mindset|lesson)\b/i, emoji: "\u{1F4AC}", lucide: "quote", priority: 115, emojis: ["\u{1F4AC}", "\u{1F4A1}", "\u2728"], lucides: ["quote", "sparkles", "lightbulb", "compass", "book-open", "brain"] },
  { rex: /\b(?:read|reading|books?|literature|library|novel|publications?|papers?|articles?)\b/i, emoji: "\u{1F4DA}", lucide: "book-open", priority: 110, emojis: ["\u{1F4DA}", "\u{1F4D6}", "\u{1F4DC}"], lucides: ["book-open", "book", "library"] },
  { rex: /\b(?:write|writing|author|story|stories|narrative|tale|prose|fiction|manuscript|screenplay|playwright)\b/i, emoji: "\u{1F4DC}", lucide: "pen-tool", priority: 110, emojis: ["\u{1F4DC}", "\u{1FAB6}", "\u{1F4D6}"], lucides: ["pen-tool", "book-open", "feather", "scroll", "file-text"] },
  { rex: /\b(?:templates?|boilerplate|preset|layout-template|blueprint)\b/i, emoji: "\u{1F4DD}", lucide: "layout-template", priority: 110, emojis: ["\u{1F4DD}", "\u{1F4CB}", "\u{1F4D0}"], lucides: ["layout-template", "copy", "ruler"] },
  { rex: /\b(?:archive|archived|archives|past|history|dump|backups?)\b/i, emoji: "\u{1F4E6}", lucide: "archive", priority: 105, emojis: ["\u{1F4E6}", "\u{1F5C4}\uFE0F"], lucides: ["archive", "box", "package"] },
  { rex: /\b(?:thesaurus|dictionary|vocabulary|definitions?|glossary)\b/i, emoji: "\u{1F4D6}", lucide: "book-open-check", priority: 105, emojis: ["\u{1F4D6}", "\u{1F4DA}", "\u{1F524}"], lucides: ["book-open-check", "spell-check", "languages"] },
  { rex: /\b(?:metadata|attribute|attributes|properties|property|tags?)\b/i, emoji: "\u{1F3F7}\uFE0F", lucide: "tags", priority: 105, emojis: ["\u{1F3F7}\uFE0F", "\u{1F516}", "\u{1F511}"], lucides: ["tags", "tag", "file-key"] },
  // =========================================================================
  // 4. TECH, PLATFORMS, BRANDS & DEV TOOLS (Priority 110 - 95)
  // =========================================================================
  { rex: /\b(?:twitter|x\.com|tweet|tweets)\b/i, emoji: "\u{1F426}", lucide: "simple-icons-twitter", priority: 110 },
  { rex: /\b(?:facebook)\b|\bfb\b/i, emoji: "\u{1F465}", lucide: "simple-icons-facebook", priority: 110 },
  { rex: /\b(?:instagram|insta)\b|\big\b/i, emoji: "\u{1F4F8}", lucide: "simple-icons-instagram", priority: 110 },
  { rex: /\b(?:youtube)\b|\byt\b/i, emoji: "\u{1F4FA}", lucide: "simple-icons-youtube", priority: 110 },
  { rex: /\b(?:discord)\b/i, emoji: "\u{1F4AC}", lucide: "simple-icons-discord", priority: 110 },
  { rex: /\b(?:reddit)\b/i, emoji: "\u{1F916}", lucide: "simple-icons-reddit", priority: 110 },
  { rex: /\b(?:whatsapp)\b|\bwa\b/i, emoji: "\u{1F4AC}", lucide: "simple-icons-whatsapp", priority: 110 },
  { rex: /\b(?:telegram)\b|\btg\b/i, emoji: "\u2708\uFE0F", lucide: "simple-icons-telegram", priority: 110 },
  { rex: /\b(?:slack)\b/i, emoji: "\u{1F4AC}", lucide: "simple-icons-slack", priority: 110 },
  { rex: /\b(?:github|gitlab|git)\b/i, emoji: "\u{1F419}", lucide: "simple-icons-github", priority: 110 },
  { rex: /\b(?:linkedin)\b/i, emoji: "\u{1F4BC}", lucide: "simple-icons-linkedin", priority: 110 },
  { rex: /\b(?:tiktok)\b/i, emoji: "\u{1F3B5}", lucide: "simple-icons-tiktok", priority: 110 },
  { rex: /\b(?:pinterest)\b|\bpin\b/i, emoji: "\u{1F4CC}", lucide: "simple-icons-pinterest", priority: 110 },
  { rex: /\b(?:snapchat)\b/i, emoji: "\u{1F47B}", lucide: "simple-icons-snapchat", priority: 110 },
  { rex: /\b(?:twitch)\b/i, emoji: "\u{1F3AE}", lucide: "simple-icons-twitch", priority: 110 },
  { rex: /\b(?:spotify)\b/i, emoji: "\u{1F3A7}", lucide: "simple-icons-spotify", priority: 110 },
  { rex: /\b(?:docker|k8s|kubernetes|containers?|pod|pods)\b/i, emoji: "\u{1F433}", lucide: "ship", priority: 105, lucides: ["ship", "container", "box"] },
  { rex: /\b(?:code|coding|dev|developer|script|scripts|programs?|programming|syntax|ast)\b/i, emoji: "\u{1F4BB}", lucide: "code", priority: 105, emojis: ["\u{1F4BB}", "\u{1F5A5}\uFE0F", "\u2328\uFE0F", "\u{1F468}\u200D\u{1F4BB}"], lucides: ["code", "terminal", "cpu", "laptop"] },
  { rex: /\b(?:server|servers|database|databases|infra|infrastructure|sql|nosql|postgres|mysql|redis|mongodb)\b/i, emoji: "\u{1F5A7}", lucide: "server", priority: 105, emojis: ["\u{1F5A7}", "\u{1F5A5}\uFE0F", "\u{1F5C4}\uFE0F"], lucides: ["server", "database", "hard-drive"] },
  { rex: /\b(?:terminal|bash|shell|zsh|cli|command-line|cmd)\b/i, emoji: "\u{1F41A}", lucide: "terminal", priority: 100 },
  { rex: /\b(?:ai|ml|machine-learning|deep-learning|neural-net|llm|gpt|model-weights|weights)\b/i, emoji: "\u{1F916}", lucide: "cpu", priority: 100 },
  { rex: /\b(?:aws|cloud|azure|gcp|lambda|serverless|s3-backup|terraform)\b/i, emoji: "\u2601\uFE0F", lucide: "cloud-lightning", priority: 100, lucides: ["cloud-lightning", "flame", "hard-drive"] },
  { rex: /\b(?:api|apis|json|yaml|xml|graphql|rest-api|webhook|endpoint)\b/i, emoji: "\u{1F50C}", lucide: "plug", priority: 100, lucides: ["plug", "webhook", "bracket"] },
  { rex: /\b(?:cybersecurity|hacker|exploit|firewall|pentest|security-audit)\b/i, emoji: "\u{1F575}\uFE0F", lucide: "shield-alert", priority: 95, lucides: ["shield-alert", "spy", "fingerprint"] },
  // =========================================================================
  // 5. PROFESSIONAL, WORK, FINANCE, LAW & HEALTH (Priority 100 - 90)
  // =========================================================================
  { rex: /\b(?:finance|financial|money|bank|banking|invoice|receipt|tax|taxes|wallet|currency|crypto|bitcoin|ethereum)\b/i, emoji: "\u{1F4B8}", lucide: "banknote", priority: 100, emojis: ["\u{1F4B8}", "\u{1F4B0}", "\u{1F4B3}"], lucides: ["banknote", "dollar-sign", "receipt", "wallet"] },
  { rex: /\b(?:law|legal|court|justice|contract|contracts|nda|agreement|agreements|clause)\b/i, emoji: "\u2696\uFE0F", lucide: "scale", priority: 100, lucides: ["scale", "gavel", "scroll"] },
  { rex: /\b(?:health|doctor|clinic|hospital|surgery|medical|stethoscope|blood-test|wellness)\b/i, emoji: "\u{1F3E5}", lucide: "stethoscope", priority: 100, lucides: ["stethoscope", "pill", "heart-pulse", "activity"] },
  { rex: /\b(?:school|study|studies|class|classes|course|courses|exam|exams|lecture|university|uni|academic)\b/i, emoji: "\u{1F393}", lucide: "graduation-cap", priority: 95 },
  { rex: /\b(?:project|projects|tasks?|todo|todos|roadmap|milestone|deliverable)\b/i, emoji: "\u{1F680}", lucide: "rocket", priority: 95, emojis: ["\u{1F680}", "\u{1F3AF}", "\u2705", "\u26A1"], lucides: ["rocket", "target", "check-circle", "zap"] },
  { rex: /\b(?:career|job|jobs|resume|cv|portfolio|work|workspace)\b/i, emoji: "\u{1F4BC}", lucide: "briefcase", priority: 95 },
  { rex: /\b(?:meeting|meetings|interview|interviews|zoom|teams|call|conference|conferences|summit|meetup)\b/i, emoji: "\u{1F91D}", lucide: "video", priority: 95, lucides: ["video", "presentation", "users", "phone-call"] },
  { rex: /\b(?:megaphone|megaphones|loudspeaker|broadcast|announcement|marketing)\b/i, emoji: "\u{1F4E3}", lucide: "megaphone", priority: 95, emojis: ["\u{1F4E3}", "\u{1F4E2}", "\u26A1"], lucides: ["megaphone", "volume-2", "radio"] },
  { rex: /\b(?:newsletter|newsletters|bulletin|press|digest|dispatch)\b/i, emoji: "\u{1F4F0}", lucide: "newspaper", priority: 95, emojis: ["\u{1F4F0}", "\u{1F4E7}", "\u{1F4DD}"], lucides: ["newspaper", "mail", "send"] },
  { rex: /\b(?:product|products|merchandise|goods|inventory)\b/i, emoji: "\u{1F4E6}", lucide: "package", priority: 95, emojis: ["\u{1F4E6}", "\u{1F6CD}\uFE0F", "\u{1F3F7}\uFE0F"], lucides: ["package", "box", "shopping-bag", "tag"] },
  { rex: /\b(?:workshop|workshops|seminar|masterclass|bootcamp|lab)\b/i, emoji: "\u{1F6E0}\uFE0F", lucide: "hammer", priority: 95, emojis: ["\u{1F6E0}\uFE0F", "\u{1F528}", "\u{1F393}"], lucides: ["hammer", "wrench", "presentation", "graduation-cap"] },
  { rex: /\b(?:life|lifestyle|living|wellness|vitality|daily-life)\b/i, emoji: "\u2764\uFE0F", lucide: "heart", priority: 95, emojis: ["\u2764\uFE0F", "\u{1F331}", "\u2728"], lucides: ["heart", "sun", "sparkles", "compass"] },
  { rex: /\b(?:data|analytics|statistics|metrics|stats|spreadsheet|sheets?|tables?)\b/i, emoji: "\u{1F4CA}", lucide: "bar-chart-2", priority: 95 },
  { rex: /\b(?:presentation|slides|keynote|pitch|deck)\b/i, emoji: "\u{1F4FD}\uFE0F", lucide: "presentation", priority: 90 },
  { rex: /\b(?:design|ui|ux|figma|sketch|mockup|wireframe|components?)\b/i, emoji: "\u2728", lucide: "layout", priority: 90, emojis: ["\u2728", "\u{1F3A8}", "\u{1F4D0}"], lucides: ["layout", "palette", "brush"] },
  // =========================================================================
  // 6. LIFESTYLE, MEDIA, HOBBIES & DOMAINS (Priority 90 - 80)
  // =========================================================================
  { rex: /\b(?:music|audio|song|songs|playlist|soundtrack|melody|track)\b/i, emoji: "\u{1F3B5}", lucide: "music", priority: 90, emojis: ["\u{1F3B5}", "\u{1F3B6}", "\u{1F3A7}"], lucides: ["music", "headphones", "mic"] },
  { rex: /\b(?:video|videos|movie|movies|film|films|cinema|stream|streaming)\b/i, emoji: "\u{1F3AC}", lucide: "clapperboard", priority: 90, emojis: ["\u{1F3AC}", "\u{1F37F}", "\u{1F4FA}"], lucides: ["clapperboard", "video", "film"] },
  { rex: /\b(?:photos?|images?|pics?|gallery|album|photography|camera)\b/i, emoji: "\u{1F5BC}\uFE0F", lucide: "image", priority: 90, emojis: ["\u{1F5BC}\uFE0F", "\u{1F4F7}", "\u{1F4F8}", "\u{1F3A8}"], lucides: ["image", "camera", "aperture", "palette"] },
  { rex: /\b(?:cook|cooking|recipe|recipes|baking|kitchen|meal|meals|diet|bake)\b/i, emoji: "\u{1F373}", lucide: "utensils", priority: 90, emojis: ["\u{1F373}", "\u{1F37D}\uFE0F", "\u{1F372}", "\u{1F355}"], lucides: ["utensils", "chef-hat", "soup"] },
  { rex: /\b(?:shopping|cart|store|shop|buy|checkout|purchases?|order|orders)\b/i, emoji: "\u{1F6D2}", lucide: "shopping-cart", priority: 90, emojis: ["\u{1F6D2}", "\u{1F6CD}\uFE0F", "\u{1F4E6}"], lucides: ["shopping-cart", "shopping-bag", "tag"] },
  { rex: /\b(?:fitness|workout|gym|exercise|running|marathon|lift|lifting)\b/i, emoji: "\u{1F3C3}", lucide: "dumbbell", priority: 85, emojis: ["\u{1F3C3}", "\u{1F3CB}\uFE0F", "\u{1F6B4}"], lucides: ["dumbbell", "activity", "heart"] },
  { rex: /\b(?:travel|travels|vacation|flight|trip|trips|itinerary|journey|voyage)\b/i, emoji: "\u2708\uFE0F", lucide: "plane", priority: 85, emojis: ["\u2708\uFE0F", "\u{1F9ED}", "\u{1F5FA}\uFE0F"], lucides: ["plane", "compass", "map-pin"] },
  { rex: /\b(?:games?|gaming|gameplay|steam|console|gamer)\b/i, emoji: "\u{1F3AE}", lucide: "gamepad-2", priority: 85, emojis: ["\u{1F3AE}", "\u{1F579}\uFE0F", "\u{1F3B2}"], lucides: ["gamepad-2", "dices", "sword"] },
  { rex: /\b(?:people|contacts?|friends?|family|team|members)\b/i, emoji: "\u{1F465}", lucide: "users", priority: 85 },
  { rex: /\b(?:pets?|dogs?|cats?|puppy|kitten|animals?|veterinary)\b/i, emoji: "\u{1F43E}", lucide: "dog", priority: 85, emojis: ["\u{1F43E}", "\u{1F415}", "\u{1F408}"], lucides: ["dog", "cat", "paw-print"] },
  { rex: /\b(?:nature|forest|plants?|gardens?|trees?|eco|botany)\b/i, emoji: "\u{1F331}", lucide: "leaf", priority: 85, emojis: ["\u{1F331}", "\u{1F33B}", "\u{1F333}"], lucides: ["leaf", "tree-pine", "flower-2"] },
  { rex: /\b(?:transport|transportation|vehicle|vehicles|car|cars|automobile|bike|bicycle|bus|subway|railway|locomotive|commute)\b/i, emoji: "\u{1F697}", lucide: "car", priority: 80, lucides: ["car", "bus", "bike"] },
  // =========================================================================
  // 7. SYSTEM UTILITIES, FILES & SETTINGS (Priority 80 - 70)
  // =========================================================================
  { rex: /\b(?:settings?|config|configuration|preferences|options|setup)\b/i, emoji: "\u2699\uFE0F", lucide: "settings", priority: 80 },
  { rex: /\b(?:security|auth|authentication|passwords?|keys?|vault|locks?)\b/i, emoji: "\u{1F512}", lucide: "lock", priority: 80, emojis: ["\u{1F512}", "\u{1F511}"], lucides: ["lock", "key", "shield"] },
  { rex: /\b(?:search|query|find|explore|lookup)\b/i, emoji: "\u{1F50D}", lucide: "search", priority: 80 },
  { rex: /\b(?:mail|letter|letters|messages?|email|inbox)\b/i, emoji: "\u{1F4E7}", lucide: "mail", priority: 80 },
  { rex: /\b(?:document|documents|report|reports|pdf|ebook|text)\b/i, emoji: "\u{1F4C4}", lucide: "file-text", priority: 75, emojis: ["\u{1F4C4}", "\u{1F4D5}"], lucides: ["file-text", "file", "scroll"] },
  { rex: /\b(?:alert|alerts|warning|warnings|error|errors|bugs?|issues?)\b/i, emoji: "\u26A0\uFE0F", lucide: "alert-triangle", priority: 75 },
  { rex: /\b(?:trash|delete|deleted|remove|bin|recycle-bin)\b/i, emoji: "\u{1F5D1}\uFE0F", lucide: "trash", priority: 70 }
];

// src/common/LRUCache.ts
var LRUCache = class {
  capacity;
  map;
  constructor(capacity) {
    this.capacity = capacity;
    this.map = /* @__PURE__ */ new Map();
  }
  get(key) {
    const val = this.map.get(key);
    if (val === void 0) return void 0;
    this.map.delete(key);
    this.map.set(key, val);
    return val;
  }
  set(key, value) {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.capacity) {
      const firstKey = this.map.keys().next().value;
      if (firstKey !== void 0) {
        this.map.delete(firstKey);
      }
    }
    this.map.set(key, value);
  }
  has(key) {
    return this.map.has(key);
  }
  delete(key) {
    return this.map.delete(key);
  }
  clear() {
    this.map.clear();
  }
  keys() {
    return this.map.keys();
  }
  get size() {
    return this.map.size;
  }
};

// src/integrations/embedingmodel.ts
var MAX_CACHE_SIZE = 2048;
var DEFAULT_TOP_K = 3;
var DEFAULT_MIN_SCORE = 0.25;
var THREE_GRAM_MIN_LENGTH = 5;
var THREE_GRAM_MAX_LENGTH = 16;
var FILE_EXTENSION_DOMAINS = {
  ".py": ["python", "code", "terminal"],
  ".js": ["javascript", "code", "terminal"],
  ".ts": ["typescript", "code", "terminal"],
  ".jsx": ["react", "code", "layout"],
  ".tsx": ["react", "code", "layout"],
  ".java": ["java", "code", "terminal"],
  ".cpp": ["code", "terminal", "cpu"],
  ".c": ["code", "terminal", "cpu"],
  ".go": ["go", "code", "server"],
  ".rs": ["rust", "code", "terminal"],
  ".rb": ["ruby", "code", "terminal"],
  ".php": ["php", "code", "server"],
  ".swift": ["swift", "code", "terminal"],
  ".kt": ["kotlin", "code", "terminal"],
  ".sql": ["database", "server", "code"],
  ".json": ["braces", "code", "database"],
  ".yaml": ["file-text", "code", "database"],
  ".yml": ["file-text", "code", "database"],
  ".toml": ["file-text", "code", "database"],
  ".xml": ["file-text", "code", "database"],
  ".html": ["layout", "code", "monitor"],
  ".css": ["palette", "code", "layout"],
  ".scss": ["palette", "code", "layout"],
  ".md": ["file-text", "pen-tool", "notebook"],
  ".txt": ["file-text", "notebook"],
  ".pdf": ["file-text", "book-open"],
  ".docx": ["file-text", "notebook"],
  ".png": ["image", "photo", "layout"],
  ".jpg": ["image", "photo", "layout"],
  ".jpeg": ["image", "photo", "layout"],
  ".gif": ["image", "film", "layout"],
  ".svg": ["image", "layout", "pen-tool"],
  ".mp3": ["music", "headphones", "audio"],
  ".wav": ["music", "headphones", "audio"],
  ".mp4": ["video", "film", "camera"],
  ".mov": ["video", "film", "camera"],
  ".zip": ["archive", "package", "box"],
  ".tar": ["archive", "package", "box"],
  ".gz": ["archive", "package", "box"],
  ".env": ["lock", "key", "shield-check"],
  ".gitignore": ["git-branch", "code", "terminal"],
  ".dockerfile": ["docker", "server", "box"]
};
var FOLDER_HINT_DOMAINS = {
  "quotes": ["quote", "sparkles", "book-open"],
  "quote": ["quote", "sparkles", "book-open"],
  "statements": ["quote", "lightbulb", "brain"],
  "statement": ["quote", "lightbulb", "brain"],
  "questions": ["help-circle", "lightbulb", "compass"],
  "question": ["help-circle", "lightbulb", "compass"],
  "people": ["users", "user", "contact"],
  "dots": ["circle-dot", "layers", "sparkles"],
  "things": ["circle-dot", "layers", "sparkles"],
  "thing": ["circle-dot", "layers", "sparkles"],
  "sources": ["book-open", "bookmark", "library"],
  "books": ["book-open", "book", "library"],
  "book": ["book-open", "book", "library"],
  "movies": ["film", "video", "tv"],
  "movie": ["film", "video", "tv"],
  "films": ["film", "video", "tv"],
  "film": ["film", "video", "tv"],
  "games": ["gamepad-2", "sword", "trophy"],
  "game": ["gamepad-2", "sword", "trophy"],
  "podcasts": ["mic", "headphones", "radio"],
  "podcast": ["mic", "headphones", "radio"],
  "articles": ["file-text", "newspaper", "pen-tool"],
  "article": ["file-text", "newspaper", "pen-tool"],
  "papers": ["file-text", "book-open", "bookmark"],
  "paper": ["file-text", "book-open", "bookmark"],
  "tv": ["tv", "film", "video"],
  "songs": ["music", "disc", "headphones"],
  "song": ["music", "disc", "headphones"],
  "works": ["folder-kanban", "layers", "briefcase"],
  "work": ["folder-kanban", "layers", "briefcase"],
  "clippings": ["scissors", "bookmark", "newspaper"],
  "cards": ["credit-card", "layers", "layout"],
  "maps": ["map", "compass", "list-tree"],
  "atlas": ["map", "globe", "compass"],
  "calendar": ["calendar", "clock", "calendar-days"],
  "daily": ["calendar", "sun", "book-open"],
  "days": ["calendar", "sun", "clock"],
  "day": ["calendar", "sun", "clock"],
  "prompts": ["terminal", "lightbulb", "sparkles"],
  "habits": ["repeat", "flame", "calendar-check"],
  "fitness": ["dumbbell", "heart-pulse", "activity"],
  "recipes": ["utensils", "coffee", "cake"],
  "finance": ["dollar-sign", "wallet", "receipt"],
  "taxes": ["dollar-sign", "receipt", "file-text"],
  "tax": ["dollar-sign", "receipt", "file-text"],
  "areas": ["layout-grid", "layers", "compass"],
  "area": ["layout-grid", "layers", "compass"],
  "efforts": ["zap", "target", "folder-kanban"],
  "effort": ["zap", "target", "folder-kanban"],
  "household": ["home", "heart", "users"],
  "newsletters": ["mail", "newspaper", "send"],
  "newsletter": ["mail", "newspaper", "send"],
  "workshops": ["users", "briefcase", "presentation"],
  "workshop": ["users", "briefcase", "presentation"],
  "conferences": ["users", "mic", "globe"],
  "conference": ["users", "mic", "globe"],
  "entertainment": ["palette", "film", "music"],
  "inbox": ["inbox", "plus-circle", "sparkles"],
  "+": ["inbox", "plus-circle", "sparkles"],
  "projects": ["folder-kanban", "layers", "briefcase"],
  "notes": ["notebook", "folder", "file-text"],
  "documents": ["folder", "file-text", "book-open"],
  "images": ["image", "folder", "photo"],
  "videos": ["video", "folder", "film"],
  "music": ["music", "folder", "headphones"],
  "downloads": ["download", "folder", "package"],
  "archives": ["archive", "folder", "package"],
  "src": ["code", "folder", "terminal"],
  "source": ["code", "folder", "terminal"],
  "lib": ["code", "folder", "terminal"],
  "components": ["layout", "code", "folder"],
  "pages": ["layout", "code", "folder"],
  "styles": ["palette", "code", "folder"],
  "assets": ["folder", "image", "layers"],
  "public": ["globe", "folder", "server"],
  "tests": ["check-square", "code", "folder"],
  "config": ["settings", "code", "folder"],
  "scripts": ["terminal", "code", "folder"],
  "docs": ["book-open", "folder", "file-text"],
  "templates": ["layout", "folder", "file-text"],
  "resources": ["package", "folder", "box"],
  "resource": ["package", "folder", "box"],
  "reviews": ["search", "calendar", "check-square"],
  "review": ["search", "calendar", "check-square"],
  "records": ["calendar", "clock", "archive"],
  "record": ["calendar", "clock", "archive"],
  "meetings": ["calendar", "clock", "users"],
  "meeting": ["calendar", "clock", "users"],
  "ideas": ["lightbulb", "brain", "sparkles"],
  "idea": ["lightbulb", "brain", "sparkles"],
  "data": ["database", "server", "folder"],
  "backend": ["server", "folder", "code"],
  "frontend": ["layout", "folder", "code"],
  "api": ["webhook", "server", "folder"],
  "utils": ["wrench", "code", "folder"],
  "helpers": ["wrench", "code", "folder"],
  "models": ["database", "code", "folder"],
  "views": ["layout", "folder", "monitor"],
  "controllers": ["server", "code", "folder"],
  "routes": ["navigation", "code", "folder"],
  "middleware": ["server", "code", "gear"],
  "migrations": ["database", "code", "folder"],
  "seeds": ["database", "code", "folder"],
  "logs": ["file-text", "clock", "folder"],
  "build": ["box", "code", "folder"],
  "dist": ["package", "box", "folder"],
  "node_modules": ["package", "box", "folder"],
  "venv": ["box", "python", "folder"],
  "obsidian": ["settings", "folder", "code"]
};
function cleanSemanticTitle(title) {
  if (!title) return "";
  return title.replace(/^\d{4}[-_.]\d{2}[-_.]\d{2}[-_.]?/, "").replace(/^\d{2}[-_.]\d{2}[-_.]\d{4}[-_.]?/, "").replace(/^v?\d+([._-]\d+)*[\s._-]+/i, "").replace(/\.(md|png|svg|txt|json|py|js|ts|jsx|tsx|java|cpp|c|go|rs|rb|php|swift|kt|sql|yaml|yml|toml|xml|html|css|scss|pdf|docx|mp3|wav|mp4|mov|zip|tar|gz|env|canvas)$/i, "").replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").replace(/[\s._-]+/g, " ").trim();
}
var ICON_SYNONYMS = {
  "trash-2": ["delete", "remove", "bin", "garbage", "rubbish", "discard", "cleanup", "purge", "clear", "erase", "junk", "recycle-bin", "destroy"],
  "trash": ["delete", "remove", "bin", "garbage", "rubbish", "discard", "cleanup", "purge", "clear", "erase", "junk", "recycle-bin"],
  "database": ["sql", "database", "postgres", "mysql", "sqlite", "mongodb", "redis", "storage", "data", "schema", "query", "records", "tables", "db", "dataset", "orm", "migrations"],
  "shield-check": ["security", "protection", "privacy", "auth", "authentication", "firewall", "safe", "guard", "defense", "secure", "verified", "antivirus", "shield", "permission"],
  "shield": ["security", "protection", "privacy", "auth", "authentication", "firewall", "safe", "guard", "defense", "secure"],
  "lock": ["password", "credentials", "secrets", "vault", "private", "tokens", "keys", "encryption", "confidential", "secure", "protect", "restricted"],
  "key": ["password", "credentials", "access", "token", "apikey", "key", "license", "secret", "auth", "unlock"],
  "wrench": ["config", "settings", "configuration", "setup", "tools", "repair", "maintenance", "options", "preferences", "tweaks", "service", "util", "utilities"],
  "settings": ["config", "settings", "configuration", "setup", "options", "preferences", "system", "admin", "properties"],
  "zap": ["speed", "fast", "quick", "energy", "power", "lightning", "electricity", "charge", "performance", "boost", "turbo", "instant", "flash", "action"],
  "flame": ["hot", "fire", "burn", "streak", "trending", "passion", "popular", "energy", "vitality", "warmth"],
  "utensils": ["food", "cooking", "recipe", "meal", "dinner", "lunch", "breakfast", "diet", "nutrition", "kitchen", "restaurant", "cafe", "baking", "culinary", "dish", "cook"],
  "coffee": ["coffee", "tea", "cafe", "break", "morning", "espresso", "drink", "beverage", "caffeine", "mug"],
  "dollar-sign": ["finance", "money", "budget", "expense", "income", "salary", "payment", "billing", "invoice", "currency", "cash", "crypto", "investment", "stocks", "trading", "banking", "revenue", "tax", "profit", "cost"],
  "banknote": ["money", "cash", "finance", "payment", "salary", "currency", "funds", "wealth"],
  "wallet": ["money", "crypto", "wallet", "finances", "payment", "savings", "budget", "assets"],
  "credit-card": ["payment", "billing", "checkout", "card", "subscription", "transaction", "visa", "mastercard", "purchase"],
  "receipt": ["receipt", "invoice", "bill", "expense", "proof", "transaction", "statement", "accounting"],
  "heart-pulse": ["health", "fitness", "workout", "exercise", "gym", "medical", "cardio", "doctor", "hospital", "medicine", "wellness", "body", "training", "pulse", "vital", "heart", "healthcare"],
  "activity": ["activity", "fitness", "workout", "analytics", "performance", "metrics", "stats", "pulse", "monitoring"],
  "stethoscope": ["medical", "doctor", "clinic", "health", "hospital", "medicine", "checkup", "physician"],
  "dumbbell": ["gym", "fitness", "workout", "exercise", "weightlifting", "bodybuilding", "strength", "training", "muscles"],
  "graduation-cap": ["education", "study", "school", "university", "college", "course", "degree", "learning", "lesson", "lecture", "student", "exam", "academy", "homework", "tutorial", "diploma", "academic", "syllabus", "session", "semester", "curriculum", "high-school", "ucla"],
  "book-open": ["reading", "books", "book", "literature", "library", "documentation", "notes", "novel", "study", "research", "guide", "manual", "reference"],
  "book": ["book", "reading", "novel", "manual", "handbook", "guide", "textbook"],
  "palette": ["design", "art", "color", "theme", "ui", "ux", "drawing", "illustration", "graphic", "visual", "creative", "paint", "sketch", "styling"],
  "brush": ["art", "paint", "painting", "drawing", "creative", "brush", "artwork", "canvas", "illustration"],
  "camera": ["photo", "photography", "pictures", "gallery", "camera", "snapshots", "wallpaper", "media", "shots", "capture"],
  "image": ["picture", "photo", "graphic", "wallpaper", "screenshot", "artwork", "banner", "illustration"],
  "video": ["movie", "film", "video", "youtube", "stream", "recording", "cinema", "clip", "broadcast", "vlog", "footage"],
  "film": ["movie", "cinema", "film", "video", "production", "theatre", "show"],
  "music": ["audio", "music", "song", "sound", "podcast", "playlist", "track", "album", "tune", "melody", "headphones", "radio", "beats", "spotify"],
  "headphones": ["music", "audio", "podcast", "listening", "sound", "earphones", "beats"],
  "mic": ["podcast", "recording", "audio", "voice", "interview", "microphone", "speech", "talk"],
  "compass": ["travel", "trip", "journey", "navigation", "direction", "vacation", "destination", "location", "tour", "explore", "adventure", "route", "philosophy", "guidance", "vision"],
  "map-pin": ["location", "place", "address", "destination", "spot", "venue", "coordinates", "pin", "geo", "travel"],
  "plane": ["flight", "travel", "trip", "vacation", "airport", "holiday", "voyage", "flying", "tourism", "itinerary", "paris", "flight-ticket"],
  "calendar": ["schedule", "meeting", "events", "appointment", "timeline", "agenda", "deadline", "reminder", "time", "date", "planning", "daily", "weekly", "monthly"],
  "clock": ["time", "timer", "history", "deadline", "schedule", "clock", "duration", "stopwatch", "hours", "minutes", "tracking"],
  "check-square": ["tasks", "todo", "checklist", "goals", "milestone", "action-items", "progress", "tracker", "objectives", "done", "completed"],
  "target": ["goals", "milestone", "target", "objective", "aim", "focus", "accuracy", "strategy", "kpi", "okr"],
  "git-branch": ["github", "git", "version-control", "branch", "repository", "commit", "pr", "pull-request", "merge", "repo"],
  "terminal": ["terminal", "console", "bash", "command-line", "cli", "shell", "scripts", "powershell", "zsh", "exec"],
  "code": ["code", "programming", "developer", "software", "source", "script", "algorithm", "syntax", "function"],
  "cpu": ["hardware", "processor", "chip", "cpu", "computer", "system", "performance", "benchmark", "tech", "device", "deeplearning", "neuralnet", "ai", "ml", "weights"],
  "server": ["server", "backend", "hosting", "infrastructure", "node", "cluster", "deployment", "sysadmin", "api"],
  "cloud": ["cloud", "aws", "azure", "gcp", "hosting", "storage", "backup", "network", "online", "sync"],
  "mail": ["email", "newsletter", "inbox", "messages", "contact", "communication", "letters", "outbox", "correspondence", "mail"],
  "send": ["send", "submit", "dispatch", "forward", "outbox", "publish", "deliver"],
  "message-square": ["chat", "conversation", "discussion", "comments", "feedback", "messages", "talk", "forum", "community"],
  "brain": ["ideas", "thoughts", "concept", "thinking", "mindset", "philosophy", "innovation", "brainstorm", "wisdom", "reflection", "insights", "psychology", "iq", "mental", "ai", "intellect"],
  "lightbulb": ["idea", "tips", "insight", "creativity", "invention", "solution", "inspiration", "eureka", "bright", "trick"],
  "sparkles": ["magic", "ai", "generative", "special", "clean", "awesome", "shine", "glow", "wonder", "glamour", "new", "meditation", "zen", "mindfulness", "spark", "sparks", "ideaverse", "callout", "callouts"],
  "file-text": ["notes", "documentation", "article", "docs", "readme", "changelog", "paper", "summary", "report", "draft", "memo", "manuscript", "content"],
  "pen-tool": ["writing", "author", "authoring", "blog", "draft", "story", "novel", "literature", "pen", "vector", "compose", "essay"],
  "scale": ["legal", "law", "contract", "agreement", "terms", "policy", "compliance", "court", "justice", "rules", "regulations", "lawyer", "attorney", "nda"],
  "gavel": ["court", "judge", "legal", "law", "verdict", "ruling", "auction", "bidding"],
  "microscope": ["science", "research", "lab", "biology", "chemistry", "physics", "experiment", "scientific", "analysis", "hypothesis", "investigation"],
  "flask-conical": ["chemistry", "experiment", "formula", "lab", "science", "potion", "reaction", "test"],
  "leaf": ["nature", "plants", "garden", "ecology", "environment", "trees", "flowers", "green", "agriculture", "botany", "organic", "sustainability"],
  "tree-pine": ["nature", "forest", "trees", "woods", "environment", "camping", "outdoor", "park"],
  "sun": ["weather", "summer", "day", "light", "morning", "bright", "sunny", "energy", "solar", "warm"],
  "moon": ["night", "dark", "evening", "sleep", "dream", "lunar", "nocturnal", "astronomy"],
  "gamepad-2": ["gaming", "games", "game", "rpg", "playstation", "xbox", "nintendo", "steam", "quest", "arcade", "achievement", "esports", "videogames"],
  "sword": ["combat", "rpg", "war", "attack", "weapon", "fight", "strategy", "defense", "adventure"],
  "trophy": ["reward", "winner", "achievement", "championship", "contest", "award", "victory", "gold", "medal", "rank"],
  "users": ["people", "team", "family", "friends", "contacts", "community", "clients", "members", "profile", "colleagues", "staff", "group", "audience", "workshop", "workshops", "conference", "conferences"],
  "user": ["profile", "account", "person", "individual", "avatar", "identity", "bio", "resume", "cv"],
  "shopping-cart": ["shopping", "cart", "buy", "purchases", "orders", "ecommerce", "products", "market", "checkout", "storefront"],
  "shopping-bag": ["shopping", "bag", "boutique", "merchandise", "retail", "fashion", "goods"],
  "package": ["package", "box", "delivery", "shipping", "cargo", "product", "parcel", "supplies", "inventory"],
  "bell": ["notification", "alerts", "warnings", "notices", "urgent", "important", "announcements", "alarms", "subscribe"],
  "bookmark": ["bookmark", "save", "saved", "favorites", "reading-list", "reference", "pinned"],
  "star": ["star", "featured", "important", "favorite", "rating", "vip", "premium", "best", "highlight"],
  "folder-kanban": ["project", "kanban", "sprint", "board", "scrum", "agile", "workflow", "management", "roadmap", "tracker"],
  "repeat": ["habit", "routines", "repeat", "loop", "cycle", "recurring", "daily-habit", "frequency", "practice", "refresh"],
  "quote": ["quotes", "sayings", "proverbs", "citation", "wisdom", "motto", "statement", "aphorism"],
  "yin-yang": ["yin", "yang", "yin-yang", "yinyang", "taoism", "daoism", "balance", "dualism", "harmony", "zen", "opposite", "contrast"],
  "layout": ["layout", "ui", "ux", "frontend", "components", "interface", "template", "wireframe", "view", "grid", "drag-drop"],
  "help-circle": ["question", "questions", "faq", "help", "ask", "inquiry", "curiosity", "mystery", "unknown", "how-to"],
  "inbox": ["inbox", "capture", "incoming", "collect", "plus", "add", "new-item"],
  "circle-dot": ["circle", "dot", "dots", "enso", "ouroboros", "infinity", "cycle", "atomic", "core"],
  "home": ["home", "house", "home-base", "dashboard", "hub", "home-pro", "start"]
};
var HIGH_PRIORITY_CATEGORIES = AUTO_ICON_CATEGORIES.filter((cat) => (cat.priority || 0) >= 110);
var EmbeddingModel = class _EmbeddingModel {
  plugin;
  iconVectors = /* @__PURE__ */ new Map();
  cleanIconIdMap = /* @__PURE__ */ new Map();
  synonymExactMap = /* @__PURE__ */ new Map();
  vectorNorms = /* @__PURE__ */ new Map();
  isInitialized = false;
  queryCache = new LRUCache(MAX_CACHE_SIZE);
  cacheHitCount = 0;
  cacheMissCount = 0;
  conceptDenseVectors = /* @__PURE__ */ new Map();
  invertedIndex = /* @__PURE__ */ new Map();
  static DENSE_CONCEPTS = {
    quotes_wisdom: { prompt: "quotes sayings proverbs wisdom philosophy reflection mindset life lessons truth illusion quote-text sentence", icons: ["quote", "sparkles", "lightbulb", "compass", "brain", "book-open"] },
    stories_writing: { prompt: "story narrative writing literature fiction author legend prose feather scroll pen untold agony", icons: ["pen-tool", "book-open", "feather", "scroll", "file-text"] },
    journey_voyage: { prompt: "journey wander voyage path travel step miles destination compass footprints map road", icons: ["compass", "map-pin", "map", "route", "plane"] },
    imagination_vision: { prompt: "imagination vision future dream idea wonder preview attraction spark magic illusion mind", icons: ["sparkles", "lightbulb", "brain", "wand-2", "star", "eye"] },
    emotions_heart: { prompt: "emotion feeling heart agony soul passion cherish love mood upset romance relationship", icons: ["heart", "sparkles", "smile", "activity"] },
    coding_development: { prompt: "software development code programming terminal developer git scripts syntax algorithms", icons: ["code", "terminal", "cpu", "file-code", "git-branch"] },
    finance_money: { prompt: "finance money banking accounting bills expenses budget receipt tax currency revenue profit wallet investment stocks", icons: ["banknote", "dollar-sign", "coins", "receipt", "credit-card", "wallet"] },
    crypto_trading: { prompt: "cryptocurrency bitcoin ethereum crypto blockchain trading tokens wallet exchange ledger", icons: ["coins", "wallet", "trending-up", "dollar-sign"] },
    meetings_calendar: { prompt: "meetings calendar schedule appointments agenda zoom call clock events timeline deadlines", icons: ["calendar", "clock", "users", "video", "calendar-days"] },
    reading_literature: { prompt: "reading books literature research papers articles library documentation notes publication review", icons: ["book-open", "book", "library", "newspaper", "file-text"] },
    tasks_project: { prompt: "tasks todo checklist goals projects kanban sprint agile action work tracking milestone roadmap", icons: ["check-square", "target", "folder-kanban", "flag", "list-todo"] },
    design_uiux: { prompt: "design graphic UI UX mockup palette Figma vector drawing art layout typography wireframe", icons: ["layout", "palette", "pen-tool", "brush", "image"] },
    music_audio: { prompt: "music audio sound song playlist headphones podcast recording radio album track melody", icons: ["music", "headphones", "mic", "disc", "radio"] },
    video_cinema: { prompt: "video movie film Youtube camera streaming video recording clapperboard cinema broadcast", icons: ["video", "film", "play-circle", "camera", "clapperboard"] },
    photography_media: { prompt: "photography camera photo portrait snapshot gallery pictures landscape shutter", icons: ["camera", "image", "eye", "film"] },
    health_medical: { prompt: "health medical doctor hospital stethoscope checkup clinic pharmacy prescription disease wellness", icons: ["activity", "stethoscope", "heart-pulse", "shield-check"] },
    fitness_workout: { prompt: "fitness workout exercise gym dumbbell weightlifting cardio training bodybuilding muscles", icons: ["dumbbell", "activity", "heart-pulse", "flame"] },
    travel_vacation: { prompt: "travel trip vacation flight plane map navigation compass location explorer tourism hotel itinerary", icons: ["plane", "compass", "map-pin", "globe", "map"] },
    gaming_esports: { prompt: "gaming video games console play steam gamepad trophy sword quest arcade rpg esports", icons: ["gamepad-2", "dices", "trophy", "sword"] },
    security_privacy: { prompt: "security passwords privacy authentication lock key shield firewall antivirus credentials token", icons: ["shield-check", "lock", "key", "eye-off"] },
    people_team: { prompt: "people contacts family friends team user profile employee contacts group network community", icons: ["users", "user", "contact", "id-card", "folder-users"] },
    shopping_ecommerce: { prompt: "shopping cart store buy order product package store market retail ecommerce checkout", icons: ["shopping-cart", "shopping-bag", "package", "store"] },
    food_cooking: { prompt: "food cooking recipe culinary meal dinner lunch breakfast kitchen restaurant baking nutrition chef", icons: ["utensils", "coffee", "apple", "flame"] },
    coffee_beverages: { prompt: "coffee tea cafe drinks beverage espresso morning break barista mug caffeine", icons: ["coffee", "utensils", "sun"] },
    law_legal: { prompt: "law legal court justice contract agreement scale gavel scroll compliance lawyer policy", icons: ["scale", "gavel", "scroll", "file-text"] },
    science_physics: { prompt: "science laboratory research chemistry biology experiment microscope flask physics quantum hypothesis", icons: ["flask-conical", "microscope", "atom"] },
    nature_environment: { prompt: "nature environment plant garden tree flower leaf eco climate ecology organic botany", icons: ["leaf", "flower-2", "tree-pine", "sun"] },
    space_astronomy: { prompt: "space astronomy stars universe galaxy telescope moon rocket cosmos planets astronaut", icons: ["telescope", "rocket", "moon", "star"] },
    hardware_iot: { prompt: "hardware computer PC CPU hard drive memory components server infrastructure electronics raspberry", icons: ["cpu", "server", "hard-drive", "database"] },
    education_learning: { prompt: "school study university course exam graduation lecture class student homework tutorial degree", icons: ["graduation-cap", "book", "school", "book-open"] },
    pets_animals: { prompt: "pets animal dog cat vet paw print puppy kitten wildlife fauna", icons: ["dog", "cat", "paw-print"] },
    psychology_mental: { prompt: "psychology mindset therapy mental health cognition consciousness emotions introspection", icons: ["brain", "sparkles", "heart", "lightbulb"] },
    devops_cloud: { prompt: "devops docker kubernetes terraform aws azure cloud container serverless ci cd deploy infrastructure", icons: ["cloud", "server", "terminal", "box"] },
    database_storage: { prompt: "database sql postgres mysql sqlite mongodb redis schema tables records query data warehouse", icons: ["database", "server", "hard-drive", "layers"] },
    ai_machinelearning: { prompt: "artificial intelligence machine learning deep learning neural network llm gpt model nlp data science", icons: ["sparkles", "brain", "cpu", "wand-2"] },
    architecture_realestate: { prompt: "architecture building house home property real estate construction floorplan interior blueprint", icons: ["home", "layout", "building", "layers"] },
    tools_maintenance: { prompt: "tools utility wrench repair configuration setup maintenance settings preferences fix troubleshoot", icons: ["wrench", "settings", "hammer", "tool"] },
    communication_email: { prompt: "email newsletter inbox messages letters correspondence dispatch mail outbox chat", icons: ["mail", "send", "message-square", "inbox"] },
    social_community: { prompt: "social media twitter community network followers audience engagement sharing connection", icons: ["users", "share-2", "message-circle", "globe"] },
    news_journalism: { prompt: "news journalism headlines press newspaper report breaking media broadcaster scoop", icons: ["newspaper", "file-text", "globe", "radio"] },
    spirituality_meditation: { prompt: "spirituality meditation mindfulness zen yoga peace soul prayer chakra temple tranquility", icons: ["sparkles", "sun", "moon", "leaf"] },
    wu_wei_daoism: { prompt: "wu wei daoism effortless action flow balance nature philosophy wisdom taoism", icons: ["sparkles", "compass", "wind", "leaf"] },
    yin_yang_balance: { prompt: "yin and yang dualism balance harmony scale contrast circle sun moon taoism daoism", icons: ["yin-yang", "sun-moon", "circle-dot", "scale"] },
    vulnerability_openness: { prompt: "vulnerability vulnerable open heart self reflection emotional courage soul", icons: ["heart", "shield-off", "unlock", "eye"] },
    trust_the_process: { prompt: "trust the process growth patience journey continuous progress footprints trending", icons: ["compass", "trending-up", "hourglass", "footprints"] },
    use_it_or_lose_it: { prompt: "use it or lose it maintenance activity practice flame repeat cycle", icons: ["repeat", "flame", "activity", "zap"] },
    habits_routines: { prompt: "important habits habit routine daily tracker repeat words used practice morning routine streak", icons: ["repeat", "calendar-check", "activity", "target"] }
  };
  static BRAND_DICTIONARY = {
    amazon: ["simple-icons-amazon", "shopping-cart", "package", "store"],
    aws: ["simple-icons-amazonaws", "cloud", "server", "database"],
    python: ["simple-icons-python", "code", "terminal", "cpu"],
    react: ["simple-icons-react", "code", "atom", "layers"],
    javascript: ["simple-icons-javascript", "code", "file-text"],
    typescript: ["simple-icons-typescript", "code", "file-text"],
    node: ["simple-icons-nodedotjs", "code", "server"],
    docker: ["simple-icons-docker", "box", "container", "server"],
    github: ["simple-icons-github", "code-2", "git-branch", "terminal"],
    gitlab: ["simple-icons-gitlab", "code-2", "git-branch", "terminal"],
    youtube: ["simple-icons-youtube", "video", "play-circle", "tv"],
    netflix: ["video", "film", "tv"],
    spotify: ["simple-icons-spotify", "music", "headphones", "disc"],
    notion: ["notebook", "file-text", "layers"],
    figma: ["simple-icons-figma", "pen-tool", "layout", "palette"],
    slack: ["message-square", "hash", "users"],
    discord: ["message-circle", "headphones", "gamepad-2"],
    twitter: ["simple-icons-x", "message-circle", "share-2"],
    x: ["simple-icons-x", "share-2"],
    google: ["simple-icons-google", "chrome", "globe", "search"],
    chrome: ["simple-icons-googlechrome", "globe", "search"],
    vscode: ["simple-icons-visualstudiocode", "code", "terminal"],
    obsidian: ["simple-icons-obsidian", "notebook", "book-open", "file-text"],
    markdown: ["simple-icons-markdown", "file-text", "pen-tool"]
  };
  static STOP_WORDS = /* @__PURE__ */ new Set([
    "a",
    "about",
    "above",
    "after",
    "again",
    "against",
    "all",
    "am",
    "an",
    "and",
    "any",
    "are",
    "aren't",
    "as",
    "at",
    "be",
    "because",
    "been",
    "before",
    "being",
    "below",
    "between",
    "both",
    "but",
    "by",
    "can",
    "could",
    "did",
    "do",
    "does",
    "doing",
    "down",
    "during",
    "each",
    "everybody",
    "everyone",
    "few",
    "for",
    "from",
    "further",
    "get",
    "getting",
    "got",
    "had",
    "has",
    "have",
    "he",
    "her",
    "here",
    "him",
    "himself",
    "his",
    "hit",
    "how",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "itself",
    "just",
    "me",
    "more",
    "most",
    "my",
    "myself",
    "no",
    "nor",
    "not",
    "now",
    "of",
    "off",
    "on",
    "once",
    "only",
    "or",
    "other",
    "our",
    "ours",
    "out",
    "over",
    "own",
    "plan",
    "plans",
    "same",
    "she",
    "should",
    "so",
    "some",
    "such",
    "than",
    "that",
    "the",
    "their",
    "theirs",
    "them",
    "themselves",
    "then",
    "there",
    "these",
    "they",
    "this",
    "those",
    "through",
    "to",
    "too",
    "under",
    "until",
    "up",
    "very",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "why",
    "with",
    "you",
    "your",
    "yours",
    "yourself",
    "yourselves"
  ]);
  static THREE_GRAM_CACHE = /* @__PURE__ */ new Map();
  constructor(plugin) {
    this.plugin = plugin;
  }
  getCacheStats() {
    return {
      hits: this.cacheHitCount,
      misses: this.cacheMissCount,
      size: this.queryCache.size
    };
  }
  clearCache() {
    this.queryCache.clear();
    this.cacheHitCount = 0;
    this.cacheMissCount = 0;
  }
  extractCleanIconId(iconId) {
    return iconId.replace(/^(lucide-|simple-icons-|si-|tabler-|fa-solid-|fa-regular-|bx-|octicon-|ra-|cf-|bi-|ri-|feather-|brand-)/i, "").toLowerCase();
  }
  initializeIndex() {
    if (this.isInitialized) return;
    this.cleanIconIdMap.clear();
    this.synonymExactMap.clear();
    for (const [iconId, synonyms] of Object.entries(ICON_SYNONYMS)) {
      const vector = this.getOrCreateVector(iconId);
      const cleanId = this.extractCleanIconId(iconId);
      const lowerIcon = iconId.toLowerCase();
      vector.tokenWeights.set(lowerIcon, 5);
      vector.tokenWeights.set(cleanId, 4.5);
      this.synonymExactMap.set(lowerIcon, iconId);
      this.synonymExactMap.set(cleanId, iconId);
      for (const syn of synonyms) {
        const sLower = syn.toLowerCase();
        if (!this.synonymExactMap.has(sLower)) {
          this.synonymExactMap.set(sLower, iconId);
        }
        const sNorm = sLower.replace(/[\s_-]+/g, "");
        if (!this.synonymExactMap.has(sNorm)) {
          this.synonymExactMap.set(sNorm, iconId);
        }
        const weights = this.buildWeightedTokenMap(syn);
        weights.forEach((w, t) => {
          vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w * 2);
        });
        vector.domains.add(syn);
      }
    }
    for (const [conceptKey, conceptDef] of Object.entries(_EmbeddingModel.DENSE_CONCEPTS)) {
      for (let i = 0; i < conceptDef.icons.length; i++) {
        const iconId = conceptDef.icons[i];
        const vector = this.getOrCreateVector(iconId);
        const cleanId = this.extractCleanIconId(iconId);
        const rankWeight = 1 - i * 0.15;
        vector.tokenWeights.set(iconId.toLowerCase(), Math.max(vector.tokenWeights.get(iconId.toLowerCase()) || 0, 4 * rankWeight));
        vector.tokenWeights.set(cleanId, Math.max(vector.tokenWeights.get(cleanId) || 0, 3.5 * rankWeight));
        const weights = this.buildWeightedTokenMap(conceptDef.prompt);
        weights.forEach((w, t) => {
          vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w * 1.8 * rankWeight);
        });
        vector.domains.add(conceptKey);
      }
    }
    for (const [brand, candidates] of Object.entries(_EmbeddingModel.BRAND_DICTIONARY)) {
      for (const iconId of candidates) {
        const vector = this.getOrCreateVector(iconId);
        const weights = this.buildWeightedTokenMap(brand);
        weights.forEach((w, t) => {
          vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w);
        });
        vector.domains.add(brand);
      }
    }
    for (const cat of AUTO_ICON_CATEGORIES) {
      const targets = [];
      if (cat.lucide) targets.push(cat.lucide);
      if (cat.lucides) targets.push(...cat.lucides);
      const rexClean = cat.rex.source.replace(/\\[sSwWdDbB][*+?]?/g, " ").replace(/[^a-zA-Z0-9\s|-]/g, " ").replace(/\|/g, " ").trim();
      const keywords = rexClean.split(/\s+/).filter((k) => k.length >= 2);
      for (const iconId of targets) {
        const vector = this.getOrCreateVector(iconId);
        const cleanId = this.extractCleanIconId(iconId);
        vector.tokenWeights.set(iconId.toLowerCase(), 4);
        vector.tokenWeights.set(cleanId, 3.5);
        for (const kw of keywords) {
          const weights = this.buildWeightedTokenMap(kw);
          weights.forEach((w, t) => {
            vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w * (cat.priority / 100));
          });
          vector.domains.add(kw);
        }
      }
    }
    const customIcons = this.plugin?.getCustomIconsMap() || {};
    for (const iconId of Object.keys(customIcons)) {
      const vector = this.getOrCreateVector(iconId);
      const cleanId = this.extractCleanIconId(iconId);
      vector.tokenWeights.set(iconId.toLowerCase(), 4);
      vector.tokenWeights.set(cleanId, 3.5);
      const weights = this.buildWeightedTokenMap(cleanId);
      weights.forEach((w, t) => {
        vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w * 1.5);
      });
    }
    const localIcons = this.plugin?.localFileSystemIcons || {};
    for (const iconId of Object.keys(localIcons)) {
      if (!localIcons[iconId]) continue;
      const vector = this.getOrCreateVector(iconId);
      const cleanId = this.extractCleanIconId(iconId);
      vector.tokenWeights.set(iconId.toLowerCase(), 4);
      vector.tokenWeights.set(cleanId, 3.5);
      const weights = this.buildWeightedTokenMap(cleanId);
      weights.forEach((w, t) => {
        vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w);
      });
    }
    try {
      const obsidianIconIds = (0, import_obsidian.getIconIds)();
      if (Array.isArray(obsidianIconIds)) {
        for (const iconId of obsidianIconIds) {
          const vector = this.getOrCreateVector(iconId);
          const cleanId = this.extractCleanIconId(iconId);
          vector.tokenWeights.set(iconId.toLowerCase(), 4);
          vector.tokenWeights.set(cleanId, 3.5);
          const weights = this.buildWeightedTokenMap(cleanId);
          weights.forEach((w, t) => {
            vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w);
          });
        }
      }
    } catch {
    }
    this.invertedIndex.clear();
    this.vectorNorms.clear();
    this.iconVectors.forEach((vec, iconId) => {
      let normSq = 0;
      vec.tokenWeights.forEach((w) => {
        normSq += w * w;
      });
      const norm = Math.sqrt(normSq) || 1;
      this.vectorNorms.set(iconId, norm);
      vec.tokenWeights.forEach((weight, token) => {
        let list = this.invertedIndex.get(token);
        if (!list) {
          list = [];
          this.invertedIndex.set(token, list);
        }
        list.push({ iconId, weight });
      });
      const lower = iconId.toLowerCase();
      const clean = this.extractCleanIconId(iconId);
      const normClean = clean.replace(/[\s_-]+/g, "");
      this.cleanIconIdMap.set(lower, iconId);
      this.cleanIconIdMap.set(clean, iconId);
      this.cleanIconIdMap.set(normClean, iconId);
    });
    this.isInitialized = true;
  }
  getOrCreateVector(iconId) {
    let vector = this.iconVectors.get(iconId);
    if (!vector) {
      vector = {
        tokens: [],
        tokenWeights: /* @__PURE__ */ new Map(),
        normalized: /* @__PURE__ */ new Map(),
        domains: /* @__PURE__ */ new Set()
      };
      this.iconVectors.set(iconId, vector);
    }
    return vector;
  }
  /**
   * Builds a weighted token map preserving full file names, full un-split phrases, and full words with high weights,
   * while retaining subword 3-grams as lower-weighted fallbacks.
   */
  buildWeightedTokenMap(text) {
    const tokenWeights = /* @__PURE__ */ new Map();
    const addToken = (tok, weight) => {
      if (!tok || tok.length < 2) return;
      const lower = tok.toLowerCase().trim();
      const current = tokenWeights.get(lower) || 0;
      tokenWeights.set(lower, Math.max(current, weight));
    };
    const clean = text.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2").toLowerCase().replace(/[^a-z0-9\s_-]/g, " ").trim();
    if (!clean) return tokenWeights;
    const rawWordsAll = clean.split(/[\s_-]+/).filter((w) => w.length >= 2);
    addToken(rawWordsAll.join(" "), 5.5);
    addToken(rawWordsAll.join(""), 5.5);
    addToken(rawWordsAll.join("-"), 5.5);
    for (let i = 0; i < rawWordsAll.length - 1; i++) {
      const pairHyphen = `${rawWordsAll[i]}-${rawWordsAll[i + 1]}`;
      const pairClean = `${rawWordsAll[i]} ${rawWordsAll[i + 1]}`;
      addToken(pairHyphen, 4);
      addToken(pairClean, 4);
      if (i < rawWordsAll.length - 2) {
        const triHyphen = `${rawWordsAll[i]}-${rawWordsAll[i + 1]}-${rawWordsAll[i + 2]}`;
        const triClean = `${rawWordsAll[i]} ${rawWordsAll[i + 1]} ${rawWordsAll[i + 2]}`;
        addToken(triHyphen, 4);
        addToken(triClean, 4);
      }
    }
    const filteredWords = rawWordsAll.filter((w) => !_EmbeddingModel.STOP_WORDS.has(w));
    const words = filteredWords.length > 0 ? filteredWords : rawWordsAll;
    for (const w of words) {
      addToken(w, 2.5);
    }
    for (const w of words) {
      if (w.length >= THREE_GRAM_MIN_LENGTH && w.length <= THREE_GRAM_MAX_LENGTH) {
        let grams = _EmbeddingModel.THREE_GRAM_CACHE.get(w);
        if (!grams) {
          grams = [];
          for (let i = 0; i <= w.length - 3; i++) {
            grams.push(w.substring(i, i + 3));
          }
          _EmbeddingModel.THREE_GRAM_CACHE.set(w, grams);
        }
        for (const g of grams) {
          addToken(g, 0.4);
        }
      }
    }
    return tokenWeights;
  }
  tokenizeText(text) {
    return Array.from(this.buildWeightedTokenMap(text).keys());
  }
  normalizeVectorFromMap(weightsMap) {
    const vec = /* @__PURE__ */ new Map();
    let normSq = 0;
    weightsMap.forEach((v) => {
      normSq += v * v;
    });
    const norm = Math.sqrt(normSq) || 1;
    weightsMap.forEach((v, k) => vec.set(k, v / norm));
    return vec;
  }
  computeCosineSimilarity(vecA, vecB) {
    let dotProduct = 0;
    const iterVec = vecA.size <= vecB.size ? vecA : vecB;
    const otherVec = iterVec === vecA ? vecB : vecA;
    iterVec.forEach((val, key) => {
      const otherVal = otherVec.get(key);
      if (otherVal !== void 0) {
        dotProduct += val * otherVal;
      }
    });
    return dotProduct;
  }
  buildQueryContext(titleOrPath, isFolder = false) {
    const parts = titleOrPath.split(/[/\\]/);
    const rawFilename = parts.pop() || titleOrPath;
    const cleaned = cleanSemanticTitle(rawFilename);
    const filename = cleaned || rawFilename.replace(/\.[a-z0-9]+$/i, "");
    const lowerName = filename.toLowerCase().trim();
    const lastDot = rawFilename.lastIndexOf(".");
    const extension = lastDot !== -1 ? rawFilename.substring(lastDot).toLowerCase() : "";
    const parentFolder = parts.length > 0 ? parts[parts.length - 1] : "Root";
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
  getExtensionBoosts(extension) {
    if (Object.prototype.hasOwnProperty.call(FILE_EXTENSION_DOMAINS, extension)) {
      const arr = FILE_EXTENSION_DOMAINS[extension];
      return Array.isArray(arr) ? arr : [];
    }
    return [];
  }
  getFolderHintBoosts(folderName) {
    if (!folderName) return [];
    const normalized = folderName.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (Object.prototype.hasOwnProperty.call(FOLDER_HINT_DOMAINS, normalized)) {
      const arr = FOLDER_HINT_DOMAINS[normalized];
      if (Array.isArray(arr)) return arr;
    }
    const lower = folderName.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(FOLDER_HINT_DOMAINS, lower)) {
      const arr = FOLDER_HINT_DOMAINS[lower];
      if (Array.isArray(arr)) return arr;
    }
    if (/^\d{4}$/.test(normalized)) {
      return ["calendar", "clock", "calendar-days"];
    }
    const tokens = lower.split(/[\s._-]+/).filter((t) => t.length >= 2);
    for (const tok of tokens) {
      if (Object.prototype.hasOwnProperty.call(FOLDER_HINT_DOMAINS, tok)) {
        const arr = FOLDER_HINT_DOMAINS[tok];
        if (Array.isArray(arr)) return arr;
      }
    }
    return [];
  }
  applyContextBoost(baseScore, iconId, context, precalculatedTokens) {
    let boost = 1;
    const lowerIcon = iconId.toLowerCase();
    const relevantTokens = precalculatedTokens || [
      ...this.getExtensionBoosts(context.extension),
      ...context.isFolder ? this.getFolderHintBoosts(context.parentFolder) : []
    ];
    for (const token of relevantTokens) {
      const lowerToken = token.toLowerCase();
      if (lowerIcon === lowerToken || lowerIcon.includes(lowerToken) || lowerToken.includes(lowerIcon)) {
        boost *= 1.25;
        break;
      }
    }
    if (context.isFolder && context.pathDepth === 1) {
      if (["folder", "layers", "archive", "box"].some((t) => lowerIcon.includes(t))) {
        boost *= 1.1;
      }
    }
    return baseScore * boost;
  }
  findBestIcons(titleOrPath, options) {
    this.initializeIndex();
    const cacheKey = `${titleOrPath}:${options?.topK ?? DEFAULT_TOP_K}:${options?.minScore ?? DEFAULT_MIN_SCORE}:${options?.isFolder ?? false}`;
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 3e5) {
      this.cacheHitCount++;
      return cached.result;
    }
    this.cacheMissCount++;
    const topK = options?.topK ?? DEFAULT_TOP_K;
    const minScore = options?.minScore ?? DEFAULT_MIN_SCORE;
    const context = options?.queryContext ?? this.buildQueryContext(titleOrPath, options?.isFolder ?? false);
    const relevantTokens = [
      ...this.getExtensionBoosts(context.extension),
      ...context.isFolder ? this.getFolderHintBoosts(context.parentFolder) : []
    ];
    const directMatch = this.tryDirectDictionaryMatch(context.lowerName, topK, context);
    if (directMatch.length > 0) {
      const enriched = directMatch.map((r) => ({
        ...r,
        confidence: "high",
        score: this.applyContextBoost(r.score, r.iconId, context, relevantTokens)
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
    const accumulators = /* @__PURE__ */ new Map();
    let queryNormSq = 0;
    queryTokenWeights.forEach((qWeight, token) => {
      queryNormSq += qWeight * qWeight;
      const postings = this.invertedIndex.get(token);
      if (!postings) return;
      for (let i = 0; i < postings.length; i++) {
        const p = postings[i];
        accumulators.set(p.iconId, (accumulators.get(p.iconId) || 0) + qWeight * p.weight);
      }
    });
    const queryNorm = Math.sqrt(queryNormSq) || 1;
    const scored = [];
    accumulators.forEach((dotProduct, iconId) => {
      const docNorm = this.vectorNorms.get(iconId) || 1;
      const rawScore = dotProduct / (queryNorm * docNorm);
      if (rawScore >= minScore) {
        scored.push({ iconId, rawScore });
      }
    });
    const boosted = scored.map((s) => ({
      iconId: s.iconId,
      score: this.applyContextBoost(s.rawScore, s.iconId, context, relevantTokens)
    })).sort((a, b) => b.score - a.score).slice(0, topK);
    const result = boosted.map((r) => ({
      ...r,
      matchedTag: context.filename,
      confidence: r.score >= 0.7 ? "high" : r.score >= 0.45 ? "medium" : "low"
    }));
    if (result.length === 0) {
      const fallback = this.getFallbackIcons(context, topK);
      this.queryCache.set(cacheKey, { result: fallback, timestamp: Date.now() });
      return fallback;
    }
    this.queryCache.set(cacheKey, { result, timestamp: Date.now() });
    return result;
  }
  isPersonName(name, parentFolder) {
    if (!name) return false;
    const clean = name.replace(/\.(md|txt|docx|pdf)$/i, "").trim();
    if (/\b(contract|agreement|nda|report|invoice|bill|receipt|statement|policy|terms|test|schedule|data|sheet|notes|summary|log|logs|flow|diagram|architecture)\b/i.test(clean)) {
      return false;
    }
    if (/^(dr|mr|mrs|ms|prof|professor|sir|lady)\b/i.test(clean)) {
      return true;
    }
    if (parentFolder && /^(people|contacts|friends|family|team|members|staff|clients|customers|authors|speakers|patients|candidates)$/i.test(parentFolder.trim())) {
      return true;
    }
    return false;
  }
  tryDirectDictionaryMatch(lowerName, topK, context) {
    const normLowerName = lowerName.replace(/[\s_-]+/g, "");
    const matchedDirectId = this.cleanIconIdMap.get(normLowerName) || this.cleanIconIdMap.get(lowerName);
    if (matchedDirectId) {
      return [{
        iconId: matchedDirectId,
        score: 0.99,
        matchedTag: lowerName,
        confidence: "high"
      }];
    }
    if (this.plugin?.iconManager) {
      const autoIcon = this.plugin.iconManager.getAutoIconData(lowerName);
      if (autoIcon && autoIcon.lucide) {
        return [{
          iconId: autoIcon.lucide,
          score: 0.98,
          matchedTag: lowerName,
          confidence: "high"
        }];
      }
    }
    const exactSynIcon = this.synonymExactMap.get(lowerName) || this.synonymExactMap.get(normLowerName);
    if (exactSynIcon) {
      return [{
        iconId: exactSynIcon,
        score: 0.99,
        matchedTag: lowerName,
        confidence: "high"
      }];
    }
    if (context) {
      const rawTokens = context.lowerName.split(/[\s._-]+/).filter((t) => t.length >= 2 && !_EmbeddingModel.STOP_WORDS.has(t));
      const candidateTokens = [...rawTokens];
      for (let i = 0; i < rawTokens.length - 1; i++) {
        candidateTokens.push(`${rawTokens[i]}${rawTokens[i + 1]}`);
        candidateTokens.push(`${rawTokens[i]}-${rawTokens[i + 1]}`);
      }
      for (const tok of candidateTokens) {
        if (Object.prototype.hasOwnProperty.call(_EmbeddingModel.BRAND_DICTIONARY, tok)) {
          const brandIcons = _EmbeddingModel.BRAND_DICTIONARY[tok];
          if (Array.isArray(brandIcons) && brandIcons.length > 0) {
            return brandIcons.slice(0, topK).map((iconId) => ({
              iconId,
              score: 1,
              matchedTag: tok,
              confidence: "high"
            }));
          }
        }
      }
    }
    if (context && context.extension && ![".md", ".txt", ".json", ".yaml", ".yml", ".toml"].includes(context.extension)) {
      const extIcons = this.getExtensionBoosts(context.extension);
      if ([".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".mp3", ".wav", ".mp4", ".mov"].includes(context.extension) && extIcons.length > 0) {
        return extIcons.slice(0, topK).map((id, idx) => ({
          iconId: id,
          score: 0.98 - idx * 0.02,
          matchedTag: context.extension,
          confidence: "high"
        }));
      }
    }
    if (context) {
      for (let i = 0; i < HIGH_PRIORITY_CATEGORIES.length; i++) {
        const cat = HIGH_PRIORITY_CATEGORIES[i];
        if (cat.rex.test(context.filename) || cat.rex.test(context.lowerName)) {
          const targets = [];
          if (cat.lucide) targets.push(cat.lucide);
          if (cat.lucides) targets.push(...cat.lucides);
          if (targets.length > 0) {
            const unique = Array.from(new Set(targets));
            return unique.slice(0, topK).map((id, idx) => ({
              iconId: id,
              score: 0.98 - idx * 0.02,
              matchedTag: "concept-match",
              confidence: "high"
            }));
          }
        }
      }
    }
    if (context) {
      const rawTokens = context.lowerName.split(/[\s._-]+/).filter((t) => t.length >= 2 && !_EmbeddingModel.STOP_WORDS.has(t));
      const candidateTokens = [...rawTokens];
      for (let i = 0; i < rawTokens.length - 1; i++) {
        candidateTokens.push(`${rawTokens[i]}${rawTokens[i + 1]}`);
        candidateTokens.push(`${rawTokens[i]}-${rawTokens[i + 1]}`);
      }
      const matchedFromTokens = [];
      for (const tok of candidateTokens) {
        const synIcon = this.synonymExactMap.get(tok);
        if (synIcon) {
          matchedFromTokens.push({
            iconId: synIcon,
            score: 0.95,
            token: tok
          });
        }
      }
      if (matchedFromTokens.length > 0) {
        const uniqueMap = /* @__PURE__ */ new Map();
        for (const m of matchedFromTokens) {
          if (!uniqueMap.has(m.iconId)) {
            uniqueMap.set(m.iconId, m);
          }
        }
        return Array.from(uniqueMap.values()).slice(0, topK).map((m) => ({
          iconId: m.iconId,
          score: m.score,
          matchedTag: m.token,
          confidence: "high"
        }));
      }
    }
    if (context && this.isPersonName(context.filename, context.parentFolder)) {
      const personIcons = context.isFolder ? ["folder-users", "users", "user", "contact"] : ["user", "contact", "id-card", "profile", "user-check"];
      return personIcons.slice(0, topK).map((iconId) => ({
        iconId,
        score: 0.98,
        matchedTag: "person-name",
        confidence: "high"
      }));
    }
    if (Object.prototype.hasOwnProperty.call(_EmbeddingModel.BRAND_DICTIONARY, lowerName)) {
      const direct = _EmbeddingModel.BRAND_DICTIONARY[lowerName];
      if (Array.isArray(direct)) {
        return direct.slice(0, topK).map((iconId) => ({
          iconId,
          score: 1,
          matchedTag: lowerName,
          confidence: "high"
        }));
      }
    }
    const prefixMatches = [];
    for (const [brand, candidates] of Object.entries(_EmbeddingModel.BRAND_DICTIONARY)) {
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
      return prefixMatches.slice(0, topK).map((m) => ({
        iconId: m.iconId,
        score: 0.9,
        matchedTag: m.brand,
        confidence: "high"
      }));
    }
    return [];
  }
  getFallbackIcons(context, topK) {
    const results = [];
    const seen = /* @__PURE__ */ new Set();
    if (context.parentFolder) {
      const folderHints = this.getFolderHintBoosts(context.parentFolder);
      for (const iconId of folderHints) {
        if (!seen.has(iconId) && !["folder", "box", "package"].includes(iconId)) {
          seen.add(iconId);
          results.push({
            iconId,
            score: 0.75,
            matchedTag: `folder:${context.parentFolder}`,
            confidence: "medium"
          });
        }
        if (results.length >= topK) break;
      }
    }
    const extensionHints = this.getExtensionBoosts(context.extension);
    for (const iconId of extensionHints) {
      if (!seen.has(iconId)) {
        seen.add(iconId);
        results.push({
          iconId,
          score: 0.4,
          matchedTag: context.extension,
          confidence: "low"
        });
      }
      if (results.length >= topK) break;
    }
    if (results.length < topK) {
      const isMultiWordSentence = !context.isFolder && context.filename.includes(" ") && context.filename.length > 12;
      let defaultIcons;
      if (context.isFolder) {
        defaultIcons = ["folder", "layers", "box", "folder-kanban"];
      } else if (isMultiWordSentence) {
        const sentencePalette = ["compass", "sparkles", "lightbulb", "quote", "brain", "pen-tool", "book-open", "repeat", "heart", "star"];
        let hash = 0;
        for (let i = 0; i < context.filename.length; i++) {
          hash = (hash << 5) - hash + context.filename.charCodeAt(i);
          hash |= 0;
        }
        const absHash = Math.abs(hash);
        const firstIcon = sentencePalette[absHash % sentencePalette.length];
        const secondIcon = sentencePalette[(absHash + 3) % sentencePalette.length];
        const thirdIcon = sentencePalette[(absHash + 5) % sentencePalette.length];
        defaultIcons = [firstIcon, secondIcon, thirdIcon, "sparkles"];
      } else {
        let hash = 0;
        for (let i = 0; i < context.filename.length; i++) {
          hash = (hash << 5) - hash + context.filename.charCodeAt(i);
          hash |= 0;
        }
        const conceptPalette = ["sparkles", "compass", "pen-tool", "lightbulb", "brain", "star", "book-open", "layers"];
        const selected = conceptPalette[Math.abs(hash) % conceptPalette.length];
        defaultIcons = [selected, "sparkles", "compass", "notebook"];
      }
      for (const iconId of defaultIcons) {
        if (!seen.has(iconId)) {
          seen.add(iconId);
          results.push({
            iconId,
            score: 0.3,
            matchedTag: context.isFolder ? "default-folder" : isMultiWordSentence ? "sentence-quote" : "default-file",
            confidence: "low"
          });
        }
        if (results.length >= topK) break;
      }
    }
    return results;
  }
  normalizeFloat32Array(vec) {
    let normSq = 0;
    for (let i = 0; i < vec.length; i++) {
      const val = vec[i];
      normSq += val * val;
    }
    const norm = Math.sqrt(normSq) || 1;
    for (let i = 0; i < vec.length; i++) {
      vec[i] /= norm;
    }
    return vec;
  }
  async fetchNeuralEmbedding(text) {
    const settings = this.plugin?.settings;
    if (settings?.embeddingEngine === "builtin") return null;
    const modelName = settings?.embeddingCustomModel || "bge-m3";
    const endpoint = (settings?.embeddingCustomEndpoint || "http://localhost:11434").replace(/\/$/, "");
    const endpointsToTry = [
      `${endpoint}/api/embeddings`,
      `${endpoint}/api/embed`,
      `${endpoint}/v1/embeddings`
    ];
    for (const url of endpointsToTry) {
      try {
        const bodyObj = url.endsWith("/v1/embeddings") ? { model: modelName, input: text } : { model: modelName, prompt: text };
        const res = await (0, import_obsidian.requestUrl)({
          url,
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(bodyObj)
        });
        const data = res.json;
        if (Array.isArray(data.embedding)) {
          return this.normalizeFloat32Array(new Float32Array(data.embedding));
        }
        if (Array.isArray(data.embeddings) && Array.isArray(data.embeddings[0])) {
          return this.normalizeFloat32Array(new Float32Array(data.embeddings[0]));
        }
        if (Array.isArray(data.data) && data.data[0]?.embedding) {
          return this.normalizeFloat32Array(new Float32Array(data.data[0].embedding));
        }
      } catch {
      }
    }
    return null;
  }
  /**
   * Builds a structured contextual prompt for custom neural embedding models.
   */
  buildEnrichedPrompt(titleOrPath, isFolder) {
    const context = this.buildQueryContext(titleOrPath, isFolder);
    const parts = [
      `Full File Name: ${context.filename}`,
      `Exact Words: ${context.filename.replace(/[\s_-]+/g, " ")}`
    ];
    if (context.extension) parts.push(`Extension: ${context.extension}`);
    if (context.parentFolder && context.parentFolder !== "Root") parts.push(`Folder Path: ${context.parentFolder}`);
    if (context.isFolder) parts.push("Type: Directory Folder");
    return parts.join(" | ");
  }
  /**
   * Computes Cosine Similarity between two pre-normalized dense N-dimensional floating point vectors.
   */
  computeDenseCosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
    const len = Math.min(vecA.length, vecB.length);
    let dot = 0;
    for (let i = 0; i < len; i++) {
      dot += vecA[i] * vecB[i];
    }
    return dot;
  }
  async findBestIconsDense(titleOrPath, denseVector, options) {
    const topK = options?.topK ?? DEFAULT_TOP_K;
    const minScore = options?.minScore ?? 0.15;
    const context = this.buildQueryContext(titleOrPath, options?.isFolder ?? false);
    const missingKeys = Object.keys(_EmbeddingModel.DENSE_CONCEPTS).filter(
      (key) => !this.conceptDenseVectors.has(key)
    );
    if (missingKeys.length > 0) {
      await Promise.all(
        missingKeys.map(async (conceptKey) => {
          const conceptDef = _EmbeddingModel.DENSE_CONCEPTS[conceptKey];
          if (conceptDef) {
            const vec = await this.fetchNeuralEmbedding(conceptDef.prompt);
            if (vec) {
              this.conceptDenseVectors.set(conceptKey, vec);
            }
          }
        })
      );
    }
    const iconScores = /* @__PURE__ */ new Map();
    this.conceptDenseVectors.forEach((conceptVec, conceptKey) => {
      const sim = this.computeDenseCosineSimilarity(denseVector, conceptVec);
      if (sim > minScore) {
        const conceptDef = _EmbeddingModel.DENSE_CONCEPTS[conceptKey];
        if (conceptDef) {
          conceptDef.icons.forEach((iconId, idx) => {
            const rankWeight = 1 - idx * 0.1;
            const score = sim * rankWeight;
            const existing = iconScores.get(iconId) || 0;
            iconScores.set(iconId, Math.max(existing, score));
          });
        }
      }
    });
    const sparseMatches = this.findBestIcons(titleOrPath, { topK: 10, minScore: 0.1, isFolder: options?.isFolder, queryContext: context });
    for (const sm of sparseMatches) {
      const current = iconScores.get(sm.iconId) || 0;
      iconScores.set(sm.iconId, Math.max(current, current * 0.6 + sm.score * 0.4));
    }
    if (iconScores.size > 0) {
      const sorted = Array.from(iconScores.entries()).map(([iconId, score]) => ({
        iconId,
        score: this.applyContextBoost(score, iconId, context)
      })).sort((a, b) => b.score - a.score).slice(0, topK);
      return sorted.map((r) => ({
        ...r,
        matchedTag: context.filename,
        confidence: r.score >= 0.65 ? "high" : r.score >= 0.35 ? "medium" : "low"
      }));
    }
    return this.findBestIcons(titleOrPath, { ...options, queryContext: context });
  }
  /**
   * Async classification supporting both Built-in Sparse Vector Engine and Custom Neural Model.
   */
  async classifyTargetsAsync(targets, onProgress) {
    const settings = this.plugin?.settings;
    const isCustomNeural = settings?.embeddingEngine === "custom";
    const output = {};
    const uniqueNames = /* @__PURE__ */ new Map();
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
        const pct = Math.round(completed / Math.max(1, total) * 100);
        onProgress(completed, total, pct);
      }
      if (isCustomNeural) {
        const enrichedPrompt = this.buildEnrichedPrompt(item.name || item.path, item.isFolder);
        const denseVector = await this.fetchNeuralEmbedding(enrichedPrompt);
        if (denseVector) {
          const matches2 = await this.findBestIconsDense(item.name || item.path, denseVector, { topK: 3, isFolder: item.isFolder });
          if (matches2.length > 0) {
            output[item.path] = matches2.map((m) => m.iconId);
            continue;
          }
        }
      }
      const matches = this.findBestIcons(item.name || item.path, { topK: 3, isFolder: item.isFolder });
      if (matches.length > 0) {
        output[item.path] = matches.map((m) => m.iconId);
      }
    }
    return output;
  }
  /**
   * Pre-calculates candidate icon IDs for a batch of items, supporting both Built-in Local and Custom Neural models.
   */
  async getBatchVectorCandidatesAsync(items, topK = 5) {
    const settings = this.plugin?.settings;
    if (settings?.embeddingEngine === "custom") {
      return await this.classifyTargetsAsync(items);
    }
    return this.getBatchVectorCandidates(items, topK);
  }
  getBatchVectorCandidates(items, topK = 5) {
    const candidateMap = {};
    for (const item of items) {
      const matches = this.findBestIcons(item.name || item.path, { topK, isFolder: item.isFolder });
      if (matches.length > 0) {
        candidateMap[item.path] = matches.map((m) => m.iconId);
      } else {
        candidateMap[item.path] = item.isFolder ? ["folder", "layers", "box", "folder-kanban"] : ["file-text", "notebook", "edit-3", "layers"];
      }
    }
    return candidateMap;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  EmbeddingModel,
  ICON_SYNONYMS,
  cleanSemanticTitle
});
