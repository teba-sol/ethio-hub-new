'use client';

import { useCallback } from 'react';
import { useLanguage } from '@/context/LanguageContext';

type LocalizedContent = object | null | undefined;

export function useContentLanguage() {
  const { language } = useLanguage();

  const getLocalizedField = useCallback(
    (content: LocalizedContent, field: string): string => {
      if (!content) return '';
      const values = content as Record<string, unknown>;

      // Try language-specific field first (name_en, description_am, etc.)
      const localizedValue = values[`${field}_${language}`];
      if (typeof localizedValue === 'string' && localizedValue.trim()) {
        return localizedValue;
      }

      // Try nested object structure (name: { en: "...", am: "..." })
      const nestedValue = values[field];
      if (nestedValue && typeof nestedValue === 'object' && !Array.isArray(nestedValue)) {
        const nestedObj = nestedValue as Record<string, unknown>;
        if (typeof nestedObj[language] === 'string' && nestedObj[language]) {
          return nestedObj[language] as string;
        }
        if (typeof nestedObj['en'] === 'string' && nestedObj['en']) {
          return nestedObj['en'] as string;
        }
      }

      // Fallback to English
      const englishValue = values[`${field}_en`];
      if (typeof englishValue === 'string' && englishValue.trim()) {
        return englishValue;
      }

      // Fallback to Amharic
      const amharicValue = values[`${field}_am`];
      if (typeof amharicValue === 'string' && amharicValue.trim()) {
        return amharicValue;
      }

      // Fallback to base field (for backward compatibility)
      const baseValue = values[field];
      if (typeof baseValue === 'string') {
        return baseValue;
      }
      if (baseValue && typeof baseValue === 'object') {
        const langKey = language.toLowerCase();
        if (baseValue[langKey] && typeof baseValue[langKey] === 'string') {
          return baseValue[langKey];
        }
        if (baseValue['en'] && typeof baseValue['en'] === 'string') {
          return baseValue['en'];
        }
        for (const key in baseValue) {
          if (typeof baseValue[key] === 'string') {
            return baseValue[key];
          }
        }
      }
      return '';
    },
    [language]
  );

  return {
    language,
    getLocalizedField,
  };
}
