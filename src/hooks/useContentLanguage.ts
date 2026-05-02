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
      return typeof baseValue === 'string' ? baseValue : '';
    },
    [language]
  );

  return {
    language,
    getLocalizedField,
  };
}
