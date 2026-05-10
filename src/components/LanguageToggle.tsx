'use client';

import { useLanguage } from '@/context/LanguageContext';
import { Languages } from 'lucide-react';

export function LanguageToggle({ isScrolled, isHomePage }: { isScrolled?: boolean, isHomePage?: boolean }) {
  const { language, setLanguage } = useLanguage();

  // If we're on a white background (like dashboards)
  const isDashboard = isHomePage === undefined && isScrolled === undefined;
  const isLightMode = isDashboard || isScrolled;

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'am' : 'en')}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all duration-500 ${
        isLightMode
          ? "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-700"
          : "bg-white/10 backdrop-blur-md border-white/20 hover:bg-white/20 text-white"
      }`}
      aria-label="Toggle language"
    >
      <Languages className={`w-4 h-4 ${isLightMode ? 'text-primary' : 'text-white'}`} />
      <span className={`text-[10px] font-black ${isLightMode ? 'text-gray-900' : 'text-white'}`}>
        {language === 'en' ? 'EN' : 'አማ'}
      </span>
    </button>
  );
}

export default LanguageToggle;
