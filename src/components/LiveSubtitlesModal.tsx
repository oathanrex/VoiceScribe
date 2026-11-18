import React, { useState, useEffect, useRef } from 'react';
import {
  Subtitles,
  Users,
  Volume2,
  Mic,
  MicOff,
  Copy,
  FileText,
  X,
  ArrowRightLeft,
  Sparkles,
  Check,
  Maximize2,
  Minimize2,
  Radio,
  Trash2,
  Languages,
} from 'lucide-react';
import {
  POPULAR_TARGET_LANGUAGES,
  translateText,
} from '../utils/translator';
import { SPEECH_LANGUAGES, SpeechLanguage } from '../data/languages';

interface LiveSubtitlesModalProps {
  open: boolean;
  onClose: () => void;
  selectedLanguage: SpeechLanguage;
  onSelectLanguage?: (lang: SpeechLanguage) => void;
  interimText: string;
  isListening: boolean;
  onToggleListening: () => void;
  onAppendToDraft: (text: string) => void;
  onSpeakText?: (text: string, langCode: string) => void;
  theme: 'light' | 'dark';
}

type Mode = 'subtitles' | 'conversation';

interface ConversationTurn {
  id: string;
  speaker: 1 | 2;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
}

export const LiveSubtitlesModal: React.FC<LiveSubtitlesModalProps> = ({
  open,
  onClose,
  selectedLanguage,
  onSelectLanguage,
  interimText,
  isListening,
  onToggleListening,
  onAppendToDraft,
  onSpeakText,
}) => {
  const [mode, setMode] = useState<Mode>('subtitles');
  const [targetLangCode, setTargetLangCode] = useState('hi');
  const [translatedInterim, setTranslatedInterim] = useState('');
  const [persistentTranscript, setPersistentTranscript] = useState('');
  const [persistentTranslation, setPersistentTranslation] = useState('');
  const [subtitleSize, setSubtitleSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [copiedSource, setCopiedSource] = useState(false);
  const [copiedSubtitle, setCopiedSubtitle] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Conversation Mode State
  const [speaker1Lang, setSpeaker1Lang] = useState(selectedLanguage.code.split('-')[0]);
  const [speaker2Lang, setSpeaker2Lang] = useState('en');
  const [activeSpeaker, setActiveSpeaker] = useState<1 | 2>(1);
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [conversationInput, setConversationInput] = useState('');
  const [isTranslatingConv, setIsTranslatingConv] = useState(false);
  const [copiedAllConv, setCopiedAllConv] = useState(false);

  const debounceTimerRef = useRef<number | null>(null);

  // Update persistent transcript when new interimText arrives
  useEffect(() => {
    if (interimText && interimText.trim()) {
      setPersistentTranscript(interimText);
    }
  }, [interimText]);

  // Live translation of interim speech for live subtitles studio
  useEffect(() => {
    const textToTranslate = interimText?.trim() || persistentTranscript.trim();
    if (!textToTranslate) {
      setTranslatedInterim('');
      return;
    }

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await translateText(
          textToTranslate,
          selectedLanguage.code,
          targetLangCode
        );
        setTranslatedInterim(res);
        if (res) {
          setPersistentTranslation(res);
        }
      } catch {
        setTranslatedInterim('');
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [interimText, persistentTranscript, selectedLanguage.code, targetLangCode]);

  // Escape key closes modal
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Swap spoken and target language
  const handleSwapLanguages = () => {
    const currentSourceCode = selectedLanguage.code.split('-')[0].toLowerCase();
    const currentTargetCode = targetLangCode;

    // Find speech language for target
    const newSpoken = SPEECH_LANGUAGES.find(
      (l) => l.code.toLowerCase().startsWith(currentTargetCode) || l.id.toLowerCase() === currentTargetCode
    ) || selectedLanguage;

    if (onSelectLanguage) {
      onSelectLanguage(newSpoken);
    }
    setTargetLangCode(currentSourceCode);

    // Swap texts
    const tempT = persistentTranscript;
    setPersistentTranscript(persistentTranslation);
    setPersistentTranslation(tempT);
    setTranslatedInterim(tempT);
  };

  const handleCopySource = () => {
    const text = persistentTranscript || interimText;
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2000);
    });
  };

  const handleCopySubtitle = () => {
    const text = translatedInterim || persistentTranslation;
    if (!text) return;
    navigator.clipboard?.writeText(text).then(() => {
      setCopiedSubtitle(true);
      setTimeout(() => setCopiedSubtitle(false), 2000);
    });
  };

  const handleClearTranscript = () => {
    setPersistentTranscript('');
    setPersistentTranslation('');
    setTranslatedInterim('');
  };

  const handleSendConversationMessage = async () => {
    const text = conversationInput.trim();
    if (!text) return;

    setIsTranslatingConv(true);
    const src = activeSpeaker === 1 ? speaker1Lang : speaker2Lang;
    const tgt = activeSpeaker === 1 ? speaker2Lang : speaker1Lang;

    try {
      const translated = await translateText(text, src, tgt);
      const newTurn: ConversationTurn = {
        id: String(Date.now()),
        speaker: activeSpeaker,
        originalText: text,
        translatedText: translated,
        sourceLang: src,
        targetLang: tgt,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setConversationHistory((prev) => [...prev, newTurn]);
      setConversationInput('');

      // Auto TTS playback in target language
      if (onSpeakText) {
        onSpeakText(translated, tgt);
      }

      // Flip speaker turn for natural conversation flow
      setActiveSpeaker((s) => (s === 1 ? 2 : 1));
    } finally {
      setIsTranslatingConv(false);
    }
  };

  const handleCopyConversation = () => {
    const text = conversationHistory
      .map(
        (t) =>
          `[Speaker ${t.speaker} (${t.sourceLang.toUpperCase()})]: ${t.originalText}\n[Translated (${t.targetLang.toUpperCase()})]: ${t.translatedText}`
      )
      .join('\n\n');

    navigator.clipboard?.writeText(text).then(() => {
      setCopiedAllConv(true);
      setTimeout(() => setCopiedAllConv(false), 2000);
    });
  };

  const handleExportConversationToDraft = () => {
    const text =
      '\n\n### Live Bilingual Conversation Transcript\n' +
      conversationHistory
        .map(
          (t) =>
            `**Speaker ${t.speaker}** (${t.timestamp}):\n> ${t.originalText}\n*Translation*: ${t.translatedText}`
        )
        .join('\n\n');

    onAppendToDraft(text);
    onClose();
  };

  if (!open) return null;

  const activeTranscript = interimText || persistentTranscript;
  const activeSubtitle = translatedInterim || persistentTranslation;
  const currentTargetLangObj = POPULAR_TARGET_LANGUAGES.find((l) => l.code === targetLangCode);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-studio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 lg:p-6 bg-black/60 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div
        className={`bg-surface border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden transition-all duration-200 ${
          isFullscreen
            ? 'fixed inset-2 sm:inset-4 md:inset-6 z-50 max-w-none w-auto max-h-none h-[calc(100vh-1rem)] sm:h-[calc(100vh-2rem)] md:h-[calc(100vh-3rem)]'
            : 'w-full max-w-5xl xl:max-w-6xl max-h-[92vh] h-auto'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-3.5 border-b border-border bg-surface-hover/30 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="voice-studio-title" className="text-sm sm:text-base font-semibold text-foreground tracking-tight">
                  Voice Studio: Live Subtitles
                </h2>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-bold bg-primary/15 text-primary rounded-full uppercase tracking-wider">
                  Live Translation
                </span>
              </div>
              <p className="hidden md:block text-xs text-muted">
                Real-time speech translation, bilingual meeting subtitles &amp; face-to-face interpreter
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Text Size Pill Toggle (Subtitles Mode) */}
            {mode === 'subtitles' && (
              <div className="hidden sm:flex items-center gap-1 mr-2 px-2 py-1 bg-surface border border-border rounded-lg text-xs">
                <span className="text-[11px] text-muted font-medium mr-1">Size:</span>
                {(['normal', 'large', 'huge'] as const).map((sz) => (
                  <button
                    key={sz}
                    type="button"
                    onClick={() => setSubtitleSize(sz)}
                    className={`px-1.5 py-0.5 text-[11px] font-medium rounded transition-colors ${
                      subtitleSize === sz
                        ? 'bg-primary text-primary-foreground font-semibold'
                        : 'text-muted hover:text-foreground'
                    }`}
                  >
                    {sz.toUpperCase()}
                  </button>
                ))}
              </div>
            )}

            {/* Fullscreen Expand / Restore Button */}
            <button
              type="button"
              onClick={() => setIsFullscreen((prev) => !prev)}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              title={isFullscreen ? 'Restore window size' : 'Expand full screen'}
              aria-label={isFullscreen ? 'Restore window size' : 'Expand full screen'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Close Modal Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-border px-4 sm:px-6 gap-2 sm:gap-4 bg-surface shrink-0">
          <button
            type="button"
            onClick={() => setMode('subtitles')}
            className={`py-2.5 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              mode === 'subtitles'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <Subtitles className="w-4 h-4" />
            <span>Meeting Subtitles &amp; Live Captions</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('conversation')}
            className={`py-2.5 sm:py-3 px-2 sm:px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              mode === 'conversation'
                ? 'border-primary text-primary font-semibold'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Face-to-Face Conversation (2-Way)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3 sm:p-5 lg:p-6 overflow-y-auto space-y-4 flex-1 flex flex-col min-h-0">
          {mode === 'subtitles' && (
            <div className="flex-1 flex flex-col gap-4 min-h-0">
              {/* DeepL-Inspired Language Routing Bar */}
              <div className="p-3 sm:p-4 rounded-xl border border-border bg-surface-hover/20 shadow-sm shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4">
                  {/* Left: Spoken Speech Language */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                        <Mic className="w-3.5 h-3.5 text-primary" />
                        <span>Spoken Voice Language</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-primary/10 text-primary rounded font-bold">
                        SOURCE
                      </span>
                    </div>

                    <select
                      value={selectedLanguage.id}
                      onChange={(e) => {
                        const targetId = e.target.value;
                        const match = SPEECH_LANGUAGES.find((l) => l.id === targetId);
                        if (match && onSelectLanguage) {
                          onSelectLanguage(match);
                        }
                      }}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:border-primary shadow-sm"
                    >
                      {SPEECH_LANGUAGES.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.name}
                        </option>
                      ))}
                    </select>

                    {/* Quick Source Chips */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[10px] text-muted mr-0.5">Quick:</span>
                      {[
                        { id: 'en', label: 'English' },
                        { id: 'hi', label: 'Hindi' },
                        { id: 'es', label: 'Spanish' },
                        { id: 'fr', label: 'French' },
                        { id: 'de', label: 'German' },
                        { id: 'ja', label: 'Japanese' },
                      ].map((chip) => {
                        const isCurrent = selectedLanguage.id.startsWith(chip.id);
                        return (
                          <button
                            key={chip.id}
                            type="button"
                            onClick={() => {
                              const match = SPEECH_LANGUAGES.find((l) => l.id === chip.id);
                              if (match && onSelectLanguage) onSelectLanguage(match);
                            }}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors ${
                              isCurrent
                                ? 'bg-primary text-primary-foreground border-primary font-bold'
                                : 'bg-surface text-muted border-border hover:text-foreground'
                            }`}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Center: Language Swap Button */}
                  <div className="flex md:flex-col items-center justify-center pt-1 md:pt-4">
                    <button
                      type="button"
                      onClick={handleSwapLanguages}
                      title="Swap spoken and subtitle languages"
                      aria-label="Swap spoken and subtitle languages"
                      className="p-2.5 rounded-full border border-border bg-surface hover:bg-well hover:border-primary/50 text-foreground transition-all shadow-sm active:scale-95 group"
                    >
                      <ArrowRightLeft className="w-4 h-4 text-muted group-hover:text-primary transition-colors" />
                    </button>
                  </div>

                  {/* Right: Live Subtitle / Target Language */}
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5 text-amber-500" />
                        <span>Live Subtitle &amp; Translation</span>
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded font-bold">
                        TARGET
                      </span>
                    </div>

                    <select
                      value={targetLangCode}
                      onChange={(e) => setTargetLangCode(e.target.value)}
                      className="w-full text-xs font-semibold px-3 py-2 rounded-lg border border-border bg-surface text-foreground focus:outline-none focus:border-primary shadow-sm"
                    >
                      {POPULAR_TARGET_LANGUAGES.map((l) => (
                        <option key={l.code} value={l.code}>
                          [{l.code.toUpperCase()}] {l.name}
                        </option>
                      ))}
                    </select>

                    {/* Quick Target Chips */}
                    <div className="flex items-center gap-1 flex-wrap pt-0.5">
                      <span className="text-[10px] text-muted mr-0.5">Quick:</span>
                      {[
                        { code: 'hi', label: 'Hindi' },
                        { code: 'en', label: 'English' },
                        { code: 'es', label: 'Spanish' },
                        { code: 'de', label: 'German' },
                        { code: 'fr', label: 'French' },
                        { code: 'ar', label: 'Arabic' },
                      ].map((chip) => {
                        const isCurrent = targetLangCode === chip.code;
                        return (
                          <button
                            key={chip.code}
                            type="button"
                            onClick={() => setTargetLangCode(chip.code)}
                            className={`px-2 py-0.5 text-[10px] font-medium rounded-full border transition-colors ${
                              isCurrent
                                ? 'bg-amber-500 text-white border-amber-500 font-bold'
                                : 'bg-surface text-muted border-border hover:text-foreground'
                            }`}
                          >
                            {chip.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* DeepL-Style Dual Billboard Studio (Side-by-Side on Desktop/Tablet) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 flex-1 min-h-[300px]">
                {/* Panel 1: Spoken Audio Stream (Source) */}
                <div className="p-4 sm:p-5 rounded-2xl border border-border bg-surface flex flex-col justify-between shadow-sm min-h-[220px]">
                  <div>
                    {/* Panel 1 Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-border/80 text-xs">
                      <div className="flex items-center gap-2">
                        {isListening ? (
                          <span className="inline-flex items-center gap-1.5 text-danger font-semibold">
                            <span className="w-2.5 h-2.5 rounded-full bg-danger animate-pulse" />
                            <span>Microphone Active</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-muted">
                            <span className="w-2 h-2 rounded-full bg-muted/60" />
                            <span>Mic Standby</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-muted">
                          {selectedLanguage.name}
                        </span>
                        {activeTranscript && (
                          <button
                            type="button"
                            onClick={handleClearTranscript}
                            title="Clear transcript"
                            className="p-1 rounded text-muted hover:text-danger hover:bg-well transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Spoken Text Display */}
                    <div className="pt-4 space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-muted font-mono block">
                        Original Speech Transcript
                      </span>
                      <p
                        className={`font-sans text-foreground leading-relaxed transition-all ${
                          subtitleSize === 'huge'
                            ? 'text-xl sm:text-2xl font-semibold'
                            : subtitleSize === 'large'
                            ? 'text-lg sm:text-xl font-medium'
                            : 'text-sm sm:text-base font-normal'
                        }`}
                      >
                        {activeTranscript ? (
                          activeTranscript
                        ) : (
                          <span className="text-muted/70 italic">
                            Speak into your microphone. Your spoken words will stream here in real time...
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Panel 1 Footer */}
                  <div className="pt-4 border-t border-border/60 flex items-center justify-between gap-2 text-xs">
                    <button
                      type="button"
                      onClick={onToggleListening}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                        isListening
                          ? 'bg-danger text-white hover:bg-danger/90'
                          : 'bg-primary text-primary-foreground hover:bg-primary-hover shadow-sm'
                      }`}
                    >
                      {isListening ? (
                        <>
                          <MicOff className="w-3.5 h-3.5" />
                          <span>Pause Mic</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5" />
                          <span>Start Speaking</span>
                        </>
                      )}
                    </button>

                    {activeTranscript && (
                      <button
                        type="button"
                        onClick={handleCopySource}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border text-muted hover:text-foreground hover:bg-well transition-colors"
                      >
                        {copiedSource ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSource ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Panel 2: Live Bilingual Subtitles (Target) */}
                <div className="p-4 sm:p-5 rounded-2xl border-2 border-slate-900 dark:border-border bg-slate-950 text-white flex flex-col justify-between shadow-xl min-h-[220px]">
                  <div>
                    {/* Panel 2 Header */}
                    <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs text-slate-400">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="font-semibold text-slate-300">Live Dual-Language Stream</span>
                      </div>
                      <span className="font-mono text-[11px] text-amber-400">
                        {currentTargetLangObj?.name || targetLangCode.toUpperCase()}
                      </span>
                    </div>

                    {/* Subtitle Text Display */}
                    <div className="pt-4 space-y-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 font-mono block">
                        Synchronized Real-Time Subtitles
                      </span>
                      <p
                        className={`font-sans text-amber-300 leading-snug transition-all ${
                          subtitleSize === 'huge'
                            ? 'text-2xl sm:text-3xl lg:text-4xl font-extrabold'
                            : subtitleSize === 'large'
                            ? 'text-xl sm:text-2xl lg:text-3xl font-bold'
                            : 'text-base sm:text-lg font-semibold'
                        }`}
                      >
                        {activeSubtitle ? (
                          activeSubtitle
                        ) : (
                          <span className="text-slate-500 font-normal italic">
                            Translated subtitles appear here instantaneously as speech is recognized.
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Panel 2 Footer */}
                  <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between gap-2 text-xs flex-wrap">
                    <div className="flex items-center gap-2">
                      {onSpeakText && activeSubtitle && (
                        <button
                          type="button"
                          onClick={() => onSpeakText(activeSubtitle, targetLangCode)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
                          title="Listen with text-to-speech audio"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-primary" />
                          <span>Listen</span>
                        </button>
                      )}

                      {activeSubtitle && (
                        <button
                          type="button"
                          onClick={handleCopySubtitle}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
                        >
                          {copiedSubtitle ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedSubtitle ? 'Copied' : 'Copy'}</span>
                        </button>
                      )}
                    </div>

                    {activeSubtitle && (
                      <button
                        type="button"
                        onClick={() => onAppendToDraft(`\n\n[Translation: ${activeSubtitle}]`)}
                        className="px-3 py-1.5 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold flex items-center gap-1.5 transition-colors shadow-sm ml-auto"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Append to Note</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {mode === 'conversation' && (
            <div className="space-y-4 flex-1 flex flex-col min-h-0">
              {/* Dual-Speaker Setup Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-border bg-surface-hover/20 shrink-0">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                      <span>Speaker 1</span>
                      {activeSpeaker === 1 && (
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      )}
                    </span>
                    <span className="text-[10px] text-muted font-mono">Turn 1</span>
                  </div>
                  <select
                    value={speaker1Lang}
                    onChange={(e) => setSpeaker1Lang(e.target.value)}
                    className="w-full text-xs font-medium p-2 rounded-lg border border-border bg-surface"
                  >
                    {POPULAR_TARGET_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        [{l.code.toUpperCase()}] {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                      <span>Speaker 2</span>
                      {activeSpeaker === 2 && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                    </span>
                    <span className="text-[10px] text-muted font-mono">Turn 2</span>
                  </div>
                  <select
                    value={speaker2Lang}
                    onChange={(e) => setSpeaker2Lang(e.target.value)}
                    className="w-full text-xs font-medium p-2 rounded-lg border border-border bg-surface"
                  >
                    {POPULAR_TARGET_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        [{l.code.toUpperCase()}] {l.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversation Message Feed */}
              <div className="border border-border rounded-xl p-4 flex-1 min-h-[220px] max-h-[380px] overflow-y-auto space-y-3 bg-surface">
                {conversationHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted py-10 space-y-2">
                    <Users className="w-8 h-8 opacity-40 text-primary" />
                    <p className="text-xs font-medium text-foreground">
                      No dialog yet. Type or speak as Speaker 1 or Speaker 2 below!
                    </p>
                    <p className="text-[11px] text-muted">
                      Messages are translated immediately and can be played aloud via voice TTS.
                    </p>
                  </div>
                ) : (
                  conversationHistory.map((turn) => (
                    <div
                      key={turn.id}
                      className={`flex flex-col ${
                        turn.speaker === 1 ? 'items-start' : 'items-end'
                      }`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl p-3.5 space-y-1 ${
                          turn.speaker === 1
                            ? 'bg-primary/10 border border-primary/20 text-foreground'
                            : 'bg-amber-500/10 border border-amber-500/20 text-foreground'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3 text-[10px] text-muted font-mono">
                          <span className="font-semibold">
                            Speaker {turn.speaker} ({turn.sourceLang.toUpperCase()})
                          </span>
                          <span>{turn.timestamp}</span>
                        </div>
                        <p className="text-sm font-medium">{turn.originalText}</p>
                        <div className="pt-1.5 border-t border-border/50 flex items-center justify-between gap-2">
                          <p className="text-xs italic text-muted">
                            &rarr; {turn.translatedText}
                          </p>
                          {onSpeakText && (
                            <button
                              type="button"
                              onClick={() => onSpeakText(turn.translatedText, turn.targetLang)}
                              title="Listen translated voice"
                              className="p-1 rounded hover:bg-surface text-primary transition-colors shrink-0"
                            >
                              <Volume2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Conversation Input Box */}
              <div className="p-3 sm:p-4 rounded-xl border border-border bg-surface-hover/20 space-y-2 shrink-0">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Speaking as:{' '}
                    <span className={activeSpeaker === 1 ? 'text-primary font-bold' : 'text-amber-500 font-bold'}>
                      Speaker {activeSpeaker} (
                      {activeSpeaker === 1 ? speaker1Lang.toUpperCase() : speaker2Lang.toUpperCase()})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSpeaker((s) => (s === 1 ? 2 : 1))}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1 font-medium"
                  >
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>Switch Speaker</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={conversationInput}
                    onChange={(e) => setConversationInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleSendConversationMessage();
                    }}
                    placeholder={`Type message as Speaker ${activeSpeaker}...`}
                    className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-border bg-surface focus:outline-none focus:border-primary shadow-sm"
                  />
                  <button
                    type="button"
                    disabled={isTranslatingConv || !conversationInput.trim()}
                    onClick={() => void handleSendConversationMessage()}
                    className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover disabled:opacity-50 shadow-sm transition-all"
                  >
                    Translate &amp; Speak
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              {conversationHistory.length > 0 && (
                <div className="flex items-center justify-end gap-2 pt-1 shrink-0">
                  <button
                    type="button"
                    onClick={handleCopyConversation}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    {copiedAllConv ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedAllConv ? 'Copied' : 'Copy All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportConversationToDraft}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export to Active Note</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 sm:px-6 py-3 border-t border-border bg-surface flex items-center justify-between text-xs text-muted shrink-0">
          <div className="flex items-center gap-2">
            <Radio className="w-3.5 h-3.5 text-primary" />
            <span>Low-latency client-side speech interpretation</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover text-foreground font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
