'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Languages } from 'lucide-react';

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 hover:border-primary transition-colors"
      aria-label="Toggle language"
    >
      <Languages className="w-4 h-4 text-gray-600" />
      <span className="text-xs font-bold text-gray-700">
        {language === 'en' ? 'EN' : 'አማ'}
      </span>
    </button>
  );
}

export default LanguageToggle;
