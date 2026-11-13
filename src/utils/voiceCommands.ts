import { VOICE_COMMANDS, VoiceCommandItem } from '../data/voiceCommands';
import { AutoCorrectChange, autoCorrectText } from './autoCorrect';

export interface ProcessedDictationResult {
  textToAppend: string;
  action?: VoiceCommandItem['action'];
  matchedCommand?: string;
  autoCorrections?: AutoCorrectChange[];
}

const PREFIX_REGEX = /^(?:add|insert)\s+/i;

/**
 * Matches spoken phrases against registered voice commands.
 * Supports optional "add " or "insert " prefixes for punctuation and symbols.
 */
export function matchVoiceCommand(rawPhrase: string): VoiceCommandItem | null {
  const normalized = rawPhrase.trim().toLowerCase();
  if (!normalized) return null;

  const stripped = normalized.replace(PREFIX_REGEX, '').trim();

  for (const cmd of VOICE_COMMANDS) {
    for (const phrase of cmd.phrases) {
      const target = phrase.toLowerCase();
      if (normalized === target) {
        return cmd;
      }
      if (cmd.category !== 'control' && stripped === target) {
        return cmd;
      }
    }
  }

  return null;
}

const PUNCTUATION_ITEMS = VOICE_COMMANDS.filter((cmd) => cmd.category === 'punctuation');

export function getPunctuationCommands(): VoiceCommandItem[] {
  return PUNCTUATION_ITEMS;
}

/**
 * Detects whether a live interim or finalized transcript contains any supported
 * punctuation command keyword (e.g. "comma", "full stop", "question mark").
 */
export function detectPunctuationKeywordInSpeech(rawText: string): string | null {
  const normalized = rawText.trim().toLowerCase();
  if (!normalized) return null;

  for (const cmd of PUNCTUATION_ITEMS) {
    for (const phrase of cmd.phrases) {
      const target = phrase.toLowerCase();
      if (normalized === target) {
        return cmd.outputLabel;
      }
      // Match whole phrase at word boundaries (supports Hindi Unicode too)
      const escaped = target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`(?:^|\\s)${escaped}(?:$|\\s)`, 'i');
      if (regex.test(normalized)) {
        return cmd.outputLabel;
      }
    }
  }

  return null;
}

const SENTENCE_END_PUNCTUATION = new Set(['.', '!', '?', '।']);
const ATTACH_WITHOUT_LEADING_SPACE = new Set(['.', ',', '?', '!', ':', ';', '...', ')', "'", '।', '%', '°']);
const NO_TRAILING_SPACE_AFTER = new Set(['(', '"', '$', '€', '₹', '#', '@']);

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
 * Processes an incoming finalized speech recognition segment,
 * applying inline voice commands (e.g., "new paragraph", "comma", "full stop")
 * and clean spacing/capitalization rules relative to existingText.
 */
export function processDictationSegment(
  rawSegment: string,
  existingText: string,
  enableVoiceCommands: boolean = true,
  enableAutoCorrect: boolean = false
): ProcessedDictationResult {
  const cleaned = rawSegment.trim();
  if (!cleaned) {
    return { textToAppend: '' };
  }

  if (enableVoiceCommands) {
    const exactMatch = matchVoiceCommand(cleaned);
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

  // Also replace inline trailing or embedded punctuation keywords when spoken in a continuous phrase
  let processed = cleaned;
  let inlineMatchedCommand: string | undefined;
  if (enableVoiceCommands) {
    const inlineDetected = detectPunctuationKeywordInSpeech(cleaned);
    const updated = processed
      .replace(/(?:^|\s+)\b(?:new paragraph|add paragraph)\b\s*/gi, '\n\n')
      .replace(/(?:^|\s+)\b(?:new line|next line)\b\s*/gi, '\n')
      .replace(/\s+\b(?:full stop|period)\b/gi, '.')
      .replace(/\s+\bcomma\b/gi, ',')
      .replace(/\s+\bquestion mark\b/gi, '?')
      .replace(/\s+\bexclamation mark\b/gi, '!')
      .replace(/\s+\bsemicolon\b/gi, ';')
      .replace(/\s+\bcolon\b/gi, ':');
    if (updated !== processed) {
      processed = updated;
      inlineMatchedCommand = inlineDetected ?? 'Formatting';
    }
  }

  let autoCorrections: AutoCorrectChange[] | undefined;
  if (enableAutoCorrect) {
    const corrected = autoCorrectText(processed);
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
  const sentences = trimmed.split(/[.!?।]+/).filter((s) => s.trim().length > 0).length;
  return { words, characters, sentences };
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}
