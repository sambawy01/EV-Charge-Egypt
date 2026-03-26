import { I18nManager } from 'react-native';
import { en } from '../i18n/en';
import { ar } from '../i18n/ar';

type TranslationKey = keyof typeof en;

const translations: Record<string, Record<string, string>> = {
  en: en as Record<string, string>,
  ar: ar as Record<string, string>,
};

let currentLocale = 'en';

export const i18n = {
  setLocale(locale: 'en' | 'ar') {
    currentLocale = locale;
    I18nManager.forceRTL(locale === 'ar');
    I18nManager.allowRTL(locale === 'ar');
  },

  getLocale(): string {
    return currentLocale;
  },

  isRTL(): boolean {
    return currentLocale === 'ar';
  },
};

export function t(key: TranslationKey): string {
  return translations[currentLocale]?.[key] || translations.en[key] || key;
}
