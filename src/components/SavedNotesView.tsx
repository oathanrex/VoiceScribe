import { useMemo, useState } from 'react';
import {
  Check,
  Copy,
  CopyPlus,
  Download,
  FileText,
  History,
  Pin,
  RotateCcw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { findLanguageById } from '../data/languages';
import { exportDraftAs } from '../utils/exportDraft';
import { SavedNote } from '../utils/storage';
import { DraftVersionSnapshot, VersionSource } from '../utils/versionHistory';

interface SavedNotesViewProps {
  notes: SavedNote[];
  activeNoteId: string;
  versionHistory: DraftVersionSnapshot[];
  onOpenNote: (note: SavedNote) => void;
  onDeleteNote: (noteId: string) => void;
  onTogglePinNote: (noteId: string) => void;
  onDuplicateNote: (noteId: string) => void;
  onRestoreVersion: (snapshot: DraftVersionSnapshot) => void;
  onCreateNewNote: () => void;
}

function formatTimestamp(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatTimeOnly(ms: number): string {
  const date = new Date(ms);
  return date.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function formatSourceLabel(source: VersionSource): string {
  if (source === 'manual') return 'Saved';
  if (source === 'restore') return 'Before restore';
  return 'Auto-saved';
}

export function SavedNotesView({
  notes,
  activeNoteId,
  versionHistory,
  onOpenNote,
  onDeleteNote,
  onTogglePinNote,
  onDuplicateNote,
  onRestoreVersion,
  onCreateNewNote,
}: SavedNotesViewProps) {
  const [query, setQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);

  const filteredNotes = useMemo(() => {
    const q = query.trim().toLowerCase();
    const sorted = [...notes].sort((a, b) => {
      if (Boolean(b.pinned) !== Boolean(a.pinned)) {
        return b.pinned ? 1 : -1;
      }
      return b.updatedAt - a.updatedAt;
    });
    if (!q) return sorted;
    return sorted.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q)
    );
  }, [notes, query]);

  const handleCopy = async (note: SavedNote) => {
    try {
      await navigator.clipboard.writeText(note.content);
      setCopiedId(note.id);
      window.setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div
      className={`${
        historyOpen ? 'max-w-[1140px]' : 'max-w-[960px]'
      } mx-auto px-4 sm:px-6 py-8 transition-[max-width] duration-200`}
    >
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            Saved Notes
          </h1>
          <p className="mt-1 text-sm text-muted">
            Stored locally in your browser. Pin key drafts, duplicate, or export anytime.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search
              className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search saved notes..."
              aria-label="Search saved notes"
              className="w-full pl-9 pr-3 py-2 min-h-[40px] text-sm bg-surface text-foreground placeholder:text-muted/70 border border-border rounded-control focus:outline-none focus:border-primary"
            />
          </div>

          <button
            type="button"
            onClick={() => setHistoryOpen((prev) => !prev)}
            aria-expanded={historyOpen}
            aria-controls="version-history-sidebar"
            data-testid="version-history-toggle"
            className={`inline-flex items-center gap-1.5 px-3 py-2 min-h-[40px] text-xs sm:text-sm font-medium border rounded-control transition-colors whitespace-nowrap shrink-0 ${
              historyOpen
                ? 'bg-accent-soft text-primary border-primary/35'
                : 'bg-surface text-foreground border-border hover:border-muted/60'
            }`}
          >
            <History className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>Version History</span>
            {versionHistory.length > 0 && (
              <span className="text-xs font-mono tabular-nums text-muted">
                ({versionHistory.length})
              </span>
            )}
          </button>
        </div>
      </div>

      <div
        className={
          historyOpen
            ? 'grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 items-start'
            : ''
        }
      >
        <div>
          {filteredNotes.length === 0 ? (
            <div className="bg-surface border border-border/80 rounded-2xl shadow-surface p-10 text-center">
              <FileText
                className="w-8 h-8 text-muted/50 mx-auto mb-3"
                aria-hidden="true"
              />
              <h2 className="font-display text-base font-semibold text-foreground">
                {notes.length === 0 ? 'No saved notes yet' : 'No notes match your search'}
              </h2>
              <p className="mt-1 text-sm text-muted max-w-sm mx-auto">
                {notes.length === 0
                  ? 'Notes you dictate or write in the Studio are saved here automatically when you start a new note.'
                  : 'Try a different search keyword or clear your search filter.'}
              </p>
              {notes.length === 0 ? (
                <button
                  type="button"
                  onClick={onCreateNewNote}
                  className="mt-5 inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-control transition-colors"
                >
                  Start Dictating
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="mt-5 inline-flex items-center justify-center min-h-[40px] px-4 py-2 text-sm font-medium text-foreground bg-well hover:bg-well/80 border border-border rounded-control transition-colors"
                >
                  Clear Search
                </button>
              )}
            </div>
          ) : (
            <ul className="bg-surface border border-border/80 rounded-2xl shadow-surface divide-y divide-border/60 overflow-hidden">
              {filteredNotes.map((note) => {
                const lang = findLanguageById(note.languageId);
                const displayTitle = note.title.trim() || 'Untitled note';
                const isCurrent = note.id === activeNoteId;
                return (
                  <li
                    key={note.id}
                    className="p-5 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-well/50 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {note.pinned && (
                          <Pin
                            className="w-3.5 h-3.5 text-primary fill-current shrink-0"
                            aria-label="Pinned"
                          />
                        )}
                        <h2 className="font-display text-base font-semibold text-foreground truncate">
                          {displayTitle}
                        </h2>
                        {isCurrent && (
                          <span className="text-xs font-medium text-primary shrink-0">
                            · Current
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-muted line-clamp-2">
                        {note.content || 'Empty note'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted tabular-nums">
                        <span>{note.wordCount} words</span>
                        <span aria-hidden="true">·</span>
                        <span>{lang.name}</span>
                        <span aria-hidden="true">·</span>
                        <span>{formatTimestamp(note.updatedAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenNote(note)}
                        aria-label={`Open '${displayTitle}'`}
                        className="min-h-[38px] px-3.5 py-1.5 text-xs font-medium text-primary bg-accent-soft hover:opacity-90 rounded-control transition-colors whitespace-nowrap"
                      >
                        Open
                      </button>
                      <button
                        type="button"
                        onClick={() => onTogglePinNote(note.id)}
                        aria-label={note.pinned ? `Unpin '${displayTitle}'` : `Pin '${displayTitle}'`}
                        aria-pressed={Boolean(note.pinned)}
                        title={note.pinned ? 'Unpin note' : 'Pin note'}
                        className={`w-9 h-9 inline-flex items-center justify-center rounded-control transition-colors ${
                          note.pinned
                            ? 'text-primary bg-accent-soft'
                            : 'text-muted hover:text-foreground hover:bg-well'
                        }`}
                      >
                        <Pin className={`w-4 h-4 ${note.pinned ? 'fill-current' : ''}`} aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateNote(note.id)}
                        aria-label={`Duplicate '${displayTitle}'`}
                        title="Duplicate note"
                        className="w-9 h-9 inline-flex items-center justify-center text-muted hover:text-foreground hover:bg-well rounded-control transition-colors"
                      >
                        <CopyPlus className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(note)}
                        aria-label={`Copy '${displayTitle}'`}
                        title="Copy text"
                        className="w-9 h-9 inline-flex items-center justify-center text-muted hover:text-foreground hover:bg-well rounded-control transition-colors"
                      >
                        {copiedId === note.id ? (
                          <Check className="w-4 h-4 text-primary" aria-hidden="true" />
                        ) : (
                          <Copy className="w-4 h-4" aria-hidden="true" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => exportDraftAs('txt', note.title, note.htmlContent, note.content)}
                        aria-label={`Download '${displayTitle}' as .txt`}
                        title="Download .txt"
                        className="w-9 h-9 inline-flex items-center justify-center text-muted hover:text-foreground hover:bg-well rounded-control transition-colors"
                      >
                        <Download className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteNote(note.id)}
                        aria-label={`Delete '${displayTitle}'`}
                        title="Delete note"
                        className="w-9 h-9 inline-flex items-center justify-center text-muted hover:text-danger hover:bg-danger-soft rounded-control transition-colors"
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {historyOpen && (
          <aside
            id="version-history-sidebar"
            aria-label="Active draft version history"
            data-testid="version-history-sidebar"
            className="bg-surface border border-border/80 rounded-2xl shadow-surface p-5"
          >
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-border/70">
              <div>
                <h2 className="font-display text-sm font-semibold text-foreground">
                  Version History
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Last 5 saves of your active draft
                </p>
              </div>
              <button
                type="button"
                onClick={() => setHistoryOpen(false)}
                aria-label="Close version history"
                className="p-1 text-muted hover:text-foreground hover:bg-well rounded-control transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>

            {versionHistory.length === 0 ? (
              <div className="py-8 text-center">
                <History className="w-7 h-7 text-muted/45 mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs font-medium text-foreground">No draft snapshots yet</p>
                <p className="mt-1 text-xs text-muted leading-relaxed">
                  Your last 5 saves appear here automatically as you write or save in the Studio.
                </p>
              </div>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {versionHistory.map((snapshot, index) => {
                  const snapshotTitle = snapshot.title.trim() || 'Untitled note';
                  const timeStr = formatTimeOnly(snapshot.savedAt);
                  return (
                    <li
                      key={snapshot.id}
                      data-testid="version-history-item"
                      className="p-3 rounded-xl bg-well/50 border border-border/60 hover:border-border transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-foreground truncate">
                            {snapshotTitle}
                          </p>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted tabular-nums">
                            <span>{formatSourceLabel(snapshot.source)}</span>
                            <span aria-hidden="true">·</span>
                            <span>{timeStr}</span>
                            <span aria-hidden="true">·</span>
                            <span>{snapshot.wordCount} words</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onRestoreVersion(snapshot)}
                          aria-label={`Restore version ${index + 1} from ${timeStr}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-primary bg-accent-soft hover:opacity-90 rounded-control transition-colors whitespace-nowrap shrink-0"
                        >
                          <RotateCcw className="w-3 h-3 shrink-0" aria-hidden="true" />
                          <span>Restore</span>
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-muted line-clamp-2 leading-relaxed">
                        {snapshot.content.trim() || 'Empty content'}
                      </p>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}
