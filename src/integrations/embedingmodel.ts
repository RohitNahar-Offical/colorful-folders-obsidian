import { requestUrl, getIconIds } from 'obsidian';
import { IColorfulFoldersPlugin } from '../common/types';
import { AUTO_ICON_CATEGORIES } from '../common/constants';
import { LRUCache } from '../common/LRUCache';

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
    'quotes': ['quote', 'sparkles', 'book-open'],
    'quote': ['quote', 'sparkles', 'book-open'],
    'statements': ['quote', 'lightbulb', 'brain'],
    'statement': ['quote', 'lightbulb', 'brain'],
    'questions': ['help-circle', 'lightbulb', 'compass'],
    'question': ['help-circle', 'lightbulb', 'compass'],
    'people': ['users', 'user', 'contact'],
    'dots': ['circle-dot', 'layers', 'sparkles'],
    'things': ['circle-dot', 'layers', 'sparkles'],
    'thing': ['circle-dot', 'layers', 'sparkles'],
    'sources': ['book-open', 'bookmark', 'library'],
    'books': ['book-open', 'book', 'library'],
    'book': ['book-open', 'book', 'library'],
    'movies': ['film', 'video', 'tv'],
    'movie': ['film', 'video', 'tv'],
    'films': ['film', 'video', 'tv'],
    'film': ['film', 'video', 'tv'],
    'games': ['gamepad-2', 'sword', 'trophy'],
    'game': ['gamepad-2', 'sword', 'trophy'],
    'podcasts': ['mic', 'headphones', 'radio'],
    'podcast': ['mic', 'headphones', 'radio'],
    'articles': ['file-text', 'newspaper', 'pen-tool'],
    'article': ['file-text', 'newspaper', 'pen-tool'],
    'papers': ['file-text', 'book-open', 'bookmark'],
    'paper': ['file-text', 'book-open', 'bookmark'],
    'tv': ['tv', 'film', 'video'],
    'songs': ['music', 'disc', 'headphones'],
    'song': ['music', 'disc', 'headphones'],
    'works': ['folder-kanban', 'layers', 'briefcase'],
    'work': ['folder-kanban', 'layers', 'briefcase'],
    'clippings': ['scissors', 'bookmark', 'newspaper'],
    'cards': ['credit-card', 'layers', 'layout'],
    'maps': ['map', 'compass', 'list-tree'],
    'atlas': ['map', 'globe', 'compass'],
    'calendar': ['calendar', 'clock', 'calendar-days'],
    'daily': ['calendar', 'sun', 'book-open'],
    'days': ['calendar', 'sun', 'clock'],
    'day': ['calendar', 'sun', 'clock'],
    'prompts': ['terminal', 'lightbulb', 'sparkles'],
    'habits': ['repeat', 'flame', 'calendar-check'],
    'fitness': ['dumbbell', 'heart-pulse', 'activity'],
    'recipes': ['utensils', 'coffee', 'cake'],
    'finance': ['dollar-sign', 'wallet', 'receipt'],
    'taxes': ['dollar-sign', 'receipt', 'file-text'],
    'tax': ['dollar-sign', 'receipt', 'file-text'],
    'areas': ['layout-grid', 'layers', 'compass'],
    'area': ['layout-grid', 'layers', 'compass'],
    'efforts': ['zap', 'target', 'folder-kanban'],
    'effort': ['zap', 'target', 'folder-kanban'],
    'household': ['home', 'heart', 'users'],
    'newsletters': ['mail', 'newspaper', 'send'],
    'newsletter': ['mail', 'newspaper', 'send'],
    'workshops': ['users', 'briefcase', 'presentation'],
    'workshop': ['users', 'briefcase', 'presentation'],
    'conferences': ['users', 'mic', 'globe'],
    'conference': ['users', 'mic', 'globe'],
    'entertainment': ['palette', 'film', 'music'],
    'inbox': ['inbox', 'plus-circle', 'sparkles'],
    '+': ['inbox', 'plus-circle', 'sparkles'],
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
    'resource': ['package', 'folder', 'box'],
    'reviews': ['search', 'calendar', 'check-square'],
    'review': ['search', 'calendar', 'check-square'],
    'records': ['calendar', 'clock', 'archive'],
    'record': ['calendar', 'clock', 'archive'],
    'meetings': ['calendar', 'clock', 'users'],
    'meeting': ['calendar', 'clock', 'users'],
    'ideas': ['lightbulb', 'brain', 'sparkles'],
    'idea': ['lightbulb', 'brain', 'sparkles'],
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

export function cleanSemanticTitle(title: string): string {
    if (!title) return '';
    return title
        .replace(/^\d{4}[-_.]\d{2}[-_.]\d{2}[-_.]?/, '') // Strip dates (e.g. 2026-08-24-, 2026.08.24)
        .replace(/^\d{2}[-_.]\d{2}[-_.]\d{4}[-_.]?/, '') // Strip dates (e.g. 24-08-2026-)
        .replace(/^v?\d+([._-]\d+)*[\s._-]+/i, '')       // Strip version/chapter prefixes (e.g. v1.0.3_, 01_, 1.2.)
        .replace(/\.(md|png|svg|txt|json|py|js|ts|jsx|tsx|java|cpp|c|go|rs|rb|php|swift|kt|sql|yaml|yml|toml|xml|html|css|scss|pdf|docx|mp3|wav|mp4|mov|zip|tar|gz|env|canvas)$/i, '')
        .replace(/([a-z])([A-Z])/g, '$1 $2')             // Split camelCase
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')       // Split acronyms
        .replace(/[\s._-]+/g, ' ')                        // Convert separators to spaces
        .trim();
}

