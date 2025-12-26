import { en } from '../locales/en';
import { zh } from '../locales/zh';

export type Language = 'en' | 'zh';
export type TranslationKey = keyof typeof en;

const translations = {
  en,
  zh,
};

let currentLanguage: Language = 'en'; // Default to English

export const i18n = {
  setLanguage: (lang: Language) => {
    currentLanguage = lang;
    localStorage.setItem('gameLanguage', lang);
  },
  
  getLanguage: (): Language => {
    const saved = localStorage.getItem('gameLanguage') as Language;
    if (saved && (saved === 'en' || saved === 'zh')) {
      return saved;
    }
    return currentLanguage || 'en'; // Default to English
  },
  
  t: (key: string, params?: Record<string, string | number>): string => {
    const lang = currentLanguage || i18n.getLanguage();
    const keys = key.split('.');
    let value: any = translations[lang];
    
    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Fallback to English if translation not found
        value = translations.en;
        for (const k2 of keys) {
          value = value?.[k2];
        }
        break;
      }
    }
    
    if (typeof value !== 'string') {
      return key; // Return key if translation not found
    }
    
    // Replace parameters
    if (params) {
      return value.replace(/\$\{(\w+)\}/g, (match, paramKey) => {
        return params[paramKey]?.toString() || match;
      });
    }
    
    return value;
  },
};

// Initialize language from localStorage
currentLanguage = i18n.getLanguage();

