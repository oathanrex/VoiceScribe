import React, { useEffect, useRef } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import { WritingIssue, IssueCategory } from '../utils/writingIntelligence';
import { PositionedIssueRect } from '../utils/editorRange';

interface WritingIssuePopoverProps {
  issue: WritingIssue;
  anchorRect: PositionedIssueRect;
  onAccept: (issue: WritingIssue) => void;
  onIgnore: (issue: WritingIssue) => void;
  onClose: () => void;
}

export const WritingIssuePopover: React.FC<WritingIssuePopoverProps> = ({
  issue,
  anchorRect,
  onAccept,
  onIgnore,
  onClose,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside or pressing Escape
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') onAccept(issue);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [issue, onAccept, onClose]);

  const getBadgeInfo = (cat: IssueCategory) => {
    switch (cat) {
      case 'correctness':
        return {
          label: 'Correctness',
          classes: 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30',
        };
      case 'clarity':
        return {
          label: 'Clarity',
          classes: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30',
        };
      case 'engagement':
        return {
          label: 'Vocabulary',
          classes: 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30',
        };
      case 'anti-ai':
        return {
          label: 'Anti-AI Guardian',
          classes: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
        };
    }
  };

  const badge = getBadgeInfo(issue.category);

  // Position calculation: prefer displaying above anchor word, flip below if too close to top
  const isNearTop = anchorRect.top < 140;
  const top = isNearTop ? anchorRect.bottom + 8 : Math.max(10, anchorRect.top - 145);
  const left = Math.max(10, Math.min(anchorRect.left, 550));

  return (
    <div
      ref={popoverRef}
      role="tooltip"
      aria-label={`Writing suggestion: ${issue.title}`}
      data-testid="writing-issue-popover"
      style={{ top: `${top}px`, left: `${left}px` }}
      className="absolute z-50 pointer-events-auto w-76 sm:w-84 bg-surface border border-border/80 rounded-2xl shadow-2xl p-4 flex flex-col gap-2.5 animate-scale-up backdrop-blur-md select-none"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header: Category Badge + Title + Close Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badge.classes} shrink-0`}
          >
            {badge.label}
          </span>
          <span className="text-xs font-semibold text-foreground truncate">{issue.title}</span>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close suggestion"
          className="p-1 rounded-lg hover:bg-surface-hover text-muted hover:text-foreground transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Diff / Replacement Box */}
      <div className="flex items-center gap-2 p-2 rounded-xl bg-well border border-border/60">
        <span className="line-through text-rose-500 dark:text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded text-xs font-mono font-medium max-w-[130px] truncate">
          {issue.original}
        </span>
        <ArrowRight className="w-3.5 h-3.5 text-muted shrink-0" />
        <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded text-xs font-mono font-bold max-w-[130px] truncate">
          {issue.replacement || '(remove)'}
        </span>
      </div>

      {/* Description / Rule Context */}
      <p className="text-xs text-muted leading-relaxed line-clamp-3">{issue.description}</p>

      {/* Actions: Accept & Dismiss */}
      <div className="flex items-center justify-between pt-1 border-t border-border/40 mt-1">
        <button
          type="button"
          onClick={() => onAccept(issue)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium shadow-sm transition-all focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-emerald-600"
        >
          <Check className="w-3.5 h-3.5" />
          <span>Accept</span>
          <kbd className="text-[10px] opacity-75 font-mono ml-0.5">↵</kbd>
        </button>

        <button
          type="button"
          onClick={() => onIgnore(issue)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl hover:bg-surface-hover text-muted hover:text-foreground text-xs font-medium transition-colors"
        >
          <span>Dismiss</span>
        </button>
      </div>
    </div>
  );
};
