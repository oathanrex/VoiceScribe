import { useCallback, useEffect, useRef, useState } from 'react';
import { SpeechSegment, splitTextIntoSpeechSegments } from '../utils/activeFocus';

export interface UseTextToSpeechReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  rate: number;
  activeSegment: SpeechSegment | null;
  totalSegments: number;
  setRate: (rate: number) => void;
  speak: (text: string, langCode: string) => void;
  stop: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState(1);
  const [activeSegment, setActiveSegment] = useState<SpeechSegment | null>(null);
  const [totalSegments, setTotalSegments] = useState(0);
  const sessionRef = useRef(0);

  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const stop = useCallback(() => {
    sessionRef.current += 1;
    if (isSupported) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel errors
      }
    }
    setIsSpeaking(false);
    setActiveSegment(null);
    setTotalSegments(0);
  }, [isSupported]);

  const speak = useCallback(
    (text: string, langCode: string) => {
      if (!isSupported || !text.trim()) return;
      const sessionId = ++sessionRef.current;
      try {
        window.speechSynthesis.cancel();
      } catch {
        // Ignore synthesis cancel errors
      }

      const segments = splitTextIntoSpeechSegments(text, 200);
      if (segments.length === 0) return;

      setIsSpeaking(true);
      setTotalSegments(segments.length);

      const speakNext = (index: number) => {
        if (sessionRef.current !== sessionId || index >= segments.length) {
          if (sessionRef.current === sessionId) {
            setIsSpeaking(false);
            setActiveSegment(null);
            setTotalSegments(0);
          }
          return;
        }

        const segment = segments[index];
        setActiveSegment(segment);

        const utterance = new SpeechSynthesisUtterance(segment.text);
        utterance.lang = langCode;
        utterance.rate = rate;
        utterance.onstart = () => {
          if (sessionRef.current === sessionId) {
            setActiveSegment(segment);
          }
        };
        utterance.onend = () => {
          if (sessionRef.current !== sessionId) return;
          if (index + 1 >= segments.length) {
            setIsSpeaking(false);
            setActiveSegment(null);
            setTotalSegments(0);
          } else {
            speakNext(index + 1);
          }
        };
        utterance.onerror = () => {
          if (sessionRef.current === sessionId) {
            setIsSpeaking(false);
            setActiveSegment(null);
            setTotalSegments(0);
          }
        };

        try {
          window.speechSynthesis.speak(utterance);
        } catch {
          if (sessionRef.current === sessionId) {
            setIsSpeaking(false);
            setActiveSegment(null);
            setTotalSegments(0);
          }
        }
      };

      speakNext(0);
    },
    [isSupported, rate]
  );

  useEffect(() => {
    return () => {
      sessionRef.current += 1;
      if (isSupported) {
        try {
          window.speechSynthesis.cancel();
        } catch {
          // Ignore unmount cancel errors
        }
      }
    };
  }, [isSupported]);

  return {
    isSupported,
    isSpeaking,
    rate,
    activeSegment,
    totalSegments,
    setRate,
    speak,
    stop,
  };
}
