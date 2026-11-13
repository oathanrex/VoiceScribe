export interface SharePayload {
  title: string;
  text: string;
  combinedText: string;
}

export function buildSharePayload(title: string, content: string): SharePayload {
  const cleanTitle = title.trim() || 'VoiceScribe Note';
  const cleanContent = content.trim();
  const combinedText = cleanContent
    ? cleanTitle !== 'VoiceScribe Note'
      ? `${cleanTitle}\n\n${cleanContent}`
      : cleanContent
    : cleanTitle;

  return {
    title: cleanTitle,
    text: cleanContent || cleanTitle,
    combinedText,
  };
}

export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'empty' | 'failed';

export async function shareDraftContent(
  title: string,
  content: string,
  deps?: {
    shareFn?: (data: { title?: string; text?: string }) => Promise<void>;
    copyFn?: (text: string) => Promise<void>;
  }
): Promise<ShareOutcome> {
  if (!title.trim() && !content.trim()) {
    return 'empty';
  }

  const payload = buildSharePayload(title, content);
  const nativeShare =
    deps?.shareFn ??
    (typeof navigator !== 'undefined' && typeof navigator.share === 'function'
      ? (data: { title?: string; text?: string }) => navigator.share(data)
      : undefined);

  if (nativeShare) {
    try {
      await nativeShare({ title: payload.title, text: payload.text });
      return 'shared';
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return 'cancelled';
      }
      // Fall through to clipboard fallback when native share rejects (e.g. desktop permissions)
    }
  }

  const copyFn =
    deps?.copyFn ??
    (typeof navigator !== 'undefined' && navigator.clipboard?.writeText
      ? (text: string) => navigator.clipboard.writeText(text)
      : undefined);

  if (copyFn) {
    try {
      await copyFn(payload.combinedText);
      return 'copied';
    } catch {
      return 'failed';
    }
  }

  return 'failed';
}