export const ICON_SYNONYMS: Record<string, string[]> = {
    'trash-2': ['delete', 'remove', 'bin', 'garbage', 'rubbish', 'discard', 'cleanup', 'purge', 'clear', 'erase', 'junk', 'recycle-bin', 'destroy'],
    'trash': ['delete', 'remove', 'bin', 'garbage', 'rubbish', 'discard', 'cleanup', 'purge', 'clear', 'erase', 'junk', 'recycle-bin'],
    'database': ['sql', 'database', 'postgres', 'mysql', 'sqlite', 'mongodb', 'redis', 'storage', 'data', 'schema', 'query', 'records', 'tables', 'db', 'dataset', 'orm', 'migrations'],
    'shield-check': ['security', 'protection', 'privacy', 'auth', 'authentication', 'firewall', 'safe', 'guard', 'defense', 'secure', 'verified', 'antivirus', 'shield', 'permission'],
    'shield': ['security', 'protection', 'privacy', 'auth', 'authentication', 'firewall', 'safe', 'guard', 'defense', 'secure'],
    'lock': ['password', 'credentials', 'secrets', 'vault', 'private', 'tokens', 'keys', 'encryption', 'confidential', 'secure', 'protect', 'restricted'],
    'key': ['password', 'credentials', 'access', 'token', 'apikey', 'key', 'license', 'secret', 'auth', 'unlock'],
    'wrench': ['config', 'settings', 'configuration', 'setup', 'tools', 'repair', 'maintenance', 'options', 'preferences', 'tweaks', 'service', 'util', 'utilities'],
    'settings': ['config', 'settings', 'configuration', 'setup', 'options', 'preferences', 'system', 'admin', 'properties'],
    'zap': ['speed', 'fast', 'quick', 'energy', 'power', 'lightning', 'electricity', 'charge', 'performance', 'boost', 'turbo', 'instant', 'flash', 'action'],
    'flame': ['hot', 'fire', 'burn', 'streak', 'trending', 'passion', 'popular', 'energy', 'vitality', 'warmth'],
    'utensils': ['food', 'cooking', 'recipe', 'meal', 'dinner', 'lunch', 'breakfast', 'diet', 'nutrition', 'kitchen', 'restaurant', 'cafe', 'baking', 'culinary', 'dish', 'cook'],
    'coffee': ['coffee', 'tea', 'cafe', 'break', 'morning', 'espresso', 'drink', 'beverage', 'caffeine', 'mug'],
    'dollar-sign': ['finance', 'money', 'budget', 'expense', 'income', 'salary', 'payment', 'billing', 'invoice', 'currency', 'cash', 'crypto', 'investment', 'stocks', 'trading', 'banking', 'revenue', 'tax', 'profit', 'cost'],
    'banknote': ['money', 'cash', 'finance', 'payment', 'salary', 'currency', 'funds', 'wealth'],
    'wallet': ['money', 'crypto', 'wallet', 'finances', 'payment', 'savings', 'budget', 'assets'],
    'credit-card': ['payment', 'billing', 'checkout', 'card', 'subscription', 'transaction', 'visa', 'mastercard', 'purchase'],
    'receipt': ['receipt', 'invoice', 'bill', 'expense', 'proof', 'transaction', 'statement', 'accounting'],
    'heart-pulse': ['health', 'fitness', 'workout', 'exercise', 'gym', 'medical', 'cardio', 'doctor', 'hospital', 'medicine', 'wellness', 'body', 'training', 'pulse', 'vital', 'heart', 'healthcare'],
    'activity': ['activity', 'fitness', 'workout', 'analytics', 'performance', 'metrics', 'stats', 'pulse', 'monitoring'],
    'stethoscope': ['medical', 'doctor', 'clinic', 'health', 'hospital', 'medicine', 'checkup', 'physician'],
    'dumbbell': ['gym', 'fitness', 'workout', 'exercise', 'weightlifting', 'bodybuilding', 'strength', 'training', 'muscles'],
    'graduation-cap': ['education', 'study', 'school', 'university', 'college', 'course', 'degree', 'learning', 'lesson', 'lecture', 'student', 'exam', 'academy', 'homework', 'tutorial', 'diploma', 'academic', 'syllabus', 'session', 'semester', 'curriculum', 'high-school', 'ucla'],
    'book-open': ['reading', 'books', 'book', 'literature', 'library', 'documentation', 'notes', 'novel', 'study', 'research', 'guide', 'manual', 'reference'],
    'book': ['book', 'reading', 'novel', 'manual', 'handbook', 'guide', 'textbook'],
    'palette': ['design', 'art', 'color', 'theme', 'ui', 'ux', 'drawing', 'illustration', 'graphic', 'visual', 'creative', 'paint', 'sketch', 'styling'],
    'brush': ['art', 'paint', 'painting', 'drawing', 'creative', 'brush', 'artwork', 'canvas', 'illustration'],
    'camera': ['photo', 'photography', 'pictures', 'gallery', 'camera', 'snapshots', 'wallpaper', 'media', 'shots', 'capture'],
    'image': ['picture', 'photo', 'graphic', 'wallpaper', 'screenshot', 'artwork', 'banner', 'illustration'],
    'video': ['movie', 'film', 'video', 'youtube', 'stream', 'recording', 'cinema', 'clip', 'broadcast', 'vlog', 'footage'],
    'film': ['movie', 'cinema', 'film', 'video', 'production', 'theatre', 'show'],
    'music': ['audio', 'music', 'song', 'sound', 'podcast', 'playlist', 'track', 'album', 'tune', 'melody', 'headphones', 'radio', 'beats', 'spotify'],
    'headphones': ['music', 'audio', 'podcast', 'listening', 'sound', 'earphones', 'beats'],
    'mic': ['podcast', 'recording', 'audio', 'voice', 'interview', 'microphone', 'speech', 'talk'],
    'compass': ['travel', 'trip', 'journey', 'navigation', 'direction', 'vacation', 'destination', 'location', 'tour', 'explore', 'adventure', 'route', 'philosophy', 'guidance', 'vision'],
    'map-pin': ['location', 'place', 'address', 'destination', 'spot', 'venue', 'coordinates', 'pin', 'geo', 'travel'],
    'plane': ['flight', 'travel', 'trip', 'vacation', 'airport', 'holiday', 'voyage', 'flying', 'tourism', 'itinerary', 'paris', 'flight-ticket'],
    'calendar': ['schedule', 'meeting', 'events', 'appointment', 'timeline', 'agenda', 'deadline', 'reminder', 'time', 'date', 'planning', 'daily', 'weekly', 'monthly'],
    'clock': ['time', 'timer', 'history', 'deadline', 'schedule', 'clock', 'duration', 'stopwatch', 'hours', 'minutes', 'tracking'],
    'check-square': ['tasks', 'todo', 'checklist', 'goals', 'milestone', 'action-items', 'progress', 'tracker', 'objectives', 'done', 'completed'],
    'target': ['goals', 'milestone', 'target', 'objective', 'aim', 'focus', 'accuracy', 'strategy', 'kpi', 'okr'],
    'git-branch': ['github', 'git', 'version-control', 'branch', 'repository', 'commit', 'pr', 'pull-request', 'merge', 'repo'],
    'terminal': ['terminal', 'console', 'bash', 'command-line', 'cli', 'shell', 'scripts', 'powershell', 'zsh', 'exec'],
    'code': ['code', 'programming', 'developer', 'software', 'source', 'script', 'algorithm', 'syntax', 'function'],
    'cpu': ['hardware', 'processor', 'chip', 'cpu', 'computer', 'system', 'performance', 'benchmark', 'tech', 'device', 'deeplearning', 'neuralnet', 'ai', 'ml', 'weights'],
    'server': ['server', 'backend', 'hosting', 'infrastructure', 'node', 'cluster', 'deployment', 'sysadmin', 'api'],
    'cloud': ['cloud', 'aws', 'azure', 'gcp', 'hosting', 'storage', 'backup', 'network', 'online', 'sync'],
    'mail': ['email', 'newsletter', 'inbox', 'messages', 'contact', 'communication', 'letters', 'outbox', 'correspondence', 'mail'],
    'send': ['send', 'submit', 'dispatch', 'forward', 'outbox', 'publish', 'deliver'],
    'message-square': ['chat', 'conversation', 'discussion', 'comments', 'feedback', 'messages', 'talk', 'forum', 'community'],
    'brain': ['ideas', 'thoughts', 'concept', 'thinking', 'mindset', 'philosophy', 'innovation', 'brainstorm', 'wisdom', 'reflection', 'insights', 'psychology', 'iq', 'mental', 'ai', 'intellect'],
    'lightbulb': ['idea', 'tips', 'insight', 'creativity', 'invention', 'solution', 'inspiration', 'eureka', 'bright', 'trick'],
    'sparkles': ['magic', 'ai', 'generative', 'special', 'clean', 'awesome', 'shine', 'glow', 'wonder', 'glamour', 'new', 'meditation', 'zen', 'mindfulness', 'spark', 'sparks', 'ideaverse', 'callout', 'callouts'],
    'file-text': ['notes', 'documentation', 'article', 'docs', 'readme', 'changelog', 'paper', 'summary', 'report', 'draft', 'memo', 'manuscript', 'content'],
    'pen-tool': ['writing', 'author', 'authoring', 'blog', 'draft', 'story', 'novel', 'literature', 'pen', 'vector', 'compose', 'essay'],
    'scale': ['legal', 'law', 'contract', 'agreement', 'terms', 'policy', 'compliance', 'court', 'justice', 'rules', 'regulations', 'lawyer', 'attorney', 'nda'],
    'gavel': ['court', 'judge', 'legal', 'law', 'verdict', 'ruling', 'auction', 'bidding'],
    'microscope': ['science', 'research', 'lab', 'biology', 'chemistry', 'physics', 'experiment', 'scientific', 'analysis', 'hypothesis', 'investigation'],
    'flask-conical': ['chemistry', 'experiment', 'formula', 'lab', 'science', 'potion', 'reaction', 'test'],
    'leaf': ['nature', 'plants', 'garden', 'ecology', 'environment', 'trees', 'flowers', 'green', 'agriculture', 'botany', 'organic', 'sustainability'],
    'tree-pine': ['nature', 'forest', 'trees', 'woods', 'environment', 'camping', 'outdoor', 'park'],
    'sun': ['weather', 'summer', 'day', 'light', 'morning', 'bright', 'sunny', 'energy', 'solar', 'warm'],
    'moon': ['night', 'dark', 'evening', 'sleep', 'dream', 'lunar', 'nocturnal', 'astronomy'],
    'gamepad-2': ['gaming', 'games', 'game', 'rpg', 'playstation', 'xbox', 'nintendo', 'steam', 'quest', 'arcade', 'achievement', 'esports', 'videogames'],
    'sword': ['combat', 'rpg', 'war', 'attack', 'weapon', 'fight', 'strategy', 'defense', 'adventure'],
    'trophy': ['reward', 'winner', 'achievement', 'championship', 'contest', 'award', 'victory', 'gold', 'medal', 'rank'],
    'users': ['people', 'team', 'family', 'friends', 'contacts', 'community', 'clients', 'members', 'profile', 'colleagues', 'staff', 'group', 'audience', 'workshop', 'workshops', 'conference', 'conferences'],
    'user': ['profile', 'account', 'person', 'individual', 'avatar', 'identity', 'bio', 'resume', 'cv'],
    'shopping-cart': ['shopping', 'cart', 'buy', 'purchases', 'orders', 'ecommerce', 'products', 'market', 'checkout', 'storefront'],
    'shopping-bag': ['shopping', 'bag', 'boutique', 'merchandise', 'retail', 'fashion', 'goods'],
    'package': ['package', 'box', 'delivery', 'shipping', 'cargo', 'product', 'parcel', 'supplies', 'inventory'],
    'bell': ['notification', 'alerts', 'warnings', 'notices', 'urgent', 'important', 'announcements', 'alarms', 'subscribe'],
    'bookmark': ['bookmark', 'save', 'saved', 'favorites', 'reading-list', 'reference', 'pinned'],
    'star': ['star', 'featured', 'important', 'favorite', 'rating', 'vip', 'premium', 'best', 'highlight'],
    'folder-kanban': ['project', 'kanban', 'sprint', 'board', 'scrum', 'agile', 'workflow', 'management', 'roadmap', 'tracker'],
    'repeat': ['habit', 'routines', 'repeat', 'loop', 'cycle', 'recurring', 'daily-habit', 'frequency', 'practice', 'refresh'],
    'quote': ['quotes', 'sayings', 'proverbs', 'citation', 'wisdom', 'motto', 'statement', 'aphorism'],
    'yin-yang': ['yin', 'yang', 'yin-yang', 'yinyang', 'taoism', 'daoism', 'balance', 'dualism', 'harmony', 'zen', 'opposite', 'contrast'],
    'layout': ['layout', 'ui', 'ux', 'frontend', 'components', 'interface', 'template', 'wireframe', 'view', 'grid', 'drag-drop'],
    'help-circle': ['question', 'questions', 'faq', 'help', 'ask', 'inquiry', 'curiosity', 'mystery', 'unknown', 'how-to'],
    'inbox': ['inbox', 'capture', 'incoming', 'collect', 'plus', 'add', 'new-item'],
    'circle-dot': ['circle', 'dot', 'dots', 'enso', 'ouroboros', 'infinity', 'cycle', 'atomic', 'core'],
    'home': ['home', 'house', 'home-base', 'dashboard', 'hub', 'home-pro', 'start']
};

