var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// scratch/obsidian_stub.js
var require_obsidian_stub = __commonJS({
  "scratch/obsidian_stub.js"(exports2, module2) {
    module2.exports = {
      requestUrl: async () => ({ json: {} }),
      Notice: class Notice {
        constructor(msg) {
        }
        hide() {
        }
        setMessage(msg) {
        }
      },
      TFolder: class TFolder {
        isRoot() {
          return false;
        }
      },
      TFile: class TFile {
      },
      getIcon: (id) => null,
      getIconIds: () => ["lucide-calendar", "lucide-compass", "lucide-sparkles", "lucide-heart", "lucide-scale", "lucide-repeat", "lucide-trending-up", "lucide-calendar-check", "lucide-sun-moon", "lucide-leaf", "lucide-wind"]
    };
  }
});

// src/common/constants.ts
var CF_FOLDER_CLOSED, CF_FOLDER_OPEN, CF_FILE_DEFAULT, AUTO_ICON_CATEGORIES, PACK_PRIORITY, STOP_WORDS, GENERIC_SUFFIX_WORDS;
var init_constants = __esm({
  "src/common/constants.ts"() {
    CF_FOLDER_CLOSED = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/><path d="M2 10h20"/></svg>');
    CF_FOLDER_OPEN = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/></svg>');
    CF_FILE_DEFAULT = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>');
    AUTO_ICON_CATEGORIES = [
      // --- Dates, Years, Numbers & Percentages ---
      { rex: /^(19|20)\d{2}$/, emoji: "\u{1F4C5}", lucide: "calendar", priority: 150, emojis: ["\u{1F4C5}", "\u{1F4C6}", "\u23F3"], lucides: ["calendar", "calendar-days", "clock"] },
      { rex: /^\d{4}-\d{2}(-\d{2})?$/, emoji: "\u{1F4C5}", lucide: "calendar-days", priority: 150, emojis: ["\u{1F4C5}", "\u{1F4C6}"], lucides: ["calendar-days", "calendar-clock"] },
      { rex: /^(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*$/i, emoji: "\u{1F4C5}", lucide: "calendar", priority: 140 },
      { rex: /^\d+$/, emoji: "\u{1F522}", lucide: "hash", priority: 130 },
      { rex: /^\d+%$/, emoji: "\u{1F4CA}", lucide: "percent", priority: 130 },
      { rex: /^#\d+$/, emoji: "\u{1F3F7}\uFE0F", lucide: "hash", priority: 130 },
      // --- Core categories ---
      { rex: /journal|daily|log|diary/i, emoji: "\u{1F4C5}", lucide: "calendar", priority: 100, emojis: ["\u{1F4C5}", "\u{1F4C6}", "\u{1F4DD}", "\u{1F4D4}"], lucides: ["calendar", "calendar-days", "book", "pencil"] },
      { rex: /image|photo|pic|asset|gallery|album/i, emoji: "\u{1F5BC}\uFE0F", lucide: "image", priority: 100, emojis: ["\u{1F5BC}\uFE0F", "\u{1F4F7}", "\u{1F4F8}", "\u{1F3A8}"], lucides: ["image", "camera", "aperture", "palette"] },
      { rex: /project|task|todo|work|goal|action/i, emoji: "\u{1F680}", lucide: "rocket", priority: 100, emojis: ["\u{1F680}", "\u{1F3AF}", "\u2705", "\u26A1"], lucides: ["rocket", "target", "check-circle", "zap"] },
      { rex: /setting|config|pref|options|setup|tool/i, emoji: "\u2699\uFE0F", lucide: "settings", priority: 100 },
      { rex: /read|book|paper|article|literature|lib/i, emoji: "\u{1F4DA}", lucide: "book-open", priority: 100 },
      { rex: /archive|old|past|backup|history|dump/i, emoji: "\u{1F4E6}", lucide: "archive", priority: 100 },
      { rex: /personal|me|self|profile|account|bio/i, emoji: "\u{1F464}", lucide: "user", priority: 100 },
      { rex: /finance|money|bank|pay|cost|bill|price|tax|wallet/i, emoji: "\u{1F4B8}", lucide: "banknote", priority: 100 },
      { rex: /health|fit|exercise|diet|gym|doctor|med|sport/i, emoji: "\u{1F957}", lucide: "activity", priority: 100 },
      { rex: /travel|trip|vacation|flight|plane|map|explore/i, emoji: "\u2708\uFE0F", lucide: "plane", priority: 100 },
      { rex: /tech|code|dev|script|bot|program|web|git|coding/i, emoji: "\u{1F4BB}", lucide: "code", priority: 100, emojis: ["\u{1F4BB}", "\u{1F5A5}\uFE0F", "\u2328\uFE0F", "\u{1F468}\u200D\u{1F4BB}"], lucides: ["code", "terminal", "cpu", "laptop"] },
      { rex: /music|audio|song|playlist|sound|record/i, emoji: "\u{1F3B5}", lucide: "music", priority: 100 },
      { rex: /video|movie|film|clip|youtube|stream/i, emoji: "\u{1F3AC}", lucide: "video", priority: 100 },
      { rex: /school|study|class|course|exam|edu|lecture|uni/i, emoji: "\u{1F393}", lucide: "graduation-cap", priority: 100 },
      { rex: /people|contact|friend|family|team|group|social/i, emoji: "\u{1F465}", lucide: "users", priority: 100 },
      { rex: /inbox|new|capture|draft|start/i, emoji: "\u{1F4E5}", lucide: "inbox", priority: 100 },
      { rex: /chat|talk|discuss|social|comm|slack|discord/i, emoji: "\u{1F4AC}", lucide: "message-square", priority: 100 },
      { rex: /star|fav|important|prior|hot|best/i, emoji: "\u2B50", lucide: "star", priority: 100 },
      { rex: /lock|secret|private|secure|vault|pass/i, emoji: "\u{1F512}", lucide: "lock", priority: 100 },
      { rex: /home|house|ref|base|living/i, emoji: "\u{1F3E0}", lucide: "home", priority: 100 },
      { rex: /search|find|query|explore/i, emoji: "\u{1F50D}", lucide: "search", priority: 100 },
      { rex: /mail|letter|message|email/i, emoji: "\u{1F4E7}", lucide: "mail", priority: 100 },
      { rex: /write|pen|edit|create|author/i, emoji: "\u{1F58B}\uFE0F", lucide: "pen-tool", priority: 100 },
      // --- Expanded categories ---
      { rex: /design|ui|ux|figma|sketch|mockup/i, emoji: "\u2728", lucide: "layout", priority: 90 },
      { rex: /data|csv|excel|sheet|table|stats|analytics/i, emoji: "\u{1F4CA}", lucide: "bar-chart-2", priority: 90 },
      { rex: /presentation|slides|ppt|deck/i, emoji: "\u{1F4FD}\uFE0F", lucide: "presentation", priority: 90 },
      { rex: /\b(document|doc|word|report|text)\b/i, emoji: "\u{1F4C4}", lucide: "file-text", priority: 85 },
      { rex: /pdf|ebook/i, emoji: "\u{1F4D5}", lucide: "file-text", priority: 90 },
      { rex: /zip|rar|compressed|archive/i, emoji: "\u{1F5DC}\uFE0F", lucide: "package", priority: 90 },
      { rex: /cloud|sync|drive|storage/i, emoji: "\u2601\uFE0F", lucide: "cloud", priority: 90 },
      { rex: /\b(shopping|cart|store|shop|buy|checkout|purchases)\b|\b(purchase-order|store-order)\b/i, emoji: "\u{1F6D2}", lucide: "shopping-cart", priority: 90 },
      { rex: /food|recipe|meal|drink|cook|restaurant/i, emoji: "\u{1F354}", lucide: "utensils", priority: 90 },
      { rex: /nature|tree|plant|eco|environment/i, emoji: "\u{1F331}", lucide: "leaf", priority: 90 },
      { rex: /game|play|fun|console|steam/i, emoji: "\u{1F3AE}", lucide: "gamepad-2", priority: 90 },
      { rex: /news|update|press|media|headline/i, emoji: "\u{1F4F0}", lucide: "newspaper", priority: 90 },
      { rex: /calendar|event|schedule|date|time/i, emoji: "\u{1F4C6}", lucide: "calendar-days", priority: 90 },
      { rex: /map|location|gps|place|address/i, emoji: "\u{1F4CD}", lucide: "map-pin", priority: 90 },
      { rex: /alert|warn|error|bug|issue/i, emoji: "\u26A0\uFE0F", lucide: "alert-triangle", priority: 90 },
      { rex: /science|lab|experiment|chemistry|biology/i, emoji: "\u{1F52C}", lucide: "flask-conical", priority: 90 },
      { rex: /career|job|resume|cv|work/i, emoji: "\u{1F4BC}", lucide: "briefcase", priority: 90 },
      { rex: /server|database|infra|network/i, emoji: "\u{1F5A7}", lucide: "server", priority: 105, emojis: ["\u{1F5A7}", "\u{1F5A5}\uFE0F", "\u{1F5C4}\uFE0F"], lucides: ["server", "database", "hard-drive"] },
      { rex: /ai|ml|neural|model/i, emoji: "\u{1F916}", lucide: "cpu", priority: 95 },
      { rex: /skull|death|danger|poison|skeleton|ghost|spooky/i, emoji: "\u{1F480}", lucide: "skull", priority: 100, emojis: ["\u{1F480}", "\u2620\uFE0F", "\u{1F47B}"], lucides: ["skull", "ghost"] },
      // --- More diverse icons ---
      { rex: /photo-edit|design|art|draw|paint/i, emoji: "\u{1F3A8}", lucide: "brush", priority: 80 },
      { rex: /travel-doc|passport|visa/i, emoji: "\u{1FAAA}", lucide: "id-card", priority: 80 },
      { rex: /question|help|support|faq|ask/i, emoji: "\u2753", lucide: "help-circle", priority: 85, emojis: ["\u2753", "\u2754", "\u{1F914}"], lucides: ["help-circle", "message-square-question", "badge-help"] },
      { rex: /quote|cite|ref|mention|block/i, emoji: "\u{1F4AC}", lucide: "quote", priority: 85, lucides: ["quote", "text-quote"] },
      { rex: /template|boiler|preset|layout|blueprint/i, emoji: "\u{1F4DD}", lucide: "layout-template", priority: 85, emojis: ["\u{1F4DD}", "\u{1F4CB}", "\u{1F4D0}"], lucides: ["layout-template", "copy", "ruler"] },
      { rex: /tv|series|episode|show|drama|media/i, emoji: "\u{1F4FA}", lucide: "tv", priority: 85, emojis: ["\u{1F4FA}", "\u{1F3AC}", "\u{1F3AD}"], lucides: ["tv", "monitor-play", "clapperboard"] },
      { rex: /visual|view|display|watch|look|eye|see/i, emoji: "\u{1F441}\uFE0F", lucide: "eye", priority: 85, emojis: ["\u{1F441}\uFE0F", "\u{1F453}", "\u{1F52D}"], lucides: ["eye", "glasses", "telescope"] },
      { rex: /recent|update|history|mod|time|new/i, emoji: "\u{1F552}", lucide: "history", priority: 85, emojis: ["\u{1F552}", "\u{1F559}", "\u23F3", "\u{1F4C5}"], lucides: ["history", "clock", "calendar-clock", "sparkles"] },
      { rex: /\b(source|origin|root|base|data|lib|bib)\b/i, emoji: "\u{1F4C1}", lucide: "database", priority: 85, emojis: ["\u{1F4C1}", "\u{1F4E5}", "\u{1F4CA}"], lucides: ["database", "library", "binary"] },
      { rex: /thing|object|stuff|entity|misc|item/i, emoji: "\u{1F4E6}", lucide: "package", priority: 80, emojis: ["\u{1F4E6}", "\u{1F381}", "\u{1F5F3}\uFE0F"], lucides: ["package", "layers", "box"] },
      { rex: /review|crit|feedback|eval/i, emoji: "\u{1F50E}", lucide: "search", priority: 85, lucides: ["search", "check-square", "clipboard-check"] },
      { rex: /\b(draft|wip|work-in-progress|construction)\b/i, emoji: "\u{1F6A7}", lucide: "wrench", priority: 85, emojis: ["\u{1F6A7}", "\u{1F6E0}\uFE0F", "\u{1F3D7}\uFE0F"], lucides: ["wrench", "construction", "hammer"] },
      { rex: /security|auth|key|password/i, emoji: "\u{1F511}", lucide: "key", priority: 80 },
      { rex: /download|install|setup/i, emoji: "\u2B07\uFE0F", lucide: "download", priority: 80 },
      { rex: /trash|delete|remove|bin/i, emoji: "\u{1F5D1}\uFE0F", lucide: "trash", priority: 80 },
      { rex: /energy|power|electric|battery/i, emoji: "\u{1F50B}", lucide: "battery-charging", priority: 80 },
      { rex: /weather|climate|forecast|rain|sun/i, emoji: "\u26C5", lucide: "cloud-sun", priority: 80 },
      { rex: /holiday|celebration|party|festival/i, emoji: "\u{1F389}", lucide: "gift", priority: 80 },
      { rex: /transport|car|bike|bus|train/i, emoji: "\u{1F697}", lucide: "car", priority: 80 },
      { rex: /construction|tools|fix|repair/i, emoji: "\u{1F6E0}\uFE0F", lucide: "wrench", priority: 80 },
      { rex: /photo-camera|shoot|capture/i, emoji: "\u{1F4F7}", lucide: "camera", priority: 80 },
      { rex: /clipboard|notes|tasks|checklist/i, emoji: "\u{1F4CB}", lucide: "clipboard-list", priority: 80 },
      { rex: /downloaded|software|apps|exe|pkg/i, emoji: "\u{1F4E6}", lucide: "box", priority: 80 },
      { rex: /currency|crypto|bitcoin|ethereum/i, emoji: "\u{1FA99}", lucide: "coins", priority: 80 },
      // --- Knowledge Management & Obsidian Specialized ---
      { rex: /atlas|moc|map|index|directory|table-of-contents|toc/i, emoji: "\u{1F5FA}\uFE0F", lucide: "map", priority: 110, lucides: ["map", "list-tree", "network"] },
      { rex: /zettel|slipbox|card-index|permanent|fleeting/i, emoji: "\u{1F5C2}\uFE0F", lucide: "library", priority: 110, lucides: ["library", "layout-grid", "scroll-text"] },
      { rex: /canvas|whiteboard|draw|excalidraw/i, emoji: "\u{1F3A8}", lucide: "frame", priority: 110, lucides: ["frame", "shapes", "pencil-ruler"] },
      { rex: /graph|link|relation|node|network/i, emoji: "\u{1F578}\uFE0F", lucide: "share-2", priority: 110, lucides: ["share-2", "git-branch", "workflow"] },
      // --- Plugins, Extensions & Addons ---
      { rex: /\b(?:plugin|plugins|extension|extensions|addon|addons|widget|widgets|wxt)\b/i, emoji: "\u{1F9E9}", lucide: "puzzle", priority: 115, emojis: ["\u{1F9E9}", "\u{1F50C}"], lucides: ["puzzle", "plugin", "simple-icons-wxt"] },
      { rex: /docker|k8s|kubernetes|container|pod/i, emoji: "\u{1F433}", lucide: "ship", priority: 95, lucides: ["ship", "container", "box"] },
      { rex: /aws|cloud|azure|gcp|lambda|serverless/i, emoji: "\u2601\uFE0F", lucide: "cloud-lightning", priority: 95, lucides: ["cloud-lightning", "flame", "hard-drive"] },
      { rex: /api|json|yaml|xml|graphql|rest/i, emoji: "\u{1F50C}", lucide: "plug", priority: 95, lucides: ["plug", "webhook", "bracket"] },
      { rex: /security|hacker|exploit|firewall|pentest/i, emoji: "\u{1F575}\uFE0F", lucide: "shield-alert", priority: 95, lucides: ["shield-alert", "spy", "fingerprint"] },
      { rex: /terminal|bash|shell|zsh|cli/i, emoji: "\u{1F41A}", lucide: "terminal", priority: 95 },
      // --- Life & Household ---
      { rex: /pet|dog|cat|animal|vet/i, emoji: "\u{1F43E}", lucide: "dog", priority: 85, emojis: ["\u{1F43E}", "\u{1F415}", "\u{1F408}", "\u{1F408}\u200D\u2B1B"], lucides: ["dog", "cat", "paw-print"] },
      { rex: /garden|plant|flower|nature|eco/i, emoji: "\u{1F33B}", lucide: "flower-2", priority: 85, emojis: ["\u{1F33B}", "\u{1F337}", "\u{1F333}", "\u{1F331}"], lucides: ["flower-2", "tree-pine", "leaf"] },
      { rex: /cook|recipe|meal|kitchen|food|diet/i, emoji: "\u{1F373}", lucide: "chef-hat", priority: 85, emojis: ["\u{1F373}", "\u{1F957}", "\u{1F958}", "\u{1F355}"], lucides: ["chef-hat", "utensils-cross", "soup"] },
      { rex: /shop|grocery|buy|order|market/i, emoji: "\u{1F6CD}\uFE0F", lucide: "shopping-bag", priority: 85, emojis: ["\u{1F6CD}\uFE0F", "\u{1F6D2}", "\u{1F4E6}"], lucides: ["shopping-bag", "store", "tag"] },
      { rex: /car|auto|vehicle|garage|drive/i, emoji: "\u{1F697}", lucide: "car-front", priority: 85, emojis: ["\u{1F697}", "\u{1F6B2}", "\u{1F3CD}\uFE0F"], lucides: ["car-front", "bike", "steering-wheel"] },
      // --- Professional & Academic ---
      { rex: /law|legal|court|justice|contract/i, emoji: "\u2696\uFE0F", lucide: "scale", priority: 95, lucides: ["scale", "gavel", "scroll"] },
      { rex: /med|doctor|health|clinic|hospital|surgery/i, emoji: "\u{1F3E5}", lucide: "stethoscope", priority: 95, lucides: ["stethoscope", "pill", "heart-pulse"] },
      { rex: /real-estate|property|house|rent|home/i, emoji: "\u{1F3E2}", lucide: "building-2", priority: 85, lucides: ["building-2", "home", "key-round"] },
      { rex: /interview|meeting|call|zoom|teams|hangout/i, emoji: "\u{1F91D}", lucide: "video", priority: 90, lucides: ["video", "phone-call", "users"] },
      // --- Entertainment & Social ---
      { rex: /game|steam|play|console|gaming/i, emoji: "\u{1F3AE}", lucide: "gamepad-2", priority: 85, emojis: ["\u{1F3AE}", "\u{1F579}\uFE0F", "\u{1F3B2}"], lucides: ["gamepad-2", "dices", "sword"] },
      { rex: /twitter|x\.com|tweet/i, emoji: "\u{1F426}", lucide: "simple-icons-twitter", priority: 110 },
      { rex: /facebook|\bfb\b/i, emoji: "\u{1F465}", lucide: "simple-icons-facebook", priority: 110 },
      { rex: /instagram|insta|\big\b/i, emoji: "\u{1F4F8}", lucide: "simple-icons-instagram", priority: 110 },
      { rex: /youtube|\byt\b/i, emoji: "\u{1F4FA}", lucide: "simple-icons-youtube", priority: 110 },
      { rex: /discord/i, emoji: "\u{1F4AC}", lucide: "simple-icons-discord", priority: 110 },
      { rex: /reddit/i, emoji: "\u{1F916}", lucide: "simple-icons-reddit", priority: 110 },
      { rex: /whatsapp|\bwa\b/i, emoji: "\u{1F4AC}", lucide: "simple-icons-whatsapp", priority: 110 },
      { rex: /telegram|\btg\b/i, emoji: "\u2708\uFE0F", lucide: "simple-icons-telegram", priority: 110 },
      { rex: /slack/i, emoji: "\u{1F4AC}", lucide: "simple-icons-slack", priority: 110 },
      { rex: /github|\bgit\b/i, emoji: "\u{1F419}", lucide: "simple-icons-github", priority: 110 },
      { rex: /linkedin/i, emoji: "\u{1F4BC}", lucide: "simple-icons-linkedin", priority: 110 },
      { rex: /tiktok/i, emoji: "\u{1F3B5}", lucide: "simple-icons-tiktok", priority: 110 },
      { rex: /pinterest|\bpin\b/i, emoji: "\u{1F4CC}", lucide: "simple-icons-pinterest", priority: 110 },
      { rex: /snapchat|\bsnap\b/i, emoji: "\u{1F47B}", lucide: "simple-icons-snapchat", priority: 110 },
      { rex: /twitch/i, emoji: "\u{1F3AE}", lucide: "simple-icons-twitch", priority: 110 },
      { rex: /social/i, emoji: "\u{1F310}", lucide: "globe", priority: 85, emojis: ["\u{1F310}", "\u{1F4F1}", "\u{1F5E8}\uFE0F"], lucides: ["globe", "share", "at-sign"] },
      { rex: /stream|twitch|netflix|disney|movie|film/i, emoji: "\u{1F3AC}", lucide: "clapperboard", priority: 85, emojis: ["\u{1F3AC}", "\u{1F37F}", "\u{1F4FA}"], lucides: ["clapperboard", "play", "film"] },
      // --- Newly Added Diverse Categories ---
      { rex: /space|astronomy|stars|universe|galaxy/i, emoji: "\u{1F30C}", lucide: "telescope", priority: 75, emojis: ["\u{1F30C}", "\u{1FA90}", "\u2604\uFE0F", "\u{1F6F8}"], lucides: ["telescope", "moon", "sun"] },
      { rex: /magic|fantasy|spell|witch|wizard/i, emoji: "\u2728", lucide: "wand-2", priority: 75, emojis: ["\u2728", "\u{1F52E}", "\u{1F9D9}"], lucides: ["wand-2", "sparkles", "stars"] },
      { rex: /hardware|pc|computer|build|components/i, emoji: "\u{1F5A5}\uFE0F", lucide: "cpu", priority: 75, emojis: ["\u{1F5A5}\uFE0F", "\u2328\uFE0F", "\u{1F5B1}\uFE0F"], lucides: ["cpu", "hard-drive", "memory-stick"] },
      { rex: /design-system|tokens|components|assets|brand/i, emoji: "\u{1F485}", lucide: "brush", priority: 90, emojis: ["\u{1F485}", "\u{1F3A8}", "\u{1F4D0}"], lucides: ["brush", "swatch-book", "palette"] },
      { rex: /podcast|interview|audiobook|listen/i, emoji: "\u{1F399}\uFE0F", lucide: "mic", priority: 80, emojis: ["\u{1F399}\uFE0F", "\u{1F3A7}", "\u{1F4FB}"], lucides: ["mic", "headphones", "radio"] },
      { rex: /recipe|baking|dessert|sweets|cake/i, emoji: "\u{1F370}", lucide: "cake", priority: 85, emojis: ["\u{1F370}", "\u{1F36A}", "\u{1F9C1}"], lucides: ["cake", "cookie"] },
      { rex: /fitness|workout|run|marathon|lift/i, emoji: "\u{1F3C3}", lucide: "dumbbell", priority: 85, emojis: ["\u{1F3C3}", "\u{1F3CB}\uFE0F", "\u{1F6B4}"], lucides: ["dumbbell", "activity", "heart"] },
      { rex: /journal|thoughts|diary|reflection/i, emoji: "\u{1F4D4}", lucide: "book-heart", priority: 85, emojis: ["\u{1F4D4}", "\u{1F4AD}", "\u270D\uFE0F"], lucides: ["book-heart", "pen-tool"] },
      { rex: /habit|routine|cue|cycle/i, emoji: "\u{1F504}", lucide: "repeat", priority: 90, emojis: ["\u{1F504}", "\u{1F4C5}", "\u26A1"], lucides: ["repeat", "calendar-check", "activity"] },
      { rex: /metaphor|analogy|concept|philosophy/i, emoji: "\u{1F4A1}", lucide: "sparkles", priority: 85, emojis: ["\u{1F4A1}", "\u2728", "\u{1F9E0}"], lucides: ["sparkles", "brain", "lightbulb"] },
      { rex: /remember|memory|recall|mind/i, emoji: "\u{1F9E0}", lucide: "brain-circuit", priority: 90, emojis: ["\u{1F9E0}", "\u{1F4A1}", "\u{1F4BE}"], lucides: ["brain-circuit", "brain", "hard-drive"] },
      { rex: /thesaurus|dictionary|vocabulary|word/i, emoji: "\u{1F4D6}", lucide: "book-open-check", priority: 90, emojis: ["\u{1F4D6}", "\u{1F4DA}", "\u{1F524}"], lucides: ["book-open-check", "spell-check", "languages"] },
      { rex: /estimate|underestimate|measure|math|scale/i, emoji: "\u{1F4D0}", lucide: "gauge", priority: 85, emojis: ["\u{1F4D0}", "\u2696\uFE0F", "\u{1F4CA}"], lucides: ["gauge", "calculator", "ruler"] },
      { rex: /metadata|attribute|property|tag|meta/i, emoji: "\u{1F3F7}\uFE0F", lucide: "tags", priority: 90, emojis: ["\u{1F3F7}\uFE0F", "\u{1F516}", "\u{1F511}"], lucides: ["tags", "tag", "file-key"] },
      // --- Sentences, Quotes, Wisdom, Philosophy & Narrative Stories ---
      { rex: /generate\s*ideas|ideation|brainstorm|idea\s*generation|new\s*ideas|idea|ideas/i, emoji: "\u{1F4A1}", lucide: "lightbulb", priority: 140, emojis: ["\u{1F4A1}", "\u2728", "\u{1F9E0}"], lucides: ["lightbulb", "brain", "sparkles"] },
      { rex: /higher-order|higher\s*order|order\s*of\s*magnitude|structural\s*order/i, emoji: "\u{1F95E}", lucide: "layers", priority: 130, emojis: ["\u{1F95E}", "\u{1F578}\uFE0F", "\u{1F333}"], lucides: ["layers", "git-branch", "network", "list-tree"] },
      { rex: /underestimate|how\s*long.*takes|time\s*estimate|estimation\s*fallacy|chronically/i, emoji: "\u23F3", lucide: "hourglass", priority: 130, emojis: ["\u23F3", "\u{1F552}", "\u23F1\uFE0F"], lucides: ["hourglass", "clock", "calendar-clock", "timer"] },
      { rex: /remember|mnemonic|memory\s*technique|stir|recall\s*more/i, emoji: "\u{1F9E0}", lucide: "brain", priority: 130, emojis: ["\u{1F9E0}", "\u{1F4A1}", "\u{1F4BE}"], lucides: ["brain", "brain-circuit", "lightbulb"] },
      { rex: /wu\s*wei|daoism|effortless\s*action/i, emoji: "\u2728", lucide: "sparkles", priority: 130, emojis: ["\u2728", "\u{1F9ED}", "\u{1F343}"], lucides: ["sparkles", "compass", "wind", "leaf"] },
      { rex: /yin\s*(and|&)?\s*yang|dualism|balance/i, emoji: "\u262F\uFE0F", lucide: "scale", priority: 130, emojis: ["\u262F\uFE0F", "\u2696\uFE0F", "\u{1F313}"], lucides: ["scale", "sun-moon", "circle-dot"] },
      { rex: /vulnerability|vulnerable|openness/i, emoji: "\u2764\uFE0F", lucide: "heart", priority: 130, emojis: ["\u2764\uFE0F", "\u{1F513}", "\u{1F6E1}\uFE0F"], lucides: ["heart", "shield-off", "unlock", "eye"] },
      { rex: /trust\s*(the)?\s*process|process\s*of\s*growth|patience/i, emoji: "\u{1F9ED}", lucide: "compass", priority: 130, emojis: ["\u{1F9ED}", "\u{1F4C8}", "\u23F3"], lucides: ["compass", "trending-up", "hourglass", "footprints"] },
      { rex: /use\s*it\s*or\s*lose\s*it|maintenance|decay/i, emoji: "\u{1F504}", lucide: "repeat", priority: 130, emojis: ["\u{1F504}", "\u{1F525}", "\u26A1"], lucides: ["repeat", "flame", "activity", "zap"] },
      { rex: /words.*habits|habit|habits|routine/i, emoji: "\u{1F504}", lucide: "repeat", priority: 125, emojis: ["\u{1F504}", "\u{1F4C5}", "\u26A1"], lucides: ["repeat", "calendar-check", "activity", "target"] },
      { rex: /wander|lost|voyage|journey|path|step|road|destination|miles|hike|flight/i, emoji: "\u{1F9ED}", lucide: "compass", priority: 110, emojis: ["\u{1F9ED}", "\u{1F4CD}", "\u{1F5FA}\uFE0F"], lucides: ["compass", "map-pin", "map", "route"] },
      { rex: /story|narrative|untold|tale|legend|prose|fiction|author|script/i, emoji: "\u{1F4DC}", lucide: "pen-tool", priority: 110, emojis: ["\u{1F4DC}", "\u{1FAB6}", "\u{1F4D6}"], lucides: ["pen-tool", "book-open", "feather", "scroll", "file-text"] },
      { rex: /imagination|illusion|truth|vision|preview|attraction|wonder|amazed|spark/i, emoji: "\u2728", lucide: "sparkles", priority: 110, emojis: ["\u2728", "\u{1F4A1}", "\u{1F9E0}", "\u2B50"], lucides: ["sparkles", "lightbulb", "brain", "wand-2", "star", "eye"] },
      { rex: /agony|emotion|feeling|heart|soul|cherished|upset|love|mood/i, emoji: "\u2764\uFE0F", lucide: "heart", priority: 110, emojis: ["\u2764\uFE0F", "\u{1F496}", "\u{1F4AD}"], lucides: ["heart", "sparkles", "smile", "activity"] },
      { rex: /quote|saying|proverb|aphorism|wisdom|philosophy|reflection|mindset|lesson|meaning|to-be/i, emoji: "\u{1F4AC}", lucide: "quote", priority: 115, emojis: ["\u{1F4AC}", "\u{1F4A1}", "\u2728"], lucides: ["quote", "sparkles", "lightbulb", "compass", "book-open", "brain"] },
      { rex: /eat|hungrier|food|feast|meal|utensil/i, emoji: "\u{1F37D}\uFE0F", lucide: "utensils", priority: 110, emojis: ["\u{1F37D}\uFE0F", "\u{1F372}", "\u{1F34E}"], lucides: ["utensils", "soup", "chef-hat"] },
      { rex: /future|distributed|innovation|cyber|tech/i, emoji: "\u{1F680}", lucide: "rocket", priority: 110, emojis: ["\u{1F680}", "\u26A1", "\u{1F52E}"], lucides: ["rocket", "zap", "cpu", "globe"] }
    ];
    PACK_PRIORITY = {
      "custom": 100,
      // 1. Unique brand assets
      "lucide": 90,
      // 2. Main UI baseline (Modern, sharp, highly consistent)
      "tabler": 80,
      // 3. Main UI fallback (Massive library, same aesthetic)
      "simple-icons": 70,
      // 4. Brands only (Logos for Google, GitHub, etc.)
      "remix": 60,
      // 5. Secondary fallback
      "bi": 55,
      // 6. Bootstrap Icons (large general-purpose library)
      "feather": 50,
      // 7. Deprecated (Lucide is the upgraded version)
      "font-awesome": 40,
      // 8. Utility fallback (Heavy, traditional style)
      "material": 30
      // 9. Geometric fallback (Different design language)
    };
    STOP_WORDS = /* @__PURE__ */ new Set([
      "a",
      "an",
      "the",
      "and",
      "or",
      "but",
      "if",
      "because",
      "as",
      "until",
      "while",
      "of",
      "at",
      "by",
      "for",
      "with",
      "about",
      "against",
      "between",
      "into",
      "through",
      "during",
      "before",
      "after",
      "above",
      "below",
      "to",
      "from",
      "up",
      "upon",
      "down",
      "in",
      "out",
      "on",
      "off",
      "over",
      "under",
      "again",
      "further",
      "then",
      "once",
      "here",
      "there",
      "when",
      "where",
      "why",
      "how",
      "all",
      "any",
      "both",
      "each",
      "few",
      "more",
      "most",
      "other",
      "some",
      "such",
      "no",
      "nor",
      "not",
      "only",
      "own",
      "same",
      "so",
      "than",
      "too",
      "very",
      "s",
      "t",
      "can",
      "will",
      "just",
      "don",
      "should",
      "now",
      "is",
      "are",
      "was",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "having",
      "do",
      "does",
      "did",
      "doing",
      "works",
      "worked",
      "working",
      "work",
      "folder",
      "file",
      "notes",
      "thoughts",
      "draft",
      "list",
      "page",
      "doc",
      "text",
      "directory",
      "items",
      "item"
    ]);
    GENERIC_SUFFIX_WORDS = /* @__PURE__ */ new Set([
      "programming",
      "program",
      "project",
      "projects",
      "notes",
      "note",
      "thoughts",
      "draft",
      "drafts",
      "tutorial",
      "tutorials",
      "guide",
      "guides",
      "course",
      "courses",
      "class",
      "classes",
      "management",
      "system",
      "systems",
      "app",
      "apps",
      "application",
      "applications",
      "service",
      "services",
      "module",
      "modules",
      "repo",
      "repository",
      "structure",
      "architecture",
      "overview",
      "summary",
      "basics",
      "advanced",
      "intro",
      "introduction",
      "practice",
      "exercise",
      "exercises",
      "examples",
      "example",
      "demo",
      "test",
      "tests",
      "testing",
      "doc",
      "docs",
      "document",
      "documents",
      "file",
      "files",
      "folder",
      "folders",
      "list",
      "page",
      "pages",
      "item",
      "items",
      "stuff",
      "misc"
    ]);
  }
});

// src/common/utils.ts
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
function stemWord(word) {
  if (!word || word.length <= 3) return word;
  let s = word.toLowerCase();
  if (s.endsWith("ing") && s.length > 5) {
    s = s.slice(0, -3);
  } else if (s.endsWith("ed") && s.length > 4) {
    s = s.slice(0, -2);
  } else if (s.endsWith("es") && s.length > 4) {
    s = s.slice(0, -2);
  } else if (s.endsWith("s") && !s.endsWith("ss") && s.length > 3) {
    s = s.slice(0, -1);
  }
  return s;
}
function stripIconPrefix(iconId) {
  if (!iconId) return "";
  return iconId.trim().toLowerCase().replace(ICON_PREFIX_REGEX, "");
}
function stripIconVariantSuffix(iconId) {
  if (!iconId) return "";
  return iconId.trim().toLowerCase().replace(ICON_VARIANT_SUFFIX_REGEX, "");
}
function extractCoreIconKeyword(iconId) {
  const noPrefix = stripIconPrefix(iconId);
  const core = stripIconVariantSuffix(noPrefix);
  return { noPrefix, core };
}
var ICON_PREFIX_REGEX, ICON_VARIANT_SUFFIX_REGEX;
var init_utils = __esm({
  "src/common/utils.ts"() {
    ICON_PREFIX_REGEX = /^(si|simple|simple-icons|simpleicons|feather|fa|fas|far|fab|fontawesome|ri|remix|remixicons|tb|tabler|mdi|material|oct|octicons|lucide|bx|bxs|bxm|ph|heroicons|cf)[-_:]/i;
    ICON_VARIANT_SUFFIX_REGEX = /[-_:](line|fill|filled|outline|outlined|solid|regular|bold|light|duotone|alt|off|2|3|1|plus|sharp|rounded|circle|square)$/i;
  }
});

// src/core/IconPackIndex.ts
var IconPackIndex;
var init_IconPackIndex = __esm({
  "src/core/IconPackIndex.ts"() {
    init_constants();
    init_utils();
    IconPackIndex = class {
      exactMap = /* @__PURE__ */ new Map();
      coreMap = /* @__PURE__ */ new Map();
      suffixMap = /* @__PURE__ */ new Map();
      allKeys = [];
      isBuilt = false;
      _localRef = void 0;
      _customRef = void 0;
      _localCount = -1;
      _customCount = -1;
      getPackPriority(iconKey) {
        const lower = iconKey.toLowerCase();
        for (const [pack, prio] of Object.entries(PACK_PRIORITY)) {
          if (lower.startsWith(pack) || lower.includes(`-${pack}-`) || lower.includes(`/${pack}/`)) {
            return prio;
          }
        }
        return 10;
      }
      build(localIcons, customIcons) {
        const localCount = localIcons ? Object.keys(localIcons).length : 0;
        const customCount = customIcons ? Object.keys(customIcons).length : 0;
        if (this.isBuilt && this._localRef === localIcons && this._customRef === customIcons && this._localCount === localCount && this._customCount === customCount) {
          return;
        }
        this._localRef = localIcons;
        this._customRef = customIcons;
        this._localCount = localCount;
        this._customCount = customCount;
        this.exactMap.clear();
        this.coreMap.clear();
        this.suffixMap.clear();
        this.allKeys = [];
        const addIconKey = (key, value) => {
          const lKey = key.toLowerCase();
          this.allKeys.push(value);
          if (!this.exactMap.has(lKey)) {
            this.exactMap.set(lKey, value);
          }
          const { noPrefix, core } = extractCoreIconKeyword(lKey);
          if (noPrefix && !this.exactMap.has(noPrefix)) {
            this.exactMap.set(noPrefix, value);
          }
          if (core) {
            const existing = this.coreMap.get(core);
            if (!existing) {
              this.coreMap.set(core, value);
            } else {
              const existingPrio = this.getPackPriority(existing);
              const newPrio = this.getPackPriority(value);
              if (newPrio > existingPrio) {
                this.coreMap.set(core, value);
              }
            }
          }
          const lastDash = lKey.lastIndexOf("-");
          const lastSlash = lKey.lastIndexOf("/");
          const splitIdx = Math.max(lastDash, lastSlash);
          if (splitIdx > 0 && splitIdx < lKey.length - 1) {
            const suffix = lKey.substring(splitIdx + 1);
            if (!this.suffixMap.has(suffix)) {
              this.suffixMap.set(suffix, value);
            }
          }
        };
        if (customIcons) {
          for (const key of Object.keys(customIcons)) {
            addIconKey(key, key);
          }
        }
        if (localIcons) {
          for (const key of Object.keys(localIcons)) {
            if (localIcons[key]) {
              addIconKey(key, key);
            }
          }
        }
        this.isBuilt = true;
      }
      findIcon(searchKey) {
        if (!this.isBuilt) return null;
        const s = searchKey.toLowerCase().replace(/[\s_:]+/g, "-").replace(/\//g, "-");
        const { noPrefix, core } = extractCoreIconKeyword(s);
        if (this.exactMap.has(s)) return this.exactMap.get(s) || null;
        if (noPrefix && this.exactMap.has(noPrefix)) return this.exactMap.get(noPrefix) || null;
        if (core && this.exactMap.has(core)) return this.exactMap.get(core) || null;
        if (core && this.coreMap.has(core)) {
          return this.coreMap.get(core) || null;
        }
        if (noPrefix && this.coreMap.has(noPrefix)) {
          return this.coreMap.get(noPrefix) || null;
        }
        if (core && this.suffixMap.has(core)) {
          return this.suffixMap.get(core) || null;
        }
        if (noPrefix && this.suffixMap.has(noPrefix)) {
          return this.suffixMap.get(noPrefix) || null;
        }
        if (this.suffixMap.has(s)) {
          return this.suffixMap.get(s) || null;
        }
        return null;
      }
      searchFuzzy(searchKey, options) {
        if (!this.isBuilt || !searchKey) return null;
        const exact = this.findIcon(searchKey);
        if (exact) return exact;
        if (searchKey.length < 3) return null;
        const threshold = options?.threshold ?? 0.8;
        const normKey = searchKey.toLowerCase().trim();
        const maxLenDiffRatio = 1 - threshold;
        let bestMatch = null;
        let bestScore = 0;
        for (const candidateKey of this.allKeys) {
          const candidateLower = candidateKey.toLowerCase();
          const lenA = normKey.length;
          const lenB = candidateLower.length;
          const maxLen = Math.max(lenA, lenB);
          if (Math.abs(lenA - lenB) / maxLen > maxLenDiffRatio) {
            continue;
          }
          const score = this.calculateSimilarity(normKey, candidateLower);
          if (score >= threshold && score > bestScore) {
            bestScore = score;
            bestMatch = candidateKey;
            if (bestScore >= 0.95) break;
          }
        }
        return bestMatch;
      }
      calculateSimilarity(a, b) {
        if (a === b) return 1;
        if (!a || !b) return 0;
        const { core: coreA, noPrefix: npA } = extractCoreIconKeyword(a);
        const { core: coreB, noPrefix: npB } = extractCoreIconKeyword(b);
        if (coreA && coreB && coreA === coreB) return 0.95;
        if (npA && npB && npA === npB) return 0.95;
        const wordsB = b.split(/[-_: ]+/);
        if (b.startsWith(a) || a.startsWith(b) || wordsB.includes(a)) {
          const minLen = Math.min(a.length, b.length);
          if (minLen >= 4) return 0.85;
        }
        const dist = this.levenshteinDistance(a, b);
        const maxLen = Math.max(a.length, b.length);
        return maxLen === 0 ? 1 : 1 - dist / maxLen;
      }
      levenshteinDistance(a, b) {
        if (a === b) return 0;
        const lenA = a.length;
        const lenB = b.length;
        if (lenA === 0) return lenB;
        if (lenB === 0) return lenA;
        let prev = new Int32Array(lenB + 1);
        let curr = new Int32Array(lenB + 1);
        for (let j = 0; j <= lenB; j++) prev[j] = j;
        for (let i = 1; i <= lenA; i++) {
          curr[0] = i;
          const charA = a.charCodeAt(i - 1);
          for (let j = 1; j <= lenB; j++) {
            const cost = charA === b.charCodeAt(j - 1) ? 0 : 1;
            curr[j] = Math.min(
              curr[j - 1] + 1,
              prev[j] + 1,
              prev[j - 1] + cost
            );
          }
          const temp = prev;
          prev = curr;
          curr = temp;
        }
        return prev[lenB];
      }
      getIsBuilt() {
        return this.isBuilt;
      }
      invalidate() {
        this.isBuilt = false;
        this._localRef = void 0;
        this._customRef = void 0;
        this._localCount = -1;
        this._customCount = -1;
        this.exactMap.clear();
        this.coreMap.clear();
        this.suffixMap.clear();
        this.allKeys = [];
      }
    };
  }
});

// src/common/LRUCache.ts
var LRUCache;
var init_LRUCache = __esm({
  "src/common/LRUCache.ts"() {
    LRUCache = class {
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
          for (const keyToEvict of this.map.keys()) {
            this.map.delete(keyToEvict);
            break;
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
      get size() {
        return this.map.size;
      }
    };
  }
});

// src/core/CategoryTrie.ts
function createTrieNode() {
  return { children: /* @__PURE__ */ new Map(), categories: [] };
}
var CategoryTrie;
var init_CategoryTrie = __esm({
  "src/core/CategoryTrie.ts"() {
    CategoryTrie = class {
      root = createTrieNode();
      fallbackCategories = [];
      build(categories) {
        this.root = createTrieNode();
        this.fallbackCategories = [];
        for (const cat of categories) {
          const source = cat.rex.source.toLowerCase();
          let isLiteralInserted = false;
          if (source.includes("\\d") || source.includes("0-9") || /19\|20/.test(source)) {
            for (let d = 0; d <= 9; d++) {
              this.insertWord(String(d), cat);
            }
            isLiteralInserted = true;
          }
          const wordTokens = source.match(/[a-z0-9]+/g);
          if (wordTokens && wordTokens.length > 0 && !source.startsWith(".") && !source.startsWith("\\")) {
            for (const word of wordTokens) {
              if (word.length >= 2 && !["or", "and", "in", "of", "to", "for"].includes(word)) {
                this.insertWord(word, cat);
                isLiteralInserted = true;
              }
            }
          }
          if (!isLiteralInserted) {
            this.fallbackCategories.push(cat);
          }
        }
      }
      insertWord(word, cat) {
        let node = this.root;
        for (let i = 0; i < word.length; i++) {
          const ch = word.charAt(i);
          let child = node.children.get(ch);
          if (!child) {
            child = createTrieNode();
            node.children.set(ch, child);
          }
          node = child;
          if (!node.categories.includes(cat)) {
            node.categories.push(cat);
          }
        }
      }
      lookup(name) {
        if (!name) return this.fallbackCategories;
        const words = name.toLowerCase().split(/[^\p{L}\p{N}]+/gu);
        const matchedSet = /* @__PURE__ */ new Set();
        for (const word of words) {
          if (!word) continue;
          let node = this.root;
          for (let i = 0; i < word.length; i++) {
            const ch = word.charAt(i);
            const nextNode = node.children.get(ch);
            if (!nextNode) break;
            node = nextNode;
            for (const cat of node.categories) {
              matchedSet.add(cat);
            }
          }
        }
        const results = Array.from(matchedSet);
        for (const fb of this.fallbackCategories) {
          if (!matchedSet.has(fb)) {
            results.push(fb);
          }
        }
        results.sort((a, b) => (b.priority || 0) - (a.priority || 0));
        return results;
      }
    };
  }
});

// src/core/IconRepository.ts
var IconRepository_exports = {};
__export(IconRepository_exports, {
  IconRepository: () => IconRepository
});
var obsidian, IconRepository;
var init_IconRepository = __esm({
  "src/core/IconRepository.ts"() {
    obsidian = __toESM(require_obsidian_stub());
    init_constants();
    init_utils();
    init_IconPackIndex();
    init_LRUCache();
    init_CategoryTrie();
    IconRepository = class {
      plugin;
      _customRulesCache = [];
      _categoryCache = null;
      _categoryTrie = new CategoryTrie();
      _customRulesKey = "";
      _normCache = new LRUCache(2048);
      _dataUriCache = new LRUCache(2048);
      _findPackIconCache = new LRUCache(2048);
      _autoIconResultCache = new LRUCache(4096);
      _packIndex = new IconPackIndex();
      _domParser = typeof DOMParser !== "undefined" ? new DOMParser() : null;
      constructor(plugin) {
        this.plugin = plugin;
      }
      getAutoIconData(name, path) {
        if (!name) return null;
        const cacheKey = path ? `${name}::${path}` : name;
        const hit = this._autoIconResultCache.get(cacheKey);
        if (hit !== void 0) {
          return hit;
        }
        const result = this._computeAutoIconData(name, path);
        this._autoIconResultCache.set(cacheKey, result);
        return result;
      }
      _computeAutoIconData(name, path) {
        if (path && path.endsWith(".md") && this.plugin.app?.vault && this.plugin.app?.metadataCache) {
          const file = this.plugin.app.vault.getAbstractFileByPath(path);
          if (file instanceof obsidian.TFile) {
            const cache = this.plugin.app.metadataCache.getFileCache(file);
            if (cache?.frontmatter) {
              const fm = cache.frontmatter;
              const fmIcon = fm.icon || fm.iconId || fm.emoji || fm["icon-id"];
              if (fmIcon && typeof fmIcon === "string" && fmIcon.trim().length > 0) {
                const cleanFmIcon = fmIcon.trim();
                return {
                  tier: 0,
                  rex: /.*/,
                  emoji: cleanFmIcon,
                  lucide: cleanFmIcon,
                  priority: 2500,
                  isCustom: true,
                  packSource: "frontmatter"
                };
              }
            }
            const tags = [];
            if (cache?.frontmatter?.tags) {
              const rawTags = cache.frontmatter.tags;
              const fmTags = Array.isArray(rawTags) ? rawTags.map((t) => String(t)) : typeof rawTags === "string" ? rawTags.split(",").map((t) => t.trim()) : [];
              tags.push(...fmTags);
            }
            if (cache?.tags) {
              for (const tObj of cache.tags) {
                if (tObj.tag) tags.push(tObj.tag);
              }
            }
            if (tags.length > 0) {
              const uniqueTags = Array.from(new Set(tags.map((t) => t.replace(/^#/, "").trim().toLowerCase()))).filter((t) => t.length > 0);
              for (const tag of uniqueTags) {
                const tagIcon = this.getAutoIconData(tag);
                if (tagIcon) {
                  return {
                    ...tagIcon,
                    tier: 0.5,
                    packSource: "tag-sync"
                  };
                }
              }
            }
          }
        }
        if (path) {
          const extMatch = path.match(/\.([a-z0-9]+)$/i);
          if (extMatch) {
            const ext = extMatch[1].toLowerCase();
            const EXTENSION_ICON_MAP = {
              "pdf": "file-text",
              "png": "image",
              "jpg": "image",
              "jpeg": "image",
              "gif": "image",
              "svg": "image",
              "webp": "image",
              "bmp": "image",
              "mp4": "video",
              "mkv": "video",
              "mov": "video",
              "avi": "video",
              "webm": "video",
              "mp3": "music",
              "wav": "music",
              "flac": "music",
              "ogg": "music",
              "m4a": "music",
              "js": "code",
              "ts": "code",
              "py": "code",
              "html": "code",
              "css": "code",
              "json": "code",
              "cpp": "code",
              "rs": "code",
              "go": "code",
              "zip": "package",
              "tar": "package",
              "gz": "package",
              "7z": "package",
              "rar": "package",
              "csv": "bar-chart-2",
              "xlsx": "bar-chart-2",
              "xls": "bar-chart-2",
              "tsv": "bar-chart-2"
            };
            if (ext !== "md" && EXTENSION_ICON_MAP[ext]) {
              const iconId = EXTENSION_ICON_MAP[ext];
              return {
                tier: 0.7,
                rex: new RegExp(`\\.${ext}$`, "i"),
                emoji: iconId,
                lucide: iconId,
                priority: 2e3,
                packSource: "file-extension"
              };
            }
          }
        }
        const lName = name.toLowerCase();
        const settings = this.plugin.settings;
        const currentKey = settings.customIconRules || "";
        if (!this._categoryCache || this._customRulesKey !== currentKey) {
          const categories = [...AUTO_ICON_CATEGORIES];
          const customRules = [];
          if (currentKey) {
            const rules = currentKey.split("\n").filter((r) => r.trim());
            for (const rule of rules) {
              try {
                const mainParts = rule.split("=").map((p) => p.trim());
                if (mainParts.length < 2) continue;
                const pattern = mainParts[0];
                let secondHalf = mainParts[1];
                let priority = 1500;
                if (secondHalf.includes("@")) {
                  const prioParts = secondHalf.split("@").map((p) => p.trim());
                  secondHalf = prioParts[0];
                  priority = parseInt(prioParts[1]) || 1500;
                }
                const isRegexMeta = /[.*+?^${}()|[\]\\]/.test(pattern);
                const rex = isRegexMeta ? new RegExp(pattern, "i") : new RegExp(`^${pattern}$|\\b${pattern}\\b|${pattern}`, "i");
                const ruleData = {
                  rex,
                  emoji: secondHalf,
                  lucide: secondHalf,
                  priority,
                  isCustom: true
                };
                customRules.push(ruleData);
                categories.push(ruleData);
              } catch (e) {
                console.error("Colorful Folders: Failed to parse custom icon rule", rule, e);
              }
            }
          }
          customRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
          categories.sort((a, b) => (b.priority || 0) - (a.priority || 0));
          this._customRulesCache = customRules;
          this._categoryCache = categories;
          this._categoryTrie.build(categories);
          this._customRulesKey = currentKey;
        }
        let sanitized = lName.trim();
        const dotIdx = sanitized.lastIndexOf(".");
        if (dotIdx > 0 && sanitized.length - dotIdx <= 5) {
          sanitized = sanitized.substring(0, dotIdx);
        }
        const cleanSanitized = sanitized.replace(/[^\p{L}\p{N}\s_-]/gu, "").trim();
        const fullHyphenated = sanitized.replace(/[\s_]+/g, "-");
        const cleanHyphenated = cleanSanitized.replace(/[\s_]+/g, "-");
        const parentFolder = path ? path.split("/").slice(-2, -1)[0] : "";
        const searchContexts = [lName];
        if (sanitized && sanitized !== lName) searchContexts.push(sanitized);
        if (cleanSanitized && cleanSanitized !== sanitized && cleanSanitized !== lName) searchContexts.push(cleanSanitized);
        if (parentFolder && parentFolder.toLowerCase() !== "root") {
          searchContexts.push(parentFolder.toLowerCase());
        }
        if (this._customRulesCache && this._customRulesCache.length > 0) {
          for (const ctx of searchContexts) {
            for (const rule of this._customRulesCache) {
              if (rule.rex.test(ctx)) {
                return {
                  ...rule,
                  tier: 1,
                  packSource: "custom-rule"
                };
              }
            }
          }
        }
        const exactMatchedIconId = this.findIconInPacks(fullHyphenated) || (cleanHyphenated ? this.findIconInPacks(cleanHyphenated) : null);
        if (exactMatchedIconId) {
          const safeRexStr = sanitized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return {
            tier: 1,
            rex: new RegExp(`^${safeRexStr}$`, "i"),
            emoji: exactMatchedIconId,
            lucide: exactMatchedIconId,
            priority: 1800,
            isCustom: true,
            packSource: exactMatchedIconId.includes("-") ? exactMatchedIconId.split("-")[0] : "custom"
          };
        }
        for (const ctx of searchContexts) {
          const candidateCategories = this._categoryTrie.lookup(ctx);
          for (let i = 0; i < candidateCategories.length; i++) {
            const cat = candidateCategories[i];
            if (cat.rex.test(ctx)) {
              const tierVal = cat.isCustom ? 2 : 3;
              const match = { ...cat, tier: tierVal, packSource: cat.isCustom ? "custom-rule" : "category-default" };
              if (settings.autoIconVariety) {
                const h = hashString(name);
                if (match.emojis && match.emojis.length > 0) {
                  match.emoji = match.emojis[h % match.emojis.length];
                }
                if (match.lucides && match.lucides.length > 0) {
                  match.lucide = match.lucides[h % match.lucides.length];
                }
              }
              return match;
            }
          }
        }
        let fuzzyMatchedIconId = null;
        const words = sanitized.split(/[^\p{L}\p{N}]+/gu).map((w) => w.toLowerCase()).filter((w) => w.length >= 1 && !STOP_WORDS.has(w));
        const domainWords = words.filter((w) => !GENERIC_SUFFIX_WORDS.has(w));
        const suffixWords = words.filter((w) => GENERIC_SUFFIX_WORDS.has(w));
        for (let i = 0; i < words.length - 1; i++) {
          const w1 = stemWord(words[i]);
          const w2 = stemWord(words[i + 1]);
          const pair = `${w1}-${w2}`;
          const matched = this.findIconInPacks(pair);
          if (matched) {
            fuzzyMatchedIconId = matched;
            break;
          }
        }
        if (!fuzzyMatchedIconId) {
          for (let i = domainWords.length - 1; i >= 0; i--) {
            const stemmed = stemWord(domainWords[i]);
            const matched = this.findIconInPacks(stemmed) || this.findIconInPacks(domainWords[i]);
            if (matched) {
              fuzzyMatchedIconId = matched;
              break;
            }
          }
        }
        if (!fuzzyMatchedIconId) {
          for (let i = suffixWords.length - 1; i >= 0; i--) {
            const stemmed = stemWord(suffixWords[i]);
            const matched = this.findIconInPacks(stemmed) || this.findIconInPacks(suffixWords[i]);
            if (matched) {
              fuzzyMatchedIconId = matched;
              break;
            }
          }
        }
        if (fuzzyMatchedIconId) {
          const safeRexStr = sanitized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          return {
            tier: 4,
            rex: new RegExp(`^${safeRexStr}$`, "i"),
            emoji: fuzzyMatchedIconId,
            lucide: fuzzyMatchedIconId,
            priority: 50,
            packSource: fuzzyMatchedIconId.includes("-") ? fuzzyMatchedIconId.split("-")[0] : "fuzzy-match"
          };
        }
        return null;
      }
      findIconInPacks(searchKey) {
        if (!searchKey) return null;
        const hit = this._findPackIconCache.get(searchKey);
        if (hit !== void 0) {
          return hit;
        }
        const local = this.plugin.localFileSystemIcons;
        const custom = this.plugin.settings.customIcons;
        if (!this._packIndex.getIsBuilt()) {
          this._packIndex.build(local, custom);
        }
        const result = this._packIndex.findIcon(searchKey);
        this._findPackIconCache.set(searchKey, result);
        if (this.plugin.settings.iconDebugMode) {
          console.debug(`ColorfulFolders: Search icon match for "${searchKey}": ${result}`);
        }
        return result;
      }
      searchFuzzy(searchKey, options) {
        if (!searchKey) return null;
        const local = this.plugin.localFileSystemIcons;
        const custom = this.plugin.settings.customIcons;
        if (!this._packIndex.getIsBuilt()) {
          this._packIndex.build(local, custom);
        }
        return this._packIndex.searchFuzzy(searchKey, options);
      }
      isEmojiIcon(iconId) {
        if (!iconId) return false;
        if (this.plugin.localFileSystemIcons) {
          const lId = iconId.toLowerCase();
          const cleanId = lId.replace(/^lucide-/, "");
          const hyphenated = lId.replace(/[\s_]+/g, "-").replace(/\//g, "-");
          if (this.plugin.localFileSystemIcons[iconId] || this.plugin.localFileSystemIcons[lId] || this.plugin.localFileSystemIcons[cleanId] || this.plugin.localFileSystemIcons[hyphenated]) {
            return false;
          }
        }
        if (this.plugin.settings.customIcons && (this.plugin.settings.customIcons[iconId] || this.plugin.settings.customIcons[iconId.toLowerCase()])) {
          return false;
        }
        if (obsidian.getIconIds?.().includes(`lucide-${iconId}`) || obsidian.getIconIds?.().includes(iconId)) {
          return false;
        }
        if (/[a-zA-Z]/.test(iconId)) {
          return false;
        }
        return /\p{Extended_Pictographic}|\p{Emoji_Presentation}/u.test(iconId);
      }
      getIconSvg(iconId, shouldEncode = true) {
        if (!iconId) return "";
        const cacheKey = `${iconId}-${shouldEncode ? "enc" : "raw"}`;
        if (this.plugin.iconCache) {
          const cached = this.plugin.iconCache.get(cacheKey);
          if (cached) return cached;
        }
        let svgStr = "";
        const custom = this.plugin.settings.customIcons;
        const local = this.plugin.localFileSystemIcons;
        if (custom) {
          svgStr = custom[iconId] || custom[iconId.toLowerCase()] || "";
        }
        if (!svgStr && local) {
          const lId = iconId.toLowerCase();
          const cleanId = lId.replace(/^lucide-/, "");
          const hyphenated = lId.replace(/[\s_:]+/g, "-").replace(/\//g, "-");
          svgStr = local[iconId] || local[lId] || local[cleanId] || local[hyphenated] || "";
          if (!svgStr) {
            const baseName = stripIconPrefix(lId);
            if (local[baseName]) {
              svgStr = local[baseName];
            } else {
              const matchedKey = this.findIconInPacks(baseName);
              if (matchedKey && local[matchedKey]) {
                svgStr = local[matchedKey];
              }
            }
          }
        }
        if (!svgStr) {
          const candidateIds = [
            iconId,
            iconId.toLowerCase(),
            iconId.replace(/^lucide-/, ""),
            `lucide-${iconId}`,
            iconId.replace(/:/g, "-"),
            iconId.replace(/-/g, ":")
          ];
          for (const cand of candidateIds) {
            const svgEl = obsidian.getIcon(cand);
            if (svgEl) {
              svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
              svgStr = svgEl.outerHTML;
              break;
            }
          }
        }
        if (svgStr) {
          const normalized = this.normalizeSvg(svgStr, shouldEncode);
          if (this.plugin.iconCache) {
            this.plugin.iconCache.set(cacheKey, normalized);
          }
          const altKey = (shouldEncode ? "0:" : "1:") + iconId;
          if (this.plugin.iconCache && !this.plugin.iconCache.has(altKey)) {
            const altNorm = this.normalizeSvg(svgStr, !shouldEncode);
            this.plugin.iconCache.set(altKey, altNorm);
          }
          return normalized;
        }
        return "";
      }
      preNormalizeIcon(id, rawSvg) {
        if (!id || !rawSvg) return;
        const normEncoded = this.normalizeSvg(rawSvg, true);
        const normRaw = this.normalizeSvg(rawSvg, false);
        if (this.plugin.iconCache) {
          this.plugin.iconCache.set(`1:${id}`, normEncoded);
          this.plugin.iconCache.set(`0:${id}`, normRaw);
        }
        this._dataUriCache.set(id, `url("data:image/svg+xml,${normEncoded}")`);
      }
      getDataUri(iconId) {
        if (!iconId) return "";
        const hit = this._dataUriCache.get(iconId);
        if (hit !== void 0) return hit;
        const rawSvg = this.getIconSvg(iconId, true);
        const dataUri = rawSvg ? `url("data:image/svg+xml,${rawSvg}")` : "";
        this._dataUriCache.set(iconId, dataUri);
        return dataUri;
      }
      normalizeSvg(svgStr, shouldEncode = true) {
        const cacheKey = `${shouldEncode ? "1:" : "0:"}${hashString(svgStr)}`;
        const hit = this._normCache.get(cacheKey);
        if (hit !== void 0) return hit;
        let result;
        try {
          if (!svgStr) {
            result = "";
          } else {
            const rawSvg = svgStr.includes("%") ? decodeURIComponent(svgStr) : svgStr;
            if (!rawSvg.includes("<svg")) {
              result = svgStr;
            } else {
              const parser = this._domParser;
              let doc = parser.parseFromString(rawSvg, "image/svg+xml");
              if (doc.getElementsByTagName("parsererror").length > 0) doc = parser.parseFromString(rawSvg, "text/html");
              const dangerousTags = ["script", "iframe", "object", "embed", "foreignobject", "animate", "set"];
              for (const tag of dangerousTags) {
                doc.querySelectorAll(tag).forEach((el) => el.remove());
              }
              doc.querySelectorAll("*").forEach((el) => {
                if (dangerousTags.includes(el.tagName.toLowerCase())) {
                  el.remove();
                }
              });
              doc.querySelectorAll("a, use, image").forEach((el) => {
                const href = (el.getAttribute("href") || el.getAttribute("xlink:href") || "").trim().toLowerCase();
                if (href.startsWith("javascript:") || href.startsWith("vbscript:") || href.startsWith("http:") || href.startsWith("https:") || href.startsWith("//") || el.tagName.toLowerCase() === "use" && href.startsWith("data:")) {
                  el.remove();
                }
              });
              doc.querySelectorAll("*").forEach((el) => {
                const attrs = Array.from(el.attributes);
                for (const attr of attrs) {
                  if (attr.name.toLowerCase().startsWith("on")) el.removeAttribute(attr.name);
                }
              });
              const svg = doc.querySelector("svg");
              if (!svg) {
                result = svgStr;
              } else {
                if (!svg.hasAttribute("xmlns")) svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
                svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
                const vbAttr = svg.getAttribute("viewBox");
                if (!vbAttr && (svg.hasAttribute("width") || svg.hasAttribute("height"))) {
                  const w = svg.getAttribute("width")?.replace("px", "") || "24";
                  const h = svg.getAttribute("height")?.replace("px", "") || "24";
                  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
                }
                svg.removeAttribute("width");
                svg.removeAttribute("height");
                svg.removeAttribute("style");
                const hasStroke = rawSvg.includes("stroke=") && !rawSvg.includes('stroke="none"');
                const hasFill = rawSvg.includes("fill=") && !rawSvg.includes('fill="none"');
                if (hasStroke && !hasFill) {
                  svg.setAttribute("fill", "none");
                  svg.setAttribute("stroke", "currentColor");
                } else {
                  svg.setAttribute("fill", "currentColor");
                }
                const cleaned = svg.outerHTML.replace(/>\s+</g, "><").replace(/(\r\n|\n|\r)/gm, "");
                result = shouldEncode ? encodeURIComponent(cleaned) : cleaned;
              }
            }
          }
        } catch {
          result = svgStr;
        }
        this._normCache.set(cacheKey, result);
        return result;
      }
      invalidateCache() {
        this._categoryCache = null;
        this._customRulesKey = "";
        this._normCache.clear();
        this._dataUriCache.clear();
        this._findPackIconCache.clear();
        this._autoIconResultCache.clear();
        this._packIndex.invalidate();
      }
    };
  }
});

// src/integrations/embedingmodel.ts
var embedingmodel_exports = {};
__export(embedingmodel_exports, {
  EmbeddingModel: () => EmbeddingModel
});
var import_obsidian, MAX_CACHE_SIZE, DEFAULT_TOP_K, DEFAULT_MIN_SCORE, THREE_GRAM_MIN_LENGTH, THREE_GRAM_MAX_LENGTH, FILE_EXTENSION_DOMAINS, FOLDER_HINT_DOMAINS, EmbeddingModel;
var init_embedingmodel = __esm({
  "src/integrations/embedingmodel.ts"() {
    import_obsidian = __toESM(require_obsidian_stub());
    init_constants();
    MAX_CACHE_SIZE = 2048;
    DEFAULT_TOP_K = 3;
    DEFAULT_MIN_SCORE = 0.25;
    THREE_GRAM_MIN_LENGTH = 5;
    THREE_GRAM_MAX_LENGTH = 16;
    FILE_EXTENSION_DOMAINS = {
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
    FOLDER_HINT_DOMAINS = {
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
    EmbeddingModel = class _EmbeddingModel {
      plugin;
      iconVectors = /* @__PURE__ */ new Map();
      isInitialized = false;
      queryCache = /* @__PURE__ */ new Map();
      cacheHitCount = 0;
      cacheMissCount = 0;
      conceptDenseVectors = /* @__PURE__ */ new Map();
      static DENSE_CONCEPTS = {
        quotes_wisdom: { prompt: "quotes sayings proverbs wisdom philosophy reflection mindset life lessons truth illusion quote-text sentence", icons: ["quote", "sparkles", "lightbulb", "compass", "brain", "book-open"] },
        stories_writing: { prompt: "story narrative writing literature fiction author legend prose feather scroll pen untold agony", icons: ["pen-tool", "book-open", "feather", "scroll", "file-text"] },
        journey_voyage: { prompt: "journey wander voyage path travel step miles destination compass footprints map road", icons: ["compass", "map-pin", "map", "route", "plane"] },
        imagination_vision: { prompt: "imagination vision future dream idea wonder preview attraction spark magic illusion mind", icons: ["sparkles", "lightbulb", "brain", "wand-2", "star", "eye"] },
        emotions_heart: { prompt: "emotion feeling heart agony soul passion cherish love mood upset", icons: ["heart", "sparkles", "smile", "activity"] },
        coding: { prompt: "software development code programming terminal developer git scripts", icons: ["code", "terminal", "cpu", "file-code", "git-branch"] },
        finance: { prompt: "finance money banking accounting bills expenses budget receipt tax currency", icons: ["banknote", "dollar-sign", "coins", "receipt", "credit-card", "wallet"] },
        meetings: { prompt: "meetings calendar schedule appointments agenda zoom call clock events", icons: ["calendar", "clock", "users", "video", "calendar-days"] },
        reading: { prompt: "reading books literature research papers articles library documentation notes", icons: ["book-open", "book", "library", "newspaper", "file-text"] },
        tasks: { prompt: "tasks todo checklist goals projects kanban action work tracking", icons: ["check-square", "target", "folder-kanban", "flag", "list-todo"] },
        design: { prompt: "design graphic UI UX mockup palette Figma vector drawing art layout", icons: ["layout", "palette", "pen-tool", "brush", "image"] },
        music: { prompt: "music audio sound song playlist headphones podcast recording radio", icons: ["music", "headphones", "mic", "disc", "radio"] },
        video: { prompt: "video movie film Youtube camera streaming video recording clapperboard", icons: ["video", "film", "play-circle", "camera", "clapperboard"] },
        health: { prompt: "health fitness workout exercise medical doctor hospital stethoscope activity", icons: ["activity", "stethoscope", "heart-pulse", "dumbbell"] },
        travel: { prompt: "travel trip vacation flight plane map navigation compass location explorer", icons: ["plane", "compass", "map-pin", "globe", "map"] },
        gaming: { prompt: "gaming video games console play steam gamepad trophy sword", icons: ["gamepad-2", "dices", "trophy", "sword"] },
        security: { prompt: "security passwords privacy authentication lock key shield firewall", icons: ["shield-check", "lock", "key", "eye-off"] },
        people: { prompt: "people contacts family friends team user profile employee contacts group", icons: ["users", "user", "contact", "id-card", "folder-users"] },
        shopping: { prompt: "shopping cart store buy order product package store market", icons: ["shopping-cart", "shopping-bag", "package", "store"] },
        law: { prompt: "law legal court justice contract agreement scale gavel scroll", icons: ["scale", "gavel", "scroll", "file-text"] },
        science: { prompt: "science laboratory research chemistry biology experiment microscope flask", icons: ["flask-conical", "microscope", "atom"] },
        nature: { prompt: "nature environment plant garden tree flower leaf eco climate", icons: ["leaf", "flower-2", "tree-pine", "sun"] },
        space: { prompt: "space astronomy stars universe galaxy telescope moon rocket", icons: ["telescope", "rocket", "moon"] },
        hardware: { prompt: "hardware computer PC CPU hard drive memory components server infrastructure", icons: ["cpu", "server", "hard-drive", "database"] },
        education: { prompt: "school study university course exam graduation lecture class", icons: ["graduation-cap", "book", "school"] },
        pets: { prompt: "pets animal dog cat vet paw print", icons: ["dog", "cat", "paw-print"] },
        wu_wei_daoism: { prompt: "wu wei daoism effortless action flow balance nature philosophy wisdom taoism", icons: ["sparkles", "compass", "wind", "leaf"] },
        yin_yang_balance: { prompt: "yin and yang dualism balance harmony scale contrast circle sun moon", icons: ["scale", "sun-moon", "circle-dot"] },
        vulnerability_openness: { prompt: "vulnerability vulnerable open heart self reflection emotional courage soul", icons: ["heart", "shield-off", "unlock", "eye"] },
        trust_the_process: { prompt: "trust the process growth patience journey continuous progress footprints trending", icons: ["compass", "trending-up", "hourglass", "footprints"] },
        use_it_or_lose_it: { prompt: "use it or lose it maintenance activity practice flame repeat cycle", icons: ["repeat", "flame", "activity", "zap"] },
        habits_routines: { prompt: "important habits habit routine daily tracker repeat words used practice", icons: ["repeat", "calendar-check", "activity", "target"] }
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
        markdown: ["simple-icons-markdown", "file-text", "pen-tool"],
        database: ["database", "server", "hard-drive", "layers"],
        people: ["users", "user", "contact", "folder-users"],
        person: ["user", "contact", "id-card", "profile"],
        user: ["user", "contact", "id-card", "profile"],
        users: ["users", "contact", "folder-users"],
        contact: ["contact", "user", "id-card", "phone"],
        contacts: ["users", "contact", "folder-users", "phone"],
        client: ["user", "contact", "briefcase", "id-card"],
        clients: ["users", "contact", "briefcase", "folder-users"],
        customer: ["user", "contact", "shopping-bag", "id-card"],
        customers: ["users", "contact", "shopping-bag", "folder-users"],
        author: ["user", "pen-tool", "book-open", "contact"],
        authors: ["users", "book-open", "pen-tool", "contact"],
        speaker: ["user", "mic", "contact"],
        biography: ["user", "book-open", "file-text"],
        profile: ["user", "id-card", "contact"],
        team: ["users", "contact", "folder-users", "briefcase"],
        member: ["user", "contact", "id-card"],
        members: ["users", "contact", "folder-users"],
        staff: ["users", "contact", "briefcase"],
        employee: ["user", "contact", "id-card", "briefcase"],
        candidate: ["user-check", "user", "id-card"],
        doctor: ["user", "stethoscope", "activity"],
        dr: ["user", "stethoscope", "activity"],
        prof: ["user", "graduation-cap", "book-open"],
        professor: ["user", "graduation-cap", "book-open"],
        finance: ["dollar-sign", "coins", "credit-card", "trending-up", "receipt", "wallet"],
        money: ["dollar-sign", "coins", "bank", "credit-card"],
        invoice: ["receipt", "dollar-sign", "credit-card", "file-text"],
        receipt: ["receipt", "dollar-sign", "shopping-bag"],
        budget: ["dollar-sign", "pie-chart", "coins", "bar-chart"],
        accounting: ["calculator", "dollar-sign", "file-text", "receipt"],
        bills: ["receipt", "dollar-sign", "credit-card"],
        expenses: ["dollar-sign", "trending-down", "receipt"],
        tax: ["dollar-sign", "calculator", "file-text"],
        shopping: ["shopping-cart", "shopping-bag", "package", "store"],
        buy: ["shopping-cart", "shopping-bag", "tag"],
        orders: ["package", "shopping-bag", "truck"],
        reading: ["book-open", "book", "notebook", "library", "bookmark"],
        books: ["book-open", "book", "library"],
        literature: ["book-open", "book", "library"],
        articles: ["file-text", "newspaper", "book-open"],
        papers: ["file-text", "book-open", "bookmark"],
        research: ["search", "book-open", "microscope", "file-text"],
        notes: ["notebook", "file-text", "pen-tool", "edit-3"],
        meetings: ["calendar", "clock", "users", "video", "calendar-days"],
        calendar: ["calendar", "clock", "target", "calendar-days"],
        schedule: ["calendar", "clock", "timer"],
        deadline: ["clock", "calendar", "alert-circle"],
        appointment: ["calendar", "clock", "user"],
        agenda: ["list", "calendar", "file-text"],
        tasks: ["check-square", "check-circle", "list-todo", "target", "flag"],
        todo: ["check-square", "check-circle", "list"],
        checklist: ["check-square", "list", "check-circle"],
        goals: ["target", "flag", "trophy", "trending-up"],
        projects: ["folder-kanban", "layers", "target", "briefcase"],
        coding: ["code", "terminal", "git-branch", "cpu", "layers"],
        programming: ["code", "terminal", "cpu", "database"],
        software: ["code", "terminal", "layers", "box"],
        backend: ["server", "database", "code", "terminal"],
        frontend: ["layout", "code", "palette", "monitor"],
        api: ["webhook", "server", "code", "key"],
        scripts: ["terminal", "code", "file-code"],
        design: ["palette", "pen-tool", "layout", "figma", "brush", "image"],
        ui: ["layout", "palette", "monitor", "smartphone"],
        ux: ["user-check", "layout", "palette"],
        mockups: ["layout", "image", "figma"],
        assets: ["folder", "image", "layers"],
        music: ["music", "headphones", "disc", "radio"],
        audio: ["headphones", "mic", "radio", "volume-2"],
        podcasts: ["mic", "headphones", "radio"],
        video: ["video", "film", "play-circle", "camera"],
        movies: ["film", "video", "tv"],
        health: ["heart-pulse", "activity", "medical", "sun"],
        fitness: ["activity", "heart-pulse", "dumbbell"],
        workout: ["activity", "heart-pulse", "dumbbell"],
        medical: ["activity", "heart-pulse", "stethoscope"],
        travel: ["plane", "compass", "map-pin", "globe", "navigation"],
        vacation: ["sun", "palmtree", "plane", "map-pin"],
        trips: ["plane", "compass", "map-pin"],
        gaming: ["gamepad-2", "sword", "trophy", "sparkles"],
        games: ["gamepad-2", "trophy", "sparkles"],
        security: ["shield-check", "lock", "key", "eye", "file-lock"],
        passwords: ["key", "lock", "shield-check"],
        privacy: ["shield-check", "eye-off", "lock"]
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
      initializeIndex() {
        if (this.isInitialized) return;
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
          const rexSource = cat.rex.source.replace(/[^a-zA-Z0-9\s|-]/g, " ").replace(/\|/g, " ").trim();
          const keywords = rexSource.split(/\s+/).filter((k) => k.length >= 2);
          for (const iconId of targets) {
            const vector = this.getOrCreateVector(iconId);
            const cleanId = iconId.replace(/^lucide-/i, "").replace(/^simple-icons-/i, "");
            vector.tokenWeights.set(iconId.toLowerCase(), 4);
            vector.tokenWeights.set(cleanId.toLowerCase(), 3.5);
            for (const kw of keywords) {
              const weights = this.buildWeightedTokenMap(kw);
              weights.forEach((w, t) => {
                vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w * (cat.priority / 100));
              });
              vector.domains.add(kw);
            }
          }
        }
        const customIcons = this.plugin?.settings?.customIcons || {};
        for (const iconId of Object.keys(customIcons)) {
          const vector = this.getOrCreateVector(iconId);
          const cleanId = iconId.replace(/^(simple-icons-|si-|tabler-|fa-solid-|fa-regular-|bx-|octicon-|ra-|cf-|bi-|ri-|feather-)/i, "").replace(/^brand-/i, "");
          vector.tokenWeights.set(iconId.toLowerCase(), 4);
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
          const cleanId = iconId.replace(/^lucide-/i, "").replace(/^(simple-icons-|si-|tabler-|fa-solid-|fa-regular-|bx-|octicon-|ra-|cf-|bi-|ri-|feather-)/i, "").replace(/^brand-/i, "");
          vector.tokenWeights.set(iconId.toLowerCase(), 4);
          vector.tokenWeights.set(cleanId.toLowerCase(), 3.5);
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
              const cleanId = iconId.replace(/^lucide-/i, "").replace(/^(simple-icons-|si-|tabler-|fa-solid-|fa-regular-|bx-|octicon-|ra-|cf-|bi-|ri-|feather-)/i, "").replace(/^brand-/i, "");
              vector.tokenWeights.set(iconId.toLowerCase(), 4);
              vector.tokenWeights.set(cleanId.toLowerCase(), 3.5);
              const weights = this.buildWeightedTokenMap(cleanId);
              weights.forEach((w, t) => {
                vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w);
              });
            }
          }
        } catch {
        }
        this.iconVectors.forEach((vec) => {
          vec.normalized = this.normalizeVectorFromMap(vec.tokenWeights);
          vec.tokens = Array.from(vec.normalized.keys());
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
        const clean = text.toLowerCase().replace(/[^a-z0-9\s_-]/g, " ").trim();
        if (!clean) return tokenWeights;
        const fullClean = clean.replace(/[\s_-]+/g, " ");
        const fullJoined = clean.replace(/[\s_-]+/g, "");
        const fullHyphen = clean.replace(/[\s_-]+/g, "-");
        addToken(fullClean, 5.5);
        addToken(fullJoined, 5.5);
        addToken(fullHyphen, 5.5);
        const rawWordsAll = clean.split(/[\s_-]+/).filter((w) => w.length >= 2);
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
        const filename = rawFilename.replace(/\.(md|png|svg|txt|json|py|js|ts|jsx|tsx|java|cpp|c|go|rs|rb|php|swift|kt|sql|yaml|yml|toml|xml|html|css|scss|pdf|docx|mp3|wav|mp4|mov|zip|tar|gz|env)$/i, "");
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
        return FILE_EXTENSION_DOMAINS[extension] || [];
      }
      getFolderHintBoosts(folderName) {
        const normalized = folderName.toLowerCase().replace(/[^a-z0-9]/g, "");
        return FOLDER_HINT_DOMAINS[normalized] || FOLDER_HINT_DOMAINS[folderName.toLowerCase()] || [];
      }
      applyContextBoost(baseScore, iconId, context) {
        let boost = 1;
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
        const context = this.buildQueryContext(titleOrPath, options?.isFolder ?? false);
        if (this.queryCache.size >= MAX_CACHE_SIZE) {
          for (const k of this.queryCache.keys()) {
            this.queryCache.delete(k);
            break;
          }
        }
        const directMatch = this.tryDirectDictionaryMatch(context.lowerName, topK, context);
        if (directMatch.length > 0) {
          const enriched = directMatch.map((r) => ({
            ...r,
            confidence: "high",
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
        const scored = [];
        this.iconVectors.forEach((iconVec, iconId) => {
          const rawScore = this.computeCosineSimilarity(queryVector, iconVec.normalized);
          if (rawScore >= minScore) {
            scored.push({ iconId, rawScore });
          }
        });
        const boosted = scored.map((s) => ({
          iconId: s.iconId,
          score: this.applyContextBoost(s.rawScore, s.iconId, context)
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
        if (/^(dr|mr|mrs|ms|prof|professor|sir|lady|author|client|patient|member|staff|doctor)\b/i.test(clean)) {
          return true;
        }
        if (parentFolder && /^(people|contacts|friends|family|team|members|staff|clients|customers|authors|speakers|patients|candidates)$/i.test(parentFolder.trim())) {
          return true;
        }
        const words = clean.split(/[\s._-]+/).filter(Boolean);
        if (words.length >= 2 && words.length <= 4) {
          const nonNameKeywords = /^(project|meeting|data|model|system|config|test|code|file|document|folder|report|summary|draft|final|version|script|app|index|main|log|track|build|page|site|web|task|list|plan|note|notes|idea|ideas|readme|changelog|package)$/i;
          const hasNonNameWord = words.some((w) => nonNameKeywords.test(w) || /^\d+$/.test(w));
          if (!hasNonNameWord) {
            return words.every((w) => /^[A-Z][a-z]+$/.test(w));
          }
        }
        return false;
      }
      tryDirectDictionaryMatch(lowerName, topK, context) {
        const normLowerName = lowerName.replace(/[\s_-]+/g, "");
        const directIconMatches = [];
        this.iconVectors.forEach((_vec, iconId) => {
          const cleanId = iconId.replace(/^lucide-/i, "").replace(/^(simple-icons-|si-|tabler-|fa-solid-|fa-regular-|bx-|octicon-|ra-|cf-|bi-|ri-|feather-)/i, "").replace(/^brand-/i, "").toLowerCase();
          const normCleanId = cleanId.replace(/[\s_-]+/g, "");
          const lowerIcon = iconId.toLowerCase();
          if (lowerIcon === lowerName || cleanId === lowerName || normCleanId === normLowerName) {
            directIconMatches.push({
              iconId,
              score: 0.99,
              matchedTag: lowerName,
              confidence: "high"
            });
          }
        });
        if (directIconMatches.length > 0) {
          return directIconMatches.slice(0, topK);
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
        if (context && this.isPersonName(context.filename, context.parentFolder)) {
          const personIcons = context.isFolder ? ["folder-users", "users", "user", "contact"] : ["user", "contact", "id-card", "profile", "user-check"];
          return personIcons.slice(0, topK).map((iconId) => ({
            iconId,
            score: 0.98,
            matchedTag: "person-name",
            confidence: "high"
          }));
        }
        const direct = _EmbeddingModel.BRAND_DICTIONARY[lowerName];
        if (direct) {
          return direct.slice(0, topK).map((iconId) => ({
            iconId,
            score: 1,
            matchedTag: lowerName,
            confidence: "high"
          }));
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
        if (results.length < topK && context.isFolder) {
          const folderHints = this.getFolderHintBoosts(context.parentFolder);
          for (const iconId of folderHints) {
            if (!seen.has(iconId)) {
              seen.add(iconId);
              results.push({
                iconId,
                score: 0.35,
                matchedTag: context.parentFolder,
                confidence: "low"
              });
            }
            if (results.length >= topK) break;
          }
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
              return data.embedding;
            }
            if (Array.isArray(data.embeddings) && Array.isArray(data.embeddings[0])) {
              return data.embeddings[0];
            }
            if (Array.isArray(data.data) && data.data[0]?.embedding) {
              return data.data[0].embedding;
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
       * Computes Cosine Similarity between two dense N-dimensional floating point vectors.
       */
      computeDenseCosineSimilarity(vecA, vecB) {
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
        const denom = Math.sqrt(normA) * Math.sqrt(normB);
        return denom === 0 ? 0 : dot / denom;
      }
      async findBestIconsDense(titleOrPath, denseVector, options) {
        const topK = options?.topK ?? DEFAULT_TOP_K;
        const minScore = options?.minScore ?? 0.15;
        const context = this.buildQueryContext(titleOrPath, options?.isFolder ?? false);
        for (const [conceptKey, conceptDef] of Object.entries(_EmbeddingModel.DENSE_CONCEPTS)) {
          if (!this.conceptDenseVectors.has(conceptKey)) {
            const vec = await this.fetchNeuralEmbedding(conceptDef.prompt);
            if (vec) {
              this.conceptDenseVectors.set(conceptKey, vec);
            }
          }
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
        return this.findBestIcons(titleOrPath, options);
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
  }
});

// tests/run_whole_title_tests.js
var assert = require("assert");
var { IconRepository: IconRepository2 } = (init_IconRepository(), __toCommonJS(IconRepository_exports));
var { EmbeddingModel: EmbeddingModel2 } = (init_embedingmodel(), __toCommonJS(embedingmodel_exports));
try {
  require("ts-node").register({ transpileOnly: true });
} catch {
}
console.log("==================================================");
console.log("\u{1F9EA} RUNNING WHOLE-TITLE CONCEPT ICON TESTS");
console.log("==================================================\n");
var mockPlugin = {
  settings: {
    autoIcons: true,
    autoIconVariety: true,
    customFolderColors: {},
    customIconRules: "",
    customIcons: {},
    iconDebugMode: false,
    aiProvider: "ollama",
    embeddingEngine: "builtin"
  },
  localFileSystemIcons: {
    "compass": "<svg></svg>",
    "sparkles": "<svg></svg>",
    "heart": "<svg></svg>",
    "scale": "<svg></svg>",
    "repeat": "<svg></svg>",
    "trending-up": "<svg></svg>",
    "calendar-check": "<svg></svg>",
    "sun-moon": "<svg></svg>",
    "lightbulb": "<svg></svg>",
    "brain": "<svg></svg>",
    "hourglass": "<svg></svg>",
    "clock": "<svg></svg>",
    "layers": "<svg></svg>",
    "map": "<svg></svg>"
  }
};
var embeddingModel = new EmbeddingModel2(mockPlugin);
mockPlugin.embeddingModel = embeddingModel;
var iconRepository = new IconRepository2(mockPlugin);
mockPlugin.iconManager = {
  getAutoIconData: (name, path) => iconRepository.getAutoIconData(name, path)
};
var testCases = [
  { name: "Trust the process", expectedKeywords: ["compass", "trending-up", "hourglass", "sparkles"] },
  { name: "Use it or Lose it is a cool concept", expectedKeywords: ["repeat", "flame", "activity", "sparkles", "zap"] },
  { name: "Vulnerability", expectedKeywords: ["heart", "shield-off", "unlock", "eye"] },
  { name: "Words I've used to describe important habits", expectedKeywords: ["repeat", "calendar-check", "activity", "target"] },
  { name: "Wu wei", expectedKeywords: ["sparkles", "compass", "wind", "leaf"] },
  { name: "Yin and Yang", expectedKeywords: ["scale", "sun-moon", "circle-dot"] },
  { name: "Use STIR To Remember More", expectedKeywords: ["brain", "brain-circuit", "lightbulb"] },
  { name: "Using the thesaurus to generate ideas", expectedKeywords: ["lightbulb", "brain", "sparkles"] },
  { name: "We chronically underestimate how long something takes", expectedKeywords: ["hourglass", "clock", "calendar-clock", "timer"] },
  { name: "What are higher-order notes", expectedKeywords: ["layers", "git-branch", "network", "list-tree"] },
  { name: "What can we learn from nerdy discussions on MOCs", expectedKeywords: ["map", "list-tree", "network"] }
];
var passedCount = 0;
var totalCount = 0;
console.log("--- 1. IconRepository Rule Engine ---");
for (const tc of testCases) {
  totalCount++;
  const autoIcon = iconRepository.getAutoIconData(tc.name, `${tc.name}.md`);
  assert(autoIcon !== null, `Expected non-null icon for "${tc.name}"`);
  assert(autoIcon.lucide !== "file-text", `Expected non-generic icon for "${tc.name}", got "file-text"`);
  assert(autoIcon.lucide !== "file", `Expected non-generic icon for "${tc.name}", got "file"`);
  assert(autoIcon.lucide !== "wrench", `Expected non-construction icon for "${tc.name}", got "wrench"`);
  const isMatched = tc.expectedKeywords.some((kw) => autoIcon.lucide && autoIcon.lucide.includes(kw));
  assert(isMatched, `Expected icon for "${tc.name}" to match one of [${tc.expectedKeywords.join(", ")}], got "${autoIcon.lucide}"`);
  console.log(`\u2705 "${tc.name}" => Assigned Icon: "${autoIcon.lucide}" (Tier ${autoIcon.tier})`);
  passedCount++;
}
console.log("\n--- 2. EmbeddingModel Vector Search ---");
for (const tc of testCases) {
  totalCount++;
  const results = embeddingModel.findBestIcons(tc.name, { topK: 3, isFolder: false });
  assert(results.length > 0, `Expected vector candidates for "${tc.name}"`);
  const firstIcon = results[0].iconId;
  assert(firstIcon !== "file-text", `Expected non-generic vector icon for "${tc.name}", got "file-text"`);
  assert(firstIcon !== "file", `Expected non-generic vector icon for "${tc.name}", got "file"`);
  const isMatched = tc.expectedKeywords.some((kw) => results.some((r) => r.iconId.includes(kw)));
  assert(isMatched, `Expected vector results for "${tc.name}" to include one of [${tc.expectedKeywords.join(", ")}], got [${results.map((r) => r.iconId).join(", ")}]`);
  console.log(`\u2705 "${tc.name}" => Vector Candidate 1: "${firstIcon}" (${results[0].confidence} confidence)`);
  passedCount++;
}
console.log("\n==================================================");
console.log(`\u{1F389} ALL ${passedCount}/${totalCount} TESTS PASSED SUCCESSFULLY!`);
console.log("==================================================");
