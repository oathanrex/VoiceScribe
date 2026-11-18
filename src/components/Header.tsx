import { useEffect, useRef, useState } from 'react';
import {
  AlignLeft,
  AudioWaveform,
  BookOpen,
  ChartBarBig,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  FileCode2,
  FileText,
  FileType2,
  Headphones,
  Languages,
  Loader2,
  Menu,
  Mic,
  Plus,
  Radio,
  ShieldCheck,
  Sparkles,
  Square,
  Timer,
  Volume2,
  X,
  Zap,
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
  const [toolsFlyoutOpen, setToolsFlyoutOpen] = useState(false);
  const [guidesFlyoutOpen, setGuidesFlyoutOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const exportRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const guidesRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus on outside click or Escape
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (exportOpen && exportRef.current && !exportRef.current.contains(target)) {
        setExportOpen(false);
      }
      if (toolsFlyoutOpen && toolsRef.current && !toolsRef.current.contains(target)) {
        setToolsFlyoutOpen(false);
      }
      if (guidesFlyoutOpen && guidesRef.current && !guidesRef.current.contains(target)) {
        setGuidesFlyoutOpen(false);
      }
      if (mobileMenuOpen && mobileMenuRef.current && !mobileMenuRef.current.contains(target)) {
        // Only close if click is not on the toggle button
        const toggleBtn = document.getElementById('mobile-menu-toggle-btn');
        if (!toggleBtn || !toggleBtn.contains(target)) {
          setMobileMenuOpen(false);
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setExportOpen(false);
        setToolsFlyoutOpen(false);
        setGuidesFlyoutOpen(false);
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [exportOpen, toolsFlyoutOpen, guidesFlyoutOpen, mobileMenuOpen]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

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
      <header className="sticky top-0 z-40 h-14 border-b border-border/80 bg-surface/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-2 sm:gap-3">
          {/* Zone 1: Brand Wordmark with Product Identity Badge (Inspired by DeepL) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              type="button"
              onClick={() => onTabChange('studio')}
              className="flex items-center gap-1.5 sm:gap-2 text-left whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary rounded-control group"
              title="VoiceScribe Voice Dictation Studio"
            >
              <span
                aria-hidden="true"
                className="w-7 h-7 rounded-control bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-105"
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

            {/* DeepL-style Sub-Product Pill */}
            <span className="hidden xl:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary bg-primary/10 border border-primary/20 rounded-full select-none">
              Voice Studio
            </span>
          </div>

          {/* Zone 2: DeepL-Style Flyout Mega-Menus + Direct Workspace Nav (Desktop) */}
          <nav aria-label="Primary workspace navigation" className="hidden lg:flex items-center gap-0.5 xl:gap-1.5 h-full">
            {/* Direct Workspace Tab: Studio */}
            <button
              type="button"
              onClick={() => onTabChange('studio')}
              aria-current={activeTab === 'studio' ? 'page' : undefined}
              className={`relative h-full px-2 xl:px-2.5 inline-flex items-center gap-1 text-[13px] xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                activeTab === 'studio'
                  ? 'text-primary font-semibold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <span>Studio</span>
              {activeTab === 'studio' && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-t-full"
                />
              )}
            </button>

            {/* Direct Workspace Tab: Saved Notes */}
            <button
              type="button"
              onClick={() => onTabChange('notes')}
              aria-current={activeTab === 'notes' ? 'page' : undefined}
              className={`relative h-full px-2 xl:px-2.5 inline-flex items-center gap-1 text-[13px] xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                activeTab === 'notes'
                  ? 'text-primary font-semibold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <span>Saved Notes</span>
              {notesCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-accent-soft text-primary text-xs font-mono tabular-nums font-semibold">
                  {notesCount}
                </span>
              )}
              {activeTab === 'notes' && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-t-full"
                />
              )}
            </button>

            {/* Direct Workspace Tab: Voice Commands */}
            <button
              type="button"
              onClick={() => onTabChange('commands')}
              aria-current={activeTab === 'commands' ? 'page' : undefined}
              className={`relative h-full px-2 xl:px-2.5 inline-flex items-center gap-1 text-[13px] xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                activeTab === 'commands'
                  ? 'text-primary font-semibold'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              <span>Voice Commands</span>
              {activeTab === 'commands' && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-t-full"
                />
              )}
            </button>

            {/* DeepL-style Flyout 1: Tools & Modes */}
            <div ref={toolsRef} className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => {
                  setToolsFlyoutOpen((prev) => !prev);
                  setGuidesFlyoutOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={toolsFlyoutOpen}
                className={`h-full px-2 xl:px-2.5 inline-flex items-center gap-1 text-[13px] xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                  toolsFlyoutOpen
                    ? 'text-primary font-semibold'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <span>Tools &amp; Modes</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                    toolsFlyoutOpen ? 'rotate-180 text-primary' : 'text-muted'
                  }`}
                  aria-hidden="true"
                />
              </button>

              {toolsFlyoutOpen && (
                <div
                  role="region"
                  aria-label="Studio tools and modalities"
                  className="absolute top-[100%] left-0 mt-1 w-80 bg-surface border border-border/90 rounded-card shadow-surface-elevated p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-3 py-1.5 border-b border-border/60 mb-1">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Voice Intelligence Suite
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      onTabChange('studio');
                      setToolsFlyoutOpen(false);
                    }}
                    className="w-full p-2.5 rounded-control flex items-start gap-3 text-left hover:bg-well transition-colors group"
                  >
                    <div className="p-1.5 rounded-control bg-primary/10 text-primary shrink-0 group-hover:scale-105 transition-transform">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          Dictation Studio
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-primary/15 text-primary rounded-full">
                          Real-Time
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-tight mt-0.5">
                        Continuous speech-to-text across 100+ languages with automatic punctuation.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTabChange('studio');
                      setToolsFlyoutOpen(false);
                    }}
                    className="w-full p-2.5 rounded-control flex items-start gap-3 text-left hover:bg-well transition-colors group"
                  >
                    <div className="p-1.5 rounded-control bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0 group-hover:scale-105 transition-transform">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          Writing Intelligence
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-500/15 text-purple-600 dark:text-purple-400 rounded-full">
                          AI Guardian
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-tight mt-0.5">
                        Real-time grammar, tone analysis, clarity optimization, and Anti-AI slop defense.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTabChange('studio');
                      setToolsFlyoutOpen(false);
                    }}
                    className="w-full p-2.5 rounded-control flex items-start gap-3 text-left hover:bg-well transition-colors group"
                  >
                    <div className="p-1.5 rounded-control bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          Tab &amp; Meeting Audio
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-tight mt-0.5">
                        Capture system audio, Zoom/Meet calls, and browser videos with live subtitle overlay.
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTabChange('studio');
                      setToolsFlyoutOpen(false);
                      if (audioExportSupported) {
                        onExportAudio?.();
                      }
                    }}
                    className="w-full p-2.5 rounded-control flex items-start gap-3 text-left hover:bg-well transition-colors group"
                  >
                    <div className="p-1.5 rounded-control bg-amber-500/10 text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          Audio WAV Studio
                        </span>
                      </div>
                      <p className="text-xs text-muted leading-tight mt-0.5">
                        Speak and export synchronized high-fidelity speech files directly to disk.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* DeepL-style Flyout 2: Guides & Knowledge */}
            <div ref={guidesRef} className="relative h-full flex items-center">
              <button
                type="button"
                onClick={() => {
                  setGuidesFlyoutOpen((prev) => !prev);
                  setToolsFlyoutOpen(false);
                }}
                aria-haspopup="true"
                aria-expanded={guidesFlyoutOpen}
                className={`h-full px-2 xl:px-2.5 inline-flex items-center gap-1 text-[13px] xl:text-sm font-medium transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary ${
                  guidesFlyoutOpen
                    ? 'text-primary font-semibold'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <span>Guides &amp; Resources</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                    guidesFlyoutOpen ? 'rotate-180 text-primary' : 'text-muted'
                  }`}
                  aria-hidden="true"
                />
              </button>

              {guidesFlyoutOpen && (
                <div
                  role="region"
                  aria-label="Guides and technical resources"
                  className="absolute top-[100%] left-0 mt-1 w-88 bg-surface border border-border/90 rounded-card shadow-surface-elevated p-2 z-50 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-3 py-1.5 border-b border-border/60 mb-1 flex items-center justify-between">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                      Knowledge Base
                    </span>
                    <a
                      href="./guides/"
                      className="text-xs text-primary hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Explore all</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <a
                    href="./guides/voice-dictation-mastery.html"
                    className="p-2.5 rounded-control flex items-start gap-3 text-left hover:bg-well transition-colors group block"
                  >
                    <div className="p-1.5 rounded-control bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                        Dictation Mastery &amp; Commands
                      </span>
                      <p className="text-xs text-muted leading-tight mt-0.5">
                        Punctuation macros, lists, and formatting commands for 150+ WPM speech typing.
                      </p>
                    </div>
                  </a>

                  <a
                    href="./guides/hindi-indic-voice-typing.html"
                    className="p-2.5 rounded-control flex items-start gap-3 text-left hover:bg-well transition-colors group block"
                  >
                    <div className="p-1.5 rounded-control bg-orange-500/10 text-orange-600 dark:text-orange-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Languages className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                        Indic &amp; Multilingual Voice Typing
                      </span>
                      <p className="text-xs text-muted leading-tight mt-0.5">
                        Phonetic Devanagari transliteration, Gboard suggestions, and dual-script speech.
                      </p>
                    </div>
                  </a>

                  <a
                    href="./guides/best-microphones-speech-recognition.html"
                    className="p-2.5 rounded-control flex items-start gap-3 text-left hover:bg-well transition-colors group block"
                  >
                    <div className="p-1.5 rounded-control bg-sky-500/10 text-sky-600 dark:text-sky-400 shrink-0 group-hover:scale-105 transition-transform">
                      <Headphones className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                        Microphone Acoustic Setup
                      </span>
                      <p className="text-xs text-muted leading-tight mt-0.5">
                        Hardware calibration for USB, condenser, and headset mics to eliminate errors.
                      </p>
                    </div>
                  </a>

                  <a
                    href="./guides/web-speech-api-benchmark.html"
                    className="p-2.5 rounded-control flex items-start gap-3 text-left hover:bg-well transition-colors group block"
                  >
                    <div className="p-1.5 rounded-control bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform">
                      <ChartBarBig className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors block">
                        Accuracy Benchmarks
                      </span>
                      <p className="text-xs text-muted leading-tight mt-0.5">
                        Real-world Word Error Rate (WER) comparison vs Dragon and OpenAI Whisper.
                      </p>
                    </div>
                  </a>

                  <div className="my-1 border-t border-border/60" />

                  <button
                    type="button"
                    onClick={() => {
                      onTabChange('guide');
                      setGuidesFlyoutOpen(false);
                    }}
                    className="w-full p-2 rounded-control flex items-center justify-between text-left text-xs font-semibold text-primary hover:bg-accent-soft transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>In-App Quick Guide &amp; Shortcuts</span>
                    </div>
                    <span className="text-[10px] uppercase font-bold text-muted">Open Tab &rarr;</span>
                  </button>
                </div>
              )}
            </div>
          </nav>

          {/* Zone 3: Save Status + Punctuation Indicator + Focus Timer + Export + New Note + Mobile Hamburger */}
          <div className="flex items-center gap-1 sm:gap-1.5 xl:gap-2 shrink-0">
            {/* Live Save Status */}
            <div
              role="status"
              aria-live="polite"
              data-testid="header-save-status"
              title={lastSyncedTooltip}
              className="hidden 2xl:inline-flex items-center gap-1 text-[11px] text-muted tabular-nums whitespace-nowrap shrink-0 pr-0.5"
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin shrink-0 text-primary" aria-hidden="true" />
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

            <div
              role="status"
              aria-live="polite"
              title={lastSyncedTooltip}
              className="hidden xl:inline-flex 2xl:hidden items-center gap-1 text-[11px] text-muted tabular-nums whitespace-nowrap shrink-0 pr-0.5"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="w-3 h-3 animate-spin shrink-0 text-primary" aria-hidden="true" />
              ) : (
                <Check className="w-3 h-3 text-primary shrink-0" aria-hidden="true" />
              )}
              <span>Saved</span>
            </div>

            {/* Punctuation AI active pill */}
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

            {/* Focus Timer dropdown */}
            <FocusTimerMenu timer={focusTimer} />

            {/* Export Dropdown */}
            <div ref={exportRef} className="relative">
              <button
                type="button"
                onClick={() => setExportOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={exportOpen}
                aria-label="Export"
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 xl:px-3 py-2 min-h-[38px] text-xs sm:text-[13px] xl:text-sm font-medium text-foreground bg-surface border border-border hover:border-muted/60 rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
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
                  className="absolute right-0 mt-2 w-56 z-50 bg-surface border border-border rounded-card shadow-surface py-1.5 animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!canExport}
                    onClick={() => handleSelectFormat('txt')}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well disabled:opacity-45 disabled:pointer-events-none transition-colors"
                  >
                    <AlignLeft className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>Plain Text (.txt)</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!canExport}
                    onClick={() => handleSelectFormat('md')}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well disabled:opacity-45 disabled:pointer-events-none transition-colors"
                  >
                    <FileCode2 className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>Markdown (.md)</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!canExport}
                    onClick={() => handleSelectFormat('pdf')}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well disabled:opacity-45 disabled:pointer-events-none transition-colors"
                  >
                    <FileText className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>PDF (.pdf)</span>
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    disabled={!canExport}
                    onClick={() => handleSelectFormat('doc')}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well disabled:opacity-45 disabled:pointer-events-none transition-colors"
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

            {/* Primary Action CTA: + New Note */}
            <button
              type="button"
              onClick={onNewNote}
              className="inline-flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 xl:px-3.5 py-2 min-h-[38px] text-xs sm:text-[13px] xl:text-sm font-semibold text-primary-foreground bg-primary hover:bg-primary-hover active:scale-[0.99] rounded-control transition-all whitespace-nowrap shrink-0 shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <Plus className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden min-[360px]:inline">
                New<span className="hidden min-[430px]:inline"> Note</span>
              </span>
            </button>

            {/* DeepL-Style Mobile Hamburger Drawer Toggle (Mobile & Tablet) */}
            <button
              type="button"
              id="mobile-menu-toggle-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label={mobileMenuOpen ? 'Close main navigation' : 'Open main navigation'}
              aria-expanded={mobileMenuOpen}
              className="lg:hidden p-2 text-foreground hover:bg-well rounded-control transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Zero-Scrollbar Mobile/Tablet Navigation Strip */}
      <nav
        aria-label="Mobile workspace navigation"
        className="lg:hidden border-b border-border/80 bg-surface px-2 sm:px-4 w-full overflow-hidden"
      >
        <div className="grid grid-cols-4 w-full items-center text-center">
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`relative py-2.5 text-xs sm:text-sm font-medium transition-colors text-center flex items-center justify-center gap-1 ${
                  isActive ? 'text-primary font-semibold' : 'text-muted hover:text-foreground'
                }`}
              >
                <span>{item.mobileLabel}</span>
                {item.id === 'notes' && notesCount > 0 && (
                  <span className="px-1 text-[10px] font-mono rounded-full bg-accent-soft text-primary font-bold">
                    {notesCount}
                  </span>
                )}
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute bottom-0 left-2 right-2 h-[2px] bg-primary rounded-t-full"
                  />
                )}
              </button>
            );
          })}
        </div>
      </nav>

      {/* DeepL-Style Slide-over Mobile & Tablet Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            ref={mobileMenuRef}
            className="w-full max-w-sm bg-surface h-full flex flex-col justify-between border-l border-border/90 shadow-2xl p-5 overflow-y-auto animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border/80">
                <div className="flex items-center gap-2">
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
                  <div>
                    <span className="font-display font-bold text-base text-foreground block">
                      VoiceScribe
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-primary">
                      Voice Studio Suite
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-control text-muted hover:text-foreground hover:bg-well transition-colors"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Workspace Navigation Section */}
              <div className="py-4 border-b border-border/60">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-2">
                  Workspace
                </span>
                <div className="space-y-1">
                  {NAV_ITEMS.map((item) => {
                    const isActive = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onTabChange(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full px-3 py-2 rounded-control flex items-center justify-between text-left text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-accent-soft text-primary font-semibold'
                            : 'text-foreground hover:bg-well'
                        }`}
                      >
                        <span>{item.label}</span>
                        {item.id === 'notes' && notesCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-surface border border-border text-xs font-mono">
                            {notesCount}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Tools & Modalities Section */}
              <div className="py-4 border-b border-border/60">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-2">
                  Voice Intelligence Tools
                </span>
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      onTabChange('studio');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full p-2 rounded-control flex items-center gap-2.5 text-left hover:bg-well transition-colors"
                  >
                    <div className="p-1.5 rounded-control bg-primary/10 text-primary shrink-0">
                      <Mic className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Voice Dictation Studio
                      </span>
                      <span className="text-[11px] text-muted block">
                        Real-time speech typing with 100+ languages
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTabChange('studio');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full p-2 rounded-control flex items-center gap-2.5 text-left hover:bg-well transition-colors"
                  >
                    <div className="p-1.5 rounded-control bg-purple-500/10 text-purple-600 dark:text-purple-400 shrink-0">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Writing Intelligence &amp; AI Guardian
                      </span>
                      <span className="text-[11px] text-muted block">
                        Grammar, clarity, tone &amp; Anti-AI defense
                      </span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onTabChange('studio');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full p-2 rounded-control flex items-center gap-2.5 text-left hover:bg-well transition-colors"
                  >
                    <div className="p-1.5 rounded-control bg-blue-500/10 text-blue-600 dark:text-blue-400 shrink-0">
                      <Radio className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-foreground block">
                        Tab &amp; Meeting Audio
                      </span>
                      <span className="text-[11px] text-muted block">
                        System audio &amp; live meeting subtitles
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Guides & Resources Section */}
              <div className="py-4">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-muted block mb-2">
                  Knowledge &amp; Benchmarks
                </span>
                <div className="space-y-1">
                  <a
                    href="./guides/"
                    className="px-3 py-2 rounded-control flex items-center justify-between text-xs font-medium text-foreground hover:bg-well transition-colors"
                  >
                    <span>Guides Hub Index</span>
                    <ExternalLink className="w-3.5 h-3.5 text-muted" />
                  </a>
                  <a
                    href="./guides/voice-dictation-mastery.html"
                    className="px-3 py-2 rounded-control flex items-center justify-between text-xs font-medium text-foreground hover:bg-well transition-colors"
                  >
                    <span>Voice Dictation Mastery</span>
                    <Zap className="w-3.5 h-3.5 text-emerald-500" />
                  </a>
                  <a
                    href="./guides/hindi-indic-voice-typing.html"
                    className="px-3 py-2 rounded-control flex items-center justify-between text-xs font-medium text-foreground hover:bg-well transition-colors"
                  >
                    <span>Indic &amp; Multilingual Voice Typing</span>
                    <Languages className="w-3.5 h-3.5 text-orange-500" />
                  </a>
                  <a
                    href="./guides/best-microphones-speech-recognition.html"
                    className="px-3 py-2 rounded-control flex items-center justify-between text-xs font-medium text-foreground hover:bg-well transition-colors"
                  >
                    <span>Microphone Acoustic Calibration</span>
                    <Headphones className="w-3.5 h-3.5 text-sky-500" />
                  </a>
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-border/80 space-y-3">
              {showPunctuation && (
                <div
                  role="status"
                  aria-live="polite"
                  data-testid="mobile-punctuation-indicator"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-primary bg-accent-soft border border-primary/30 rounded-control"
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span>{punctuationText}</span>
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-muted">
                <span>Sync Status</span>
                <span className="font-mono">{saveStatus === 'saving' ? 'Saving...' : `Synced ${lastSyncedText}`}</span>
              </div>

              <button
                type="button"
                onClick={() => {
                  onNewNote();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-4 rounded-control bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary-hover active:scale-[0.99] transition-all"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Note</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
