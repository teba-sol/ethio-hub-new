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

  // Try language-specific field first (name_am, description_en, etc.)
  const localizedField = `${field}_${language}`;
  if (obj[localizedField]) return obj[localizedField];

  // Fallback to English
  const englishField = `${field}_en`;
  if (obj[englishField]) return obj[englishField];

  // Fallback to base field (for backward compatibility)
  if (obj[field]) return obj[field];

  return '';
}
