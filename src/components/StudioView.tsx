import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  BarChart2,
  Bold,
  BookOpen,
  Check,
  ChevronDown,
  Clock,
  Copy,
  FileUp,
  Highlighter,
  Italic,
  Keyboard,
  List,
  ListOrdered,
  Loader2,
  Maximize2,
  Mic,
  MicOff,
  Minimize2,
  Monitor,
  Moon,
  Printer,
  Radio,
  Save,
  Search,
  Share2,
  Sparkles,
  SpellCheck2,
  Square,
  Sun,
  Trash2,
  Type,
  Underline,
  UserCheck,
  Volume2,
  VolumeX,
  Wand2,
  Wrench,
  X,
} from 'lucide-react';
import { SpeechLanguage } from '../data/languages';
import { FocusTimerController } from '../hooks/useFocusTimer';
import {
  applySegmentHighlightToDom,
  clearSegmentHighlightFromDom,
  computeActiveLineRects,
  LineGlowRect,
  SpeechSegment,
} from '../utils/activeFocus';
import { autoCorrectText } from '../utils/autoCorrect';
import { EditorFontFamily, FONT_FAMILY_OPTIONS } from '../utils/fontFamily';
import { shareDraftContent } from '../utils/shareDraft';
import { TypographySize } from '../utils/storage';
import {
  cleanTranscriptText,
  countQueryMatches,
  formatTimestampTag,
  replaceAllMatches,
  replaceFirstMatch,
} from '../utils/textTools';
import { formatLastSyncedTime, formatLastSyncedTooltip } from '../utils/syncStatus';
import { computeTextMetrics, formatDuration } from '../utils/voiceCommands';
import { AnalyticsModal } from './AnalyticsModal';
import { FocusTimerMenu } from './FocusTimerMenu';
import { LanguageSelector } from './LanguageSelector';
import { WaveformVisualizer } from './WaveformVisualizer';
import { TabAudioModal } from './TabAudioModal';
import type { UseTabAudioCaptureReturn } from '../hooks/useTabAudioCapture';

interface StudioViewProps {
  noteId: string;
  title: string;
  content: string;
  htmlContent: string;
  selectedLanguage: SpeechLanguage;
  tabCapture?: UseTabAudioCaptureReturn;
  voiceCommandsEnabled: boolean;
  autoCorrectEnabled: boolean;
  focusMode: boolean;
  readabilityMode: boolean;
  typography: TypographySize;
  fontFamily: EditorFontFamily;
  focusTimer: FocusTimerController;
  isListening: boolean;
  isSpeechSupported: boolean;
  interimText: string;
  speechError: string | null;
  elapsedSeconds: number;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  lastCommandLabel: string | null;
  lastAutoCorrection: string | null;
  isSpeaking: boolean;
  isTtsSupported: boolean;
  ttsRate: number;
  activeFocusEnabled: boolean;
  activeSpeechSegment: SpeechSegment | null;
  totalSpeechSegments: number;
  theme: 'light' | 'dark';
  saveStatus: 'saving' | 'saved';
  lastSyncedAt: number | null;
  onTitleChange: (title: string) => void;
  onContentChange: (plainText: string, html: string) => void;
  onImportDraft: (title: string, content: string) => void;
  onSelectLanguage: (lang: SpeechLanguage) => void;
  onToggleVoiceCommands: () => void;
  onToggleAutoCorrect: () => void;
  onToggleFocusMode: () => void;
  onToggleReadabilityMode: () => void;
  onToggleActiveFocus: () => void;
  onChangeTypography: (size: TypographySize) => void;
  onChangeFontFamily: (family: EditorFontFamily) => void;
  onToggleListening: () => void;
  onDismissError: () => void;
  onRunSampleDictation: () => void;
  onToggleTts: () => void;
  onStopTts: () => void;
  onCycleTtsRate: () => void;
  onClearNote: () => void;
  onSaveNote: () => void;
  onToggleTheme: () => void;
}

const TYPOGRAPHY_OPTIONS: { id: TypographySize; label: string; sizeHint: string; textClass: string }[] = [
  { id: 'small', label: 'Small', sizeHint: '14px', textClass: 'text-[14px] leading-[1.65]' },
  { id: 'medium', label: 'Medium', sizeHint: '16px', textClass: 'text-[16px] leading-[1.7]' },
  { id: 'large', label: 'Large', sizeHint: '18px', textClass: 'text-[18px] leading-[1.75]' },
  { id: 'xlarge', label: 'Extra Large', sizeHint: '21px', textClass: 'text-[21px] leading-[1.8]' },
];

function plainTextToHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

