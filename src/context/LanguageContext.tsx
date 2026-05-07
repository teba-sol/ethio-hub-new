'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { Language, TranslationDictionary, translations } from '../locales/translations';

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
   const t = (key: string, params?: Record<string, any>): string => {
     if (!key) return '';
     const keys = key.split('.');
     let current: TranslationDictionary | string = translations[language];

     for (const k of keys) {
       if (typeof current === 'string') {
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
         current = fallback;
         if (typeof current !== 'string') return key;
       }
     }

     let result = typeof current === 'string' ? current : key;

     // Apply parameter interpolation
     if (params && typeof result === 'string') {
       Object.entries(params).forEach(([k, v]) => {
         result = result.replace(new RegExp(`{${k}}`, 'g'), String(v));
       });
     }

     return result;
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
