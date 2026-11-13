import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';
import { BarChart2, X } from 'lucide-react';
import { computeDraftAnalytics } from '../utils/wordAnalytics';

interface AnalyticsModalProps {
  open: boolean;
  content: string;
  theme: 'light' | 'dark';
  onClose: () => void;
}

export function AnalyticsModal({ open, content, theme, onClose }: AnalyticsModalProps) {
  const [ignoreStopWords, setIgnoreStopWords] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  const analytics = useMemo(
    () => computeDraftAnalytics(content, { limit: 8, ignoreStopWords }),
    [content, ignoreStopWords]
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // Render D3 horizontal bar chart
  useEffect(() => {
    if (!open) return;
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    const data = analytics.topWords;
    if (data.length === 0) return;

    const margin = { top: 8, right: 36, bottom: 8, left: 104 };
    const width = 440;
    const rowHeight = 30;
    const height = margin.top + margin.bottom + data.length * rowHeight;

    svg.attr('viewBox', `0 0 ${width} ${height}`);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const maxCount = d3.max(data, (d) => d.count) ?? 1;

    const x = d3.scaleLinear().domain([0, maxCount]).range([0, innerWidth]);
    const y = d3
      .scaleBand<string>()
      .domain(data.map((d) => d.word))
      .range([0, innerHeight])
      .padding(0.28);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const isDark = theme === 'dark';
    const rootStyle = getComputedStyle(document.documentElement);
    const barColor =
      rootStyle.getPropertyValue('--pfx-primary').trim() || (isDark ? '#34D399' : '#108A64');
    const trackColor =
      rootStyle.getPropertyValue('--pfx-well').trim() ||
      (isDark ? 'rgba(30, 41, 59, 0.7)' : 'rgba(241, 245, 249, 1)');
    const labelColor =
      rootStyle.getPropertyValue('--pfx-fg').trim() || (isDark ? '#E2E8F0' : '#334155');
    const countColor =
      rootStyle.getPropertyValue('--pfx-muted').trim() || (isDark ? '#94A3B8' : '#64748B');

    // Subtle background track per row
    g.selectAll('.bar-track')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-track')
      .attr('x', 0)
      .attr('y', (d) => y(d.word) ?? 0)
      .attr('width', innerWidth)
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', trackColor);

    // Data bars
    g.selectAll('.bar-fill')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar-fill')
      .attr('x', 0)
      .attr('y', (d) => y(d.word) ?? 0)
      .attr('width', (d) => Math.max(4, x(d.count)))
      .attr('height', y.bandwidth())
      .attr('rx', 4)
      .attr('fill', barColor);

    // Word labels on the left
    g.selectAll('.word-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'word-label')
      .attr('x', -10)
      .attr('y', (d) => (y(d.word) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'end')
      .attr('fill', labelColor)
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .text((d) => (d.word.length > 13 ? `${d.word.slice(0, 12)}…` : d.word));

    // Numeric counts on the right
    g.selectAll('.count-label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'count-label')
      .attr('x', innerWidth + 10)
      .attr('y', (d) => (y(d.word) ?? 0) + y.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', 'start')
      .attr('fill', countColor)
      .attr('font-family', 'var(--font-mono)')
      .attr('font-size', '11px')
      .text((d) => String(d.count));
  }, [open, analytics.topWords, theme]);

  if (!open) return null;

  const formatShortTime = (secs: number, suffix: string) =>
    secs === 0
      ? `0s ${suffix}`
      : secs < 60
        ? `${secs}s ${suffix}`
        : `${Math.ceil(secs / 60)}m ${suffix}`;

  const readingLabel = formatShortTime(analytics.readingTimeSeconds, 'read');
  const speakingLabel = formatShortTime(analytics.speakingTimeSeconds, 'speak');

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 dark:bg-black/60 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="analytics-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-surface border border-border rounded-2xl shadow-surface p-5 sm:p-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id="analytics-modal-title"
              className="font-display text-lg font-semibold tracking-tight text-foreground"
            >
              Draft Analytics
            </h2>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted tabular-nums">
              <span>{analytics.totalWords} words</span>
              <span aria-hidden="true">·</span>
              <span>{analytics.uniqueWords} unique</span>
              <span aria-hidden="true">·</span>
              <span>{analytics.sentences} sentences</span>
              <span aria-hidden="true">·</span>
              <span>{readingLabel}</span>
              <span aria-hidden="true">·</span>
              <span>{speakingLabel}</span>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close analytics"
            className="w-8 h-8 inline-flex items-center justify-center rounded-control text-muted hover:text-foreground hover:bg-well transition-colors shrink-0"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="mt-4 pb-3 border-b border-border/60 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-foreground">
            Most used words
          </span>

          <div
            role="group"
            aria-label="Word filter mode"
            className="inline-flex items-center gap-0.5 p-0.5 bg-well rounded-control"
          >
            <button
              type="button"
              onClick={() => setIgnoreStopWords(true)}
              aria-pressed={ignoreStopWords}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                ignoreStopWords
                  ? 'bg-surface text-foreground shadow-surface'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              Meaningful
            </button>
            <button
              type="button"
              onClick={() => setIgnoreStopWords(false)}
              aria-pressed={!ignoreStopWords}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                !ignoreStopWords
                  ? 'bg-surface text-foreground shadow-surface'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              All words
            </button>
          </div>
        </div>

        {/* D3 Bar Chart / Empty State */}
        <div className="mt-4">
          {analytics.topWords.length === 0 ? (
            <div className="py-10 text-center">
              <BarChart2
                className="w-7 h-7 text-muted/50 mx-auto mb-2.5"
                aria-hidden="true"
              />
              <p className="text-sm text-muted">
                {analytics.totalWords === 0
                  ? 'Start dictating or typing to see word frequency analytics.'
                  : 'Only common stop words found. Switch to “All words” to view them.'}
              </p>
            </div>
          ) : (
            <svg
              ref={svgRef}
              data-testid="analytics-bar-chart"
              role="img"
              aria-label="Bar chart of most frequently used words in the current draft"
              className="w-full h-auto block"
            />
          )}
        </div>
      </div>
    </div>
  );
}
