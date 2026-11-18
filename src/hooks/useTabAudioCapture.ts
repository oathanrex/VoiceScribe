import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type AISettings,
  loadAISettings,
  saveAISettings,
  transcribeAudioChunk,
  DEFAULT_AI_SETTINGS,
} from '../utils/aiTranscriber';

export interface UseTabAudioCaptureOptions {
  languageCode: string;
  onChunkTranscribed: (text: string) => void;
}

export interface UseTabAudioCaptureReturn {
  isSupported: boolean;
  isCapturing: boolean;
  isTranscribing: boolean;
  isMonitorMuted: boolean;
  tabTitle: string | null;
  error: string | null;
  elapsedSeconds: number;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  aiSettings: AISettings;
  chunksProcessed: number;
  lastTranscript: string | null;
  startTabCapture: () => Promise<boolean>;
  stopTabCapture: () => void;
  toggleMonitorMute: () => void;
  updateAISettings: (newSettings: Partial<AISettings>) => void;
  transcribeMediaFile: (file: File) => Promise<string>;
  clearError: () => void;
}

export function useTabAudioCapture({
  languageCode,
  onChunkTranscribed,
}: UseTabAudioCaptureOptions): UseTabAudioCaptureReturn {
  const [isCapturing, setIsCapturing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isMonitorMuted, setIsMonitorMuted] = useState(false);
  const [tabTitle, setTabTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [chunksProcessed, setChunksProcessed] = useState(0);
  const [lastTranscript, setLastTranscript] = useState<string | null>(null);
  const [aiSettings, setAiSettings] = useState<AISettings>(() => loadAISettings());

  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const monitorGainRef = useRef<GainNode | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const onChunkRef = useRef(onChunkTranscribed);
  const languageRef = useRef(languageCode);
  const aiSettingsRef = useRef(aiSettings);

  onChunkRef.current = onChunkTranscribed;
  languageRef.current = languageCode;
  aiSettingsRef.current = aiSettings;

  const isSupported =
    typeof navigator !== 'undefined' &&
    Boolean(navigator.mediaDevices?.getDisplayMedia);

  const cleanup = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }
      mediaRecorderRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    monitorGainRef.current = null;
    setIsCapturing(false);
    setIsTranscribing(false);
    setTabTitle(null);
  }, []);

  const stopTabCapture = useCallback(() => {
    cleanup();
  }, [cleanup]);

  const toggleMonitorMute = useCallback(() => {
    if (!monitorGainRef.current) return;
    const nextMuted = !isMonitorMuted;
    monitorGainRef.current.gain.value = nextMuted ? 0 : 1;
    setIsMonitorMuted(nextMuted);
  }, [isMonitorMuted]);

  const updateAISettings = useCallback((newSettings: Partial<AISettings>) => {
    const updated = saveAISettings(newSettings);
    setAiSettings(updated);
  }, []);

  const handleAudioChunk = useCallback(
    async (blob: Blob) => {
      if (blob.size < 500) return; // Ignore silent/empty chunks
      const currentConfig = aiSettingsRef.current;
      const key =
        currentConfig.provider === 'groq'
          ? currentConfig.groqKey
          : currentConfig.provider === 'openai'
          ? currentConfig.openaiKey
          : currentConfig.geminiKey;

      if (!key || !key.trim()) {
        setError(
          `No ${currentConfig.provider.toUpperCase()} API key configured. Enter your key in Tab Audio settings to enable AI transcription.`
        );
        return;
      }

      setIsTranscribing(true);
      try {
        const text = await transcribeAudioChunk(
          blob,
          currentConfig,
          languageRef.current
        );
        if (text && text.trim()) {
          setLastTranscript(text);
          setChunksProcessed((c) => c + 1);
          onChunkRef.current(text);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
      } finally {
        setIsTranscribing(false);
      }
    },
    []
  );

  const startTabCapture = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError('Tab audio capture is not supported in this browser. Please use Chrome or Edge.');
      return false;
    }

    setError(null);
    try {
      // Request system/tab audio via getDisplayMedia
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const audioTracks = displayStream.getAudioTracks();
      if (audioTracks.length === 0) {
        displayStream.getTracks().forEach((t) => t.stop());
        setError(
          "No audio track was shared. When selecting a Chrome Tab, make sure the 'Share tab audio' toggle at the bottom is checked."
        );
        return false;
      }

      const audioTrack = audioTracks[0];
      setTabTitle(audioTrack.label || 'Shared Tab Audio');

      // Audio Context for Visualizer and Monitor Pass-through
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(new MediaStream([audioTrack]));

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const monitorGain = ctx.createGain();
      monitorGain.gain.value = 1.0; // Unmuted by default so user hears the video
      source.connect(monitorGain);
      monitorGain.connect(ctx.destination);

      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      monitorGainRef.current = monitorGain;
      streamRef.current = displayStream;

      // Handle user stopping share via browser native banner
      audioTrack.onended = () => {
        cleanup();
      };

      // Set up MediaRecorder for chunked transcription
      const audioOnlyStream = new MediaStream([audioTrack]);
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : '';

      const recorder = new MediaRecorder(
        audioOnlyStream,
        mimeType ? { mimeType } : undefined
      );

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          void handleAudioChunk(event.data);
        }
      };

      const chunkMs = (aiSettingsRef.current.chunkDurationSeconds || 10) * 1000;
      recorder.start(chunkMs);
      mediaRecorderRef.current = recorder;

      setIsCapturing(true);
      setElapsedSeconds(0);
      setChunksProcessed(0);

      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
      timerRef.current = window.setInterval(() => {
        setElapsedSeconds((s) => s + 1);
      }, 1000);

      return true;
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        // User cancelled picker
        return false;
      }
      const msg = err instanceof Error ? err.message : String(err);
      setError(`Failed to capture tab audio: ${msg}`);
      cleanup();
      return false;
    }
  }, [isSupported, cleanup, handleAudioChunk]);

  const transcribeMediaFile = useCallback(
    async (file: File): Promise<string> => {
      setError(null);
      setIsTranscribing(true);
      try {
        const currentConfig = aiSettingsRef.current;
        const key =
          currentConfig.provider === 'groq'
            ? currentConfig.groqKey
            : currentConfig.provider === 'openai'
            ? currentConfig.openaiKey
            : currentConfig.geminiKey;

        if (!key || !key.trim()) {
          throw new Error(
            `No ${currentConfig.provider.toUpperCase()} API key configured. Enter your key in Tab Audio settings.`
          );
        }

        const text = await transcribeAudioChunk(
          file,
          currentConfig,
          languageRef.current
        );

        if (text && text.trim()) {
          onChunkRef.current(text);
          setLastTranscript(text);
          return text;
        }
        return '';
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setError(msg);
        throw err;
      } finally {
        setIsTranscribing(false);
      }
    },
    []
  );

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    isSupported,
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
  };
}
