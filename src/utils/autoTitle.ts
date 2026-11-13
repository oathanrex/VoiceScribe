const TRAILING_PUNCTUATION_REGEX = /[,;:\-–—]+$/;

/**
 * Generates a concise, human-readable title suggestion from the opening words
 * of a note's dictated or typed content.
 */
export function suggestNoteTitle(
  content: string,
  options: { maxWords?: number; maxChars?: number } = {}
): string {
  const maxWords = options.maxWords ?? 6;
  const maxChars = options.maxChars ?? 52;

  const trimmed = content.replace(/\r\n/g, '\n').trim();
  if (!trimmed) return '';

  // Prefer the first non-empty line so multi-paragraph notes don't bleed across breaks
  const firstLine =
    trimmed
      .split('\n')
      .map((line) => line.trim())
      .find((line) => line.length > 0) ?? '';

  if (!firstLine) return '';

  const words = firstLine.split(/\s+/).filter(Boolean);
  if (words.length === 0) return '';

  const selected: string[] = [];
  for (let i = 0; i < words.length && i < maxWords; i++) {
    const word = words[i];
    const candidate = [...selected, word].join(' ');
    if (selected.length > 0 && candidate.length > maxChars) {
      break;
    }
    selected.push(word);

    // Stop early at a natural sentence boundary after at least 2 words
    if (selected.length >= 2 && /[.!?।]$/.test(word)) {
      break;
    }
  }

  let title = selected.join(' ').replace(TRAILING_PUNCTUATION_REGEX, '').trim();

  // Strip trailing period for cleaner title aesthetics (keep ? and !)
  title = title.replace(/\.+$/, '').trim();

  if (title.length > maxChars) {
    title = title.slice(0, maxChars).trimEnd();
  }

  return title;
}
