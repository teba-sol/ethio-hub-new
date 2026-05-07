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
            className="w-full p-4 bg-gray-50/50 border border-gray-200 rounded-[14px] text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all duration-200 placeholder:text-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:bg-white"
            placeholder={placeholder || (language === 'en' ? 'Enter in English...' : 'አማርኛ ያስገቡ...')}
            required={required}
            dir="ltr"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={handleChange}
            className="w-full px-4 py-3.5 bg-gray-50/50 border border-gray-200 rounded-[14px] text-sm focus:ring-4 focus:ring-primary/10 focus:border-primary focus:bg-white outline-none transition-all duration-200 placeholder:text-gray-400 shadow-[0_2px_4px_rgba(0,0,0,0.02)] hover:border-gray-300 hover:bg-white"
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
}) => {
  const baseClass = 'w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all';
  const Field = textarea ? 'textarea' : 'input';

  return (
    <div className={`space-y-3 ${className}`}>
      {label && !hideLabel && (
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className={`grid ${(showEnglish && showAmharic) ? 'grid-cols-1 md:grid-cols-2 gap-4' : 'grid-cols-1'} gap-4`}>
        {showEnglish && (
          <div className="space-y-2">
            {!hideLabel && (
              <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-700">
                English
              </span>
            )}
            <Field
              {...(textarea ? { rows } : { type: 'text' })}
              value={englishValue}
              onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onEnglishChange(event.target.value)}
              className={baseClass}
              placeholder={englishPlaceholder}
              required={required}
              dir="ltr"
            />
          </div>
        )}
        {showAmharic && (
          <div className="space-y-2">
            {!hideLabel && (
              <span className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-amber-700">
                Amharic
              </span>
            )}
            <Field
              {...(textarea ? { rows } : { type: 'text' })}
              value={amharicValue}
              onChange={(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onAmharicChange(event.target.value)}
              className={baseClass}
              placeholder={amharicPlaceholder}
              required={required}
              dir="auto"
            />
          </div>
        )}
      </div>
    </div>
  );
};
