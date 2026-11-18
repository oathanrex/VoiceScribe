import { WritingIssue } from './writingIntelligence';
import { locateSegmentInTextChunks } from './activeFocus';

export interface PositionedIssueRect {
  top: number;
  left: number;
  width: number;
  height: number;
  bottom: number;
}

export interface PositionedIssue {
  issue: WritingIssue;
  rects: PositionedIssueRect[];
  primaryRect: PositionedIssueRect;
}

/**
 * Creates a DOM Range corresponding to [start, end] character offsets
 * or an issue within rootEl, using locateSegmentInTextChunks for rock-solid HTML alignment.
 */
export function createRangeFromOffsets(
  rootEl: HTMLElement,
  start: number,
  end: number,
  fullText?: string,
  targetText?: string
): Range | null {
  if (start < 0 || end <= start || !rootEl) return null;

  try {
    if (typeof document === 'undefined') return null;

    const walker = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT);
    const textNodes: Text[] = [];
    let n: Node | null;
    while ((n = walker.nextNode()) !== null) {
      if (n.nodeType === Node.TEXT_NODE && n.nodeValue) {
        textNodes.push(n as Text);
      }
    }

    if (textNodes.length === 0) return null;

    if (fullText && targetText) {
      const chunks = textNodes.map((node) => node.nodeValue ?? '');
      const slices = locateSegmentInTextChunks(chunks, fullText, {
        start,
        end,
        text: targetText,
      });

      if (slices.length > 0) {
        const first = slices[0];
        const last = slices[slices.length - 1];
        const range = document.createRange();
        range.setStart(textNodes[first.chunkIndex], first.startOffset);
        range.setEnd(textNodes[last.chunkIndex], last.endOffset);
        return range;
      }
    }

    // Direct offset fallback if fullText/targetText not provided
    let charIndex = 0;
    let startNode: Text | null = null;
    let startOffset = 0;
    let endNode: Text | null = null;
    let endOffset = 0;

    for (const node of textNodes) {
      const text = node.nodeValue ?? '';
      const nodeLen = text.length;

      if (!startNode && charIndex + nodeLen >= start) {
        startNode = node;
        startOffset = Math.max(0, start - charIndex);
      }
      if (!endNode && charIndex + nodeLen >= end) {
        endNode = node;
        endOffset = Math.min(nodeLen, end - charIndex);
        break;
      }

      charIndex += nodeLen;
    }

    if (startNode && endNode) {
      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);
      return range;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Computes pixel-exact bounding client rects for each writing issue
 * relative to the container element, handling wrapped lines gracefully.
 */
export function computeIssueClientRects(
  issues: WritingIssue[],
  editorEl: HTMLElement,
  containerEl: HTMLElement,
  ignoredIds: Set<string> = new Set(),
  fullText?: string
): PositionedIssue[] {
  if (!editorEl || !containerEl || issues.length === 0) return [];
  if (typeof containerEl.getBoundingClientRect !== 'function') return [];

  const containerRect = containerEl.getBoundingClientRect();
  const results: PositionedIssue[] = [];

  for (const issue of issues) {
    if (ignoredIds.has(issue.id)) continue;

    const start = issue.index;
    const end = issue.index + issue.original.length;
    const range = createRangeFromOffsets(
      editorEl,
      start,
      end,
      fullText ?? editorEl.innerText,
      issue.original
    );
    if (!range) continue;

    const clientRects = Array.from(range.getClientRects());
    if (clientRects.length === 0) continue;

    const mappedRects: PositionedIssueRect[] = clientRects
      .filter((cr) => cr.width > 0 && cr.height > 0)
      .map((cr) => ({
        top: cr.top - containerRect.top,
        left: cr.left - containerRect.left,
        width: cr.width,
        height: cr.height,
        bottom: cr.bottom - containerRect.top,
      }));

    if (mappedRects.length === 0) continue;

    // Primary rect used for positioning the floating popover card
    const primaryRect = mappedRects[0];

    results.push({
      issue,
      rects: mappedRects,
      primaryRect,
    });
  }

  return results;
}
