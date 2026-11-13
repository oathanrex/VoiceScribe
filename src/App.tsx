import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Award, Loader2, Timer, Volume2, X } from 'lucide-react';
import { AudioExportUiState, Header, WorkspaceTab } from './components/Header';
import { StudioView } from './components/StudioView';
import { SavedNotesView } from './components/SavedNotesView';
import { CommandsView } from './components/CommandsView';
import { Footer, LegalSection } from './components/Footer';
import { GuideView } from './components/GuideView';
import { findLanguageById, SpeechLanguage } from './data/languages';
import { useFocusTimer } from './hooks/useFocusTimer';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { suggestNoteTitle } from './utils/autoTitle';
import {
  computeDailyGoalProgress,
  DailyGoalState,
  ensureCurrentDateState,
  markDailyGoalCelebrated,
  recordNoteWordCount,
  shouldCelebrateDailyGoal,
  updateDailyGoalTarget,
} from './utils/dailyGoal';
import {
  isSpeechAudioExportSupported,
  SpeechAudioExportHandle,
  startSpeechAudioExport,
} from './utils/audioExport';
import { EditorFontFamily, resolveFontFamilyCssVar } from './utils/fontFamily';
import { exportDraftAs, ExportFormat } from './utils/exportDraft';
import {
  appendDraftVersion,
  DraftVersionSnapshot,
  shouldRecordAutosaveVersion,
  VersionSource,
} from './utils/versionHistory';
import {
  computeTextMetrics,
  detectPunctuationKeywordInSpeech,
  processDictationSegment,
} from './utils/voiceCommands';
import {
  ActiveDraft,
  loadActiveDraft,
  loadActiveFocusEnabled,
  loadAutoCorrectEnabled,
  loadDailyGoalState,
  loadFontFamilyPreference,
  loadLanguagePreference,
  loadLastSyncedAt,
  loadSavedNotes,
  loadThemePreference,
  loadTypographyPreference,
  loadVersionHistory,
  loadVoiceCommandsEnabled,
  persistActiveDraft,
  persistActiveFocusEnabled,
  persistAutoCorrectEnabled,
  persistDailyGoalState,
  persistFontFamilyPreference,
  persistLanguagePreference,
  persistLastSyncedAt,
  persistSavedNotes,
  persistThemePreference,
  persistTypographyPreference,
  persistVersionHistory,
  persistVoiceCommandsEnabled,
  SavedNote,
  TypographySize,
} from './utils/storage';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>');
}

function plainTextToHtml(text: string): string {
  if (!text) return '';
  return escapeHtml(text);
}

const SAMPLE_SEGMENTS = [
  'Good morning team comma',
  'today we are launching the redesigned VoiceScribe workspace full stop',
  'new paragraph',
  'Notice how clutter is removed comma leaving just the paper canvas and a calm dictation dock at the bottom full stop',
];

