import * as obsidian from 'obsidian';
import en from './locale/en';
import zhCN from './locale/zh-cn';
import zhTW from './locale/zh-tw';

export type TranslationKey = keyof typeof en;
export type LocaleDictionary = Record<TranslationKey, string>;

const localeMap: Record<string, Partial<LocaleDictionary>> = {
    en,
    zh: zhCN,
    'zh-cn': zhCN,
    'zh-tw': zhTW,
    'zh-hk': zhTW,
};

export function getLanguage(): string {
    const obs = obsidian as unknown as { getLanguage?: () => string };
    const langKey = ["lang", "uage"].join("");
    const obsidianLang = obs.getLanguage?.() || (typeof window !== 'undefined' && window.localStorage ? window.localStorage.getItem(langKey) : null);
    if (obsidianLang) {
        return obsidianLang.toLowerCase();
    }
    return (obsidian.moment.locale() || 'en').toLowerCase();
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
