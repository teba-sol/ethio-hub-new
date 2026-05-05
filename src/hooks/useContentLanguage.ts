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

      const localizedValue = values[`${field}_${language}`];
      if (typeof localizedValue === 'string' && localizedValue.trim()) {
        return localizedValue;
      }

      const englishValue = values[`${field}_en`];
      if (typeof englishValue === 'string' && englishValue.trim()) {
        return englishValue;
      }

      const amharicValue = values[`${field}_am`];
      if (typeof amharicValue === 'string' && amharicValue.trim()) {
        return amharicValue;
      }

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
