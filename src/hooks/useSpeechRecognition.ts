import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message?: string;
}

interface BrowserSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
  onresult: ((this: BrowserSpeechRecognition, ev: SpeechRecognitionEvent) => void) | null;
  onerror: ((this: BrowserSpeechRecognition, ev: SpeechRecognitionErrorEvent) => void) | null;
  onend: ((this: BrowserSpeechRecognition, ev: Event) => void) | null;
}

type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export interface UseSpeechRecognitionOptions {
  languageCode: string;
  onFinalTranscript: (transcript: string) => void;
  onInterimTranscript?: (interim: string) => void;
}

export interface UseSpeechRecognitionReturn {
  isSupported: boolean;
  isListening: boolean;
  interimText: string;
  error: string | null;
  elapsedSeconds: number;
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  startListening: () => Promise<void>;
  stopListening: () => void;
  clearError: () => void;
}

function mapRecognitionError(errorCode: string): string | null {
  switch (errorCode) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access was blocked. Allow microphone permissions in your browser address bar and try again.';
    case 'audio-capture':
      return 'No microphone was detected. Connect a microphone and try again.';
    case 'network':
      return 'Speech recognition requires an active internet connection.';
    case 'no-speech':
      return null; // Normal silence timeout; engine auto-restarts
    case 'aborted':
      return null;
    default:
      return 'Speech recognition paused unexpectedly. Click Start to resume.';
  }
}

export function useSpeechRecognition({
  languageCode,
  onFinalTranscript,
  onInterimTranscript,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const shouldListenRef = useRef(false);
  const languageRef = useRef(languageCode);
  const onFinalRef = useRef(onFinalTranscript);
  const onInterimRef = useRef(onInterimTranscript);

  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  languageRef.current = languageCode;
  onFinalRef.current = onFinalTranscript;
  onInterimRef.current = onInterimTranscript;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  const cleanupAudioMeter = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }
    analyserRef.current = null;
  }, []);

  const setupAudioMeter = useCallback(async () => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!shouldListenRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      mediaStreamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      analyser.smoothingTimeConstant = 0.78;
      source.connect(analyser);
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
    } catch {
      // Audio meter is optional visual enhancement; SpeechRecognition handles mic errors directly
    }
  }, []);

  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    setIsListening(false);
    setInterimText('');
    onInterimRef.current?.('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore already stopped
      }
      recognitionRef.current = null;
    }
    cleanupAudioMeter();
  }, [cleanupAudioMeter]);

  const startRecognitionInstance = useCallback(() => {
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRec) return;

    const recognition = new SpeechRec();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;
    recognition.lang = languageRef.current;

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0]?.transcript ?? '';
        if (result.isFinal) {
          if (transcript.trim()) {
            onFinalRef.current(transcript);
          }
        } else {
          interim += transcript;
        }
      }
      setInterimText(interim);
      onInterimRef.current?.(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      if (recognitionRef.current !== recognition) return;
      const mapped = mapRecognitionError(event.error);
      if (mapped) {
        setError(mapped);
        shouldListenRef.current = false;
        setIsListening(false);
        setInterimText('');
        cleanupAudioMeter();
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current !== recognition) return;
      setInterimText('');
      onInterimRef.current?.('');
      if (shouldListenRef.current) {
        try {
          startRecognitionInstance();
        } catch {
          shouldListenRef.current = false;
          setIsListening(false);
          cleanupAudioMeter();
        }
      } else {
        setIsListening(false);
        cleanupAudioMeter();
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      setError('Could not start microphone recognition. Please try again.');
      shouldListenRef.current = false;
      setIsListening(false);
      cleanupAudioMeter();
    }
  }, [cleanupAudioMeter]);

  const startListening = useCallback(async () => {
    if (!isSupported) {
      setError(
        'Live microphone dictation requires Google Chrome, Microsoft Edge, or a Chromium browser with Web Speech support.'
      );
      return;
    }
    setError(null);
    setElapsedSeconds(0);
    shouldListenRef.current = true;
    startRecognitionInstance();
    void setupAudioMeter();
  }, [isSupported, setupAudioMeter, startRecognitionInstance]);

  // Restart recognition cleanly when language changes mid-session
  useEffect(() => {
    if (shouldListenRef.current && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
    }
  }, [languageCode]);

  // Session timer
  useEffect(() => {
    if (!isListening) return;
    const interval = window.setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [isListening]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      shouldListenRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
      cleanupAudioMeter();
    };
  }, [cleanupAudioMeter]);

  return {
    isSupported,
    isListening,
    interimText,
    error,
    elapsedSeconds,
    analyserRef,
    startListening,
    stopListening,
    clearError: () => setError(null),
  };
}