interface PostingItem {
    iconId: string;
    weight: number;
}

const HIGH_PRIORITY_CATEGORIES = AUTO_ICON_CATEGORIES.filter(cat => (cat.priority || 0) >= 110);

export class EmbeddingModel {
    private plugin: IColorfulFoldersPlugin;
    private iconVectors: Map<string, IconVector> = new Map();
    private cleanIconIdMap: Map<string, string> = new Map();
    private synonymExactMap: Map<string, string> = new Map();
    private vectorNorms: Map<string, number> = new Map();
    private isInitialized = false;
    private queryCache: LRUCache<string, { result: VectorMatchResult[]; timestamp: number }> = new LRUCache(MAX_CACHE_SIZE);
    private cacheHitCount = 0;
    private cacheMissCount = 0;
    private conceptDenseVectors: Map<string, Float32Array> = new Map();
    private invertedIndex: Map<string, PostingItem[]> = new Map();

    private static readonly DENSE_CONCEPTS: Record<string, { prompt: string; icons: string[] }> = {
        quotes_wisdom: { prompt: "quotes sayings proverbs wisdom philosophy reflection mindset life lessons truth illusion quote-text sentence", icons: ['quote', 'sparkles', 'lightbulb', 'compass', 'brain', 'book-open'] },
        stories_writing: { prompt: "story narrative writing literature fiction author legend prose feather scroll pen untold agony", icons: ['pen-tool', 'book-open', 'feather', 'scroll', 'file-text'] },
        journey_voyage: { prompt: "journey wander voyage path travel step miles destination compass footprints map road", icons: ['compass', 'map-pin', 'map', 'route', 'plane'] },
        imagination_vision: { prompt: "imagination vision future dream idea wonder preview attraction spark magic illusion mind", icons: ['sparkles', 'lightbulb', 'brain', 'wand-2', 'star', 'eye'] },
        emotions_heart: { prompt: "emotion feeling heart agony soul passion cherish love mood upset romance relationship", icons: ['heart', 'sparkles', 'smile', 'activity'] },
        coding_development: { prompt: "software development code programming terminal developer git scripts syntax algorithms", icons: ['code', 'terminal', 'cpu', 'file-code', 'git-branch'] },
        finance_money: { prompt: "finance money banking accounting bills expenses budget receipt tax currency revenue profit wallet investment stocks", icons: ['banknote', 'dollar-sign', 'coins', 'receipt', 'credit-card', 'wallet'] },
        crypto_trading: { prompt: "cryptocurrency bitcoin ethereum crypto blockchain trading tokens wallet exchange ledger", icons: ['coins', 'wallet', 'trending-up', 'dollar-sign'] },
        meetings_calendar: { prompt: "meetings calendar schedule appointments agenda zoom call clock events timeline deadlines", icons: ['calendar', 'clock', 'users', 'video', 'calendar-days'] },
        reading_literature: { prompt: "reading books literature research papers articles library documentation notes publication review", icons: ['book-open', 'book', 'library', 'newspaper', 'file-text'] },
        tasks_project: { prompt: "tasks todo checklist goals projects kanban sprint agile action work tracking milestone roadmap", icons: ['check-square', 'target', 'folder-kanban', 'flag', 'list-todo'] },
        design_uiux: { prompt: "design graphic UI UX mockup palette Figma vector drawing art layout typography wireframe", icons: ['layout', 'palette', 'pen-tool', 'brush', 'image'] },
        music_audio: { prompt: "music audio sound song playlist headphones podcast recording radio album track melody", icons: ['music', 'headphones', 'mic', 'disc', 'radio'] },
        video_cinema: { prompt: "video movie film Youtube camera streaming video recording clapperboard cinema broadcast", icons: ['video', 'film', 'play-circle', 'camera', 'clapperboard'] },
        photography_media: { prompt: "photography camera photo portrait snapshot gallery pictures landscape shutter", icons: ['camera', 'image', 'eye', 'film'] },
        health_medical: { prompt: "health medical doctor hospital stethoscope checkup clinic pharmacy prescription disease wellness", icons: ['activity', 'stethoscope', 'heart-pulse', 'shield-check'] },
        fitness_workout: { prompt: "fitness workout exercise gym dumbbell weightlifting cardio training bodybuilding muscles", icons: ['dumbbell', 'activity', 'heart-pulse', 'flame'] },
        travel_vacation: { prompt: "travel trip vacation flight plane map navigation compass location explorer tourism hotel itinerary", icons: ['plane', 'compass', 'map-pin', 'globe', 'map'] },
        gaming_esports: { prompt: "gaming video games console play steam gamepad trophy sword quest arcade rpg esports", icons: ['gamepad-2', 'dices', 'trophy', 'sword'] },
        security_privacy: { prompt: "security passwords privacy authentication lock key shield firewall antivirus credentials token", icons: ['shield-check', 'lock', 'key', 'eye-off'] },
        people_team: { prompt: "people contacts family friends team user profile employee contacts group network community", icons: ['users', 'user', 'contact', 'id-card', 'folder-users'] },
        shopping_ecommerce: { prompt: "shopping cart store buy order product package store market retail ecommerce checkout", icons: ['shopping-cart', 'shopping-bag', 'package', 'store'] },
        food_cooking: { prompt: "food cooking recipe culinary meal dinner lunch breakfast kitchen restaurant baking nutrition chef", icons: ['utensils', 'coffee', 'apple', 'flame'] },
        coffee_beverages: { prompt: "coffee tea cafe drinks beverage espresso morning break barista mug caffeine", icons: ['coffee', 'utensils', 'sun'] },
        law_legal: { prompt: "law legal court justice contract agreement scale gavel scroll compliance lawyer policy", icons: ['scale', 'gavel', 'scroll', 'file-text'] },
        science_physics: { prompt: "science laboratory research chemistry biology experiment microscope flask physics quantum hypothesis", icons: ['flask-conical', 'microscope', 'atom'] },
        nature_environment: { prompt: "nature environment plant garden tree flower leaf eco climate ecology organic botany", icons: ['leaf', 'flower-2', 'tree-pine', 'sun'] },
        space_astronomy: { prompt: "space astronomy stars universe galaxy telescope moon rocket cosmos planets astronaut", icons: ['telescope', 'rocket', 'moon', 'star'] },
        hardware_iot: { prompt: "hardware computer PC CPU hard drive memory components server infrastructure electronics raspberry", icons: ['cpu', 'server', 'hard-drive', 'database'] },
        education_learning: { prompt: "school study university course exam graduation lecture class student homework tutorial degree", icons: ['graduation-cap', 'book', 'school', 'book-open'] },
        pets_animals: { prompt: "pets animal dog cat vet paw print puppy kitten wildlife fauna", icons: ['dog', 'cat', 'paw-print'] },
        psychology_mental: { prompt: "psychology mindset therapy mental health cognition consciousness emotions introspection", icons: ['brain', 'sparkles', 'heart', 'lightbulb'] },
        devops_cloud: { prompt: "devops docker kubernetes terraform aws azure cloud container serverless ci cd deploy infrastructure", icons: ['cloud', 'server', 'terminal', 'box'] },
        database_storage: { prompt: "database sql postgres mysql sqlite mongodb redis schema tables records query data warehouse", icons: ['database', 'server', 'hard-drive', 'layers'] },
        ai_machinelearning: { prompt: "artificial intelligence machine learning deep learning neural network llm gpt model nlp data science", icons: ['sparkles', 'brain', 'cpu', 'wand-2'] },
        architecture_realestate: { prompt: "architecture building house home property real estate construction floorplan interior blueprint", icons: ['home', 'layout', 'building', 'layers'] },
        tools_maintenance: { prompt: "tools utility wrench repair configuration setup maintenance settings preferences fix troubleshoot", icons: ['wrench', 'settings', 'hammer', 'tool'] },
        communication_email: { prompt: "email newsletter inbox messages letters correspondence dispatch mail outbox chat", icons: ['mail', 'send', 'message-square', 'inbox'] },
        social_community: { prompt: "social media twitter community network followers audience engagement sharing connection", icons: ['users', 'share-2', 'message-circle', 'globe'] },
        news_journalism: { prompt: "news journalism headlines press newspaper report breaking media broadcaster scoop", icons: ['newspaper', 'file-text', 'globe', 'radio'] },
        spirituality_meditation: { prompt: "spirituality meditation mindfulness zen yoga peace soul prayer chakra temple tranquility", icons: ['sparkles', 'sun', 'moon', 'leaf'] },
        wu_wei_daoism: { prompt: "wu wei daoism effortless action flow balance nature philosophy wisdom taoism", icons: ['sparkles', 'compass', 'wind', 'leaf'] },
        yin_yang_balance: { prompt: "yin and yang dualism balance harmony scale contrast circle sun moon taoism daoism", icons: ['yin-yang', 'sun-moon', 'circle-dot', 'scale'] },
        vulnerability_openness: { prompt: "vulnerability vulnerable open heart self reflection emotional courage soul", icons: ['heart', 'shield-off', 'unlock', 'eye'] },
        trust_the_process: { prompt: "trust the process growth patience journey continuous progress footprints trending", icons: ['compass', 'trending-up', 'hourglass', 'footprints'] },
        use_it_or_lose_it: { prompt: "use it or lose it maintenance activity practice flame repeat cycle", icons: ['repeat', 'flame', 'activity', 'zap'] },
        habits_routines: { prompt: "important habits habit routine daily tracker repeat words used practice morning routine streak", icons: ['repeat', 'calendar-check', 'activity', 'target'] }
    };

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
        gitlab: ['simple-icons-gitlab', 'code-2', 'git-branch', 'terminal'],
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
        markdown: ['simple-icons-markdown', 'file-text', 'pen-tool']
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

