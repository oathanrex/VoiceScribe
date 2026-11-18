import React, { useState, useEffect } from 'react';
import { WritingIssue, IssueCategory } from '../utils/writingIntelligence';
import { PositionedIssue, computeIssueClientRects } from '../utils/editorRange';
import { WritingIssuePopover } from './WritingIssuePopover';

interface WritingOverlayProps {
  issues: WritingIssue[];
  editorEl: HTMLElement | null;
  containerEl: HTMLElement | null;
  fullText?: string;
  onAcceptIssue: (issue: WritingIssue) => void;
  ignoredIssueIds: Set<string>;
  onIgnoreIssue: (issue: WritingIssue) => void;
}

export const WritingOverlay: React.FC<WritingOverlayProps> = ({
  issues,
  editorEl,
  containerEl,
  fullText,
  onAcceptIssue,
  ignoredIssueIds,
  onIgnoreIssue,
}) => {
  const [positionedIssues, setPositionedIssues] = useState<PositionedIssue[]>([]);
  const [activeIssue, setActiveIssue] = useState<PositionedIssue | null>(null);

  // Re-compute issue rects whenever content, issues, or viewport changes
  useEffect(() => {
    if (!editorEl || !containerEl || issues.length === 0) {
      setPositionedIssues([]);
      return;
    }

    const updatePositions = () => {
      const computed = computeIssueClientRects(
        issues,
        editorEl,
        containerEl,
        ignoredIssueIds,
        fullText
      );
      setPositionedIssues(computed);

      // If active issue is no longer in computed issues, close it
      setActiveIssue((prev) => {
        if (!prev) return null;
        const exists = computed.find((p) => p.issue.id === prev.issue.id);
        return exists || null;
      });
    };

    updatePositions();
    const handleResize = () => updatePositions();
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', updatePositions, true);

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', updatePositions, true);
    };
  }, [issues, editorEl, containerEl, ignoredIssueIds, fullText]);

  const getSquiggleStyle = (category: IssueCategory) => {
    let colorHex = '%23ef4444'; // Red default (correctness)
    let hoverBg = 'hover:bg-rose-500/10';

    if (category === 'clarity') {
      colorHex = '%233b82f6'; // Blue (clarity)
      hoverBg = 'hover:bg-blue-500/10';
    } else if (category === 'engagement') {
      colorHex = '%238b5cf6'; // Purple (vocabulary)
      hoverBg = 'hover:bg-purple-500/10';
    } else if (category === 'anti-ai') {
      colorHex = '%2310b981'; // Emerald (anti-ai)
      hoverBg = 'hover:bg-emerald-500/10';
    }

    const svgWave = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 6 3'%3E%3Cpath d='M0 1.5 Q 1.5 0, 3 1.5 T 6 1.5' fill='none' stroke='${colorHex}' stroke-width='1.2' stroke-linecap='round'/%3E%3C/svg%3E")`;

    return {
      style: {
        backgroundImage: svgWave,
        backgroundRepeat: 'repeat-x',
        backgroundPosition: 'bottom',
        backgroundSize: '6px 3px',
      },
      hoverBg,
    };
  };

  return (
    <div
      data-testid="writing-overlay-layer"
      className="absolute inset-0 pointer-events-none z-30 overflow-visible select-none"
    >
      {/* Inline Wavy Squiggle Rects */}
      {positionedIssues.map((pos) => {
        const { style, hoverBg } = getSquiggleStyle(pos.issue.category);
        const isCurrent = activeIssue?.issue.id === pos.issue.id;

        return pos.rects.map((rect, idx) => (
          <button
            key={`${pos.issue.id}-${idx}`}
            type="button"
            style={{
              top: `${rect.top}px`,
              left: `${rect.left}px`,
              width: `${rect.width}px`,
              height: `${rect.height}px`,
              ...style,
            }}
            onClick={(e) => {
              e.stopPropagation();
              setActiveIssue(pos);
            }}
            onMouseEnter={() => {
              if (!activeIssue) {
                setActiveIssue(pos);
              }
            }}
            aria-label={`Writing suggestion: ${pos.issue.title}`}
            title={`${pos.issue.title}: "${pos.issue.original}" → "${pos.issue.replacement}"`}
            className={`absolute pointer-events-auto cursor-pointer rounded-xs transition-colors ${hoverBg} ${
              isCurrent ? 'bg-primary/10' : ''
            }`}
          />
        ));
      })}

      {/* Floating Popover Card */}
      {activeIssue && (
        <WritingIssuePopover
          issue={activeIssue.issue}
          anchorRect={activeIssue.primaryRect}
          onAccept={(iss) => {
            onAcceptIssue(iss);
            setActiveIssue(null);
          }}
          onIgnore={(iss) => {
            onIgnoreIssue(iss);
            setActiveIssue(null);
          }}
          onClose={() => setActiveIssue(null)}
        />
      )}
    </div>
  );
};
