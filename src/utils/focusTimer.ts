export const FOCUS_TIMER_PRESETS = [15, 25, 45, 60] as const;

export const MIN_FOCUS_MINUTES = 1;
export const MAX_FOCUS_MINUTES = 180;

export function clampFocusMinutes(minutes: number): number {
  if (!Number.isFinite(minutes)) return 25;
  return Math.min(MAX_FOCUS_MINUTES, Math.max(MIN_FOCUS_MINUTES, Math.round(minutes)));
}

export function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const mins = Math.floor(safe / 60);
  const secs = safe % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function computeTimerProgressRatio(
  remainingSeconds: number,
  durationMinutes: number
): number {
  const total = Math.max(1, clampFocusMinutes(durationMinutes) * 60);
  const ratio = 1 - Math.max(0, remainingSeconds) / total;
  return Math.min(1, Math.max(0, ratio));
}

/**
 * Plays a gentle two-note harmonic chime using Web Audio API.
 * Safe no-op in headless or restricted environments without AudioContext.
 */
export function playFocusTimerChime(): void {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const notes = [
      { freq: 523.25, start: 0, duration: 0.45 }, // C5
      { freq: 659.25, start: 0.16, duration: 0.65 }, // E5
    ];

    notes.forEach(({ freq, start, duration }) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + start);

      gain.gain.setValueAtTime(0.0001, now + start);
      gain.gain.exponentialRampToValueAtTime(0.14, now + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + duration + 0.05);
    });

    window.setTimeout(() => {
      ctx.close().catch(() => {});
    }, 1200);
  } catch {
    // Ignore audio context autoplay/platform errors safely
  }
}
