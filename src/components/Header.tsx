import { useEffect, useRef, useState } from 'react';
import {
  AlignLeft,
  Check,
  ChevronDown,
  Download,
  FileCode2,
  FileText,
  FileType2,
  Loader2,
  Plus,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react';
import { FocusTimerController } from '../hooks/useFocusTimer';
import { ExportFormat } from '../utils/exportDraft';
import { formatLastSyncedTime, formatLastSyncedTooltip } from '../utils/syncStatus';
import { FocusTimerMenu } from './FocusTimerMenu';

export type WorkspaceTab = 'studio' | 'notes' | 'commands' | 'guide';

export interface PunctuationStatus {
  active: boolean;
  processingLabel: string | null;
}

export interface AudioExportUiState {
  status: 'idle' | 'preparing' | 'recording';
  progressLabel?: string;
}

interface HeaderProps {
  activeTab: WorkspaceTab;
  onTabChange: (tab: WorkspaceTab) => void;
  onNewNote: () => void;
  onExport: (format: ExportFormat) => void;
  onExportAudio?: () => void;
  onCancelAudioExport?: () => void;
  audioExportSupported?: boolean;
  audioExportState?: AudioExportUiState;
  canExport: boolean;
  notesCount: number;
  focusTimer: FocusTimerController;
  punctuationStatus?: PunctuationStatus;
  saveStatus?: 'saving' | 'saved';
  lastSyncedAt?: number | null;
}

const NAV_ITEMS: { id: WorkspaceTab; label: string; mobileLabel: string }[] = [
  { id: 'studio', label: 'Studio', mobileLabel: 'Studio' },
  { id: 'notes', label: 'Saved Notes', mobileLabel: 'Notes' },
  { id: 'commands', label: 'Voice Commands', mobileLabel: 'Commands' },
  { id: 'guide', label: 'Guide', mobileLabel: 'Guide' },
];

export function Header({
  activeTab,
  onTabChange,
  onNewNote,
  onExport,
  onExportAudio,
  onCancelAudioExport,
  audioExportSupported = false,
  audioExportState = { status: 'idle' },
  canExport,
  notesCount,
  focusTimer,
  punctuationStatus,
  saveStatus = 'saved',
  lastSyncedAt = null,
}: HeaderProps) {
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!exportOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setExportOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exportOpen]);

  const handleSelectFormat = (format: ExportFormat) => {
    onExport(format);
    setExportOpen(false);
  };

  const showPunctuation = Boolean(
    punctuationStatus?.active || punctuationStatus?.processingLabel
  );
  const punctuationText = punctuationStatus?.processingLabel
    ? `Punctuation AI (${punctuationStatus.processingLabel})`
    : 'Punctuation AI';
  const lastSyncedText = formatLastSyncedTime(lastSyncedAt);
  const lastSyncedTooltip = formatLastSyncedTooltip(lastSyncedAt);

  return (
    <>
      <header className="sticky top-0 z-30 h-14 border-b border-border/80 bg-surface/95 backdrop-blur-md">
        <div className="max-w-6xl mx-auto h-full px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => onTabChange('studio')}
            className="flex items-center gap-1.5 sm:gap-2 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-control"
          >
            <span
              aria-hidden="true"
              className="w-7 h-7 rounded-control bg-primary text-primary-foreground flex items-center justify-center shrink-0"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect x="2" y="6" width="2" height="4" rx="1" fill="currentColor" />
                <rect x="5.5" y="3" width="2" height="10" rx="1" fill="currentColor" />
                <rect x="9" y="4.5" width="2" height="7" rx="1" fill="currentColor" />
                <rect x="12.5" y="6" width="2" height="4" rx="1" fill="currentColor" />
              </svg>
            </span>
            <span className="font-display text-[15px] sm:text-[17px] font-semibold tracking-tight text-foreground">
              VoiceScribe
            </span>
          </button>

          {/* Zone 2: Concise single-line desktop nav */}
          <nav aria-label="Primary workspace navigation" className="hidden lg:flex items-center gap-2 xl:gap-5 h-full">
            {NAV_ITEMS.map((item) => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => onTabChange(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`relative h-full inline-flex items-center gap-1 text-[13px] xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                    isActive
                      ? 'text-primary'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.id === 'notes' && notesCount > 0 && (
                    <span className="text-xs font-mono tabular-nums text-muted/80">
                      ({notesCount})
                    </span>
                  )}
                  {isActive && (
                    <span
                      aria-hidden="true"
                      className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-t-full"
                    />
                  )}
                </button>
              );
            })}

            <a
              href="./guides/"
              className="relative h-full inline-flex items-center gap-1 text-[13px] xl:text-sm font-medium text-muted hover:text-foreground transition-colors whitespace-nowrap shrink-0"
            >
              <span>Guides Hub</span>
            </a>
          </nav>

          {/* Zone 3: Save Status + Punctuation Indicator + Focus Timer + Export + New Note */}
          <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 shrink-0">
            <div
              role="status"
              aria-live="polite"
              data-testid="header-save-status"
              title={lastSyncedTooltip}
              className="hidden xl:inline-flex items-center gap-1 text-[11px] text-muted tabular-nums whitespace-nowrap shrink-0 pr-0.5"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin shrink-0" aria-hidden="true" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
                  <span>Saved</span>
                </>
              )}
              <span aria-hidden="true">·</span>
              <span data-testid="header-last-synced">Last synced {lastSyncedText}</span>
            </div>

            {showPunctuation && (
              <div
                role="status"
                aria-live="polite"
                data-testid="header-punctuation-indicator"
                title="AI is processing spoken punctuation commands"
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 min-h-[30px] text-xs font-medium text-primary bg-accent-soft border border-primary/30 rounded-control whitespace-nowrap shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="max-w-[145px] xl:max-w-[190px] truncate">{punctuationText}</span>
              </div>
            )}

            <FocusTimerMenu timer={focusTimer} />

            <div ref={exportRef} className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((prev) => !prev)}
                disabled={!canExport && audioExportState.status === 'idle'}
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                aria-label="Export"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 xl:px-3 py-2 min-h-[38px] text-xs sm:text-[13px] xl:text-sm font-medium text-foreground bg-surface border border-border hover:border-muted/60 disabled:opacity-45 disabled:pointer-events-none rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                {audioExportState.status !== 'idle' ? (
                  <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" aria-hidden="true" />
                ) : (
                  <Download className="w-4 h-4 shrink-0" aria-hidden="true" />
                )}
                <span className="hidden min-[380px]:inline">Export</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-muted transition-transform duration-150 shrink-0 ${
                    exportOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {exportOpen && (
                <div
                  role="menu"
                  aria-label="Export draft formats"
                  className="absolute right-0 mt-2 w-56 z-40 bg-surface border border-border rounded-card shadow-surface py-1.5"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelectFormat('txt')}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well transition-colors"
                  >
                    <AlignLeft className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>Plain Text (.txt)</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelectFormat('md')}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well transition-colors"
                  >
                    <FileCode2 className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>Markdown (.md)</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelectFormat('pdf')}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well transition-colors"
                  >
                    <FileText className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>PDF (.pdf)</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => handleSelectFormat('doc')}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well transition-colors"
                  >
                    <FileType2 className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>Word (.doc)</span>
                  </button>

                  <div className="my-1 border-t border-border/60" role="separator" />

                  <button
                    type="button"
                    role="menuitem"
                    data-testid="export-audio-menuitem"
                    disabled={audioExportState.status === 'idle' && (!audioExportSupported || !canExport)}
                    onClick={() => {
                      if (audioExportState.status !== 'idle') {
                        onCancelAudioExport?.();
                      } else {
                        onExportAudio?.();
                      }
                      setExportOpen(false);
                    }}
                    className="w-full px-3.5 py-2 flex items-start gap-2.5 text-left text-sm text-foreground hover:bg-well disabled:opacity-45 disabled:pointer-events-none transition-colors"
                  >
                    {audioExportState.status !== 'idle' ? (
                      <Square className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-muted shrink-0 mt-0.5" aria-hidden="true" />
                    )}
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium leading-tight">
                        {audioExportState.status !== 'idle' ? 'Cancel Audio Export' : 'Export to Audio'}
                      </span>
                      <span className="block text-[11px] text-muted mt-0.5 leading-tight">
                        {audioExportState.status !== 'idle'
                          ? audioExportState.progressLabel || 'Recording speech...'
                          : audioExportSupported
                            ? 'Speak & save audio file'
                            : 'Not supported in this browser'}
                      </span>
                    </span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onNewNote}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 xl:px-3.5 py-2 min-h-[38px] text-xs sm:text-[13px] xl:text-sm font-medium text-primary-foreground bg-primary hover:bg-primary-hover active:scale-[0.99] rounded-control transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden min-[360px]:inline">
                New<span className="hidden min-[430px]:inline"> Note</span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Non-sticky mobile/tablet sub-navigation to preserve <=15% sticky viewport budget */}
      <nav
        aria-label="Mobile workspace navigation"
        className="lg:hidden border-b border-border/80 bg-surface px-4 flex items-center gap-5 overflow-x-auto"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative py-2.5 text-sm font-medium whitespace-nowrap shrink-0 ${
                isActive ? 'text-primary' : 'text-muted'
              }`}
            >
              <span>{item.mobileLabel}</span>
              {item.id === 'notes' && notesCount > 0 && (
                <span className="ml-1 text-xs font-mono tabular-nums text-muted/80">
                  ({notesCount})
                </span>
              )}
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                />
              )}
            </button>
          );
        })}

        <a
          href="./guides/"
          className="relative py-2.5 text-sm font-medium text-muted hover:text-foreground whitespace-nowrap shrink-0"
        >
          <span>Guides</span>
        </a>

        {showPunctuation && (
          <span
            role="status"
            aria-live="polite"
            data-testid="mobile-punctuation-indicator"
            className="sm:hidden ml-auto inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-primary bg-accent-soft border border-primary/30 rounded-control whitespace-nowrap shrink-0"
          >
            <Sparkles className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="max-w-[110px] truncate">{punctuationText}</span>
          </span>
        )}
      </nav>
    </>
  );
}
