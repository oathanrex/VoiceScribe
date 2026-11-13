export interface WordFrequencyItem {
  word: string;
  count: number;
}

export interface DraftAnalyticsSummary {
  totalWords: number;
  uniqueWords: number;
  readingTimeSeconds: number;
  speakingTimeSeconds: number;
  sentences: number;
  paragraphs: number;
  topWords: WordFrequencyItem[];
}

const ENGLISH_STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'been', 'being', 'but', 'by',
  'can', 'could', 'did', 'do', 'does', 'for', 'from', 'had', 'has', 'have',
  'he', 'her', 'here', 'hers', 'him', 'his', 'how', 'i', 'if', 'in', 'into',
  'is', 'it', 'its', 'just', 'me', 'more', 'my', 'no', 'not', 'of', 'on',
  'or', 'our', 'ours', 'out', 'she', 'should', 'so', 'some', 'that', 'the',
  'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those', 'to',
  'too', 'up', 'us', 'very', 'was', 'we', 'were', 'what', 'when', 'where',
  'which', 'who', 'will', 'with', 'would', 'you', 'your', 'yours',
]);

/**
 * Extracts normalized word tokens supporting Latin and Unicode scripts.
 */
export function tokenizeWords(text: string): string[] {
  const matches = text.toLowerCase().match(/[\p{L}\p{M}\p{N}]+(?:['’][\p{L}\p{M}\p{N}]+)*/gu);
  return matches ? matches : [];
}

/**
 * Computes frequency counts for the most used words in a draft.
 */
export function computeTopWords(
  text: string,
  options: { limit?: number; ignoreStopWords?: boolean } = {}
): WordFrequencyItem[] {
  const { limit = 8, ignoreStopWords = true } = options;
  if (limit <= 0) return [];

  const tokens = tokenizeWords(text);
  const counts = new Map<string, number>();

  for (const token of tokens) {
    if (ignoreStopWords && ENGLISH_STOP_WORDS.has(token)) {
      continue;
    }
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return Array.from(counts.entries())
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.word.localeCompare(b.word);
    })
    .slice(0, limit);
}

export function computeDraftAnalytics(
  text: string,
  options: { limit?: number; ignoreStopWords?: boolean } = {}
): DraftAnalyticsSummary {
  const tokens = tokenizeWords(text);
  const uniqueWords = new Set(tokens).size;
  const totalWords = tokens.length;
  // Average silent reading rate ~200 wpm; conversational speaking rate ~135 wpm
  const readingTimeSeconds = totalWords === 0 ? 0 : Math.max(1, Math.round((totalWords / 200) * 60));
  const speakingTimeSeconds = totalWords === 0 ? 0 : Math.max(1, Math.round((totalWords / 135) * 60));
  const trimmed = text.trim();
  const sentences = trimmed
    ? trimmed.split(/[.!?।]+/).filter((s) => s.trim().length > 0).length
    : 0;
  const paragraphs = trimmed
    ? trimmed.split(/\n{2,}/).filter((p) => p.trim().length > 0).length
    : 0;
  const topWords = computeTopWords(text, options);

  return {
    totalWords,
    uniqueWords,
    readingTimeSeconds,
    speakingTimeSeconds,
    sentences,
    paragraphs,
    topWords,
  };
}
