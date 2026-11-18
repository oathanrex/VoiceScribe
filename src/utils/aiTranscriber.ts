/**
 * VoiceScribe AI Audio Transcriber Utility
 * Supports client-side transcription of Tab Audio streams and audio/video files
 * via Groq Whisper (free & ultra-fast), OpenAI Whisper, and Gemini Flash.
 */

export type AIProvider = 'groq' | 'openai' | 'gemini';

export interface AISettings {
  provider: AIProvider;
  groqKey?: string;
  openaiKey?: string;
  geminiKey?: string;
  autoTranscribeChunks: boolean;
  chunkDurationSeconds: number;
}

const STORAGE_KEY = 'voicescribe_ai_transcriber_config';

export const DEFAULT_AI_SETTINGS: AISettings = {
  provider: 'groq',
  groqKey: '',
  openaiKey: '',
  geminiKey: '',
  autoTranscribeChunks: true,
  chunkDurationSeconds: 10,
};

export function loadAISettings(): AISettings {
  if (typeof window === 'undefined' || !window.localStorage) {
    return DEFAULT_AI_SETTINGS;
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_AI_SETTINGS;
    return { ...DEFAULT_AI_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_AI_SETTINGS;
  }
}

export function saveAISettings(settings: Partial<AISettings>): AISettings {
  const current = loadAISettings();
  const updated: AISettings = { ...current, ...settings };
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore quota errors
    }
  }
  return updated;
}

export function getActiveApiKey(settings: AISettings): string {
  switch (settings.provider) {
    case 'groq':
      return settings.groqKey || '';
    case 'openai':
      return settings.openaiKey || '';
    case 'gemini':
      return settings.geminiKey || '';
    default:
      return '';
  }
}

/**
 * Transcribes an audio blob (WAV/WebM/MP3) using Groq Whisper API.
 * Blazing fast (up to 300x realtime) and provides a generous free tier.
 */
export async function transcribeWithGroq(
  blob: Blob,
  apiKey: string,
  languageCode = 'en'
): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error('Groq API Key is missing. Enter your key in the Tab Audio settings.');
  }

  const formData = new FormData();
  const filename = blob.type.includes('webm') ? 'audio.webm' : 'audio.wav';
  formData.append('file', blob, filename);
  formData.append('model', 'whisper-large-v3-turbo');
  
  // Extract 2-letter language code (e.g., 'hi' from 'hi-IN')
  const shortLang = languageCode.split('-')[0].toLowerCase();
  if (shortLang) {
    formData.append('language', shortLang);
  }

  const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Groq API Error (${response.status}): ${errText || response.statusText}`);
  }

  const data = (await response.json()) as { text?: string };
  return (data.text || '').trim();
}

/**
 * Transcribes an audio blob using OpenAI Whisper API.
 */
export async function transcribeWithOpenAI(
  blob: Blob,
  apiKey: string,
  languageCode = 'en'
): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error('OpenAI API Key is missing. Enter your key in Tab Audio settings.');
  }

  const formData = new FormData();
  const filename = blob.type.includes('webm') ? 'audio.webm' : 'audio.wav';
  formData.append('file', blob, filename);
  formData.append('model', 'whisper-1');

  const shortLang = languageCode.split('-')[0].toLowerCase();
  if (shortLang) {
    formData.append('language', shortLang);
  }

  const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey.trim()}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`OpenAI API Error (${response.status}): ${errText || response.statusText}`);
  }

  const data = (await response.json()) as { text?: string };
  return (data.text || '').trim();
}

/**
 * Transcribes an audio blob using Google Gemini 2.0 Flash / 1.5 Flash.
 */
export async function transcribeWithGemini(
  blob: Blob,
  apiKey: string,
  languageCode = 'en'
): Promise<string> {
  if (!apiKey.trim()) {
    throw new Error('Gemini API Key is missing. Enter your key in Tab Audio settings.');
  }

  // Convert Blob to Base64
  const arrayBuffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64Data = btoa(binary);
  const mimeType = blob.type || 'audio/webm';

  const promptText = `Accurately transcribe the spoken speech in this audio clip into text. Language preference: ${languageCode}. Format with proper capitalization and punctuation. Output ONLY the raw transcript without introductory commentary or meta-talk.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(
    apiKey.trim()
  )}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText },
          {
            inlineData: {
              mimeType: mimeType.split(';')[0],
              data: base64Data,
            },
          },
        ],
      },
    ],
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`Gemini API Error (${response.status}): ${errText || response.statusText}`);
  }

  interface GeminiResponse {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  }

  const data = (await response.json()) as GeminiResponse;
  const candidate = data.candidates?.[0]?.content?.parts?.[0]?.text;
  return (candidate || '').trim();
}

/**
 * Master dispatcher that executes transcription based on chosen provider.
 */
export async function transcribeAudioChunk(
  blob: Blob,
  settings: AISettings,
  languageCode = 'en'
): Promise<string> {
  const key = getActiveApiKey(settings);
  switch (settings.provider) {
    case 'groq':
      return transcribeWithGroq(blob, key, languageCode);
    case 'openai':
      return transcribeWithOpenAI(blob, key, languageCode);
    case 'gemini':
      return transcribeWithGemini(blob, key, languageCode);
    default:
      throw new Error(`Unsupported AI provider: ${String(settings.provider)}`);
  }
}
