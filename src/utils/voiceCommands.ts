import { VOICE_COMMANDS, VoiceCommandItem } from '../data/voiceCommands';
import { AutoCorrectChange, autoCorrectText } from './autoCorrect';

export interface ProcessedDictationResult {
  textToAppend: string;
  action?: VoiceCommandItem['action'];
  matchedCommand?: string;
  autoCorrections?: AutoCorrectChange[];
}

const PREFIX_REGEX = /^(?:add|insert|लगाओ|डालो|agregar|insérer|einfügen)\s+/i;

/**
 * Matches spoken phrases against registered voice commands.
 * Prioritizes the active language, then falls back to universal/English.
 */
export function matchVoiceCommand(rawPhrase: string, langCode?: string): VoiceCommandItem | null {
  const normalized = rawPhrase.trim().toLowerCase();
  if (!normalized) return null;

  const stripped = normalized.replace(PREFIX_REGEX, '').trim();
  const langPrefix = langCode ? langCode.toLowerCase().split(/[-_]/)[0] : '';

  // 1. Check commands matching the active language first
  if (langPrefix) {
    for (const cmd of VOICE_COMMANDS) {
      if (cmd.lang === langPrefix) {
        for (const phrase of cmd.phrases) {
          const target = phrase.toLowerCase();
          if (normalized === target || (cmd.category !== 'control' && stripped === target)) {
            return cmd;
          }
        }
      }
    }
  }

  // 2. Check universal/English commands
  for (const cmd of VOICE_COMMANDS) {
    if (!langPrefix || cmd.lang === 'en' || !cmd.lang) {
      for (const phrase of cmd.phrases) {
        const target = phrase.toLowerCase();
        if (normalized === target || (cmd.category !== 'control' && stripped === target)) {
          return cmd;
        }
      }
    }
  }

  return null;
}

const PUNCTUATION_ITEMS = VOICE_COMMANDS.filter((cmd) => cmd.category === 'punctuation');

export function getPunctuationCommands(langCode?: string): VoiceCommandItem[] {
  if (!langCode || langCode === 'all') {
    return PUNCTUATION_ITEMS;
  }
  const prefix = langCode.toLowerCase().split(/[-_]/)[0];
  const matched = PUNCTUATION_ITEMS.filter((cmd) => cmd.lang === prefix);
  return matched.length > 0 ? matched : PUNCTUATION_ITEMS.filter((cmd) => cmd.lang === 'en');
}

/**
 * Detects whether a live interim or finalized transcript contains any supported
 * punctuation command keyword in the active language or English.
 */
export function detectPunctuationKeywordInSpeech(rawText: string, langCode?: string): string | null {
  const normalized = rawText.trim().toLowerCase();
  if (!normalized) return null;

  const langPrefix = langCode ? langCode.toLowerCase().split(/[-_]/)[0] : '';

  // Check language-specific punctuations first
  const candidates = langPrefix
    ? PUNCTUATION_ITEMS.filter((cmd) => cmd.lang === langPrefix || cmd.lang === 'en')
    : PUNCTUATION_ITEMS;

  for (const cmd of candidates) {
    for (const phrase of cmd.phrases) {
      const target = phrase.toLowerCase();
      if (normalized === target) {
        return cmd.outputLabel;
      }
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'i');
      if (regex.test(normalized)) {
        return cmd.outputLabel;
      }
    }
  }

  return null;
}

const SENTENCE_END_PUNCTUATION = new Set(['.', '!', '?', '।', '۔', '。', '！', '？']);
const ATTACH_WITHOUT_LEADING_SPACE = new Set([
  '.',
  ',',
  '?',
  '!',
  ':',
  ';',
  '... ',
  '…',
  ')',
  "'",
  '।',
  '۔',
  '،',
  '؟',
  '%',
  '°',
  '。',
  '、',
  '！',
  '？',
  '；',
  '：',
]);
const NO_TRAILING_SPACE_AFTER = new Set(['(', '"', '$', '€', '₹', '£', '¥', '#', '@', '“', '‘']);

/**
 * Determines whether the next spoken word should be auto-capitalized
 * based on the current trailing text in the transcript.
 */
export function shouldCapitalizeNext(existingText: string): boolean {
  const trimmed = existingText.trimEnd();
  if (!trimmed) return true;
  const lastChar = trimmed[trimmed.length - 1];
  return SENTENCE_END_PUNCTUATION.has(lastChar) || existingText.endsWith('\n');
}

