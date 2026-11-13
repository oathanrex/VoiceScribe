import { useCallback, useEffect, useRef, useState } from 'react';
import { splitSpeechChunks } from '../utils/audioExport';

export interface UseTextToSpeechReturn {
  isSupported: boolean;
  isSpeaking: boolean;
  rate: number;
  setRate: (rate: number) => void;
  speak: (text: string, langCode: string) => void;
  stop: () => void;
}

export function useTextToSpeech(): UseTextToSpeechReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [rate, setRate] = useState(1);
  const sessionRef = useRef(0);

  const isSupported =
    typeof window !== 'undefined' &&
    'speechSynthesis' in window &&
    typeof SpeechSynthesisUtterance !== 'undefined';

  const stop = useCallback(() => {
    sessionRef.current += 1;
    if (!isSupported) return;
    try {
      window.speechSynthesis.cancel();
    } catch {
      // Ignore synthesis cancel errors
    }
    setIsSpeaking(false);
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

      const chunks = splitSpeechChunks(text, 200);
      if (chunks.length === 0) return;

      setIsSpeaking(true);

      const speakNext = (index: number) => {
        if (sessionRef.current !== sessionId || index >= chunks.length) {
          if (sessionRef.current === sessionId) {
            setIsSpeaking(false);
          }
          return;
        }

        const utterance = new SpeechSynthesisUtterance(chunks[index]);
        utterance.lang = langCode;
        utterance.rate = rate;
        utterance.onend = () => {
          if (sessionRef.current !== sessionId) return;
          if (index + 1 >= chunks.length) {
            setIsSpeaking(false);
          } else {
            speakNext(index + 1);
          }
        };
        utterance.onerror = () => {
          if (sessionRef.current === sessionId) {
            setIsSpeaking(false);
          }
        };
        window.speechSynthesis.speak(utterance);
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
    setRate,
    speak,
    stop,
  };
}
