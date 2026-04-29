// src/components/BilingualInput.tsx
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface BilingualInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name_en: string;
  name_am: string;
  value_en: string;
  value_am: string;
  onChange_en: (value: string) => void;
  onChange_am: (value: string) => void;
  textarea?: boolean;
  rows?: number;
}

export const BilingualInput: React.FC<BilingualInputProps> = ({
  label,
  name_en,
  name_am,
  value_en,
  value_am,
  onChange_en,
  onChange_am,
  textarea = false,
  rows = 3,
  className = '',
  ...props
}) => {
  const { language } = useLanguage();

  const isAmharic = language === 'am';

  return (
    <div className={`flex flex-col space-y-1 w-full ${className}`}>
      {label && (
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
          {label}
        </label>
      )}

      <div className="space-y-3">
        {/* English Input */}
        <div className={`transition-all ${isAmharic ? 'opacity-60' : ''}`}>
          <label className="text-[10px] font-bold text-gray-400 ml-1">
            English {!isAmharic && <span className="text-red-500">*</span>}
          </label>
          {textarea ? (
            <textarea
              value={value_en}
              onChange={(e) => onChange_en(e.target.value)}
              rows={rows}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder={`Enter ${name_en} in English...`}
              required={!isAmharic}
              {...props as any}
            />
          ) : (
            <input
              type="text"
              value={value_en}
              onChange={(e) => onChange_en(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder={`Enter ${name_en} in English...`}
              required={!isAmharic}
              {...props}
            />
          )}
        </div>

        {/* Amharic Input */}
        <div className={`transition-all ${!isAmharic ? 'opacity-60' : ''}`}>
          <label className="text-[10px] font-bold text-gray-400 ml-1">
            አማሪች {isAmharic && <span className="text-red-500">*</span>}
          </label>
          {textarea ? (
            <textarea
              value={value_am}
              onChange={(e) => onChange_am(e.target.value)}
              rows={rows}
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder={`${name_am} በማሪ ይግሉ...`}
              required={isAmharic}
              dir="auto"
              {...props as any}
            />
          ) : (
            <input
              type="text"
              value={value_am}
              onChange={(e) => onChange_am(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all"
              placeholder={`${name_am} በማሪ ይግሉ...`}
              required={isAmharic}
              dir="auto"
              {...props}
            />
          )}
        </div>
      </div>
    </div>
  );
};