    private extractCleanIconId(iconId: string): string {
        return iconId
            .replace(/^(lucide-|simple-icons-|si-|tabler-|fa-solid-|fa-regular-|bx-|octicon-|ra-|cf-|bi-|ri-|feather-|brand-)/i, '')
            .toLowerCase();
    }

    public initializeIndex(): void {
        if (this.isInitialized) return;

        this.cleanIconIdMap.clear();
        this.synonymExactMap.clear();

        // 1. Index Comprehensive Icon Synonyms Lexicon (Highest priority: 5.0)
        for (const [iconId, synonyms] of Object.entries(ICON_SYNONYMS)) {
            const vector = this.getOrCreateVector(iconId);
            const cleanId = this.extractCleanIconId(iconId);
            const lowerIcon = iconId.toLowerCase();
            vector.tokenWeights.set(lowerIcon, 5.0);
            vector.tokenWeights.set(cleanId, 4.5);

            this.synonymExactMap.set(lowerIcon, iconId);
            this.synonymExactMap.set(cleanId, iconId);

            for (const syn of synonyms) {
                const sLower = syn.toLowerCase();
                if (!this.synonymExactMap.has(sLower)) {
                    this.synonymExactMap.set(sLower, iconId);
                }
                const sNorm = sLower.replace(/[\s_-]+/g, '');
                if (!this.synonymExactMap.has(sNorm)) {
                    this.synonymExactMap.set(sNorm, iconId);
                }

                const weights = this.buildWeightedTokenMap(syn);
                weights.forEach((w, t) => {
                    vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w * 2.0);
                });
                vector.domains.add(syn);
            }
        }

