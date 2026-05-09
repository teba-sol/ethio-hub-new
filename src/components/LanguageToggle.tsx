'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Languages } from 'lucide-react';

export function LanguageToggle({ isScrolled, isHomePage }: { isScrolled?: boolean, isHomePage?: boolean }) {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all duration-500 ${
        isScrolled || !isHomePage
          ? "bg-white border-gray-200 hover:border-primary"
          : "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-white"
      }`}
      aria-label="Toggle language"
    >
      <Languages className={`w-4 h-4 ${isScrolled || !isHomePage ? "text-gray-600" : "text-white"}`} />
      <span className={`text-xs font-bold ${isScrolled || !isHomePage ? "text-gray-700" : "text-white"}`}>
        {language === 'en' ? 'EN' : 'አማ'}
      </span>
    </button>
  );
}

export default LanguageToggle;
