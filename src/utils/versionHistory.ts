export const MAX_DRAFT_VERSIONS = 5;

export type VersionSource = 'manual' | 'autosave' | 'restore';

export interface DraftVersionSnapshot {
  id: string;
  noteId: string;
  title: string;
  content: string;
  htmlContent: string;
  savedAt: number;
  wordCount: number;
  source: VersionSource;
}

export interface DraftSnapshotInput {
  id: string;
  title: string;
  content: string;
  htmlContent: string;
}

function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).filter(Boolean).length : 0;
}

/**
 * Prepends a snapshot of the active draft while deduplicating identical consecutive states
 * and enforcing the 5-snapshot retention cap.
 */
export function appendDraftVersion(
  history: DraftVersionSnapshot[],
  draft: DraftSnapshotInput,
  options: { source?: VersionSource; now?: number } = {}
): DraftVersionSnapshot[] {
  const { source = 'autosave', now = Date.now() } = options;
  if (!draft.content.trim() && !draft.title.trim()) {
    return history;
  }

  const latest = history[0];
  if (
    latest &&
    latest.noteId === draft.id &&
    latest.title === draft.title &&
    latest.content === draft.content
  ) {
    return history;
  }

  const entry: DraftVersionSnapshot = {
    id: `ver-${now}-${Math.random().toString(36).slice(2, 7)}`,
    noteId: draft.id,
    title: draft.title,
    content: draft.content,
    htmlContent: draft.htmlContent,
    savedAt: now,
    wordCount: countWords(draft.content),
    source,
  };

  return [entry, ...history].slice(0, MAX_DRAFT_VERSIONS);
}

/**
 * Prevents rapid keystroke debounces from flooding all 5 history slots by requiring
 * either a meaningful text delta (>= 20 chars), a different note, or >= 12 seconds elapsed.
 */
export function shouldRecordAutosaveVersion(
  latest: DraftVersionSnapshot | undefined,
  draft: DraftSnapshotInput,
  now: number = Date.now()
): boolean {
  if (!draft.content.trim() && !draft.title.trim()) {
    return false;
  }
  if (!latest) return true;
  if (latest.noteId !== draft.id) return true;
  if (latest.title === draft.title && latest.content === draft.content) return false;

  const charDelta = Math.abs(draft.content.length - latest.content.length);
  const elapsedMs = now - latest.savedAt;
  return charDelta >= 20 || elapsedMs >= 12000;
}
