import { useCallback, useEffect, useRef, useState } from 'react';
import { clampFocusMinutes, playFocusTimerChime } from '../utils/focusTimer';

export type FocusTimerStatus = 'idle' | 'running' | 'paused' | 'completed';

const MINUTES_KEY = 'voicescribe_focus_minutes_v1';
const SOUND_KEY = 'voicescribe_focus_sound_v1';

function loadInitialMinutes(): number {
  try {
    const raw = localStorage.getItem(MINUTES_KEY);
    if (raw) return clampFocusMinutes(Number(raw));
  } catch {
    // Ignore storage error
  }
  return 25;
}

function loadInitialSound(): boolean {
  try {
    const raw = localStorage.getItem(SOUND_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export interface FocusTimerController {
  durationMinutes: number;
  remainingSeconds: number;
  status: FocusTimerStatus;
  soundEnabled: boolean;
  completedSessions: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  setDuration: (minutes: number) => void;
  toggleSound: () => void;
  dismissCompleted: () => void;
}

export function useFocusTimer(
  onSessionComplete?: (durationMinutes: number) => void
): FocusTimerController {
  const [durationMinutes, setDurationMinutes] = useState<number>(() => loadInitialMinutes());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(() => loadInitialMinutes() * 60);
  const [status, setStatus] = useState<FocusTimerStatus>('idle');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => loadInitialSound());
  const [completedSessions, setCompletedSessions] = useState<number>(0);

  const endTimeRef = useRef<number | null>(null);
  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;
  const durationRef = useRef(durationMinutes);
  durationRef.current = durationMinutes;
  const onCompleteRef = useRef(onSessionComplete);
  onCompleteRef.current = onSessionComplete;

  useEffect(() => {
    if (status !== 'running') {
      endTimeRef.current = null;
      return;
    }

    if (endTimeRef.current === null) {
      endTimeRef.current = Date.now() + remainingSeconds * 1000;
    }

    const tick = () => {
      if (endTimeRef.current === null) return;
      const msLeft = endTimeRef.current - Date.now();
      if (msLeft <= 0) {
        endTimeRef.current = null;
        setRemainingSeconds(0);
        setStatus('completed');
        setCompletedSessions((prev) => prev + 1);
        if (soundEnabledRef.current) {
          playFocusTimerChime();
        }
        onCompleteRef.current?.(durationRef.current);
        return;
      }
      setRemainingSeconds(Math.ceil(msLeft / 1000));
    };

    const intervalId = window.setInterval(tick, 250);
    return () => window.clearInterval(intervalId);
  }, [status, remainingSeconds]);

  const start = useCallback(() => {
    setRemainingSeconds((prev) => {
      const target = prev <= 0 || status === 'completed' ? durationRef.current * 60 : prev;
      endTimeRef.current = Date.now() + target * 1000;
      return target;
    });
    setStatus('running');
  }, [status]);

  const pause = useCallback(() => {
    if (endTimeRef.current !== null) {
      const secs = Math.max(1, Math.ceil((endTimeRef.current - Date.now()) / 1000));
      setRemainingSeconds(secs);
      endTimeRef.current = null;
    }
    setStatus('paused');
  }, []);

  const reset = useCallback(() => {
    endTimeRef.current = null;
    setStatus('idle');
    setRemainingSeconds(durationRef.current * 60);
  }, []);

  const setDuration = useCallback((minutes: number) => {
    const clamped = clampFocusMinutes(minutes);
    endTimeRef.current = null;
    durationRef.current = clamped;
    setDurationMinutes(clamped);
    setRemainingSeconds(clamped * 60);
    setStatus('idle');
    try {
      localStorage.setItem(MINUTES_KEY, String(clamped));
    } catch {
      // Ignore
    }
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SOUND_KEY, String(next));
      } catch {
        // Ignore
      }
      return next;
    });
  }, []);

  const dismissCompleted = useCallback(() => {
    endTimeRef.current = null;
    setStatus('idle');
    setRemainingSeconds(durationRef.current * 60);
  }, []);

  return {
    durationMinutes,
    remainingSeconds,
    status,
    soundEnabled,
    completedSessions,
    start,
    pause,
    reset,
    setDuration,
    toggleSound,
    dismissCompleted,
  };
}