        // 1b. Index Dense Concept Prompts into Vector Token Weights (High priority: 4.5)
        for (const [conceptKey, conceptDef] of Object.entries(EmbeddingModel.DENSE_CONCEPTS)) {
            for (let i = 0; i < conceptDef.icons.length; i++) {
                const iconId = conceptDef.icons[i];
                const vector = this.getOrCreateVector(iconId);
                const cleanId = this.extractCleanIconId(iconId);
                const rankWeight = 1.0 - (i * 0.15);
                vector.tokenWeights.set(iconId.toLowerCase(), Math.max(vector.tokenWeights.get(iconId.toLowerCase()) || 0, 4.0 * rankWeight));
                vector.tokenWeights.set(cleanId, Math.max(vector.tokenWeights.get(cleanId) || 0, 3.5 * rankWeight));

                const weights = this.buildWeightedTokenMap(conceptDef.prompt);
                weights.forEach((w, t) => {
                    vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + (w * 1.8 * rankWeight));
                });
                vector.domains.add(conceptKey);
            }
        }

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

        for (const cat of AUTO_ICON_CATEGORIES) {
            const targets: string[] = [];
            if (cat.lucide) targets.push(cat.lucide);
            if (cat.lucides) targets.push(...cat.lucides);

            const rexClean = cat.rex.source
                .replace(/\\[sSwWdDbB][*+?]?/g, ' ')
                .replace(/[^a-zA-Z0-9\s|-]/g, ' ')
                .replace(/\|/g, ' ')
                .trim();
            const keywords = rexClean.split(/\s+/).filter(k => k.length >= 2);

            for (const iconId of targets) {
                const vector = this.getOrCreateVector(iconId);
                const cleanId = this.extractCleanIconId(iconId);
                vector.tokenWeights.set(iconId.toLowerCase(), 4.0);
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

            vector.tokenWeights.set(iconId.toLowerCase(), 4.0);
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

            vector.tokenWeights.set(iconId.toLowerCase(), 4.0);
            vector.tokenWeights.set(cleanId, 3.5);

            const weights = this.buildWeightedTokenMap(cleanId);
            weights.forEach((w, t) => {
                vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w);
            });
        }

        try {
            const obsidianIconIds = getIconIds();
            if (Array.isArray(obsidianIconIds)) {
                for (const iconId of obsidianIconIds) {
                    const vector = this.getOrCreateVector(iconId);
                    const cleanId = this.extractCleanIconId(iconId);

                    vector.tokenWeights.set(iconId.toLowerCase(), 4.0);
                    vector.tokenWeights.set(cleanId, 3.5);

                    const weights = this.buildWeightedTokenMap(cleanId);
                    weights.forEach((w, t) => {
                        vector.tokenWeights.set(t, (vector.tokenWeights.get(t) || 0) + w);
                    });
                }
            }
        } catch {
            // Ignore if getIconIds is unavailable in current runtime
        }

        // Finalize vector normalization, populate cleanIconIdMap, vectorNorms & build inverted posting lists
        this.invertedIndex.clear();
        this.vectorNorms.clear();

        this.iconVectors.forEach((vec, iconId) => {
            let normSq = 0;
            vec.tokenWeights.forEach(w => { normSq += w * w; });
            const norm = Math.sqrt(normSq) || 1.0;
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
            const normClean = clean.replace(/[\s_-]+/g, '');
            this.cleanIconIdMap.set(lower, iconId);
            this.cleanIconIdMap.set(clean, iconId);
            this.cleanIconIdMap.set(normClean, iconId);
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

        const clean = text
            .replace(/([a-z])([A-Z])/g, '$1 $2')
            .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
            .toLowerCase()
            .replace(/[^a-z0-9\s_-]/g, ' ')
            .trim();
        if (!clean) return tokenWeights;

        // 1b. Contiguous word n-grams (2-word and 3-word phrase tokens: 4.0 weight)
        const rawWordsAll = clean.split(/[\s_-]+/).filter(w => w.length >= 2);

        // 1. Full un-split clean phrase/filename (Highest priority: 5.5)
        addToken(rawWordsAll.join(' '), 5.5);
        addToken(rawWordsAll.join(''), 5.5);
        addToken(rawWordsAll.join('-'), 5.5);
        for (let i = 0; i < rawWordsAll.length - 1; i++) {
            const pairHyphen = `${rawWordsAll[i]}-${rawWordsAll[i + 1]}`;
            const pairClean = `${rawWordsAll[i]} ${rawWordsAll[i + 1]}`;
            addToken(pairHyphen, 4.0);
            addToken(pairClean, 4.0);
            if (i < rawWordsAll.length - 2) {
                const triHyphen = `${rawWordsAll[i]}-${rawWordsAll[i + 1]}-${rawWordsAll[i + 2]}`;
                const triClean = `${rawWordsAll[i]} ${rawWordsAll[i + 1]} ${rawWordsAll[i + 2]}`;
                addToken(triHyphen, 4.0);
                addToken(triClean, 4.0);
            }
        }

        // 2. Full individual word tokens (High priority)
        const filteredWords = rawWordsAll.filter(w => !EmbeddingModel.STOP_WORDS.has(w));
        const words = filteredWords.length > 0 ? filteredWords : rawWordsAll;

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
        const cleaned = cleanSemanticTitle(rawFilename);
        const filename = cleaned || rawFilename.replace(/\.[a-z0-9]+$/i, '');
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
        if (Object.prototype.hasOwnProperty.call(FILE_EXTENSION_DOMAINS, extension)) {
            const arr = FILE_EXTENSION_DOMAINS[extension];
            return Array.isArray(arr) ? arr : [];
        }
        return [];
    }

    private getFolderHintBoosts(folderName: string): string[] {
        if (!folderName) return [];
        const normalized = folderName.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (Object.prototype.hasOwnProperty.call(FOLDER_HINT_DOMAINS, normalized)) {
            const arr = FOLDER_HINT_DOMAINS[normalized];
            if (Array.isArray(arr)) return arr;
        }
        const lower = folderName.toLowerCase();
        if (Object.prototype.hasOwnProperty.call(FOLDER_HINT_DOMAINS, lower)) {
            const arr = FOLDER_HINT_DOMAINS[lower];
            if (Array.isArray(arr)) return arr;
        }

        // Check 4-digit calendar years (e.g. "2020", "2024")
        if (/^\d{4}$/.test(normalized)) {
            return ['calendar', 'clock', 'calendar-days'];
        }

        // Check constituent words of folder name (e.g. "Taxes 2024" -> "taxes", "LYT Workshops" -> "workshops")
        const tokens = lower.split(/[\s._-]+/).filter(t => t.length >= 2);
        for (const tok of tokens) {
            if (Object.prototype.hasOwnProperty.call(FOLDER_HINT_DOMAINS, tok)) {
                const arr = FOLDER_HINT_DOMAINS[tok];
                if (Array.isArray(arr)) return arr;
            }
        }
        return [];
    }

    private applyContextBoost(baseScore: number, iconId: string, context: QueryContext, precalculatedTokens?: string[]): number {
        let boost = 1.0;
        const lowerIcon = iconId.toLowerCase();

        const relevantTokens = precalculatedTokens || [
            ...this.getExtensionBoosts(context.extension),
            ...(context.isFolder ? this.getFolderHintBoosts(context.parentFolder) : [])
        ];
        
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

    public findBestIcons(titleOrPath: string, options?: { topK?: number; minScore?: number; isFolder?: boolean; queryContext?: QueryContext }): VectorMatchResult[] {
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
        const context = options?.queryContext ?? this.buildQueryContext(titleOrPath, options?.isFolder ?? false);

        const relevantTokens = [
            ...this.getExtensionBoosts(context.extension),
            ...(context.isFolder ? this.getFolderHintBoosts(context.parentFolder) : [])
        ];

        const directMatch = this.tryDirectDictionaryMatch(context.lowerName, topK, context);
        if (directMatch.length > 0) {
            const enriched: VectorMatchResult[] = directMatch.map((r): VectorMatchResult => ({
                ...r,
                confidence: 'high',
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

        // Fast Inverted Posting Accumulator (Only visits intersection tokens O(|Q ∩ D|))
        const accumulators = new Map<string, number>();
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

        const queryNorm = Math.sqrt(queryNormSq) || 1.0;
        const scored: { iconId: string; rawScore: number }[] = [];

        accumulators.forEach((dotProduct, iconId) => {
            const docNorm = this.vectorNorms.get(iconId) || 1.0;
            const rawScore = dotProduct / (queryNorm * docNorm);
            if (rawScore >= minScore) {
                scored.push({ iconId, rawScore });
            }
        });

        const boosted = scored
            .map(s => ({
                iconId: s.iconId,
                score: this.applyContextBoost(s.rawScore, s.iconId, context, relevantTokens)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, topK);

        const result: VectorMatchResult[] = boosted.map((r): VectorMatchResult => ({
            ...r,
            matchedTag: context.filename,
            confidence: r.score >= 0.7 ? 'high' : r.score >= 0.45 ? 'medium' : 'low'
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
        // If title contains standard document nouns, it is a document, not a person profile
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

    private tryDirectDictionaryMatch(lowerName: string, topK: number, context?: QueryContext): VectorMatchResult[] {
        const normLowerName = lowerName.replace(/[\s_-]+/g, '');

        const matchedDirectId = this.cleanIconIdMap.get(normLowerName) || this.cleanIconIdMap.get(lowerName);
        if (matchedDirectId) {
            return [{
                iconId: matchedDirectId,
                score: 0.99,
                matchedTag: lowerName,
                confidence: 'high'
            }];
        }

        if (this.plugin?.iconManager) {
            const autoIcon = this.plugin.iconManager.getAutoIconData(lowerName);
            if (autoIcon && autoIcon.lucide) {
                return [{
                    iconId: autoIcon.lucide,
                    score: 0.98,
                    matchedTag: lowerName,
                    confidence: 'high'
                }];
            }
        }

        // Direct O(1) exact match against synonym map
        const exactSynIcon = this.synonymExactMap.get(lowerName) || this.synonymExactMap.get(normLowerName);
        if (exactSynIcon) {
            return [{
                iconId: exactSynIcon,
                score: 0.99,
                matchedTag: lowerName,
                confidence: 'high'
            }];
        }

        // 1. Check Brand Dictionary on individual tokens & pairs (e.g. "docker", "type" + "script" -> "typescript", "aws", "spotify")
        if (context) {
            const rawTokens = context.lowerName.split(/[\s._-]+/).filter(t => t.length >= 2 && !EmbeddingModel.STOP_WORDS.has(t));
            const candidateTokens = [...rawTokens];
            for (let i = 0; i < rawTokens.length - 1; i++) {
                candidateTokens.push(`${rawTokens[i]}${rawTokens[i + 1]}`);
                candidateTokens.push(`${rawTokens[i]}-${rawTokens[i + 1]}`);
            }

            for (const tok of candidateTokens) {
                if (Object.prototype.hasOwnProperty.call(EmbeddingModel.BRAND_DICTIONARY, tok)) {
                    const brandIcons = EmbeddingModel.BRAND_DICTIONARY[tok];
                    if (Array.isArray(brandIcons) && brandIcons.length > 0) {
                        return brandIcons.slice(0, topK).map(iconId => ({
                            iconId,
                            score: 1.0,
                            matchedTag: tok,
                            confidence: 'high'
                        }));
                    }
                }
            }
        }

        // 2. Non-Markdown explicit media / binary extension match (e.g. .png, .jpg, .mp3, .mp4, .pdf)
        if (context && context.extension && !['.md', '.txt', '.json', '.yaml', '.yml', '.toml'].includes(context.extension)) {
            const extIcons = this.getExtensionBoosts(context.extension);
            if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.mp3', '.wav', '.mp4', '.mov'].includes(context.extension) && extIcons.length > 0) {
                return extIcons.slice(0, topK).map((id, idx) => ({
                    iconId: id,
                    score: 0.98 - (idx * 0.02),
                    matchedTag: context.extension,
                    confidence: 'high'
                }));
            }
        }

        // 3. Check pre-filtered high-priority whole-phrase conceptual categories
        if (context) {
            for (let i = 0; i < HIGH_PRIORITY_CATEGORIES.length; i++) {
                const cat = HIGH_PRIORITY_CATEGORIES[i];
                if (cat.rex.test(context.filename) || cat.rex.test(context.lowerName)) {
                    const targets: string[] = [];
                    if (cat.lucide) targets.push(cat.lucide);
                    if (cat.lucides) targets.push(...cat.lucides);
                    if (targets.length > 0) {
                        const unique = Array.from(new Set(targets));
                        return unique.slice(0, topK).map((id, idx) => ({
                            iconId: id,
                            score: 0.98 - (idx * 0.02),
                            matchedTag: 'concept-match',
                            confidence: 'high'
                        }));
                    }
                }
            }
        }

        // 4. Fast O(1) constituent keyword match against synonym exact map
        if (context) {
            const rawTokens = context.lowerName.split(/[\s._-]+/).filter(t => t.length >= 2 && !EmbeddingModel.STOP_WORDS.has(t));
            const candidateTokens = [...rawTokens];
            for (let i = 0; i < rawTokens.length - 1; i++) {
                candidateTokens.push(`${rawTokens[i]}${rawTokens[i + 1]}`);
                candidateTokens.push(`${rawTokens[i]}-${rawTokens[i + 1]}`);
            }

            const matchedFromTokens: { iconId: string; score: number; token: string }[] = [];
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
                const uniqueMap = new Map<string, { iconId: string; score: number; token: string }>();
                for (const m of matchedFromTokens) {
                    if (!uniqueMap.has(m.iconId)) {
                        uniqueMap.set(m.iconId, m);
                    }
                }
                return Array.from(uniqueMap.values()).slice(0, topK).map(m => ({
                    iconId: m.iconId,
                    score: m.score,
                    matchedTag: m.token,
                    confidence: 'high'
                }));
            }
        }

        if (context && this.isPersonName(context.filename, context.parentFolder)) {
            const personIcons = context.isFolder
                ? ['folder-users', 'users', 'user', 'contact']
                : ['user', 'contact', 'id-card', 'profile', 'user-check'];
            return personIcons.slice(0, topK).map(iconId => ({
                iconId,
                score: 0.98,
                matchedTag: 'person-name',
                confidence: 'high'
            }));
        }

        if (Object.prototype.hasOwnProperty.call(EmbeddingModel.BRAND_DICTIONARY, lowerName)) {
            const direct = EmbeddingModel.BRAND_DICTIONARY[lowerName];
            if (Array.isArray(direct)) {
                return direct.slice(0, topK).map(iconId => ({
                    iconId,
                    score: 1.0,
                    matchedTag: lowerName,
                    confidence: 'high'
                }));
            }
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
                confidence: 'high'
            }));
        }

        return [];
    }

    private getFallbackIcons(context: QueryContext, topK: number): VectorMatchResult[] {
        const results: VectorMatchResult[] = [];
        const seen = new Set<string>();

        // 1. If inside a semantically typed parent folder (e.g. Quotes/, Questions/, People/, Scripts/, Maps/), inherit parent domain
        if (context.parentFolder) {
            const folderHints = this.getFolderHintBoosts(context.parentFolder);
            for (const iconId of folderHints) {
                if (!seen.has(iconId) && !['folder', 'box', 'package'].includes(iconId)) {
                    seen.add(iconId);
                    results.push({
                        iconId,
                        score: 0.75,
                        matchedTag: `folder:${context.parentFolder}`,
                        confidence: 'medium'
                    });
                }
                if (results.length >= topK) break;
            }
        }

        // 2. Extension Hints
        const extensionHints = this.getExtensionBoosts(context.extension);
        for (const iconId of extensionHints) {
            if (!seen.has(iconId)) {
                seen.add(iconId);
                results.push({
                    iconId,
                    score: 0.4,
                    matchedTag: context.extension,
                    confidence: 'low'
                });
            }
            if (results.length >= topK) break;
        }

        if (results.length < topK) {
            const isMultiWordSentence = !context.isFolder && context.filename.includes(' ') && context.filename.length > 12;
            let defaultIcons: string[];

            if (context.isFolder) {
                defaultIcons = ['folder', 'layers', 'box', 'folder-kanban'];
            } else if (isMultiWordSentence) {
                const sentencePalette = ['compass', 'sparkles', 'lightbulb', 'quote', 'brain', 'pen-tool', 'book-open', 'repeat', 'heart', 'star'];
                let hash = 0;
                for (let i = 0; i < context.filename.length; i++) {
                    hash = (hash << 5) - hash + context.filename.charCodeAt(i);
                    hash |= 0;
                }
                const absHash = Math.abs(hash);
                const firstIcon = sentencePalette[absHash % sentencePalette.length];
                const secondIcon = sentencePalette[(absHash + 3) % sentencePalette.length];
                const thirdIcon = sentencePalette[(absHash + 5) % sentencePalette.length];
                defaultIcons = [firstIcon, secondIcon, thirdIcon, 'sparkles'];
            } else {
                let hash = 0;
                for (let i = 0; i < context.filename.length; i++) {
                    hash = (hash << 5) - hash + context.filename.charCodeAt(i);
                    hash |= 0;
                }
                const conceptPalette = ['sparkles', 'compass', 'pen-tool', 'lightbulb', 'brain', 'star', 'book-open', 'layers'];
                const selected = conceptPalette[Math.abs(hash) % conceptPalette.length];
                defaultIcons = [selected, 'sparkles', 'compass', 'notebook'];
            }

            for (const iconId of defaultIcons) {
                if (!seen.has(iconId)) {
                    seen.add(iconId);
                    results.push({
                        iconId,
                        score: 0.3,
                        matchedTag: context.isFolder ? 'default-folder' : (isMultiWordSentence ? 'sentence-quote' : 'default-file'),
                        confidence: 'low'
                    });
                }
                if (results.length >= topK) break;
            }
        }

        return results;
    }

    private normalizeFloat32Array(vec: Float32Array): Float32Array {
        let normSq = 0;
        for (let i = 0; i < vec.length; i++) {
            const val = vec[i];
            normSq += val * val;
        }
        const norm = Math.sqrt(normSq) || 1.0;
        for (let i = 0; i < vec.length; i++) {
            vec[i] /= norm;
        }
        return vec;
    }

    public async fetchNeuralEmbedding(text: string): Promise<Float32Array | null> {
        const settings = this.plugin?.settings;
        if (settings?.embeddingEngine === 'builtin') return null;

        const modelName = settings?.embeddingCustomModel || 'bge-m3';
        const endpoint = (settings?.embeddingCustomEndpoint || 'http://localhost:11434').replace(/\/$/, '');

        const endpointsToTry = [
            `${endpoint}/api/embeddings`,
            `${endpoint}/api/embed`,
            `${endpoint}/v1/embeddings`
        ];

        for (const url of endpointsToTry) {
            try {
                const bodyObj = url.endsWith('/v1/embeddings')
                    ? { model: modelName, input: text }
                    : { model: modelName, prompt: text };

                const res = await requestUrl({
                    url,
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(bodyObj)
                });

                const data = res.json as Record<string, unknown>;
                if (Array.isArray(data.embedding)) {
                    return this.normalizeFloat32Array(new Float32Array(data.embedding as number[]));
                }
                if (Array.isArray(data.embeddings) && Array.isArray(data.embeddings[0])) {
                    return this.normalizeFloat32Array(new Float32Array(data.embeddings[0] as number[]));
                }
                if (Array.isArray(data.data) && (data.data[0] as Record<string, unknown>)?.embedding) {
                    return this.normalizeFloat32Array(new Float32Array((data.data[0] as Record<string, unknown>).embedding as number[]));
                }
            } catch {
                // Try next endpoint
            }
        }

        return null;
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
     * Computes Cosine Similarity between two pre-normalized dense N-dimensional floating point vectors.
     */
    public computeDenseCosineSimilarity(vecA: Float32Array | number[], vecB: Float32Array | number[]): number {
        if (!vecA || !vecB || vecA.length === 0 || vecB.length === 0) return 0;
        const len = Math.min(vecA.length, vecB.length);
        let dot = 0;
        for (let i = 0; i < len; i++) {
            dot += vecA[i] * vecB[i];
        }
        return dot;
    }

    public async findBestIconsDense(
        titleOrPath: string,
        denseVector: Float32Array | number[],
        options?: { topK?: number; minScore?: number; isFolder?: boolean }
    ): Promise<VectorMatchResult[]> {
        const topK = options?.topK ?? DEFAULT_TOP_K;
        const minScore = options?.minScore ?? 0.15;
        const context = this.buildQueryContext(titleOrPath, options?.isFolder ?? false);

        const missingKeys = Object.keys(EmbeddingModel.DENSE_CONCEPTS).filter(
            key => !this.conceptDenseVectors.has(key)
        );
        if (missingKeys.length > 0) {
            await Promise.all(
                missingKeys.map(async (conceptKey) => {
                    const conceptDef = EmbeddingModel.DENSE_CONCEPTS[conceptKey];
                    if (conceptDef) {
                        const vec = await this.fetchNeuralEmbedding(conceptDef.prompt);
                        if (vec) {
                            this.conceptDenseVectors.set(conceptKey, vec);
                        }
                    }
                })
            );
        }

        const iconScores = new Map<string, number>();

        this.conceptDenseVectors.forEach((conceptVec, conceptKey) => {
            const sim = this.computeDenseCosineSimilarity(denseVector, conceptVec);
            if (sim > minScore) {
                const conceptDef = EmbeddingModel.DENSE_CONCEPTS[conceptKey];
                if (conceptDef) {
                    conceptDef.icons.forEach((iconId, idx) => {
                        const rankWeight = 1.0 - (idx * 0.1);
                        const score = sim * rankWeight;
                        const existing = iconScores.get(iconId) || 0;
                        iconScores.set(iconId, Math.max(existing, score));
                    });
                }
            }
        });

        // Hybrid Scoring: Ingest sparse keyword matches to reinforce dense signals
        const sparseMatches = this.findBestIcons(titleOrPath, { topK: 10, minScore: 0.1, isFolder: options?.isFolder, queryContext: context });
        for (const sm of sparseMatches) {
            const current = iconScores.get(sm.iconId) || 0;
            // 60% Dense Neural Similarity + 40% Sparse Keyword BM25
            iconScores.set(sm.iconId, Math.max(current, (current * 0.6) + (sm.score * 0.4)));
        }

        if (iconScores.size > 0) {
            const sorted = Array.from(iconScores.entries())
                .map(([iconId, score]) => ({
                    iconId,
                    score: this.applyContextBoost(score, iconId, context)
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, topK);

            return sorted.map((r): VectorMatchResult => ({
                ...r,
                matchedTag: context.filename,
                confidence: r.score >= 0.65 ? 'high' : r.score >= 0.35 ? 'medium' : 'low'
            }));
        }

        return this.findBestIcons(titleOrPath, { ...options, queryContext: context });
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
                    const matches = await this.findBestIconsDense(item.name || item.path, denseVector, { topK: 3, isFolder: item.isFolder });
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
