import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { en } from './en';
import { ar } from './ar';

type TranslationKeys = keyof typeof en;
type Language = 'en' | 'ar';

const LANG_KEY = 'ev_charge_lang';
let _currentLang: Language = 'en';
let _listeners: (() => void)[] = [];

export function useTranslation() {
  const [lang, setLangState] = useState<Language>(_currentLang);

  useEffect(() => {
    // Load saved language
    AsyncStorage.getItem(LANG_KEY).then((saved) => {
      if (saved === 'ar' || saved === 'en') {
        _currentLang = saved;
        setLangState(saved);
      }
    });

    // Subscribe to language changes
    const listener = () => setLangState(_currentLang);
    _listeners.push(listener);
    return () => { _listeners = _listeners.filter(l => l !== listener); };
  }, []);

  const setLanguage = useCallback(async (newLang: Language) => {
    _currentLang = newLang;
    await AsyncStorage.setItem(LANG_KEY, newLang);
    setLangState(newLang);
    _listeners.forEach(l => l());
  }, []);

  const t = useCallback((key: TranslationKeys): string => {
    const translations = lang === 'ar' ? ar : en;
    return (translations as any)[key] || (en as any)[key] || key;
  }, [lang]);

  const isRTL = lang === 'ar';

  return { t, lang, setLanguage, isRTL };
}
