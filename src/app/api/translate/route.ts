// src/app/api/translate/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { translate } from '@vitalets/google-translate-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, targetLang, sourceLang = 'en' } = body;

    if (!text || !targetLang) {
      return NextResponse.json(
        { success: false, message: 'text and targetLang are required' },
        { status: 400 }
      );
    }

    // Use Google Translate API (via @vitalets/google-translate-api)
    const result = await translate(text, { from: sourceLang, to: targetLang });

    return NextResponse.json({
      success: true,
      originalText: text,
      translatedText: result.text,
      sourceLang,
      targetLang,
    });
  } catch (error) {
    console.error('Translation error:', error);
    return NextResponse.json(
      { success: false, message: 'Translation failed' },
      { status: 500 }
    );
  }
}

// Optional: GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Translation API is running',
    note: 'Using Google Translate API via @vitalets/google-translate-api',
  });
}
