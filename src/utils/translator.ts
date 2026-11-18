/**
 * VoiceScribe Real-Time Translator Utility
 * Powers live bilingual subtitles, meeting interpretation,
 * and dual-language dictation.
 */

export interface TranslationResult {
  original: string;
  translated: string;
  sourceLang: string;
  targetLang: string;
}

export const POPULAR_TARGET_LANGUAGES = [
  { code: 'en', name: 'English', flag: 'EN' },
  { code: 'hi', name: 'Hindi (हिंदी)', flag: 'HI' },
  { code: 'es', name: 'Spanish (Español)', flag: 'ES' },
  { code: 'fr', name: 'French (Français)', flag: 'FR' },
  { code: 'de', name: 'German (Deutsch)', flag: 'DE' },
  { code: 'ja', name: 'Japanese (日本語)', flag: 'JA' },
  { code: 'zh', name: 'Chinese (中文)', flag: 'ZH' },
  { code: 'ar', name: 'Arabic (العربية)', flag: 'AR' },
  { code: 'ru', name: 'Russian (Русский)', flag: 'RU' },
  { code: 'pt', name: 'Portuguese (Português)', flag: 'PT' },
  { code: 'it', name: 'Italian (Italiano)', flag: 'IT' },
  { code: 'bn', name: 'Bengali (বাংলা)', flag: 'BN' },
  { code: 'ur', name: 'Urdu (اردو)', flag: 'UR' },
  { code: 'ko', name: 'Korean (한국어)', flag: 'KO' },
];

/**
 * Normalizes BCP-47 language codes (e.g. 'en-US' -> 'en', 'hi-IN' -> 'hi')
 */
export function normalizeLanguageCode(code: string): string {
  if (!code) return 'en';
  return code.split('-')[0].toLowerCase();
}

/**
 * Translates text client-side using free high-speed endpoint.
 * Falls back gracefully if network fails or text is empty.
 */
export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const sl = normalizeLanguageCode(sourceLang);
  const tl = normalizeLanguageCode(targetLang);

  if (sl === tl) return trimmed;

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sl
    )}&tl=${encodeURIComponent(tl)}&dt=t&q=${encodeURIComponent(trimmed)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Translation failed with HTTP ${response.status}`);
    }

    const data = await response.json();
    if (Array.isArray(data) && Array.isArray(data[0])) {
      const parts = data[0]
        .map((segment: unknown[]) => (Array.isArray(segment) ? segment[0] : ''))
        .filter(Boolean);
      return parts.join('').trim() || trimmed;
    }

    return trimmed;
  } catch {
    // If offline or blocked, return original text safely
    return trimmed;
  }
}
