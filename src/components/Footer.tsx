import { useEffect, useRef, useState } from 'react';
import { Check, Target } from 'lucide-react';
import { clampDailyGoalTarget, DailyGoalProgress } from '../utils/dailyGoal';

export type LegalSection = 'article' | 'privacy' | 'terms' | 'about';

interface FooterProps {
  dailyGoalProgress: DailyGoalProgress;
  onUpdateDailyGoalTarget: (nextTarget: number) => void;
  onNavigateGuide: (section: LegalSection) => void;
}

const GOAL_PRESETS = [250, 500, 1000, 2000];

export function Footer({
  dailyGoalProgress,
  onUpdateDailyGoalTarget,
  onNavigateGuide,
}: FooterProps) {
  const [goalOpen, setGoalOpen] = useState(false);
  const [draftTarget, setDraftTarget] = useState<string>(String(dailyGoalProgress.targetWords));
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDraftTarget(String(dailyGoalProgress.targetWords));
  }, [dailyGoalProgress.targetWords]);

  useEffect(() => {
    if (!goalOpen) return;
    const handlePointerDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setGoalOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setGoalOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [goalOpen]);

  const radius = 9;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.min(1, Math.max(0, dailyGoalProgress.wordsToday / dailyGoalProgress.targetWords));
  const strokeDashoffset = circumference * (1 - ratio);

  const handleSaveCustomGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = Number(draftTarget);
    const clamped = clampDailyGoalTarget(parsed);
    onUpdateDailyGoalTarget(clamped);
    setDraftTarget(String(clamped));
    setGoalOpen(false);
  };

  return (
    <footer className="border-t border-border/70 bg-surface/60 mt-auto">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-muted">
        <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-2">
          <p>© {new Date().getFullYear()} VoiceScribe. Browser-local speech-to-text workspace.</p>

          {/* Daily Word Count Goal Ring & Popover */}
          <div ref={popoverRef} className="relative">
            <button
              type="button"
              data-testid="daily-goal-trigger"
              onClick={() => setGoalOpen((prev) => !prev)}
              aria-expanded={goalOpen}
              aria-haspopup="dialog"
              aria-label={`Daily word count goal: ${dailyGoalProgress.wordsToday} of ${dailyGoalProgress.targetWords} words`}
              className="inline-flex items-center gap-2 px-2.5 py-1 rounded-control bg-well/70 hover:bg-well border border-border/70 text-foreground transition-colors whitespace-nowrap tabular-nums focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
            >
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                className="shrink-0 -rotate-90"
                aria-hidden="true"
                data-testid="daily-goal-ring"
              >
                <circle
                  cx="12"
                  cy="12"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="text-border"
                />
                <circle
                  cx="12"
                  cy="12"
                  r={radius}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="text-primary transition-[stroke-dashoffset] duration-300"
                />
              </svg>

              <span className="font-medium">
                {dailyGoalProgress.wordsToday} / {dailyGoalProgress.targetWords} words
              </span>

              {dailyGoalProgress.reached && (
                <Check className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
              )}
            </button>

            {goalOpen && (
              <div
                role="dialog"
                aria-label="Set daily word count goal"
                className="absolute bottom-full left-1/2 -translate-x-1/2 md:left-0 md:translate-x-0 mb-2.5 w-72 z-40 bg-surface border border-border rounded-card shadow-surface p-4 text-left"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 font-medium text-foreground text-sm">
                    <Target className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                    <span>Daily Word Goal</span>
                  </div>
                  <span className="text-xs font-mono tabular-nums text-primary font-medium">
                    {dailyGoalProgress.percentage}%
                  </span>
                </div>

                <p className="text-xs text-muted tabular-nums mb-3">
                  {dailyGoalProgress.wordsToday} of {dailyGoalProgress.targetWords} words written today.
                </p>

                <div className="grid grid-cols-4 gap-1.5 mb-3">
                  {GOAL_PRESETS.map((preset) => {
                    const isSelected = dailyGoalProgress.targetWords === preset;
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          onUpdateDailyGoalTarget(preset);
                          setDraftTarget(String(preset));
                          setGoalOpen(false);
                        }}
                        className={`py-1.5 text-xs font-mono tabular-nums rounded-control border transition-colors ${
                          isSelected
                            ? 'bg-accent-soft border-primary/40 text-primary font-medium'
                            : 'bg-well/60 border-border text-foreground hover:bg-well'
                        }`}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>

                <form onSubmit={handleSaveCustomGoal} className="flex items-center gap-2">
                  <input
                    type="number"
                    min={10}
                    max={50000}
                    step={1}
                    value={draftTarget}
                    onChange={(e) => setDraftTarget(e.target.value)}
                    aria-label="Custom daily word target"
                    className="w-full px-2.5 py-1.5 text-xs font-mono tabular-nums bg-well text-foreground border border-border rounded-control focus:outline-none focus:border-primary"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-medium text-primary-foreground bg-primary hover:bg-primary-hover rounded-control transition-colors whitespace-nowrap shrink-0"
                  >
                    Set Goal
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center justify-center gap-5">
          <button
            type="button"
            onClick={() => onNavigateGuide('article')}
            className="hover:text-foreground transition-colors whitespace-nowrap"
          >
            Dictation Guide
          </button>
          <button
            type="button"
            onClick={() => onNavigateGuide('about')}
            className="hover:text-foreground transition-colors whitespace-nowrap"
          >
            About & Contact
          </button>
          <button
            type="button"
            onClick={() => onNavigateGuide('privacy')}
            className="hover:text-foreground transition-colors whitespace-nowrap"
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => onNavigateGuide('terms')}
            className="hover:text-foreground transition-colors whitespace-nowrap"
          >
            Terms of Use
          </button>
        </nav>
      </div>
    </footer>
  );
}
