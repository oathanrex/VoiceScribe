import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Languages,
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
} from 'lucide-react';
import {
  POPULAR_TARGET_LANGUAGES,
  translateText,
} from '../utils/translator';
import { SpeechLanguage } from '../data/languages';

interface LiveSubtitlesModalProps {
  open: boolean;
  onClose: () => void;
  selectedLanguage: SpeechLanguage;
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
  interimText,
  isListening,
  onToggleListening,
  onAppendToDraft,
  onSpeakText,
}) => {
  const [mode, setMode] = useState<Mode>('subtitles');
  const [targetLangCode, setTargetLangCode] = useState('en');
  const [translatedInterim, setTranslatedInterim] = useState('');
  const [autoAppendTranslation, setAutoAppendTranslation] = useState(false);
  const [subtitleSize, setSubtitleSize] = useState<'normal' | 'large' | 'huge'>('large');
  const [copied, setCopied] = useState(false);

  // Conversation Mode State
  const [speaker1Lang, setSpeaker1Lang] = useState(selectedLanguage.code.split('-')[0]);
  const [speaker2Lang, setSpeaker2Lang] = useState('en');
  const [activeSpeaker, setActiveSpeaker] = useState<1 | 2>(1);
  const [conversationHistory, setConversationHistory] = useState<ConversationTurn[]>([]);
  const [conversationInput, setConversationInput] = useState('');
  const [isTranslatingConv, setIsTranslatingConv] = useState(false);

  const debounceTimerRef = useRef<number | null>(null);

  // Live translation of interim speech for live subtitles studio
  useEffect(() => {
    if (!interimText || !interimText.trim()) {
      setTranslatedInterim('');
      return;
    }

    if (debounceTimerRef.current !== null) {
      window.clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = window.setTimeout(async () => {
      try {
        const res = await translateText(
          interimText,
          selectedLanguage.code,
          targetLangCode
        );
        setTranslatedInterim(res);
      } catch {
        setTranslatedInterim('');
      }
    }, 180);

    return () => {
      if (debounceTimerRef.current !== null) {
        window.clearTimeout(debounceTimerRef.current);
      }
    };
  }, [interimText, selectedLanguage.code, targetLangCode]);

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
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
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

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="voice-studio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/50 dark:bg-black/75 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-hover/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="voice-studio-title" className="text-base font-semibold text-foreground">
                  Voice Studio: Live Subtitles
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-primary/15 text-primary rounded-full uppercase tracking-wider">
                  Live Translation
                </span>
              </div>
              <p className="text-xs text-muted">
                Real-time speech translation, bilingual meeting subtitles &amp; face-to-face interpreter
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-surface-hover transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector */}
        <div className="flex border-b border-border px-5 gap-2 bg-surface">
          <button
            type="button"
            onClick={() => setMode('subtitles')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              mode === 'subtitles'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <Subtitles className="w-4 h-4" />
            <span>Meeting Subtitles &amp; Live Captions</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('conversation')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              mode === 'conversation'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Face-to-Face Conversation (2-Way)</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm flex-1">
          {mode === 'subtitles' && (
            <div className="space-y-4">
              {/* Language Routing Bar */}
              <div className="p-4 rounded-xl border border-border bg-surface-hover/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-semibold text-muted uppercase">Spoken:</span>
                  <span className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-medium text-foreground">
                    {selectedLanguage.name}
                  </span>

                  <ArrowRightLeft className="w-4 h-4 text-muted mx-1" />

                  <span className="text-xs font-semibold text-muted uppercase">Subtitle:</span>
                  <select
                    value={targetLangCode}
                    onChange={(e) => setTargetLangCode(e.target.value)}
                    className="px-2.5 py-1 rounded-lg bg-surface border border-border text-xs font-medium text-foreground focus:outline-none focus:border-primary"
                  >
                    {POPULAR_TARGET_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        [{l.code.toUpperCase()}] {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">Text Size:</span>
                  {(['normal', 'large', 'huge'] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => setSubtitleSize(sz)}
                      className={`px-2 py-0.5 text-xs rounded border transition-colors ${
                        subtitleSize === sz
                          ? 'border-primary bg-primary/10 text-primary font-medium'
                          : 'border-border text-muted hover:text-foreground'
                      }`}
                    >
                      {sz.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Subtitle Screen / Billboard */}
              <div className="p-6 rounded-2xl border-2 border-border bg-black/90 text-white min-h-[220px] flex flex-col justify-between shadow-inner">
                <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Dual-Language Stream</span>
                  </div>
                  <span className="font-mono">
                    {isListening ? 'Microphone Active' : 'Waiting for Speech...'}
                  </span>
                </div>

                {/* Main Caption Text */}
                <div className="space-y-3 flex-1 flex flex-col justify-center">
                  {/* Spoken original */}
                  <div>
                    <span className="text-[11px] uppercase tracking-wider text-slate-400 block mb-0.5 font-mono">
                      Spoken ({selectedLanguage.name}):
                    </span>
                    <p
                      className={`font-sans text-slate-200 transition-all ${
                        subtitleSize === 'huge'
                          ? 'text-2xl font-bold'
                          : subtitleSize === 'large'
                          ? 'text-xl font-medium'
                          : 'text-base'
                      }`}
                    >
                      {interimText ? interimText : 'Speak into your microphone to generate live captions...'}
                    </p>
                  </div>

                  {/* Translated Subtitle */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <span className="text-[11px] uppercase tracking-wider text-amber-400 block mb-0.5 font-mono">
                      Live Subtitle (
                      {POPULAR_TARGET_LANGUAGES.find((l) => l.code === targetLangCode)?.name ||
                        targetLangCode.toUpperCase()}
                      ):
                    </span>
                    <p
                      className={`font-sans text-amber-300 font-semibold transition-all ${
                        subtitleSize === 'huge'
                          ? 'text-3xl font-extrabold'
                          : subtitleSize === 'large'
                          ? 'text-2xl font-bold'
                          : 'text-lg font-semibold'
                      }`}
                    >
                      {translatedInterim ? translatedInterim : 'Translated subtitle appears here in real-time.'}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                  <span>Ultra-low latency streaming translation</span>
                  {translatedInterim && (
                    <button
                      type="button"
                      onClick={() => onAppendToDraft(`\n\n[Translation: ${translatedInterim}]`)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>Append Subtitle to Note</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Dictation Toggle Dock */}
              <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-surface">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onToggleListening}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
                      isListening
                        ? 'bg-danger text-white hover:bg-danger/90'
                        : 'bg-primary text-primary-foreground hover:bg-primary-hover'
                    }`}
                  >
                    {isListening ? (
                      <>
                        <MicOff className="w-4 h-4" />
                        <span>Stop Mic</span>
                      </>
                    ) : (
                      <>
                        <Mic className="w-4 h-4" />
                        <span>Start Speaking</span>
                      </>
                    )}
                  </button>
                  <span className="text-xs text-muted">
                    {isListening ? 'Listening and translating...' : 'Click to start live speech translation'}
                  </span>
                </div>

                <label className="flex items-center gap-2 text-xs text-muted cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoAppendTranslation}
                    onChange={(e) => setAutoAppendTranslation(e.target.checked)}
                    className="rounded text-primary focus:ring-primary"
                  />
                  <span>Auto-save translations into notes</span>
                </label>
              </div>
            </div>
          )}

          {mode === 'conversation' && (
            <div className="space-y-4">
              {/* Dual-Speaker Setup Header */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl border border-border bg-surface-hover/20">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                    <span>Speaker 1</span>
                    {activeSpeaker === 1 && (
                      <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    )}
                  </span>
                  <select
                    value={speaker1Lang}
                    onChange={(e) => setSpeaker1Lang(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-border bg-surface"
                  >
                    {POPULAR_TARGET_LANGUAGES.map((l) => (
                      <option key={l.code} value={l.code}>
                        [{l.code.toUpperCase()}] {l.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-500 flex items-center gap-1.5">
                    <span>Speaker 2</span>
                    {activeSpeaker === 2 && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    )}
                  </span>
                  <select
                    value={speaker2Lang}
                    onChange={(e) => setSpeaker2Lang(e.target.value)}
                    className="w-full text-xs p-1.5 rounded-lg border border-border bg-surface"
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
              <div className="border border-border rounded-xl p-4 min-h-[260px] max-h-[360px] overflow-y-auto space-y-3 bg-surface">
                {conversationHistory.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center text-muted py-12 space-y-2">
                    <Users className="w-8 h-8 opacity-40 text-primary" />
                    <p className="text-xs">
                      No dialog yet. Type or speak as Speaker 1 or Speaker 2 below!
                    </p>
                    <p className="text-[11px] opacity-75">
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
              <div className="p-3 rounded-xl border border-border bg-surface-hover/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">
                    Speaking as:{' '}
                    <span className={activeSpeaker === 1 ? 'text-primary' : 'text-amber-500'}>
                      Speaker {activeSpeaker} (
                      {activeSpeaker === 1 ? speaker1Lang.toUpperCase() : speaker2Lang.toUpperCase()})
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveSpeaker((s) => (s === 1 ? 2 : 1))}
                    className="text-[11px] text-primary hover:underline flex items-center gap-1"
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
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-border bg-surface focus:outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    disabled={isTranslatingConv || !conversationInput.trim()}
                    onClick={() => void handleSendConversationMessage()}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover disabled:opacity-50"
                  >
                    Translate &amp; Speak
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              {conversationHistory.length > 0 && (
                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCopyConversation}
                    className="px-3 py-1.5 rounded-lg border border-border text-xs text-muted hover:text-foreground flex items-center gap-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy All'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleExportConversationToDraft}
                    className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary-hover flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Export to Active Note</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface flex items-center justify-between text-xs text-muted">
          <span>Real-Time Multilingual Speech Subtitles &amp; Interpretation</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover text-foreground font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
