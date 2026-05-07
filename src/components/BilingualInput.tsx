// src/components/BilingualInput.tsx
import React from 'react';
import { useLanguage } from '@/context/LanguageContext';

interface BilingualInputProps {
  label?: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  otherValue?: string;
  textarea?: boolean;
  rows?: number;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

interface DualLanguageFieldProps {
  label: string;
  englishValue: string;
  amharicValue: string;
  onEnglishChange: (value: string) => void;
  onAmharicChange: (value: string) => void;
  textarea?: boolean;
  rows?: number;
  required?: boolean;
  englishPlaceholder?: string;
  amharicPlaceholder?: string;
  className?: string;
  showEnglish?: boolean;
  showAmharic?: boolean;
  hideLabel?: boolean;
  type?: string;
  icon?: any;
}

export const BilingualInput: React.FC<BilingualInputProps & { hideLabel?: boolean }> = ({
  label,
  name,
  value,
  onChange,
  otherValue,
  textarea = false,
  rows = 3,
  className = '',
  required = false,
  placeholder,
  hideLabel = false,
}) => {
  const { language } = useLanguage();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col space-y-2 w-full group ${className}`}>
      {label && !hideLabel && (
        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 transition-colors group-focus-within:text-primary">
          {label}
        </label>
      )}

      <div className="space-y-2">
        {!hideLabel && (
          <label className="text-[10px] font-bold text-gray-400 ml-1 flex items-center gap-2">
            <span className="w-1 h-1 rounded-full bg-primary/40" />
            {language === 'en' ? 'English' : 'አማርኛ'} {required && <span className="text-red-500">*</span>}
          </label>
        )}
        {textarea ? (
          <textarea
            value={value}
            onChange={handleChange}
            rows={rows}
            className="w-full px-4 py-4 bg-gray-50/30 border border-gray-200 rounded-[16px] text-sm transition-all duration-300 placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:bg-white hover:shadow-md resize-none"
            placeholder={placeholder || (language === 'en' ? 'Enter in English...' : 'አማርኛ ያስገቡ...')}
            required={required}
            dir="ltr"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={handleChange}
            className="w-full px-4 py-4 bg-gray-50/30 border border-gray-200 rounded-[16px] text-sm transition-all duration-300 placeholder:text-gray-400 focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 focus:outline-none shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:bg-white hover:shadow-md"
            placeholder={placeholder || (language === 'en' ? 'Enter in English...' : 'አማርኛ ያስገቡ...')}
            required={required}
            dir="ltr"
          />
        )}
      </div>
    </div>
  );
};

export const DualLanguageField: React.FC<DualLanguageFieldProps> = ({
  label,
  englishValue,
  amharicValue,
  onEnglishChange,
  onAmharicChange,
  textarea = false,
  rows = 3,
  required = true,
  englishPlaceholder = 'Enter English version...',
  amharicPlaceholder = 'Enter Amharic version...',
  className = '',
  showEnglish = true,
  showAmharic = true,
  hideLabel = false,
  type = 'text',
  icon: Icon,
}) => {
  const inputBaseClass = `w-full ${Icon ? 'pl-11 pr-4' : 'px-4'} py-4 bg-gray-50/30 border border-gray-200 rounded-[16px] text-sm transition-all duration-300 placeholder:text-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:bg-white hover:shadow-md focus:bg-white focus:outline-none`;
  const textareaBaseClass = 'w-full px-4 py-4 bg-gray-50/30 border border-gray-200 rounded-[16px] text-sm transition-all duration-300 placeholder:text-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:bg-white hover:shadow-md focus:bg-white focus:outline-none resize-none';
  const focusClass = 'focus:border-primary focus:ring-4 focus:ring-primary/10';
  const Field = textarea ? 'textarea' : 'input';

  return (
    <div className={`space-y-3 ${className}`}>
      {label && !hideLabel && (
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest ml-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className={`grid ${(showEnglish && showAmharic) ? 'grid-cols-1 md:grid-cols-2 gap-4' : 'grid-cols-1'} gap-4`}>
        {showEnglish && (
          <div className="relative">
            {!hideLabel && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700 mb-2">
                English
              </span>
            )}
            <div className="relative group">
              {Icon && !textarea && (
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-primary z-10" />
              )}
              <Field
                {...(textarea ? { rows } : { type })}
                value={englishValue}
                onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onEnglishChange(event.target.value)}
                className={`${textarea ? textareaBaseClass : inputBaseClass} ${focusClass}`}
                placeholder={englishPlaceholder}
                required={required}
                dir="ltr"
              />
              <div className="absolute inset-0 rounded-[16px] pointer-events-none border border-transparent transition-all duration-300 group-hover:border-primary/20 group-focus-within:border-primary/30" />
            </div>
          </div>
        )}
        {showAmharic && (
          <div className="relative">
            {!hideLabel && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700 mb-2">
                አማርኛ
              </span>
            )}
            <div className="relative group">
              {Icon && !textarea && (
                <Icon className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 transition-colors group-focus-within:text-primary z-10" />
              )}
              <Field
                {...(textarea ? { rows } : { type })}
                value={amharicValue}
                onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onAmharicChange(event.target.value)}
                className={`${textarea ? textareaBaseClass : inputBaseClass} ${focusClass}`}
                placeholder={amharicPlaceholder}
                required={required}
                dir="auto"
              />
              <div className="absolute inset-0 rounded-[16px] pointer-events-none border border-transparent transition-all duration-300 group-hover:border-primary/20 group-focus-within:border-primary/30" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