export function StudioView({
  noteId,
  title,
  content,
  htmlContent,
  selectedLanguage,
  voiceCommandsEnabled,
  autoCorrectEnabled,
  focusMode,
  readabilityMode,
  typography,
  fontFamily,
  focusTimer,
  isListening,
  isSpeechSupported,
  interimText,
  speechError,
  elapsedSeconds,
  analyserRef,
  lastCommandLabel,
  lastAutoCorrection,
  isSpeaking,
  isTtsSupported,
  ttsRate,
  activeFocusEnabled,
  activeSpeechSegment,
  totalSpeechSegments,
  theme,
  saveStatus,
  lastSyncedAt,
  tabCapture,
  onTitleChange,
  onContentChange,
  onImportDraft,
  onSelectLanguage,
  onToggleVoiceCommands,
  onToggleAutoCorrect,
  onToggleFocusMode,
  onToggleReadabilityMode,
  onToggleActiveFocus,
  onChangeTypography,
  onChangeFontFamily,
  onToggleListening,
  onDismissError,
  onRunSampleDictation,
  onToggleTts,
  onStopTts,
  onCycleTtsRate,
  onClearNote,
  onSaveNote,
  onToggleTheme,
}: StudioViewProps) {
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typographyMenuRef = useRef<HTMLDivElement>(null);
  const toolsMenuRef = useRef<HTMLDivElement>(null);
  const findInputRef = useRef<HTMLInputElement>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const activeHighlightRef = useRef<boolean>(false);

  const lastSyncedRef = useRef<{ noteId: string; html: string }>({
    noteId: '',
    html: '',
  });

  const [copied, setCopied] = useState(false);
  const [sharedFeedback, setSharedFeedback] = useState(false);
  const [analyticsOpen, setAnalyticsOpen] = useState(false);
  const [typographyOpen, setTypographyOpen] = useState(false);
  const [tabAudioModalOpen, setTabAudioModalOpen] = useState(false);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQuery, setFindQuery] = useState('');
  const [replaceValue, setReplaceValue] = useState('');
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [toolNotice, setToolNotice] = useState<string | null>(null);
  const [speakerTurn, setSpeakerTurn] = useState<1 | 2>(1);
  const [activeLineRects, setActiveLineRects] = useState<LineGlowRect[]>([]);

  const metrics = useMemo(() => computeTextMetrics(content), [content]);
  const liveText = interimText ? `${content} ${interimText}` : content;
  const liveMetrics = useMemo(() => computeTextMetrics(liveText), [liveText]);
  const hasContent = content.trim().length > 0;
  const findMatchCount = useMemo(
    () => (findOpen ? countQueryMatches(content, findQuery, caseSensitive) : 0),
    [content, findOpen, findQuery, caseSensitive]
  );

  const flashNotice = (msg: string) => {
    if (noticeTimerRef.current !== null) {
      window.clearTimeout(noticeTimerRef.current);
    }
    setToolNotice(msg);
    noticeTimerRef.current = window.setTimeout(() => {
      setToolNotice(null);
      noticeTimerRef.current = null;
    }, 2400);
  };

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current !== null) {
        window.clearTimeout(noticeTimerRef.current);
      }
    };
  }, []);

  // Sync external updates (loading a note, clearing, voice dictation append) into contentEditable
  useEffect(() => {
    const el = editorRef.current;
    if (!el) return;
    if (lastSyncedRef.current.noteId !== noteId || lastSyncedRef.current.html !== htmlContent) {
      el.innerHTML = htmlContent;
      lastSyncedRef.current = { noteId, html: htmlContent };
      activeHighlightRef.current = false;
    }
  }, [noteId, htmlContent]);

  // Apply non-destructive Active Focus segment highlight and pulsing line glow during playback
  useEffect(() => {
    const el = editorRef.current;
    const containerEl = editorContainerRef.current;
    if (!el || !containerEl) return;

    if (!activeFocusEnabled || !isSpeaking || !activeSpeechSegment || !content.trim()) {
      if (activeHighlightRef.current) {
        clearSegmentHighlightFromDom(el);
        activeHighlightRef.current = false;
      }
      setActiveLineRects([]);
      return;
    }

    const cleanHtml = htmlContent || plainTextToHtml(content);
    el.innerHTML = cleanHtml;
    const marks = applySegmentHighlightToDom(el, content, activeSpeechSegment);
    activeHighlightRef.current = marks.length > 0;

    if (marks.length === 0) {
      setActiveLineRects([]);
      return;
    }

    const updateRects = () => {
      if (!editorContainerRef.current) return;
      setActiveLineRects(computeActiveLineRects(marks, editorContainerRef.current));
    };

    updateRects();
    if (typeof marks[0].scrollIntoView === 'function') {
      marks[0].scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }

    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateRects) : null;
    ro?.observe(containerEl);
    window.addEventListener('resize', updateRects);

    return () => {
      ro?.disconnect();
      window.removeEventListener('resize', updateRects);
    };
  }, [
    activeFocusEnabled,
    isSpeaking,
    activeSpeechSegment,
    content,
    htmlContent,
    noteId,
    typography,
    readabilityMode,
    focusMode,
  ]);

  // Close menus on outside click or Escape
  useEffect(() => {
    if (!typographyOpen && !toolsOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      const target = e.target as Node;
      if (typographyOpen && typographyMenuRef.current && !typographyMenuRef.current.contains(target)) {
        setTypographyOpen(false);
      }
      if (toolsOpen && toolsMenuRef.current && !toolsMenuRef.current.contains(target)) {
        setToolsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setTypographyOpen(false);
        setToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [typographyOpen, toolsOpen]);

  // Studio keyboard shortcuts: Ctrl+F (Find & Replace), Ctrl+Shift+T (Timestamp), Esc (Focus/Modals)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
        setFindOpen(true);
        window.setTimeout(() => findInputRef.current?.focus(), 20);
      } else if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 't') {
        e.preventDefault();
        const prefix = content && !content.endsWith('\n') && !content.endsWith(' ') ? '\n' : '';
        const nextText = content + prefix + formatTimestampTag();
        onContentChange(nextText, plainTextToHtml(nextText));
        flashNotice('Timestamp inserted');
      } else if (e.key === 'Escape') {
        if (shortcutsOpen) {
          setShortcutsOpen(false);
        } else if (findOpen) {
          setFindOpen(false);
        } else if (focusMode && !analyticsOpen) {
          onToggleFocusMode();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [analyticsOpen, content, findOpen, focusMode, onContentChange, onToggleFocusMode, shortcutsOpen]);

  const handleEditorInput = () => {
    const el = editorRef.current;
    if (!el) return;
    if (clearSegmentHighlightFromDom(el)) {
      activeHighlightRef.current = false;
      setActiveLineRects([]);
      if (isSpeaking) {
        onStopTts();
      }
    }
    const rawPlain = el.innerText.replace(/\u00a0/g, ' ');
    if (rawPlain.trim() === '' && !el.querySelector('li')) {
      el.innerHTML = '';
      lastSyncedRef.current = { noteId, html: '' };
      onContentChange('', '');
      return;
    }
    const html = el.innerHTML;
    lastSyncedRef.current = { noteId, html };
    onContentChange(rawPlain, html);
  };

  const applyFormat = (command: string) => {
    const el = editorRef.current;
    if (!el) return;
    if (clearSegmentHighlightFromDom(el)) {
      activeHighlightRef.current = false;
      setActiveLineRects([]);
      if (isSpeaking) {
        onStopTts();
      }
    }
    el.focus();
    document.execCommand(command, false);
    handleEditorInput();
  };

  const handleCopy = async () => {
    if (!hasContent) return;
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    }
  };

  const handleShare = async () => {
    if (!hasContent && !title.trim()) return;
    const outcome = await shareDraftContent(title, content);
    if (outcome === 'shared') {
      setSharedFeedback(true);
      flashNotice('Draft shared');
      window.setTimeout(() => setSharedFeedback(false), 1800);
    } else if (outcome === 'copied') {
      setSharedFeedback(true);
      flashNotice('Copied to share');
      window.setTimeout(() => setSharedFeedback(false), 1800);
    } else if (outcome === 'failed') {
      flashNotice('Unable to share draft');
    }
  };

  const handleInsertTimestamp = () => {
    const prefix = content && !content.endsWith('\n') && !content.endsWith(' ') ? '\n' : '';
    const nextText = content + prefix + formatTimestampTag();
    onContentChange(nextText, plainTextToHtml(nextText));
    setToolsOpen(false);
    flashNotice('Timestamp inserted');
  };

  const handleInsertSpeaker = () => {
    const prefix = content.trim() ? (content.endsWith('\n') ? '' : '\n\n') : '';
    const label = `Speaker ${speakerTurn}: `;
    const nextText = content + prefix + label;
    onContentChange(nextText, plainTextToHtml(nextText));
    setSpeakerTurn((prev) => (prev === 1 ? 2 : 1));
    setToolsOpen(false);
    flashNotice(`Inserted Speaker ${speakerTurn}`);
  };

  const handleCleanFormatting = () => {
    if (!hasContent) return;
    const cleaned = cleanTranscriptText(content);
    onContentChange(cleaned, plainTextToHtml(cleaned));
    setToolsOpen(false);
    flashNotice('Spacing & case cleaned');
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]+/g, ' ').trim();
      onImportDraft(baseTitle, text);
      flashNotice(`Imported ${file.name}`);
    } catch {
      flashNotice('Could not read file');
    }
  };

  const handleReplaceNext = () => {
    if (!findQuery) return;
    const res = replaceFirstMatch(content, findQuery, replaceValue, caseSensitive);
    if (res.replaced) {
      onContentChange(res.text, plainTextToHtml(res.text));
      flashNotice('Replaced 1 match');
    }
  };

  const handleReplaceAll = () => {
    if (!findQuery) return;
    const res = replaceAllMatches(content, findQuery, replaceValue, caseSensitive);
    if (res.count > 0) {
      onContentChange(res.text, plainTextToHtml(res.text));
      flashNotice(`Replaced ${res.count} ${res.count === 1 ? 'match' : 'matches'}`);
    }
  };

  const selectedTypoOption =
    TYPOGRAPHY_OPTIONS.find((opt) => opt.id === typography) ?? TYPOGRAPHY_OPTIONS[1];

  const editorLayoutClass = readabilityMode
    ? `max-w-[58ch] mx-auto ${selectedTypoOption.textClass.split(' ')[0]} leading-[1.95]`
    : focusMode
      ? `max-w-[68ch] mx-auto ${selectedTypoOption.textClass}`
      : `max-w-[70ch] ${selectedTypoOption.textClass}`;

  return (
    <div
      className={`mx-auto px-4 sm:px-6 ${
        focusMode ? 'max-w-3xl pt-8 sm:pt-12 pb-16' : 'max-w-6xl pt-5 pb-24 sm:pb-12'
      }`}
    >
      {/* Hidden file input for .txt / .md import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,text/plain,text/markdown"
        onChange={handleImportFile}
        className="hidden"
        aria-hidden="true"
      />

      {/* Minimal Exit Focus Mode bar when active */}
      {focusMode && (
        <div data-print-hide="true" className="flex flex-wrap items-center justify-end gap-2 mb-4">
          <FocusTimerMenu timer={focusTimer} compact />

          {isTtsSupported && (
            <>
              <button
                type="button"
                onClick={onToggleTts}
                disabled={!hasContent && !isSpeaking}
                aria-label={isSpeaking ? 'Stop reading aloud' : 'Listen to note'}
                className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs font-medium border rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  isSpeaking
                    ? 'bg-accent-soft border-primary/30 text-primary'
                    : 'text-muted bg-surface/90 border-border hover:text-foreground disabled:opacity-40 disabled:pointer-events-none'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <Square className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                    <span>Stop</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Listen</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onToggleActiveFocus}
                aria-pressed={activeFocusEnabled}
                data-testid="focus-bar-active-focus-toggle"
                className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs font-medium border rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                  activeFocusEnabled
                    ? 'bg-accent-soft border-primary/30 text-primary'
                    : 'text-muted bg-surface/90 border-border hover:text-foreground'
                }`}
              >
                <Highlighter className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Active Focus</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onToggleReadabilityMode}
            aria-pressed={readabilityMode}
            aria-label="Readability"
            className={`inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs font-medium border rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              readabilityMode
                ? 'bg-accent-soft border-primary/30 text-primary'
                : 'text-muted bg-surface/90 border-border hover:text-foreground'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Readability</span>
          </button>

          <button
            type="button"
            onClick={onToggleFocusMode}
            aria-label="Exit Focus Mode"
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs font-medium text-muted hover:text-foreground bg-surface/90 border border-border rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <Minimize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            <span>Exit Focus Mode</span>
          </button>
        </div>
      )}

      {/* Workspace Toolbar (collapsed completely in Focus Mode) */}
      {!focusMode && (
        <div
          data-print-hide="true"
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2 mb-4"
        >
          <div className="flex flex-wrap items-center gap-1.5 shrink-0">
            <LanguageSelector selectedLanguage={selectedLanguage} onSelect={onSelectLanguage} />

            <button
              type="button"
              onClick={onToggleVoiceCommands}
              aria-pressed={voiceCommandsEnabled}
              className={`inline-flex items-center gap-1.5 min-h-[38px] px-2 py-1.5 text-xs sm:text-[13px] font-medium rounded-control border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                voiceCommandsEnabled
                  ? 'bg-accent-soft border-primary/30 text-primary'
                  : 'bg-surface border-border text-muted hover:text-foreground'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Voice commands</span>
            </button>

            <button
              type="button"
              onClick={onToggleAutoCorrect}
              aria-pressed={autoCorrectEnabled}
              data-testid="autocorrect-toggle"
              title="Automatically fix common phonetic typos and casing errors while dictating"
              className={`inline-flex items-center gap-1.5 min-h-[38px] px-2 py-1.5 text-xs sm:text-[13px] font-medium rounded-control border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                autoCorrectEnabled
                  ? 'bg-accent-soft border-primary/30 text-primary'
                  : 'bg-surface border-border text-muted hover:text-foreground'
              }`}
            >
              <SpellCheck2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span>Auto-correct</span>
            </button>
          </div>

          {/* Typography, Tools & Workspace Actions */}
          <div className="flex flex-wrap items-center justify-between lg:justify-end gap-0.5 min-w-0">

            {isTtsSupported && (
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={onToggleTts}
                  disabled={!hasContent && !isSpeaking}
                  aria-label={isSpeaking ? 'Stop reading aloud' : 'Listen to note'}
                  title={isSpeaking ? 'Stop reading aloud' : 'Listen to note'}
                  className={`inline-flex items-center justify-center gap-1 h-9 rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-primary ${
                    isSpeaking
                      ? 'px-1.5 text-xs font-medium bg-accent-soft text-primary'
                      : 'w-[29px] text-muted hover:text-foreground hover:bg-well disabled:opacity-40 disabled:pointer-events-none'
                  }`}
                >
                  {isSpeaking ? (
                    <>
                      <Square className="w-3.5 h-3.5 fill-current shrink-0" aria-hidden="true" />
                      <span>Stop</span>
                    </>
                  ) : (
                    <Volume2 className="w-4 h-4 shrink-0" aria-hidden="true" />
                  )}
                </button>
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={onCycleTtsRate}
                    aria-label={`Playback speed ${ttsRate}x`}
                    className="h-9 px-1 text-xs font-mono tabular-nums text-muted hover:text-foreground hover:bg-well rounded-control"
                  >
                    {ttsRate}x
                  </button>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleCopy}
              disabled={!hasContent}
              aria-label={copied ? 'Copied transcript' : 'Copy transcript'}
              title={copied ? 'Copied' : 'Copy transcript'}
              className={`inline-flex items-center justify-center w-[29px] h-9 rounded-control transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-primary ${
                copied
                  ? 'text-primary bg-accent-soft'
                  : 'text-muted hover:text-foreground hover:bg-well disabled:opacity-40 disabled:pointer-events-none'
              }`}
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Copy className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={handleShare}
              disabled={!hasContent && !title.trim()}
              aria-label={sharedFeedback ? 'Draft shared' : 'Share draft'}
              title={sharedFeedback ? 'Shared' : 'Share draft'}
              className={`inline-flex items-center justify-center w-[29px] h-9 rounded-control transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-primary ${
                sharedFeedback
                  ? 'text-primary bg-accent-soft'
                  : 'text-muted hover:text-foreground hover:bg-well disabled:opacity-40 disabled:pointer-events-none'
              }`}
            >
              {sharedFeedback ? (
                <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              ) : (
                <Share2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              onClick={onSaveNote}
              disabled={!hasContent && !title.trim()}
              aria-label="Save note"
              title="Save note (Ctrl+S)"
              className="inline-flex items-center justify-center w-[29px] h-9 text-muted hover:text-foreground hover:bg-well disabled:opacity-40 disabled:pointer-events-none rounded-control transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Save className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
            </button>

            {/* Typography Size Dropdown */}
            <div ref={typographyMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setTypographyOpen((prev) => !prev);
                  setToolsOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={typographyOpen}
                aria-label="Typography"
                title={`Typography (${selectedTypoOption.label})`}
                className={`inline-flex items-center gap-1 h-9 px-1.5 text-xs font-medium rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-primary ${
                  typographyOpen
                    ? 'bg-accent-soft text-primary'
                    : 'text-muted hover:text-foreground hover:bg-well'
                }`}
              >
                <Type className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span className="hidden md:inline">Size</span>
                <ChevronDown
                  className={`w-3 h-3 transition-transform duration-150 shrink-0 ${
                    typographyOpen ? 'rotate-180' : ''
                  }`}
                  aria-hidden="true"
                />
              </button>

              {typographyOpen && (
                <div
                  role="menu"
                  aria-label="Editor text size and font family"
                  className="absolute right-0 mt-2 w-48 z-40 bg-surface border border-border rounded-card shadow-surface py-1.5"
                >
                  <div className="px-3.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted">
                    Text Size
                  </div>
                  {TYPOGRAPHY_OPTIONS.map((opt) => {
                    const isActive = typography === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isActive}
                        onClick={() => {
                          onChangeTypography(opt.id);
                          setTypographyOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 flex items-center justify-between gap-2 text-left text-sm transition-colors ${
                          isActive
                            ? 'bg-accent-soft text-primary font-medium'
                            : 'text-foreground hover:bg-well'
                        }`}
                      >
                        <span>{opt.label}</span>
                        <span className="flex items-center gap-1.5">
                          <span className="text-[11px] font-mono text-muted">{opt.sizeHint}</span>
                          {isActive && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                        </span>
                      </button>
                    );
                  })}

                  <div className="my-1 border-t border-border/60" role="separator" />
                  <div className="px-3.5 py-1 text-[11px] font-medium uppercase tracking-wider text-muted">
                    Font Family
                  </div>
                  {FONT_FAMILY_OPTIONS.map((opt) => {
                    const isActive = fontFamily === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        role="menuitemradio"
                        aria-checked={isActive}
                        onClick={() => {
                          onChangeFontFamily(opt.id);
                          setTypographyOpen(false);
                        }}
                        className={`w-full px-3.5 py-2 flex items-center justify-between gap-2 text-left text-sm transition-colors ${
                          isActive
                            ? 'bg-accent-soft text-primary font-medium'
                            : 'text-foreground hover:bg-well'
                        }`}
                      >
                        <span style={{ fontFamily: opt.cssValue }}>{opt.label}</span>
                        {isActive && <Check className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Writing Tools Menu (Find & Replace, Timestamp, Speaker, Clean, Import, Print, Shortcuts) */}
            <div ref={toolsMenuRef} className="relative shrink-0">
              <button
                type="button"
                onClick={() => {
                  setToolsOpen((prev) => !prev);
                  setTypographyOpen(false);
                }}
                aria-haspopup="menu"
                aria-expanded={toolsOpen}
                aria-label="Writing tools"
                title="Writing tools"
                className={`inline-flex items-center justify-center w-[29px] h-9 rounded-control transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-primary ${
                  toolsOpen
                    ? 'bg-accent-soft text-primary'
                    : 'text-muted hover:text-foreground hover:bg-well'
                }`}
              >
                <Wrench className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              </button>

              {toolsOpen && (
                <div
                  role="menu"
                  aria-label="Writing tools menu"
                  className="absolute right-0 mt-2 w-56 z-40 bg-surface border border-border rounded-card shadow-surface py-1.5"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setFindOpen((prev) => !prev);
                      setToolsOpen(false);
                      window.setTimeout(() => findInputRef.current?.focus(), 20);
                    }}
                    className="w-full px-3.5 py-2 flex items-center justify-between gap-2 text-left text-sm text-foreground hover:bg-well transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Search className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                      <span>Find & Replace</span>
                    </span>
                    <span className="text-[11px] font-mono text-muted">Ctrl+F</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleInsertTimestamp}
                    className="w-full px-3.5 py-2 flex items-center justify-between gap-2 text-left text-sm text-foreground hover:bg-well transition-colors"
                  >
                    <span className="flex items-center gap-2.5">
                      <Clock className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                      <span>Insert Timestamp</span>
                    </span>
                    <span className="text-[11px] font-mono text-muted">⇧⌘T</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleInsertSpeaker}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well transition-colors"
                  >
                    <UserCheck className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>Insert Speaker {speakerTurn}</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    disabled={!hasContent}
                    onClick={handleCleanFormatting}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well disabled:opacity-45 disabled:pointer-events-none transition-colors"
                  >
                    <Wand2 className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>Clean Spacing & Case</span>
                  </button>

                  <div className="my-1 border-t border-border/60" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setToolsOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well transition-colors"
                  >
                    <FileUp className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>Import .txt / .md</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    disabled={!hasContent && !title.trim()}
                    onClick={() => {
                      setToolsOpen(false);
                      window.print();
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well disabled:opacity-45 disabled:pointer-events-none transition-colors"
                  >
                    <Printer className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>Print Document</span>
                  </button>

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setToolsOpen(false);
                      setShortcutsOpen(true);
                    }}
                    className="w-full px-3.5 py-2 flex items-center gap-2.5 text-left text-sm text-foreground hover:bg-well transition-colors"
                  >
                    <Keyboard className="w-4 h-4 text-muted shrink-0" aria-hidden="true" />
                    <span>Keyboard Shortcuts</span>
                  </button>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setAnalyticsOpen(true)}
              aria-label="Analytics"
              title="Draft Analytics"
              className="inline-flex items-center gap-1.5 h-9 px-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-well rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <BarChart2 className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span className="hidden xl:inline">Analytics</span>
            </button>

            <button
              type="button"
              onClick={onToggleReadabilityMode}
              aria-pressed={readabilityMode}
              aria-label="Readability"
              title="Toggle Readability mode (focused line width & line height)"
              className={`inline-flex items-center gap-1.5 h-9 px-1.5 text-xs font-medium rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-primary ${
                readabilityMode
                  ? 'bg-accent-soft text-primary'
                  : 'text-muted hover:text-foreground hover:bg-well'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden xl:inline">Readability</span>
            </button>

            <button
              type="button"
              onClick={onToggleFocusMode}
              aria-pressed={focusMode}
              aria-label="Focus Mode"
              title="Focus Mode"
              className="inline-flex items-center gap-1.5 h-9 px-1.5 text-xs font-medium text-muted hover:text-foreground hover:bg-well rounded-control transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Maximize2 className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
              <span className="hidden xl:inline">Focus</span>
            </button>

            <button
              type="button"
              onClick={onClearNote}
              disabled={!hasContent && !title.trim()}
              aria-label="Clear note"
              title="Clear note"
              className="inline-flex items-center justify-center w-[29px] h-9 text-muted hover:text-danger hover:bg-danger-soft disabled:opacity-35 disabled:pointer-events-none rounded-control transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
            >
              <Trash2 className="w-4 h-4" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
              className="inline-flex items-center justify-center w-[29px] h-9 text-muted hover:text-foreground hover:bg-well rounded-control transition-colors shrink-0 focus-visible:outline-2 focus-visible:outline-primary"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4" aria-hidden="true" />
              ) : (
                <Moon className="w-4 h-4" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Main Document Paper Canvas */}
      <section
        aria-label="Transcript document"
        className={`bg-surface border border-border/90 rounded-2xl shadow-surface ${
          focusMode ? 'p-6 sm:p-12 min-h-[72vh]' : 'p-5 sm:p-10'
        }`}
      >
        {!focusMode && (
          <>
            <input
              type="text"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Untitled note"
              aria-label="Note title"
              className={`w-full bg-transparent font-display text-2xl sm:text-[26px] font-semibold tracking-tight text-foreground placeholder:text-muted/45 focus:outline-none ${
                readabilityMode ? 'max-w-[58ch] mx-auto block' : ''
              }`}
            />

            {/* Unboxed typographic metadata strip + inline rich-text formatting */}
            <div
              data-print-hide="true"
              className={`mt-2 pb-4 border-b border-border/60 flex flex-wrap items-center justify-between gap-2 text-xs text-muted tabular-nums ${
                readabilityMode ? 'max-w-[58ch] mx-auto' : ''
              }`}
            >
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                <span>
                  {metrics.words} {metrics.words === 1 ? 'word' : 'words'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{metrics.characters} chars</span>
                <span aria-hidden="true">·</span>
                <span>{selectedLanguage.name}</span>
                <span aria-hidden="true">·</span>
                <span
                  data-testid="save-status"
                  aria-live="polite"
                  className="inline-flex items-center gap-1 text-muted"
                >
                  {saveStatus === 'saving' ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" aria-hidden="true" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3 h-3 text-primary" aria-hidden="true" />
                      <span>Saved</span>
                    </>
                  )}
                </span>
                <span aria-hidden="true">·</span>
                <span
                  data-testid="studio-last-synced"
                  title={formatLastSyncedTooltip(lastSyncedAt)}
                  className="text-muted/90"
                >
                  Last synced {formatLastSyncedTime(lastSyncedAt)}
                </span>
                {readabilityMode && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span className="text-primary font-medium">Readability</span>
                  </>
                )}
                {activeFocusEnabled && isSpeaking && activeSpeechSegment && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span data-testid="active-focus-playback-status" className="text-primary font-medium">
                      Active Focus {totalSpeechSegments > 1 ? `(${activeSpeechSegment.index + 1}/${totalSpeechSegments})` : 'on'}
                    </span>
                  </>
                )}
                {(toolNotice || lastCommandLabel || lastAutoCorrection) && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span data-testid="studio-status-notice" className="text-primary font-medium">
                      {toolNotice ||
                        (lastCommandLabel ? `Applied: ${lastCommandLabel}` : lastAutoCorrection)}
                    </span>
                  </>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <div
                  role="group"
                  aria-label="Font Family"
                  data-testid="font-family-selector"
                  className="inline-flex items-center bg-well/70 border border-border rounded-control p-0.5 shrink-0"
                >
                  {FONT_FAMILY_OPTIONS.map((opt) => {
                    const isSelected = fontFamily === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => onChangeFontFamily(opt.id)}
                        aria-pressed={isSelected}
                        title={`${opt.label} (${opt.description})`}
                        style={{ fontFamily: opt.cssValue }}
                        className={`px-2 py-0.5 min-h-[24px] text-xs rounded-[5px] transition-colors whitespace-nowrap focus-visible:outline-2 focus-visible:outline-primary ${
                          isSelected
                            ? 'bg-surface text-primary font-medium shadow-xs'
                            : 'text-muted hover:text-foreground'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>

                {isTtsSupported && (
                  <button
                    type="button"
                    onClick={onToggleActiveFocus}
                    aria-pressed={activeFocusEnabled}
                    data-testid="active-focus-toggle"
                    title="Highlight active spoken segment with a pulsing line glow during playback"
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 text-xs font-medium rounded-control border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-primary ${
                      activeFocusEnabled
                        ? 'bg-accent-soft border-primary/35 text-primary'
                        : 'bg-surface border-border text-muted hover:text-foreground hover:bg-well'
                    }`}
                  >
                    <Highlighter className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                    <span>Active Focus</span>
                  </button>
                )}

                <div
                  role="group"
                  aria-label="Text formatting"
                  className="hidden sm:flex items-center gap-0.5 shrink-0"
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('bold')}
                    aria-label="Bold"
                    title="Bold"
                    className="w-7 h-7 inline-flex items-center justify-center rounded-control text-muted hover:text-foreground hover:bg-well transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Bold className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('italic')}
                    aria-label="Italic"
                    title="Italic"
                    className="w-7 h-7 inline-flex items-center justify-center rounded-control text-muted hover:text-foreground hover:bg-well transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Italic className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('underline')}
                    aria-label="Underline"
                    title="Underline"
                    className="w-7 h-7 inline-flex items-center justify-center rounded-control text-muted hover:text-foreground hover:bg-well transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <Underline className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('insertUnorderedList')}
                    aria-label="Bulleted list"
                    title="Bulleted list"
                    className="w-7 h-7 inline-flex items-center justify-center rounded-control text-muted hover:text-foreground hover:bg-well transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <List className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => applyFormat('insertOrderedList')}
                    aria-label="Numbered list"
                    title="Numbered list"
                    className="w-7 h-7 inline-flex items-center justify-center rounded-control text-muted hover:text-foreground hover:bg-well transition-colors focus-visible:outline-2 focus-visible:outline-primary"
                  >
                    <ListOrdered className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>

            {/* Collapsible Find & Replace Strip */}
            {findOpen && (
              <div
                data-print-hide="true"
                role="region"
                aria-label="Find and replace"
                className="mt-4 p-3 rounded-card bg-well/70 border border-border flex flex-wrap items-center gap-2"
              >
                <div className="relative flex-1 min-w-[160px]">
                  <Search
                    className="w-3.5 h-3.5 text-muted absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    aria-hidden="true"
                  />
                  <input
                    ref={findInputRef}
                    type="text"
                    value={findQuery}
                    onChange={(e) => setFindQuery(e.target.value)}
                    placeholder="Find text..."
                    aria-label="Find text"
                    className="w-full pl-8 pr-2.5 py-1.5 text-xs bg-surface text-foreground placeholder:text-muted/70 border border-border rounded-control focus:outline-none focus:border-primary"
                  />
                </div>

                <input
                  type="text"
                  value={replaceValue}
                  onChange={(e) => setReplaceValue(e.target.value)}
                  placeholder="Replace with..."
                  aria-label="Replace with"
                  className="flex-1 min-w-[150px] px-2.5 py-1.5 text-xs bg-surface text-foreground placeholder:text-muted/70 border border-border rounded-control focus:outline-none focus:border-primary"
                />

                <button
                  type="button"
                  onClick={() => setCaseSensitive((prev) => !prev)}
                  aria-pressed={caseSensitive}
                  title="Match case"
                  className={`px-2 py-1.5 text-xs font-mono rounded-control border transition-colors ${
                    caseSensitive
                      ? 'bg-accent-soft border-primary/40 text-primary font-medium'
                      : 'bg-surface border-border text-muted hover:text-foreground'
                  }`}
                >
                  Aa
                </button>

                <span className="text-xs font-mono tabular-nums text-muted px-1">
                  {findQuery ? `${findMatchCount} ${findMatchCount === 1 ? 'match' : 'matches'}` : '0 matches'}
                </span>

                <button
                  type="button"
                  onClick={handleReplaceNext}
                  disabled={!findQuery || findMatchCount === 0}
                  className="px-2.5 py-1.5 text-xs font-medium bg-surface border border-border hover:bg-well disabled:opacity-45 rounded-control text-foreground transition-colors"
                >
                  Replace
                </button>

                <button
                  type="button"
                  onClick={handleReplaceAll}
                  disabled={!findQuery || findMatchCount === 0}
                  className="px-2.5 py-1.5 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover disabled:opacity-45 rounded-control transition-colors"
                >
                  Replace All
                </button>

                <button
                  type="button"
                  onClick={() => setFindOpen(false)}
                  aria-label="Close find and replace"
                  className="p-1 text-muted hover:text-foreground rounded-control"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}

            {/* Inline Speech Error / Browser Guidance */}
            {speechError && (
              <div
                data-print-hide="true"
                role="alert"
                className="mt-4 flex items-start justify-between gap-3 px-4 py-3 rounded-card bg-danger-soft border border-danger/30 text-sm text-danger"
              >
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{speechError}</span>
                </div>
                <button
                  type="button"
                  onClick={onDismissError}
                  aria-label="Dismiss alert"
                  className="p-1 text-danger hover:opacity-80 rounded-control shrink-0"
                >
                  <X className="w-4 h-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Editable Transcript Surface */}
        <div
          className={`${focusMode ? 'min-h-[60vh]' : 'mt-5 min-h-[300px] sm:min-h-[370px]'} flex flex-col justify-between`}
        >
          <div className={readabilityMode ? 'w-full' : undefined}>
            <div ref={editorContainerRef} className="relative">
              {activeFocusEnabled && isSpeaking && activeLineRects.length > 0 && (
                <div
                  aria-hidden="true"
                  data-testid="active-focus-glow-layer"
                  className={`pointer-events-none absolute inset-0 overflow-hidden z-0 ${
                    readabilityMode
                      ? 'max-w-[58ch] mx-auto'
                      : focusMode
                        ? 'max-w-[68ch] mx-auto'
                        : 'max-w-[70ch]'
                  }`}
                >
                  {activeLineRects.map((rect, idx) => (
                    <div
                      key={idx}
                      data-testid="active-focus-line-glow"
                      className="active-focus-line-glow absolute left-0 right-0 rounded-md"
                      style={{ top: `${rect.top}px`, height: `${rect.height}px` }}
                    />
                  ))}
                </div>
              )}

              <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                role="textbox"
                aria-multiline="true"
                aria-label="Dictation transcript"
                dir={selectedLanguage.rtl ? 'rtl' : 'ltr'}
                data-readability={readabilityMode ? 'true' : 'false'}
                data-typography={typography}
                data-active-focus={activeFocusEnabled && isSpeaking ? 'true' : 'false'}
                data-placeholder="Start speaking or type directly here..."
                onInput={handleEditorInput}
                className={`dictation-editor relative z-[1] ${
                  focusMode ? 'min-h-[55vh]' : 'min-h-[220px]'
                } ${editorLayoutClass} text-foreground focus:outline-none whitespace-pre-wrap break-words transition-[max-width,line-height,font-size] duration-150`}
              />
            </div>

            {interimText && (
              <p
                aria-live="polite"
                data-testid="interim-transcript-preview"
                style={{ fontFamily: 'var(--font-sans)' }}
                className={`mt-3 text-[15px] leading-relaxed text-muted italic ${
                  readabilityMode ? 'max-w-[58ch] mx-auto' : ''
                }`}
              >
                {autoCorrectEnabled ? autoCorrectText(interimText).text : interimText}
              </p>
            )}
          </div>

          {/* Calm Empty State Helper (hidden in Focus Mode) */}
          {!focusMode && !hasContent && !isListening && (
            <div
              data-print-hide="true"
              className="mt-8 pt-5 border-t border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <p className="text-xs text-muted leading-relaxed max-w-md">
                {isSpeechSupported
                  ? 'Click Start Dictation below and speak naturally. Say “comma”, “full stop”, or “new paragraph” for hands-free formatting.'
                  : 'Live microphone dictation works best in Google Chrome or Edge. You can still type, edit, or preview sample dictation.'}
              </p>
              <button
                type="button"
                onClick={onRunSampleDictation}
                className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3.5 py-1.5 text-xs font-medium text-foreground bg-well hover:bg-well/80 border border-border rounded-control transition-colors whitespace-nowrap shrink-0 self-start sm:self-auto"
              >
                <span>Try sample dictation</span>
              </button>
            </div>
          )}

          {/* Non-intrusive real-time word counter in bottom-right corner */}
          <div data-print-hide="true" className="mt-4 flex justify-end">
            <span
              data-testid="realtime-word-counter"
              aria-live="polite"
              className="text-xs font-mono tabular-nums text-muted select-none"
            >
              {liveMetrics.words} {liveMetrics.words === 1 ? 'word' : 'words'}
            </span>
          </div>
        </div>
      </section>

      {/* Bottom Floating Dictation Dock (collapsed in Focus Mode for distraction-free writing) */}
      {!focusMode && (
        <div data-print-hide="true" className="sticky bottom-3 sm:bottom-5 z-20 max-w-2xl mx-auto mt-5">
          <div className="bg-surface/95 backdrop-blur-md border border-border rounded-2xl shadow-surface px-3 py-2 sm:px-5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
            {tabCapture?.isCapturing ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={tabCapture.stopTabCapture}
                  className="inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 sm:px-5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 bg-danger text-white hover:opacity-90"
                >
                  <Radio className="w-4 h-4 shrink-0 animate-spin" aria-hidden="true" />
                  <span>Stop Tab Capture</span>
                </button>
                <button
                  type="button"
                  onClick={tabCapture.toggleMonitorMute}
                  title={tabCapture.isMonitorMuted ? 'Unmute Tab Audio' : 'Mute Tab Audio'}
                  className="p-2.5 rounded-xl border border-border bg-surface hover:bg-surface-hover text-foreground transition-colors"
                >
                  {tabCapture.isMonitorMuted ? (
                    <VolumeX className="w-4 h-4 text-amber-500" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-primary" />
                  )}
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onToggleListening}
                  className={`inline-flex items-center justify-center gap-2 min-h-[44px] px-3.5 sm:px-5 rounded-xl text-sm font-medium transition-all whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 ${
                    isListening
                      ? 'bg-danger text-white hover:opacity-90 focus-visible:outline-danger'
                      : 'bg-primary text-primary-foreground hover:bg-primary-hover focus-visible:outline-primary'
                  }`}
                >
                  {isListening ? (
                    <>
                      <MicOff className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Stop Listening</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-4 h-4 shrink-0" aria-hidden="true" />
                      <span>Start Dictation</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setTabAudioModalOpen(true)}
                  title="Capture YouTube, Tab, or System Audio"
                  className="inline-flex items-center justify-center gap-1.5 min-h-[44px] px-3 rounded-xl text-xs font-medium border border-border bg-surface hover:bg-surface-hover text-foreground transition-all shrink-0"
                >
                  <Monitor className="w-4 h-4 text-primary shrink-0" />
                  <span className="hidden sm:inline">Tab / YouTube Audio</span>
                </button>
              </div>
            )}

            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <WaveformVisualizer
                isListening={isListening || Boolean(tabCapture?.isCapturing)}
                analyserRef={tabCapture?.isCapturing ? tabCapture.analyserRef : analyserRef}
              />
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs whitespace-nowrap shrink-0">
                <span
                  className={`font-medium ${
                    isListening || tabCapture?.isCapturing ? 'text-danger' : 'text-muted'
                  }`}
                >
                  {tabCapture?.isCapturing
                    ? tabCapture.isTranscribing
                      ? 'Transcribing...'
                      : 'Tab Audio'
                    : isListening
                    ? 'Listening'
                    : 'Ready'}
                </span>
                <span aria-hidden="true" className="text-border">
                  ·
                </span>
                <span className="font-mono tabular-nums text-muted">
                  {formatDuration(
                    tabCapture?.isCapturing ? tabCapture.elapsedSeconds : elapsedSeconds
                  )}
                </span>
              </div>
            </div>

            <span className="hidden sm:inline-block text-xs font-mono text-muted whitespace-nowrap shrink-0">
              Ctrl+M
            </span>
          </div>
        </div>
      )}

      {/* Non-intrusive Analytics Modal */}
      <AnalyticsModal
        open={analyticsOpen}
        content={content}
        theme={theme}
        onClose={() => setAnalyticsOpen(false)}
      />

      {/* Keyboard Shortcuts Modal */}
      {shortcutsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 dark:bg-black/60 backdrop-blur-[2px]"
          onClick={() => setShortcutsOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="shortcuts-modal-title"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-surface border border-border rounded-2xl shadow-surface p-5 sm:p-6"
          >
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-border/60">
              <h2
                id="shortcuts-modal-title"
                className="font-display text-lg font-semibold tracking-tight text-foreground"
              >
                Keyboard Shortcuts
              </h2>
              <button
                type="button"
                onClick={() => setShortcutsOpen(false)}
                aria-label="Close shortcuts"
                className="w-8 h-8 inline-flex items-center justify-center rounded-control text-muted hover:text-foreground hover:bg-well transition-colors"
              >
                <X className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            <ul className="mt-4 space-y-2.5 text-sm">
              {[
                ['Start / Stop Dictation', 'Ctrl + M'],
                ['Save & Auto-Title Note', 'Ctrl + S'],
                ['Find & Replace', 'Ctrl + F'],
                ['Insert Timestamp', 'Ctrl + Shift + T'],
                ['Exit Focus Mode / Close Modal', 'Esc'],
              ].map(([action, keys]) => (
                <li key={action} className="flex items-center justify-between gap-4">
                  <span className="text-foreground/90">{action}</span>
                  <kbd className="px-2 py-0.5 text-xs font-mono bg-well border border-border rounded-control text-muted">
                    {keys}
                  </kbd>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Tab Audio & YouTube Capture Modal */}
      {tabCapture && (
        <TabAudioModal
          open={tabAudioModalOpen}
          tabCapture={tabCapture}
          onClose={() => setTabAudioModalOpen(false)}
          theme={theme}
        />
      )}
    </div>
  );
}
