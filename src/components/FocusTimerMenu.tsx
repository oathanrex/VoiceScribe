import { useEffect, useRef, useState } from 'react';
import { Pause, Play, RotateCcw, Timer, Volume2, VolumeX } from 'lucide-react';
import { FocusTimerController } from '../hooks/useFocusTimer';
import {
  clampFocusMinutes,
  computeTimerProgressRatio,
  FOCUS_TIMER_PRESETS,
  formatCountdown,
  playFocusTimerChime,
} from '../utils/focusTimer';

interface FocusTimerMenuProps {
  timer: FocusTimerController;
  compact?: boolean;
}

export function FocusTimerMenu({ timer, compact = false }: FocusTimerMenuProps) {
  const [open, setOpen] = useState(false);
  const [customMinutes, setCustomMinutes] = useState<string>(String(timer.durationMinutes));
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCustomMinutes(String(timer.durationMinutes));
  }, [timer.durationMinutes]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  const isRunning = timer.status === 'running';
  const isPaused = timer.status === 'paused';
  const isActive = isRunning || isPaused;
  const formatted = formatCountdown(timer.remainingSeconds);
  const progressRatio = computeTimerProgressRatio(timer.remainingSeconds, timer.durationMinutes);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(customMinutes);
    const clamped = clampFocusMinutes(parsed);
    timer.setDuration(clamped);
    setCustomMinutes(String(clamped));
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      <button
        type="button"
        data-testid="focus-timer-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={
          isActive
            ? `Focus Timer: ${formatted} remaining`
            : `Focus Timer (${timer.durationMinutes} min)`
        }
        title="Pomodoro Focus Timer"
        className={`inline-flex items-center justify-center gap-1 sm:gap-1.5 min-h-[38px] rounded-control border transition-colors whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          isRunning
            ? 'px-1.5 sm:px-2.5 bg-accent-soft border-primary/35 text-primary font-medium'
            : isPaused
              ? 'px-1.5 sm:px-2.5 bg-well border-border text-foreground font-medium'
              : compact
                ? 'px-2.5 bg-surface/90 border-border text-muted hover:text-foreground'
                : 'px-2 sm:px-2.5 bg-surface border-border text-muted hover:text-foreground hover:border-muted/60'
        }`}
      >
        <Timer className="w-4 h-4 shrink-0" aria-hidden="true" />
        {isActive ? (
          <span className="text-xs font-mono tabular-nums">{formatted}</span>
        ) : (
          <span className={compact ? 'text-xs font-medium' : 'hidden lg:inline text-sm font-medium'}>
            Timer
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Focus timer controls"
          data-testid="focus-timer-popover"
          className="absolute right-0 mt-2 w-72 z-50 bg-surface border border-border rounded-2xl shadow-surface p-4 text-left"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted">
              Focus Timer
            </span>
            <button
              type="button"
              onClick={timer.toggleSound}
              aria-pressed={timer.soundEnabled}
              aria-label={timer.soundEnabled ? 'Mute completion chime' : 'Enable completion chime'}
              title={timer.soundEnabled ? 'Sound on' : 'Sound muted'}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted hover:text-foreground hover:bg-well rounded-control transition-colors"
            >
              {timer.soundEnabled ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-primary" aria-hidden="true" />
                  <span>Sound on</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Muted</span>
                </>
              )}
            </button>
          </div>

          {/* Live Readout + Subtle Progress Track */}
          <div className="mt-3 text-center">
            <div
              data-testid="focus-timer-readout"
              className="font-display text-3xl font-semibold tracking-tight text-foreground tabular-nums"
            >
              {formatted}
            </div>
            <p className="mt-0.5 text-xs text-muted">
              {timer.status === 'running'
                ? 'Deep work session active'
                : timer.status === 'paused'
                  ? 'Session paused'
                  : timer.status === 'completed'
                    ? 'Session complete'
                    : `${timer.durationMinutes} min Pomodoro session`}
            </p>
            <div className="mt-3 h-1.5 w-full rounded-full bg-well overflow-hidden">
              <div
                className="h-full bg-primary transition-[width] duration-300"
                style={{ width: `${Math.round(progressRatio * 100)}%` }}
              />
            </div>
          </div>

          {/* Primary Play/Pause + Reset */}
          <div className="mt-3.5 flex items-center gap-2">
            {isRunning ? (
              <button
                type="button"
                onClick={timer.pause}
                className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs font-medium bg-well hover:bg-well/80 text-foreground border border-border rounded-control transition-colors"
              >
                <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                <span>Pause</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={timer.start}
                className="flex-1 inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3 py-1.5 text-xs font-medium bg-primary hover:bg-primary-hover text-primary-foreground rounded-control transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>{isPaused ? 'Resume' : 'Start Focus'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={timer.reset}
              aria-label="Reset timer"
              title="Reset timer"
              className="w-9 h-[38px] inline-flex items-center justify-center text-muted hover:text-foreground hover:bg-well border border-border rounded-control transition-colors shrink-0"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>

          {/* Session Length Presets */}
          <div className="mt-3.5 pt-3 border-t border-border/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted">Session length</span>
              <button
                type="button"
                onClick={() => playFocusTimerChime()}
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Preview chime
              </button>
            </div>

            <div className="grid grid-cols-4 gap-1.5 mb-2.5">
              {FOCUS_TIMER_PRESETS.map((mins) => {
                const isSelected = timer.durationMinutes === mins;
                return (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => {
                      timer.setDuration(mins);
                      setCustomMinutes(String(mins));
                    }}
                    className={`py-1.5 text-xs font-mono tabular-nums rounded-control border transition-colors ${
                      isSelected
                        ? 'bg-accent-soft border-primary/40 text-primary font-medium'
                        : 'bg-well/60 border-border text-foreground hover:bg-well'
                    }`}
                  >
                    {mins}m
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleApplyCustom} className="flex items-center gap-1.5">
              <input
                type="number"
                min={1}
                max={180}
                step={1}
                value={customMinutes}
                onChange={(e) => setCustomMinutes(e.target.value)}
                aria-label="Custom session minutes"
                className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-well text-foreground border border-border rounded-control focus:outline-none focus:border-primary"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-foreground bg-surface border border-border hover:bg-well rounded-control transition-colors whitespace-nowrap shrink-0"
              >
                Set min
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