export default function App() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('studio');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => loadThemePreference());
  const [languageId, setLanguageId] = useState<string>(() => loadLanguagePreference());
  const [voiceCommandsEnabled, setVoiceCommandsEnabled] = useState<boolean>(() =>
    loadVoiceCommandsEnabled()
  );
  const [autoCorrectEnabled, setAutoCorrectEnabled] = useState<boolean>(() =>
    loadAutoCorrectEnabled()
  );
  const [activeFocusEnabled, setActiveFocusEnabled] = useState<boolean>(() =>
    loadActiveFocusEnabled()
  );
  const [savedNotes, setSavedNotes] = useState<SavedNote[]>(() => loadSavedNotes());
  const [draft, setDraft] = useState<ActiveDraft>(() => loadActiveDraft());
  const [versionHistory, setVersionHistory] = useState<DraftVersionSnapshot[]>(() =>
    loadVersionHistory()
  );
  const [dailyGoal, setDailyGoal] = useState<DailyGoalState>(() =>
    loadDailyGoalState(savedNotes, {
      id: draft.id,
      wordCount: computeTextMetrics(draft.content).words,
    })
  );
  const [celebrationToast, setCelebrationToast] = useState<{
    wordsToday: number;
    targetWords: number;
  } | null>(null);
  const [focusToastMinutes, setFocusToastMinutes] = useState<number | null>(null);
  const [lastCommandLabel, setLastCommandLabel] = useState<string | null>(null);
  const [lastAutoCorrection, setLastAutoCorrection] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState<boolean>(false);
  const [readabilityMode, setReadabilityMode] = useState<boolean>(false);
  const [typography, setTypography] = useState<TypographySize>(() => loadTypographyPreference());
  const [fontFamily, setFontFamily] = useState<EditorFontFamily>(() =>
    loadFontFamilyPreference()
  );
  const [guideSection, setGuideSection] = useState<LegalSection>('article');
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved'>('saved');
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(() => loadLastSyncedAt());
  const [audioExportState, setAudioExportState] = useState<AudioExportUiState>({ status: 'idle' });
  const [audioExportToast, setAudioExportToast] = useState<{
    kind: 'info' | 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  const focusTimer = useFocusTimer((completedMins) => {
    setFocusToastMinutes(completedMins);
  });

  const isFirstMountRef = useRef(true);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  const savedNotesRef = useRef(savedNotes);
  savedNotesRef.current = savedNotes;

  const versionHistoryRef = useRef(versionHistory);
  versionHistoryRef.current = versionHistory;

  const languageIdRef = useRef(languageId);
  languageIdRef.current = languageId;

  const dailyGoalRef = useRef(dailyGoal);
  dailyGoalRef.current = dailyGoal;

  const voiceCommandsRef = useRef(voiceCommandsEnabled);
  voiceCommandsRef.current = voiceCommandsEnabled;

  const autoCorrectRef = useRef(autoCorrectEnabled);
  autoCorrectRef.current = autoCorrectEnabled;

  const sampleTimersRef = useRef<number[]>([]);
  const commandIndicatorTimerRef = useRef<number | null>(null);
  const autoCorrectTimerRef = useRef<number | null>(null);
  const audioExportHandleRef = useRef<SpeechAudioExportHandle | null>(null);

  const selectedLanguage = useMemo(() => findLanguageById(languageId), [languageId]);
  const dailyGoalProgress = useMemo(() => computeDailyGoalProgress(dailyGoal), [dailyGoal]);
  const audioExportSupported = useMemo(() => isSpeechAudioExportSupported(), []);

  const recordDraftVersion = useCallback(
    (targetDraft: ActiveDraft, source: VersionSource, force = false) => {
      if (!targetDraft.content.trim() && !targetDraft.title.trim()) {
        return;
      }
      const prevHistory = versionHistoryRef.current;
      if (!force && !shouldRecordAutosaveVersion(prevHistory[0], targetDraft)) {
        return;
      }
      const next = appendDraftVersion(prevHistory, targetDraft, { source });
      if (next !== prevHistory) {
        versionHistoryRef.current = next;
        persistVersionHistory(next);
        setVersionHistory(next);
      }
    },
    []
  );

  const markSyncedNow = useCallback((at: number = Date.now()) => {
    persistLastSyncedAt(at);
    setLastSyncedAt(at);
  }, []);

  // Apply Tailwind v4 `.dark` class and `data-theme="dark"` attribute cleanly on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.removeAttribute('data-theme');
    }
    persistThemePreference(theme);
  }, [theme]);

  // Update --font-sans CSS variable cleanly for the editor and persist selection
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--font-sans',
      resolveFontFamilyCssVar(fontFamily)
    );
    persistFontFamilyPreference(fontFamily);
  }, [fontFamily]);

  // Persist active draft with explicit Saving... -> Saved feedback and record throttled version snapshot
  useEffect(() => {
    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      persistActiveDraft(draft);
      return;
    }
    setSaveStatus('saving');
    const timerId = window.setTimeout(() => {
      persistActiveDraft(draft);
      recordDraftVersion(draft, 'autosave', false);
      markSyncedNow();
      setSaveStatus('saved');
    }, 300);
    return () => window.clearTimeout(timerId);
  }, [draft, markSyncedNow, recordDraftVersion]);

  // Update daily word count progress whenever active draft content changes
  useEffect(() => {
    const currentWords = computeTextMetrics(draft.content).words;
    const prev = dailyGoalRef.current;
    const rolled = ensureCurrentDateState(prev, savedNotesRef.current, {
      id: draft.id,
      wordCount: currentWords,
    });
    let next = recordNoteWordCount(rolled, draft.id, currentWords);
    if (shouldCelebrateDailyGoal(next)) {
      const progress = computeDailyGoalProgress(next);
      setCelebrationToast({
        wordsToday: progress.wordsToday,
        targetWords: progress.targetWords,
      });
      next = markDailyGoalCelebrated(next);
    }
    if (next !== prev) {
      dailyGoalRef.current = next;
      persistDailyGoalState(next);
      setDailyGoal(next);
    }
  }, [draft.id, draft.content]);

  // Auto-dismiss celebration toast after 6 seconds
  useEffect(() => {
    if (!celebrationToast) return;
    const timerId = window.setTimeout(() => {
      setCelebrationToast(null);
    }, 6000);
    return () => window.clearTimeout(timerId);
  }, [celebrationToast]);

  // Auto-dismiss audio export feedback toast after 5.5 seconds
  useEffect(() => {
    if (!audioExportToast || audioExportState.status !== 'idle') return;
    const timerId = window.setTimeout(() => {
      setAudioExportToast(null);
    }, 5500);
    return () => window.clearTimeout(timerId);
  }, [audioExportState.status, audioExportToast]);

  const upsertNoteIntoLibrary = useCallback(
    (targetDraft: ActiveDraft, langId: string, applyAutoTitle: boolean): ActiveDraft => {
      if (!targetDraft.content.trim() && !targetDraft.title.trim()) {
        return targetDraft;
      }

      const resolvedTitle =
        targetDraft.title.trim() || suggestNoteTitle(targetDraft.content);
      const resolvedDraft: ActiveDraft =
        applyAutoTitle && !targetDraft.title.trim() && resolvedTitle
          ? { ...targetDraft, title: resolvedTitle }
          : targetDraft;

      const wordCount = computeTextMetrics(resolvedDraft.content).words;
      setSavedNotes((prev) => {
        const existing = prev.find((n) => n.id === resolvedDraft.id);
        const nextEntry: SavedNote = {
          id: resolvedDraft.id,
          title: resolvedDraft.title,
          content: resolvedDraft.content,
          htmlContent: resolvedDraft.htmlContent,
          languageId: langId,
          updatedAt: Date.now(),
          wordCount,
          pinned: existing?.pinned,
        };
        const updated = existing
          ? prev.map((n) => (n.id === resolvedDraft.id ? nextEntry : n))
          : [nextEntry, ...prev];
        persistSavedNotes(updated);
        return updated;
      });

      return resolvedDraft;
    },
    []
  );

  // Auto-title and persist untitled non-empty draft if user leaves or refreshes the page
  useEffect(() => {
    const persistWithAutoTitleOnLeave = () => {
      const current = draftRef.current;
      if (!current.content.trim()) return;
      const suggested = current.title.trim() || suggestNoteTitle(current.content);
      if (!suggested) return;

      const resolved: ActiveDraft = current.title.trim()
        ? current
        : { ...current, title: suggested };

      const prevNotes = savedNotesRef.current;
      const existing = prevNotes.find((n) => n.id === resolved.id);
      const isAlreadySavedIdentically =
        resolved === current &&
        Boolean(existing) &&
        existing?.title === resolved.title &&
        existing?.content === resolved.content &&
        existing?.htmlContent === resolved.htmlContent;

      if (isAlreadySavedIdentically) {
        return;
      }

      persistActiveDraft(resolved);

      const wordCount = computeTextMetrics(resolved.content).words;
      const nextEntry: SavedNote = {
        id: resolved.id,
        title: resolved.title,
        content: resolved.content,
        htmlContent: resolved.htmlContent,
        languageId: languageIdRef.current,
        updatedAt: Date.now(),
        wordCount,
        pinned: existing?.pinned,
      };
      const updated = existing
        ? prevNotes.map((n) => (n.id === resolved.id ? nextEntry : n))
        : [nextEntry, ...prevNotes];
      persistSavedNotes(updated);
      persistLastSyncedAt(Date.now());
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistWithAutoTitleOnLeave();
      }
    };

    window.addEventListener('beforeunload', persistWithAutoTitleOnLeave);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('beforeunload', persistWithAutoTitleOnLeave);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const tts = useTextToSpeech();

  const stopListeningRef = useRef<() => void>(() => {});

  const handleFinalTranscript = useCallback((rawSegment: string) => {
    const current = draftRef.current;
    const result = processDictationSegment(
      rawSegment,
      current.content,
      voiceCommandsRef.current,
      autoCorrectRef.current
    );

    if (result.matchedCommand) {
      setLastCommandLabel(result.matchedCommand);
      if (commandIndicatorTimerRef.current !== null) {
        window.clearTimeout(commandIndicatorTimerRef.current);
      }
      commandIndicatorTimerRef.current = window.setTimeout(() => {
        setLastCommandLabel(null);
        commandIndicatorTimerRef.current = null;
      }, 2200);
    }

    if (result.autoCorrections && result.autoCorrections.length > 0) {
      const first = result.autoCorrections[0];
      const summary =
        result.autoCorrections.length === 1
          ? `Fixed: ${first.from} → ${first.to}`
          : `Auto-fixed ${result.autoCorrections.length} edits`;
      setLastAutoCorrection(summary);
      if (autoCorrectTimerRef.current !== null) {
        window.clearTimeout(autoCorrectTimerRef.current);
      }
      autoCorrectTimerRef.current = window.setTimeout(() => {
        setLastAutoCorrection(null);
        autoCorrectTimerRef.current = null;
      }, 2400);
    }

    if (result.action === 'stop') {
      stopListeningRef.current();
      return;
    }

    if (result.action === 'clear') {
      setDraft((prev) => ({ ...prev, content: '', htmlContent: '' }));
      return;
    }

    if (result.action === 'copy') {
      if (current.content.trim()) {
        navigator.clipboard?.writeText(current.content).catch(() => {});
      }
      return;
    }

    if (!result.textToAppend) return;

    setDraft((prev) => {
      const nextContent = prev.content + result.textToAppend;
      const appendedHtml = escapeHtml(result.textToAppend);
      const nextHtml = prev.htmlContent ? prev.htmlContent + appendedHtml : appendedHtml;
      return {
        ...prev,
        content: nextContent,
        htmlContent: nextHtml,
      };
    });
  }, []);

  const recognition = useSpeechRecognition({
    languageCode: selectedLanguage.code,
    onFinalTranscript: handleFinalTranscript,
  });

  stopListeningRef.current = recognition.stopListening;

  const toggleListening = useCallback(() => {
    if (recognition.isListening) {
      recognition.stopListening();
    } else {
      void recognition.startListening();
    }
  }, [recognition]);

  const handleSaveNote = useCallback(() => {
    const resolved = upsertNoteIntoLibrary(draftRef.current, languageIdRef.current, true);
    if (resolved !== draftRef.current) {
      setDraft(resolved);
    } else {
      persistActiveDraft(resolved);
    }
    recordDraftVersion(resolved, 'manual', true);
    markSyncedNow();
    setSaveStatus('saved');
  }, [markSyncedNow, recordDraftVersion, upsertNoteIntoLibrary]);

  // Global Ctrl+M / Cmd+M (dictation) & Ctrl+S / Cmd+S (save + auto-title) shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'm') {
        e.preventDefault();
        toggleListening();
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSaveNote();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveNote, toggleListening]);

  // Cleanup sample, command, auto-correct timers & any active audio export on unmount
  useEffect(() => {
    return () => {
      sampleTimersRef.current.forEach((id) => window.clearTimeout(id));
      if (commandIndicatorTimerRef.current !== null) {
        window.clearTimeout(commandIndicatorTimerRef.current);
      }
      if (autoCorrectTimerRef.current !== null) {
        window.clearTimeout(autoCorrectTimerRef.current);
      }
      audioExportHandleRef.current?.cancel();
      audioExportHandleRef.current = null;
    };
  }, []);

  const handleNewNote = useCallback(() => {
    sampleTimersRef.current.forEach((id) => window.clearTimeout(id));
    sampleTimersRef.current = [];
    if (recognition.isListening) {
      recognition.stopListening();
    }
    tts.stop();
    const resolved = upsertNoteIntoLibrary(draftRef.current, languageId, true);
    recordDraftVersion(resolved, 'autosave', true);
    const fresh: ActiveDraft = {
      id: `note-${Date.now()}`,
      title: '',
      content: '',
      htmlContent: '',
    };
    setDraft(fresh);
    setActiveTab('studio');
  }, [languageId, recognition, recordDraftVersion, tts, upsertNoteIntoLibrary]);

  const handleOpenSavedNote = useCallback(
    (note: SavedNote) => {
      if (recognition.isListening) {
        recognition.stopListening();
      }
      tts.stop();
      const resolved = upsertNoteIntoLibrary(draftRef.current, languageId, true);
      recordDraftVersion(resolved, 'autosave', true);
      setLanguageId(note.languageId);
      persistLanguagePreference(note.languageId);
      setDraft({
        id: note.id,
        title: note.title,
        content: note.content,
        htmlContent: note.htmlContent || plainTextToHtml(note.content),
      });
      setActiveTab('studio');
    },
    [languageId, recognition, recordDraftVersion, tts, upsertNoteIntoLibrary]
  );

  const handleRestoreVersion = useCallback(
    (snapshot: DraftVersionSnapshot) => {
      sampleTimersRef.current.forEach((id) => window.clearTimeout(id));
      sampleTimersRef.current = [];
      if (recognition.isListening) {
        recognition.stopListening();
      }
      tts.stop();

      // Protect current unsaved edits in history before overwriting active draft
      recordDraftVersion(draftRef.current, 'restore', true);

      const restored: ActiveDraft = {
        id: snapshot.noteId || draftRef.current.id,
        title: snapshot.title,
        content: snapshot.content,
        htmlContent: snapshot.htmlContent || plainTextToHtml(snapshot.content),
      };
      persistActiveDraft(restored);
      setDraft(restored);
      markSyncedNow();
      setSaveStatus('saved');
      setActiveTab('studio');
    },
    [markSyncedNow, recognition, recordDraftVersion, tts]
  );

  const handleDeleteSavedNote = useCallback((noteId: string) => {
    setSavedNotes((prev) => {
      const updated = prev.filter((n) => n.id !== noteId);
      persistSavedNotes(updated);
      return updated;
    });
    // Prevent deleted active note from silently resurrecting when user switches tabs later
    if (noteId === draftRef.current.id) {
      const fresh: ActiveDraft = {
        id: `note-${Date.now()}`,
        title: '',
        content: '',
        htmlContent: '',
      };
      setDraft(fresh);
      persistActiveDraft(fresh);
    }
    markSyncedNow();
  }, [markSyncedNow]);

  const handleTogglePinNote = useCallback((noteId: string) => {
    setSavedNotes((prev) => {
      const updated = prev.map((n) => (n.id === noteId ? { ...n, pinned: !n.pinned } : n));
      persistSavedNotes(updated);
      return updated;
    });
    markSyncedNow();
  }, [markSyncedNow]);

  const handleDuplicateNote = useCallback((noteId: string) => {
    setSavedNotes((prev) => {
      const source = prev.find((n) => n.id === noteId);
      if (!source) return prev;
      const copy: SavedNote = {
        ...source,
        id: `note-${Date.now()}`,
        title: `${source.title.trim() || 'Untitled note'} (Copy)`,
        updatedAt: Date.now(),
        pinned: false,
      };
      const updated = [copy, ...prev];
      persistSavedNotes(updated);
      return updated;
    });
    markSyncedNow();
  }, [markSyncedNow]);

  const handleImportDraft = useCallback(
    (importedTitle: string, importedContent: string) => {
      const resolved = upsertNoteIntoLibrary(draftRef.current, languageIdRef.current, true);
      recordDraftVersion(resolved, 'autosave', true);
      const next: ActiveDraft = {
        id: `note-${Date.now()}`,
        title: importedTitle,
        content: importedContent,
        htmlContent: plainTextToHtml(importedContent),
      };
      setDraft(next);
    },
    [recordDraftVersion, upsertNoteIntoLibrary]
  );

  const handleChangeTypography = useCallback((size: TypographySize) => {
    setTypography(size);
    persistTypographyPreference(size);
  }, []);

  const handleChangeFontFamily = useCallback((family: EditorFontFamily) => {
    setFontFamily(family);
  }, []);

  const handleSelectLanguage = useCallback((lang: SpeechLanguage) => {
    setLanguageId(lang.id);
    persistLanguagePreference(lang.id);
  }, []);

  const handleToggleVoiceCommands = useCallback(() => {
    setVoiceCommandsEnabled((prev) => {
      const next = !prev;
      persistVoiceCommandsEnabled(next);
      return next;
    });
  }, []);

  const handleToggleAutoCorrect = useCallback(() => {
    setAutoCorrectEnabled((prev) => {
      const next = !prev;
      persistAutoCorrectEnabled(next);
      return next;
    });
  }, []);

  const handleToggleActiveFocus = useCallback(() => {
    setActiveFocusEnabled((prev) => {
      const next = !prev;
      persistActiveFocusEnabled(next);
      return next;
    });
  }, []);

  const handleRunSampleDictation = useCallback(() => {
    sampleTimersRef.current.forEach((id) => window.clearTimeout(id));
    sampleTimersRef.current = [];
    SAMPLE_SEGMENTS.forEach((seg, index) => {
      const timerId = window.setTimeout(() => {
        handleFinalTranscript(seg);
      }, index * 220);
      sampleTimersRef.current.push(timerId);
    });
  }, [handleFinalTranscript]);

  const handleInsertToken = useCallback((token: string) => {
    setDraft((prev) => {
      const nextContent = prev.content + token;
      const nextHtml = prev.htmlContent + escapeHtml(token);
      return { ...prev, content: nextContent, htmlContent: nextHtml };
    });
    setActiveTab('studio');
  }, []);

  const handleClearNote = useCallback(() => {
    sampleTimersRef.current.forEach((id) => window.clearTimeout(id));
    sampleTimersRef.current = [];
    tts.stop();
    setDraft((prev) => ({
      ...prev,
      title: '',
      content: '',
      htmlContent: '',
    }));
  }, [tts]);

  const handleTabChange = useCallback(
    (tab: WorkspaceTab) => {
      if (activeTab === 'studio' && tab !== 'studio') {
        const resolved = upsertNoteIntoLibrary(draftRef.current, languageId, true);
        recordDraftVersion(resolved, 'autosave', true);
        if (resolved !== draftRef.current) {
          setDraft(resolved);
        }
      }
      setFocusMode(false);
      setActiveTab(tab);
    },
    [activeTab, languageId, recordDraftVersion, upsertNoteIntoLibrary]
  );

  const handleExport = useCallback(
    (format: ExportFormat) => {
      const resolved = upsertNoteIntoLibrary(draftRef.current, languageIdRef.current, true);
      recordDraftVersion(resolved, 'autosave', true);
      if (resolved !== draftRef.current) {
        setDraft(resolved);
      }
      exportDraftAs(format, resolved.title, resolved.htmlContent, resolved.content);
    },
    [recordDraftVersion, upsertNoteIntoLibrary]
  );

  const handleCancelAudioExport = useCallback(() => {
    audioExportHandleRef.current?.cancel();
  }, []);

  const handleExportAudio = useCallback(async () => {
    if (audioExportHandleRef.current) {
      audioExportHandleRef.current.cancel();
      return;
    }

    if (recognition.isListening) {
      recognition.stopListening();
    }
    tts.stop();

    const resolved = upsertNoteIntoLibrary(draftRef.current, languageIdRef.current, true);
    recordDraftVersion(resolved, 'autosave', true);
    if (resolved !== draftRef.current) {
      setDraft(resolved);
    }

    setAudioExportToast(null);
    setAudioExportState({
      status: 'preparing',
      progressLabel: 'Share tab audio in browser prompt...',
    });

    const handle = startSpeechAudioExport({
      title: resolved.title,
      content: resolved.content,
      languageCode: selectedLanguage.code,
      rate: tts.rate,
      onStateChange: (progress) => {
        if (progress.status === 'preparing') {
          setAudioExportState({
            status: 'preparing',
            progressLabel: 'Share tab audio in browser prompt...',
          });
        } else {
          const partLabel =
            progress.totalChunks && progress.totalChunks > 1
              ? `Speaking part ${progress.chunkIndex}/${progress.totalChunks}...`
              : 'Speaking & recording audio...';
          setAudioExportState({
            status: 'recording',
            progressLabel: partLabel,
          });
        }
      },
    });

    audioExportHandleRef.current = handle;

    try {
      const result = await handle.promise;
      if (audioExportHandleRef.current === handle) {
        audioExportHandleRef.current = null;
      }
      setAudioExportState({ status: 'idle' });

      if (result.status === 'saved') {
        setAudioExportToast({
          kind: 'success',
          title: 'Audio exported',
          message: `Saved ${result.filename}`,
        });
      } else if (result.status === 'cancelled') {
        setAudioExportToast({
          kind: 'info',
          title: 'Audio export cancelled',
          message: result.message,
        });
      } else if (result.status === 'no-audio-track') {
        setAudioExportToast({
          kind: 'info',
          title: 'Tab audio not shared',
          message: result.message,
        });
      } else {
        setAudioExportToast({
          kind: result.status === 'error' ? 'error' : 'info',
          title:
            result.status === 'unsupported'
              ? 'Browser unsupported'
              : result.status === 'empty'
                ? 'Nothing to speak'
                : 'Audio export failed',
          message: result.message,
        });
      }
    } catch {
      if (audioExportHandleRef.current === handle) {
        audioExportHandleRef.current = null;
      }
      setAudioExportState({ status: 'idle' });
      setAudioExportToast({
        kind: 'error',
        title: 'Audio export failed',
        message: 'Unexpected error while saving spoken audio.',
      });
    }
  }, [recognition, recordDraftVersion, selectedLanguage.code, tts, upsertNoteIntoLibrary]);

  const handleUpdateDailyGoalTarget = useCallback((nextTarget: number) => {
    const prev = dailyGoalRef.current;
    let next = updateDailyGoalTarget(prev, nextTarget);
    if (shouldCelebrateDailyGoal(next)) {
      const progress = computeDailyGoalProgress(next);
      setCelebrationToast({
        wordsToday: progress.wordsToday,
        targetWords: progress.targetWords,
      });
      next = markDailyGoalCelebrated(next);
    }
    dailyGoalRef.current = next;
    persistDailyGoalState(next);
    setDailyGoal(next);
  }, []);

  const canExport = Boolean(draft.content.trim() || draft.title.trim());

  const handleNavigateGuide = useCallback(
    (section: LegalSection) => {
      if (activeTab === 'studio') {
        const resolved = upsertNoteIntoLibrary(draftRef.current, languageId, true);
        recordDraftVersion(resolved, 'autosave', true);
        if (resolved !== draftRef.current) {
          setDraft(resolved);
        }
      }
      setGuideSection(section);
      setFocusMode(false);
      setActiveTab('guide');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [activeTab, languageId, recordDraftVersion, upsertNoteIntoLibrary]
  );

  const interimPunctuationLabel =
    voiceCommandsEnabled && recognition.isListening
      ? detectPunctuationKeywordInSpeech(recognition.interimText)
      : null;

  const punctuationStatus = useMemo(
    () => ({
      active: voiceCommandsEnabled && (recognition.isListening || Boolean(lastCommandLabel)),
      processingLabel: interimPunctuationLabel || lastCommandLabel,
    }),
    [interimPunctuationLabel, lastCommandLabel, recognition.isListening, voiceCommandsEnabled]
  );

  const isFocusActive = focusMode && activeTab === 'studio';

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      {!isFocusActive && (
        <Header
          activeTab={activeTab}
          onTabChange={handleTabChange}
          onNewNote={handleNewNote}
          onExport={handleExport}
          onExportAudio={handleExportAudio}
          onCancelAudioExport={handleCancelAudioExport}
          audioExportSupported={audioExportSupported}
          audioExportState={audioExportState}
          canExport={canExport}
          notesCount={savedNotes.length}
          focusTimer={focusTimer}
          punctuationStatus={punctuationStatus}
          saveStatus={saveStatus}
          lastSyncedAt={lastSyncedAt}
        />
      )}

      <main className="flex-1">
        {activeTab === 'studio' && (
          <StudioView
            noteId={draft.id}
            title={draft.title}
            content={draft.content}
            htmlContent={draft.htmlContent}
            selectedLanguage={selectedLanguage}
            voiceCommandsEnabled={voiceCommandsEnabled}
            autoCorrectEnabled={autoCorrectEnabled}
            focusMode={focusMode}
            readabilityMode={readabilityMode}
            typography={typography}
            fontFamily={fontFamily}
            focusTimer={focusTimer}
            isListening={recognition.isListening}
            isSpeechSupported={recognition.isSupported}
            interimText={recognition.interimText}
            speechError={recognition.error}
            elapsedSeconds={recognition.elapsedSeconds}
            analyserRef={recognition.analyserRef}
            lastCommandLabel={lastCommandLabel}
            lastAutoCorrection={lastAutoCorrection}
            isSpeaking={tts.isSpeaking}
            isTtsSupported={tts.isSupported}
            ttsRate={tts.rate}
            activeFocusEnabled={activeFocusEnabled}
            activeSpeechSegment={tts.activeSegment}
            totalSpeechSegments={tts.totalSegments}
            theme={theme}
            saveStatus={saveStatus}
            lastSyncedAt={lastSyncedAt}
            onTitleChange={(title) => setDraft((prev) => ({ ...prev, title }))}
            onContentChange={(content, htmlContent) =>
              setDraft((prev) => ({ ...prev, content, htmlContent }))
            }
            onImportDraft={handleImportDraft}
            onSelectLanguage={handleSelectLanguage}
            onToggleVoiceCommands={handleToggleVoiceCommands}
            onToggleAutoCorrect={handleToggleAutoCorrect}
            onToggleFocusMode={() => setFocusMode((prev) => !prev)}
            onToggleReadabilityMode={() => setReadabilityMode((prev) => !prev)}
            onToggleActiveFocus={handleToggleActiveFocus}
            onChangeTypography={handleChangeTypography}
            onChangeFontFamily={handleChangeFontFamily}
            onToggleListening={toggleListening}
            onDismissError={recognition.clearError}
            onRunSampleDictation={handleRunSampleDictation}
            onToggleTts={() => {
              if (tts.isSpeaking) {
                tts.stop();
              } else {
                tts.speak(draft.content, selectedLanguage.code);
              }
            }}
            onStopTts={tts.stop}
            onCycleTtsRate={() => {
              const rates = [0.9, 1, 1.25, 1.5];
              const next = rates[(rates.indexOf(tts.rate) + 1) % rates.length];
              tts.setRate(next);
            }}
            onClearNote={handleClearNote}
            onSaveNote={handleSaveNote}
            onToggleTheme={() => setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))}
          />
        )}

        {activeTab === 'notes' && (
          <SavedNotesView
            notes={savedNotes}
            activeNoteId={draft.id}
            versionHistory={versionHistory}
            onOpenNote={handleOpenSavedNote}
            onDeleteNote={handleDeleteSavedNote}
            onTogglePinNote={handleTogglePinNote}
            onDuplicateNote={handleDuplicateNote}
            onRestoreVersion={handleRestoreVersion}
            onCreateNewNote={handleNewNote}
          />
        )}

        {activeTab === 'commands' && <CommandsView onInsertToken={handleInsertToken} />}

        {activeTab === 'guide' && (
          <GuideView
            section={guideSection}
            onSectionChange={setGuideSection}
            onBackToStudio={() => setActiveTab('studio')}
          />
        )}
      </main>

      {/* Celebration Toast when daily word goal target is reached */}
      {celebrationToast && (
        <div
          role="status"
          aria-live="polite"
          data-testid="goal-celebration-toast"
          className="fixed bottom-24 right-4 sm:right-6 z-50 max-w-sm bg-surface border border-primary/40 rounded-card shadow-surface px-4 py-3 flex items-start gap-3"
        >
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-control bg-accent-soft text-primary flex items-center justify-center shrink-0 mt-0.5"
          >
            <Award className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Daily goal reached!</p>
            <p className="mt-0.5 text-xs text-muted tabular-nums">
              {celebrationToast.wordsToday} / {celebrationToast.targetWords} words written today.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setCelebrationToast(null)}
            aria-label="Dismiss goal celebration"
            className="p-1 text-muted hover:text-foreground hover:bg-well rounded-control shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Focus Timer Completion Toast */}
      {focusToastMinutes !== null && (
        <div
          role="status"
          aria-live="polite"
          data-testid="focus-timer-toast"
          className={`fixed ${
            celebrationToast ? 'bottom-44' : 'bottom-24'
          } right-4 sm:right-6 z-50 max-w-sm bg-surface border border-primary/40 rounded-card shadow-surface px-4 py-3 flex items-start gap-3`}
        >
          <span
            aria-hidden="true"
            className="w-8 h-8 rounded-control bg-accent-soft text-primary flex items-center justify-center shrink-0 mt-0.5"
          >
            <Timer className="w-4 h-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Focus session complete</p>
            <p className="mt-0.5 text-xs text-muted tabular-nums">
              Finished your {focusToastMinutes}-minute deep work block.
            </p>
            <div className="mt-2 flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setFocusToastMinutes(null);
                  focusTimer.reset();
                  focusTimer.start();
                }}
                className="px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground hover:bg-primary-hover rounded-control transition-colors"
              >
                Start another
              </button>
              <button
                type="button"
                onClick={() => {
                  setFocusToastMinutes(null);
                  focusTimer.dismissCompleted();
                }}
                className="px-2.5 py-1 text-xs font-medium text-muted hover:text-foreground hover:bg-well rounded-control transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setFocusToastMinutes(null);
              focusTimer.dismissCompleted();
            }}
            aria-label="Close focus session alert"
            className="p-1 text-muted hover:text-foreground hover:bg-well rounded-control shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* Audio Export Progress & Feedback Toast */}
      {(audioExportState.status !== 'idle' || audioExportToast) && (
        <div
          role={audioExportToast?.kind === 'error' ? 'alert' : 'status'}
          aria-live="polite"
          data-testid="audio-export-toast"
          className={`fixed ${
            celebrationToast || focusToastMinutes !== null ? 'bottom-44' : 'bottom-24'
          } right-4 sm:right-6 z-50 max-w-sm bg-surface border ${
            audioExportToast?.kind === 'error' ? 'border-danger/50' : 'border-primary/40'
          } rounded-card shadow-surface px-4 py-3 flex items-start gap-3`}
        >
          <span
            aria-hidden="true"
            className={`w-8 h-8 rounded-control flex items-center justify-center shrink-0 mt-0.5 ${
              audioExportToast?.kind === 'error'
                ? 'bg-danger-soft text-danger'
                : 'bg-accent-soft text-primary'
            }`}
          >
            {audioExportState.status !== 'idle' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            {audioExportState.status !== 'idle' ? (
              <>
                <p className="text-sm font-semibold text-foreground">Exporting speech audio</p>
                <p className="mt-0.5 text-xs text-muted">
                  {audioExportState.progressLabel || 'Recording spoken draft...'}
                </p>
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleCancelAudioExport}
                    className="px-2.5 py-1 text-xs font-medium text-foreground bg-well hover:bg-border/60 rounded-control transition-colors"
                  >
                    Cancel export
                  </button>
                </div>
              </>
            ) : (
              audioExportToast && (
                <>
                  <p className="text-sm font-semibold text-foreground">{audioExportToast.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{audioExportToast.message}</p>
                </>
              )
            )}
          </div>
          {audioExportState.status === 'idle' && audioExportToast && (
            <button
              type="button"
              onClick={() => setAudioExportToast(null)}
              aria-label="Dismiss audio export notice"
              className="p-1 text-muted hover:text-foreground hover:bg-well rounded-control shrink-0"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      )}

      {!isFocusActive && (
        <Footer
          dailyGoalProgress={dailyGoalProgress}
          onUpdateDailyGoalTarget={handleUpdateDailyGoalTarget}
          onNavigateGuide={handleNavigateGuide}
        />
      )}
    </div>
  );
}
