// src/hooks/useAutoTranslate.ts
import { useState, useEffect } from 'react';

interface UseAutoTranslateReturn {
  translatedText: string;
  isTranslating: boolean;
  error: string | null;
}

export function useAutoTranslate(
  text: string,
  sourceLang: string = 'en',
  targetLang: string = 'am'
): UseAutoTranslateReturn {
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text.trim()) {
      setTranslatedText('');
      return;
    }

    const translateText = async () => {
      setIsTranslating(true);
      setError(null);

      try {
        const response = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text,
            sourceLang,
            targetLang,
          }),
        });

        const data = await response.json();

        if (data.success) {
          setTranslatedText(data.translatedText);
        } else {
          setError(data.message || 'Translation failed');
        }
      } catch (err) {
        setError('Failed to translate text');
        console.error('Translation error:', err);
      } finally {
        setIsTranslating(false);
      }
    };

    // Debounce translation requests
    const timer = setTimeout(() => {
      translateText();
    }, 500);

    return () => clearTimeout(timer);
  }, [text, sourceLang, targetLang]);

  return { translatedText, isTranslating, error };
}
