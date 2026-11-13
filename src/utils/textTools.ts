export function formatTimestampTag(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `[${hours}:${minutes}] `;
}

export function cleanTranscriptText(input: string): string {
  const normalized = input.replace(/\r\n/g, '\n').trim();
  if (!normalized) return '';

  const cleanedParagraphs = normalized
    .split(/\n{2,}/)
    .map((para) => {
      const lines = para
        .split('\n')
        .map((line) =>
          line
            // Collapse multiple horizontal spaces
            .replace(/[ \t]{2,}/g, ' ')
            // Remove space before punctuation
            .replace(/\s+([,.;:!?।])/g, '$1')
            // Ensure space after punctuation when followed by a word character
            .replace(/([,.;:!?])([^\s\d"'”’)\]}])/g, '$1 $2')
            .trim()
        )
        .filter((l, idx, arr) => l.length > 0 || (idx > 0 && idx < arr.length - 1));

      return lines.join('\n');
    })
    .filter((p) => p.length > 0);

  let joined = cleanedParagraphs.join('\n\n');

  // Capitalize start of text and sentence boundaries
  joined = joined.replace(/(^|[.!?।]\s+|\n\n)(\p{Ll})/gu, (_m, prefix: string, ch: string) => {
    return prefix + ch.toUpperCase();
  });

  return joined;
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function countQueryMatches(
  text: string,
  query: string,
  caseSensitive: boolean = false
): number {
  if (!query || !text) return 0;
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(escapeRegExp(query), flags);
  const matches = text.match(regex);
  return matches ? matches.length : 0;
}

export function replaceAllMatches(
  text: string,
  query: string,
  replacement: string,
  caseSensitive: boolean = false
): { text: string; count: number } {
  if (!query || !text) return { text, count: 0 };
  const flags = caseSensitive ? 'g' : 'gi';
  const regex = new RegExp(escapeRegExp(query), flags);
  let count = 0;
  const updated = text.replace(regex, () => {
    count += 1;
    return replacement;
  });
  return { text: updated, count };
}

export function replaceFirstMatch(
  text: string,
  query: string,
  replacement: string,
  caseSensitive: boolean = false
): { text: string; replaced: boolean } {
  if (!query || !text) return { text, replaced: false };
  const flags = caseSensitive ? '' : 'i';
  const regex = new RegExp(escapeRegExp(query), flags);
  if (!regex.test(text)) return { text, replaced: false };
  const updated = text.replace(regex, () => replacement);
  return { text: updated, replaced: true };
}
