import React from 'react';
import { ChevronRight } from 'lucide-react';
import { WritingScore } from '../utils/writingIntelligence';

interface WritingScoreWidgetProps {
  score: WritingScore;
  onOpenModal: () => void;
  hasContent: boolean;
}

export const WritingScoreWidget: React.FC<WritingScoreWidgetProps> = ({
  score,
  onOpenModal,
  hasContent,
}) => {
  const { overall, issues } = score;

  const getScoreColor = (sc: number) => {
    if (sc >= 85) return { stroke: '#10b981', text: 'text-emerald-600 dark:text-emerald-400' };
    if (sc >= 65) return { stroke: '#f59e0b', text: 'text-amber-600 dark:text-amber-400' };
    return { stroke: '#ef4444', text: 'text-rose-600 dark:text-rose-400' };
  };

  const currentScore = hasContent ? overall : 100;
  const colorInfo = getScoreColor(currentScore);
  const strokeDashoffset = 100 - currentScore;

  return (
    <button
      type="button"
      onClick={onOpenModal}
      data-testid="writing-score-widget"
      title="Writing Intelligence: Click for Full Dashboard & Deep Polish"
      className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-surface/95 backdrop-blur-md border border-border/80 shadow-surface hover:shadow-md hover:border-primary/40 transition-all select-none group focus-visible:outline-2 focus-visible:outline-primary cursor-pointer"
    >
      {/* Mini Score Ring */}
      <div className="relative w-6 h-6 flex items-center justify-center shrink-0">
        <svg className="w-6 h-6 -rotate-90" viewBox="0 0 36 36">
          <path
            className="text-border"
            strokeWidth="3.5"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
          <path
            strokeDasharray="100, 100"
            strokeDashoffset={strokeDashoffset}
            strokeWidth="3.5"
            strokeLinecap="round"
            stroke={colorInfo.stroke}
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        </svg>
        <span className={`absolute text-[10px] font-extrabold font-mono ${colorInfo.text}`}>
          {currentScore}
        </span>
      </div>

      {/* Issues Summary Text */}
      <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
        <span>
          {!hasContent
            ? 'Editorial Ready'
            : issues.length === 0
            ? 'All clear'
            : `${issues.length} ${issues.length === 1 ? 'suggestion' : 'suggestions'}`}
        </span>
        <ChevronRight className="w-3.5 h-3.5 text-muted group-hover:translate-x-0.5 transition-transform" />
      </div>
    </button>
  );
};
