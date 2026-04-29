'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Language, TranslationDictionary } from '@/locales/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    // Load saved language from localStorage on mount
    const saved = localStorage.getItem('language') as Language;
    if (saved && (saved === 'en' || saved === 'am')) {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  // Translation function
  const t = (key: string): string => {
    const keys = key.split('.');
    let current: TranslationDictionary | string = translations[language];

    for (const k of keys) {
      if (typeof current === 'string') {
        // Key path too deep
        return key;
      }
      current = current[k];

      if (current === undefined) {
        // Key not found, fallback to English
        let fallback: TranslationDictionary | string = translations.en;
        for (const fk of keys) {
          if (typeof fallback === 'string') break;
          fallback = fallback[fk];
          if (fallback === undefined) return key;
        }
        return typeof fallback === 'string' ? fallback : key;
      }
    }

    return typeof current === 'string' ? current : key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Custom hook for using language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Export translations for static typing
import translations from '@/locales/translations';
