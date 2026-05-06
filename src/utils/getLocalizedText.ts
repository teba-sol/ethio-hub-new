// src/utils/getLocalizedText.ts
import { Language } from '@/locales/translations';

type LocalizedField = 'name' | 'description' | 'shortDescription' | 'fullDescription' | 'title' | 'type' | 'locationName' | 'cancellation' | 'terms' | 'safety' | 'activities';

interface LocalizedObject {
  [key: string]: any;
}

export function getLocalizedText(
  obj: LocalizedObject | null | undefined,
  field: LocalizedField,
  language: Language
): string {
  if (!obj) return '';

  // Try language-specific field first (name_en, description_en, etc.)
  const localizedField = `${field}_${language}`;
  if (obj[localizedField]) return obj[localizedField];

  // Try nested object structure (name: { en: "...", am: "..." })
  if (obj[field] && typeof obj[field] === 'object' && !Array.isArray(obj[field])) {
    if (obj[field][language]) return obj[field][language];
    if (obj[field]['en']) return obj[field]['en'];
  }

  // Fallback to English
  const englishField = `${field}_en`;
  if (obj[englishField]) return obj[englishField];

  // Fallback to base field (for backward compatibility)
  const baseField = obj[field];
  if (baseField) {
    if (typeof baseField === 'string' || typeof baseField === 'number') {
      return String(baseField);
    }
    if (typeof baseField === 'object') {
      const langKey = language.toLowerCase();
      if (baseField[langKey]) return baseField[langKey];
      if (baseField['en']) return baseField['en'];
      for (const key in baseField) {
        if (typeof baseField[key] === 'string' && baseField[key]) {
          return baseField[key];
        }
      }
    }
  }

  return '';
}