export function capitalizeFirstLetter(text: string): string {
  if (!text) return text;
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Multi-language inline replacements for continuous dictation.
 */
function applyInlineReplacements(text: string, langPrefix: string): { text: string; matched: boolean } {
  let updated = text;
  const initial = text;

  // Universal line/paragraph breaks
  updated = updated
    .replace(/(?:^|\s+)\b(?:new paragraph|add paragraph|नया अनुच्छेद|नया पैराग्राफ|nuevo párrafo|nouveau paragraphe|neuer absatz|nuovo paragrafo|novo parágrafo|новый абзац|فقرة جديدة|নতুন অনুচ্ছেদ|కొత్త పేరా|नवीन परिच्छेद|ਨਵਾਂ ਪੈਰਾ|نیا پیراگراف|新しい段落|新段落)\b\s*/gi, '\n\n')
    .replace(/(?:^|\s+)\b(?:new line|next line|नई पंक्ति|नई लाइन|nueva línea|nueva linea|nouvelle ligne|neue zeile|nuova riga|nova linha|новая строка|سطر جديد|নতুন লাইন|కొత్త లైన్|नवीन ओळ|ਨਵੀਂ ਲਾਈਨ|نئی سطر|改行|换行)\b\s*/gi, '\n');

  // English inline punctuations
  updated = updated
    .replace(/\s+\b(?:full stop|period)\b/gi, '.')
    .replace(/\s+\bcomma\b/gi, ',')
    .replace(/\s+\bquestion mark\b/gi, '?')
    .replace(/\s+\bexclamation mark\b/gi, '!')
    .replace(/\s+\bsemicolon\b/gi, ';')
    .replace(/\s+\bcolon\b/gi, ':');

  // Hindi inline punctuations
  if (langPrefix === 'hi') {
    updated = updated
      .replace(/\s*(?:पूर्ण विराम|पूर्णविराम)(?:\s+|$)/gu, '। ')
      .replace(/\s*(?:अल्पविराम|अल्प विराम)(?:\s+|$)/gu, ', ')
      .replace(/\s*(?:प्रश्न चिन्ह|प्रश्नवाचक चिन्ह|प्रश्न चिह्न)(?:\s+|$)/gu, '? ')
      .replace(/\s*(?:विस्मयादिबोधक चिन्ह|आश्चर्य सूचक चिन्ह)(?:\s+|$)/gu, '! ')
      .replace(/\s*(?:उपविराम|विवरण चिन्ह)(?:\s+|$)/gu, ': ')
      .replace(/\s*(?:अर्धविराम)(?:\s+|$)/gu, '; ');
  }

  // Spanish inline punctuations
  if (langPrefix === 'es') {
    updated = updated
      .replace(/\s+\b(?:punto final|punto)\b/gi, '.')
      .replace(/\s+\bcoma\b/gi, ',')
      .replace(/\s+\b(?:signo de interrogación|punto de interrogación)\b/gi, '?')
      .replace(/\s+\b(?:signo de exclamación|signo de admiración)\b/gi, '!')
      .replace(/\s+\bdos puntos\b/gi, ':')
      .replace(/\s+\bpunto y coma\b/gi, ';');
  }

  // French inline punctuations
  if (langPrefix === 'fr') {
    updated = updated
      .replace(/\s+\b(?:point final|point)\b/gi, '.')
      .replace(/\s+\bvirgule\b/gi, ',')
      .replace(/\s+\bpoint d'interrogation\b/gi, '?')
      .replace(/\s+\bpoint d'exclamation\b/gi, '!')
      .replace(/\s+\bdeux points\b/gi, ':')
      .replace(/\s+\bpoint-virgule\b/gi, ';');
  }

  // German inline punctuations
  if (langPrefix === 'de') {
    updated = updated
      .replace(/\s+\bpunkt\b/gi, '.')
      .replace(/\s+\bkomma\b/gi, ',')
      .replace(/\s+\bfragezeichen\b/gi, '?')
      .replace(/\s+\bausrufezeichen\b/gi, '!')
      .replace(/\s+\bdoppelpunkt\b/gi, ':')
      .replace(/\s+\b(?:semikolon|strichpunkt)\b/gi, ';');
  }

  // Bengali inline punctuations
  if (langPrefix === 'bn') {
    updated = updated
      .replace(/\s*(?:দাঁড়ি|দাড়ি)(?:\s+|$)/gu, '। ')
      .replace(/\s*(?:কমা)(?:\s+|$)/gu, ', ')
      .replace(/\s*(?:প্রশ্নবোধক चिन्ह|প্রশ্নবোধক চিহ্ন|জিজ্ঞাসা চিহ্ন)(?:\s+|$)/gu, '? ');
  }

  // Urdu inline punctuations
  if (langPrefix === 'ur') {
    updated = updated
      .replace(/\s*(?:ختمہ)(?:\s+|$)/gu, '۔ ')
      .replace(/\s*(?:سکتہ)(?:\s+|$)/gu, '، ')
      .replace(/\s*(?:سوالیہ نشان)(?:\s+|$)/gu, '؟ ');
  }

  // Arabic inline punctuations
  if (langPrefix === 'ar') {
    updated = updated
      .replace(/\s*(?:نقطة)(?:\s+|$)/gu, '. ')
      .replace(/\s*(?:فاصلة)(?:\s+|$)/gu, '، ')
      .replace(/\s*(?:علامة استفهام)(?:\s+|$)/gu, '؟ ');
  }

  // Japanese inline punctuations
  if (langPrefix === 'ja') {
    updated = updated
      .replace(/\s*(?:句点|まる|ピリオド)/gu, '。')
      .replace(/\s*(?:読点|とうてん|コンマ)/gu, '、')
      .replace(/\s*(?:はてな|疑問符)/gu, '？');
  }

  return { text: updated, matched: updated !== initial };
}

/**
 * Processes an incoming finalized speech recognition segment,
 * applying inline voice commands (e.g., "new paragraph", "comma", "पूर्ण विराम")
 * and clean spacing/capitalization rules relative to existingText.
 */
export function processDictationSegment(
  rawSegment: string,
  existingText: string,
  enableVoiceCommands: boolean = true,
  enableAutoCorrect: boolean = false,
  langCode?: string
): ProcessedDictationResult {
  const cleaned = rawSegment.trim();
  if (!cleaned) {
    return { textToAppend: '' };
  }

  const langPrefix = langCode ? langCode.toLowerCase().split(/[-_]/)[0] : '';

  if (enableVoiceCommands) {
    const exactMatch = matchVoiceCommand(cleaned, langCode);
    if (exactMatch) {
      if (exactMatch.action === 'newline') {
        return { textToAppend: '\n', action: 'newline', matchedCommand: exactMatch.outputLabel };
      }
      if (exactMatch.action === 'newparagraph') {
        return { textToAppend: '\n\n', action: 'newparagraph', matchedCommand: exactMatch.outputLabel };
      }
      if (exactMatch.action) {
        return { textToAppend: '', action: exactMatch.action, matchedCommand: exactMatch.outputLabel };
      }
      if (exactMatch.insertText !== undefined) {
        const token = exactMatch.insertText;
        if (ATTACH_WITHOUT_LEADING_SPACE.has(token)) {
          return { textToAppend: token, matchedCommand: exactMatch.outputLabel };
        }
        const needsSpace =
          existingText.length > 0 &&
          !existingText.endsWith(' ') &&
          !existingText.endsWith('\n') &&
          !token.startsWith(' ');
        return {
          textToAppend: (needsSpace ? ' ' : '') + token,
          matchedCommand: exactMatch.outputLabel,
        };
      }
    }
  }

  let processed = cleaned;
  let inlineMatchedCommand: string | undefined;

  if (enableVoiceCommands) {
    const inlineDetected = detectPunctuationKeywordInSpeech(cleaned, langCode);
    const replacement = applyInlineReplacements(processed, langPrefix);
    if (replacement.matched) {
      processed = replacement.text;
      inlineMatchedCommand = inlineDetected ?? 'Formatting';
    }
  }

  let autoCorrections: AutoCorrectChange[] | undefined;
  if (enableAutoCorrect) {
    const corrected = autoCorrectText(processed, langCode);
    processed = corrected.text;
    if (corrected.changes.length > 0) {
      autoCorrections = corrected.changes;
    }
  }

  if (shouldCapitalizeNext(existingText)) {
    processed = capitalizeFirstLetter(processed);
  }

  const lastChar = existingText[existingText.length - 1];
  const needsLeadingSpace =
    existingText.length > 0 &&
    !existingText.endsWith(' ') &&
    !existingText.endsWith('\n') &&
    !NO_TRAILING_SPACE_AFTER.has(lastChar) &&
    !processed.startsWith('\n') &&
    !ATTACH_WITHOUT_LEADING_SPACE.has(processed[0]);

  return {
    textToAppend: (needsLeadingSpace ? ' ' : '') + processed,
    matchedCommand: inlineMatchedCommand,
    autoCorrections,
  };
}

export interface TextMetrics {
  words: number;
  characters: number;
  sentences: number;
}

export function computeTextMetrics(text: string): TextMetrics {
  const trimmed = text.trim();
  if (!trimmed) {
    return { words: 0, characters: 0, sentences: 0 };
  }
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const characters = text.length;
  const sentences = trimmed.split(/[.!?।۔。！？]+/).filter((s) => s.trim().length > 0).length;
  return { words, characters, sentences };
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
