import React, { useState, useRef } from 'react';
import {
  Monitor,
  Mic,
  Volume2,
  VolumeX,
  Radio,
  FileAudio,
  Sparkles,
  Settings2,
  HelpCircle,
  X,
  ExternalLink,
  Upload,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Key,
} from 'lucide-react';
import { WaveformVisualizer } from './WaveformVisualizer';
import { formatDuration } from '../utils/voiceCommands';
import type { UseTabAudioCaptureReturn } from '../hooks/useTabAudioCapture';
import type { AIProvider } from '../utils/aiTranscriber';

interface TabAudioModalProps {
  open: boolean;
  tabCapture: UseTabAudioCaptureReturn;
  onClose: () => void;
  theme: 'light' | 'dark';
}

type TabView = 'capture' | 'loopback' | 'file';

export const TabAudioModal: React.FC<TabAudioModalProps> = ({
  open,
  tabCapture,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<TabView>('capture');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileStatus, setFileStatus] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!open) return null;

  const {
    isCapturing,
    isTranscribing,
    isMonitorMuted,
    tabTitle,
    error,
    elapsedSeconds,
    analyserRef,
    aiSettings,
    chunksProcessed,
    lastTranscript,
    startTabCapture,
    stopTabCapture,
    toggleMonitorMute,
    updateAISettings,
    transcribeMediaFile,
    clearError,
  } = tabCapture;

  const handleProviderChange = (provider: AIProvider) => {
    updateAISettings({ provider });
  };

  const currentKey =
    aiSettings.provider === 'groq'
      ? aiSettings.groqKey || ''
      : aiSettings.provider === 'openai'
      ? aiSettings.openaiKey || ''
      : aiSettings.geminiKey || '';

  const handleKeyChange = (val: string) => {
    if (aiSettings.provider === 'groq') {
      updateAISettings({ groqKey: val });
    } else if (aiSettings.provider === 'openai') {
      updateAISettings({ openaiKey: val });
    } else {
      updateAISettings({ geminiKey: val });
    }
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
      setFileStatus(null);
    }
  };

  const handleFileTranscribe = async () => {
    if (!selectedFile) return;
    try {
      setFileStatus('Transcribing audio with ' + aiSettings.provider.toUpperCase() + '...');
      const text = await transcribeMediaFile(selectedFile);
      setFileStatus(`Success! Appended ${text.split(/\s+/).length} words to your note.`);
      setSelectedFile(null);
    } catch {
      setFileStatus(null);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tab-audio-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/45 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-surface border border-border rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-surface-hover/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <h2 id="tab-audio-title" className="text-base font-semibold text-foreground">
                Capture Tab & System Audio
              </h2>
              <p className="text-xs text-muted">
                Transcribe YouTube, meetings, webinars, or audio files into live text
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

        {/* Tab Navigation */}
        <div className="flex border-b border-border px-5 gap-2 bg-surface">
          <button
            type="button"
            onClick={() => setActiveTab('capture')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'capture'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Live Tab Stream</span>
            {isCapturing && (
              <span className="w-2 h-2 rounded-full bg-danger animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('loopback')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'loopback'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>100% Free Loopback (No Key)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('file')}
            className={`py-3 px-3 text-xs sm:text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'file'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted hover:text-foreground'
            }`}
          >
            <FileAudio className="w-4 h-4" />
            <span>File Transcriber</span>
          </button>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={clearError}
              className="text-xs underline hover:opacity-80 shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm">
          {activeTab === 'capture' && (
            <>
              {/* Tab Capture Control Box */}
              <div className="p-4 rounded-xl border border-border bg-surface-hover/20 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground">
                        {isCapturing
                          ? `Capturing: ${tabTitle || 'Chrome Tab Audio'}`
                          : 'Tab Audio Stream'}
                      </span>
                      {isCapturing && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-danger/15 text-danger rounded-full animate-pulse">
                          LIVE
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted">
                      Select your YouTube tab & check &ldquo;Share tab audio&rdquo; in the browser prompt.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {isCapturing && (
                      <button
                        type="button"
                        onClick={toggleMonitorMute}
                        title={isMonitorMuted ? 'Unmute monitor' : 'Mute monitor'}
                        className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          isMonitorMuted
                            ? 'border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                            : 'border-border bg-surface hover:bg-surface-hover text-foreground'
                        }`}
                      >
                        {isMonitorMuted ? (
                          <>
                            <VolumeX className="w-4 h-4" />
                            <span className="hidden sm:inline">Muted</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-4 h-4 text-primary" />
                            <span className="hidden sm:inline">Listening</span>
                          </>
                        )}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        if (isCapturing) {
                          stopTabCapture();
                        } else {
                          void startTabCapture();
                        }
                      }}
                      className={`px-4 py-2.5 rounded-xl font-medium text-xs sm:text-sm flex items-center gap-2 transition-all shadow-sm ${
                        isCapturing
                          ? 'bg-danger text-white hover:bg-danger/90'
                          : 'bg-primary text-primary-foreground hover:bg-primary-hover'
                      }`}
                    >
                      {isCapturing ? (
                        <>
                          <Radio className="w-4 h-4 animate-spin" />
                          <span>Stop Tab Capture</span>
                        </>
                      ) : (
                        <>
                          <Monitor className="w-4 h-4" />
                          <span>Select & Capture YouTube Tab</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Real-time Visualizer & Status */}
                {isCapturing && (
                  <div className="pt-3 border-t border-border flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <WaveformVisualizer isListening={isCapturing} analyserRef={analyserRef} />
                      <span className="text-xs font-mono text-muted">
                        {formatDuration(elapsedSeconds)}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted">
                      {isTranscribing ? (
                        <span className="flex items-center gap-1 text-primary animate-pulse">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Transcribing chunk...
                        </span>
                      ) : (
                        <span>
                          {chunksProcessed} {chunksProcessed === 1 ? 'chunk' : 'chunks'} processed
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* AI Transcriber Settings */}
              <div className="p-4 rounded-xl border border-border bg-surface space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-foreground uppercase tracking-wider">
                    <Settings2 className="w-4 h-4 text-primary" />
                    <span>AI Transcription Engine</span>
                  </div>
                  <span className="text-[11px] text-muted font-mono">
                    Client-side Direct API
                  </span>
                </div>

                {/* Provider Picker */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleProviderChange('groq')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      aiSettings.provider === 'groq'
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-surface-hover/30 text-muted hover:text-foreground'
                    }`}
                  >
                    <div className="text-xs font-semibold flex items-center justify-between">
                      <span>Groq Whisper</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 rounded">
                        Fastest
                      </span>
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">300x Realtime · Free</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProviderChange('gemini')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      aiSettings.provider === 'gemini'
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-surface-hover/30 text-muted hover:text-foreground'
                    }`}
                  >
                    <div className="text-xs font-semibold flex items-center justify-between">
                      <span>Gemini 2.0</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/15 text-blue-600 dark:text-blue-400 rounded">
                        Google
                      </span>
                    </div>
                    <div className="text-[10px] opacity-80 mt-0.5">Multimodal Flash</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleProviderChange('openai')}
                    className={`p-2.5 rounded-xl border text-left transition-all ${
                      aiSettings.provider === 'openai'
                        ? 'border-primary bg-primary/10 text-primary font-medium'
                        : 'border-border bg-surface-hover/30 text-muted hover:text-foreground'
                    }`}
                  >
                    <div className="text-xs font-semibold">OpenAI Whisper</div>
                    <div className="text-[10px] opacity-80 mt-0.5">Official Whisper-1</div>
                  </button>
                </div>

                {/* API Key Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <label
                      htmlFor="ai-api-key-input"
                      className="text-muted flex items-center gap-1.5"
                    >
                      <Key className="w-3.5 h-3.5 text-primary" />
                      <span>{aiSettings.provider.toUpperCase()} API Key</span>
                    </label>
                    <a
                      href={
                        aiSettings.provider === 'groq'
                          ? 'https://console.groq.com/keys'
                          : aiSettings.provider === 'gemini'
                          ? 'https://aistudio.google.com/app/apikey'
                          : 'https://platform.openai.com/api-keys'
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1 text-[11px]"
                    >
                      <span>Get free {aiSettings.provider} key</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="relative">
                    <input
                      id="ai-api-key-input"
                      type={showKey ? 'text' : 'password'}
                      value={currentKey}
                      onChange={(e) => handleKeyChange(e.target.value)}
                      placeholder={`Enter your ${aiSettings.provider} API key (e.g. gsk_...)`}
                      className="w-full text-xs font-mono px-3 py-2 pr-16 rounded-xl border border-border bg-surface focus:outline-none focus:border-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey(!showKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[11px] text-muted hover:text-foreground px-1.5 py-0.5"
                    >
                      {showKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted">
                    Stored strictly in your local browser storage. Never sent to our servers.
                  </p>
                </div>
              </div>

              {lastTranscript && (
                <div className="p-3.5 rounded-xl border border-border bg-surface-hover/20 space-y-1">
                  <span className="text-[11px] font-semibold text-muted uppercase tracking-wider">
                    Latest Transcribed Segment:
                  </span>
                  <p className="text-xs text-foreground italic">&ldquo;{lastTranscript}&rdquo;</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'loopback' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-foreground space-y-2">
                <div className="flex items-center gap-2 font-semibold text-amber-600 dark:text-amber-400">
                  <Sparkles className="w-4 h-4" />
                  <span>100% Free Unlimited Live Typing (No API Key Required)</span>
                </div>
                <p className="text-xs leading-relaxed text-muted">
                  You can transcribe YouTube, webinars, or any tab continuously for free using Chrome&rsquo;s built-in Web Speech API by routing system sound to your input device.
                </p>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-foreground uppercase tracking-wider">
                  3-Step Windows Setup Guide:
                </h4>

                <div className="p-3 rounded-xl border border-border bg-surface flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    1
                  </div>
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-foreground">Enable &ldquo;Stereo Mix&rdquo; in Windows</span>
                    <p className="text-muted">
                      Right-click sound icon in taskbar &rarr; <strong>Sound Settings</strong> &rarr; More sound settings &rarr; <strong>Recording</strong> tab &rarr; Right-click <strong>Stereo Mix</strong> &rarr; Click <strong>Enable</strong>.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </div>
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-foreground">Set Chrome Microphone to Stereo Mix</span>
                    <p className="text-muted">
                      In Chrome, paste <code className="bg-surface-hover px-1 rounded">chrome://settings/content/microphone</code> into address bar &rarr; select <strong>Stereo Mix</strong> as default microphone.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    3
                  </div>
                  <div className="text-xs space-y-1">
                    <span className="font-semibold text-foreground">Play YouTube and Click Start Dictation!</span>
                    <p className="text-muted">
                      Play any YouTube video in tab 2, return to VoiceScribe, and click <strong>Start Dictation</strong>. The video will be typed out live in real-time in 100+ languages with zero cost!
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-border bg-surface-hover/30 text-xs text-muted flex items-center gap-2">
                  <HelpCircle className="w-4 h-4 text-primary shrink-0" />
                  <span>Mac users: Install free <strong>BlackHole</strong> or <strong>Loopback</strong> virtual audio driver for identical functionality.</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'file' && (
            <div className="space-y-4">
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-surface-hover/20 hover:bg-surface-hover/40 transition-colors flex flex-col items-center justify-center text-center cursor-pointer space-y-3"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="audio/*,video/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSelectedFile(e.target.files[0]);
                      setFileStatus(null);
                    }
                  }}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-sm font-medium text-foreground">
                    {selectedFile ? selectedFile.name : 'Drop audio/video file here or click to browse'}
                  </span>
                  <p className="text-xs text-muted mt-1">
                    Supports MP3, WAV, M4A, WebM, MP4 (Max 25MB)
                  </p>
                </div>
              </div>

              {selectedFile && (
                <div className="p-4 rounded-xl border border-border bg-surface flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-foreground">
                      {selectedFile.name}
                    </span>
                    <p className="text-[11px] text-muted">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>

                  <button
                    type="button"
                    disabled={isTranscribing}
                    onClick={() => void handleFileTranscribe()}
                    className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs font-medium hover:bg-primary-hover disabled:opacity-50 flex items-center gap-2"
                  >
                    {isTranscribing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Transcribing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Transcribe into Note</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {fileStatus && (
                <div className="p-3 rounded-xl border border-primary/30 bg-primary/10 text-xs text-primary flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{fileStatus}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-surface flex items-center justify-between text-xs text-muted">
          <span>Client-side audio capture &amp; processing</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-border hover:bg-surface-hover text-foreground font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
