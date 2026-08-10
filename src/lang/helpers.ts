import * as obsidian from 'obsidian';
import en from './locale/en';
import zhCN from './locale/zh-cn';
import zhTW from './locale/zh-tw';
import es from './locale/es';
import fr from './locale/fr';
import de from './locale/de';
import ja from './locale/ja';
import sk from './locale/sk';

export type TranslationKey = keyof typeof en;
export type LocaleDictionary = Record<TranslationKey, string>;

const localeMap: Record<string, Partial<LocaleDictionary>> = {
    en,
    zh: zhCN,
    'zh-cn': zhCN,
    'zh-tw': zhTW,
    'zh-hk': zhTW,
    es,
    fr,
    de,
    ja,
    sk,
};

let cachedLang: string | null = null;

export function getLanguage(): string {
    if (cachedLang) return cachedLang;
    const obs = obsidian as unknown as { getLanguage?: () => string };
    const obsidianLang = obs.getLanguage?.();
    if (obsidianLang) {
        cachedLang = obsidianLang.toLowerCase();
        return cachedLang;
    }
    const locale = (obsidian.moment?.locale() || (typeof navigator !== 'undefined' ? navigator.language : 'en')).toLowerCase();
    cachedLang = locale;
    return cachedLang;
}

export function t(key: TranslationKey, vars?: Record<string, string | number>): string {
    const currentLang = getLanguage();
    const currentLocale = localeMap[currentLang] || localeMap[currentLang.split('-')[0]] || en;
    
    let text: string = currentLocale[key] || en[key] || key;

    if (vars) {
        Object.entries(vars).forEach(([name, value]) => {
            text = text.replace(new RegExp(`\\{\\{${name}\\}\\}`, 'g'), String(value));
        });
    }

    return text;
}
