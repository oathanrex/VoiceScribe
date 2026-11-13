export interface SpeechSegment {
  index: number;
  text: string;
  start: number;
  end: number;
}

export interface TextChunkSlice {
  chunkIndex: number;
  startOffset: number;
  endOffset: number;
}

export interface LineGlowRect {
  top: number;
  height: number;
}

/**
 * Splits text into speech-safe segments while preserving exact [start, end]
 * character offsets into the original string.
 */
export function splitTextIntoSpeechSegments(
  text: string,
  maxChars = 200
): SpeechSegment[] {
  if (!text || !text.trim()) return [];

  const limit = Math.max(40, maxChars);
  const rawSegments: { text: string; start: number; end: number }[] = [];

  // Iterate over non-empty lines/paragraphs preserving exact indices
  const lineRegex = /[^\r\n]+/g;
  let lineMatch: RegExpExecArray | null;

  while ((lineMatch = lineRegex.exec(text)) !== null) {
    const rawLine = lineMatch[0];
    const lineStart = lineMatch.index;
    const leadingWs = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const trailingWs = rawLine.match(/\s*$/)?.[0].length ?? 0;
    const trimmedEnd = rawLine.length - trailingWs;

    if (leadingWs >= trimmedEnd) continue;

    const cleanLineStart = lineStart + leadingWs;
    const cleanLine = rawLine.slice(leadingWs, trimmedEnd);

    // Find sentence spans inside cleanLine
    const sentenceSpans: { text: string; start: number; end: number }[] = [];
    const boundaryRegex = /(?<=[.!?।])\s+/g;
    let cursor = 0;
    let sepMatch: RegExpExecArray | null;

    while ((sepMatch = boundaryRegex.exec(cleanLine)) !== null) {
      const part = cleanLine.slice(cursor, sepMatch.index).trim();
      if (part) {
        const partOffset = cleanLine.indexOf(part, cursor);
        sentenceSpans.push({
          text: part,
          start: cleanLineStart + partOffset,
          end: cleanLineStart + partOffset + part.length,
        });
      }
      cursor = sepMatch.index + sepMatch[0].length;
    }

    const tail = cleanLine.slice(cursor).trim();
    if (tail) {
      const tailOffset = cleanLine.indexOf(tail, cursor);
      sentenceSpans.push({
        text: tail,
        start: cleanLineStart + tailOffset,
        end: cleanLineStart + tailOffset + tail.length,
      });
    }

    let currentGroup: { text: string; start: number; end: number } | null = null;

    const flushGroup = () => {
      if (currentGroup) {
        rawSegments.push(currentGroup);
        currentGroup = null;
      }
    };

    for (const span of sentenceSpans) {
      if (span.text.length > limit) {
        flushGroup();
        // Split oversized sentence on word boundaries while keeping exact offsets
        const wordRegex = /\S+/g;
        let wordMatch: RegExpExecArray | null;
        let wordGroupStart = -1;
        let wordGroupEnd = -1;

        while ((wordMatch = wordRegex.exec(span.text)) !== null) {
          const wStart = span.start + wordMatch.index;
          const wEnd = wStart + wordMatch[0].length;

          if (wordMatch[0].length > limit) {
            if (wordGroupStart !== -1) {
              rawSegments.push({
                text: text.slice(wordGroupStart, wordGroupEnd),
                start: wordGroupStart,
                end: wordGroupEnd,
              });
              wordGroupStart = -1;
              wordGroupEnd = -1;
            }
            for (let i = 0; i < wordMatch[0].length; i += limit) {
              const s = wStart + i;
              const e = Math.min(wEnd, s + limit);
              rawSegments.push({
                text: text.slice(s, e),
                start: s,
                end: e,
              });
            }
          } else if (wordGroupStart === -1) {
            wordGroupStart = wStart;
            wordGroupEnd = wEnd;
          } else if (wEnd - wordGroupStart <= limit) {
            wordGroupEnd = wEnd;
          } else {
            rawSegments.push({
              text: text.slice(wordGroupStart, wordGroupEnd),
              start: wordGroupStart,
              end: wordGroupEnd,
            });
            wordGroupStart = wStart;
            wordGroupEnd = wEnd;
          }
        }

        if (wordGroupStart !== -1) {
          rawSegments.push({
            text: text.slice(wordGroupStart, wordGroupEnd),
            start: wordGroupStart,
            end: wordGroupEnd,
          });
        }
      } else if (!currentGroup) {
        currentGroup = { ...span };
      } else if (span.end - currentGroup.start <= limit) {
        currentGroup = {
          text: text.slice(currentGroup.start, span.end),
          start: currentGroup.start,
          end: span.end,
        };
      } else {
        flushGroup();
        currentGroup = { ...span };
      }
    }

    flushGroup();
  }

  return rawSegments.map((seg, index) => ({
    index,
    text: seg.text,
    start: seg.start,
    end: seg.end,
  }));
}

/**
 * Maps a segment's offset in plain text onto a sequence of DOM text-node strings
 * by aligning non-whitespace characters. This stays exact across <br>, <p>, <div>,
 * list items, and inline <b>/<i>/<u> formatting boundaries.
 */
export function locateSegmentInTextChunks(
  chunks: string[],
  fullPlainText: string,
  segment: Pick<SpeechSegment, 'start' | 'end' | 'text'>
): TextChunkSlice[] {
  const nonWsBefore = fullPlainText.slice(0, segment.start).replace(/\s+/g, '').length;
  const targetNonWs = segment.text.replace(/\s+/g, '');
  if (!targetNonWs) return [];

  let nonWsSeen = 0;
  let remainingTarget = targetNonWs.length;
  let started = false;
  const slices: TextChunkSlice[] = [];

  for (let chunkIndex = 0; chunkIndex < chunks.length; chunkIndex++) {
    const chunk = chunks[chunkIndex];
    let localStart = -1;
    let localEnd = -1;

    for (let i = 0; i < chunk.length; i++) {
      if (/\s/.test(chunk[i])) {
        if (started) {
          if (localStart === -1) {
            localStart = i;
          }
          localEnd = i + 1;
        }
        continue;
      }

      if (!started) {
        if (nonWsSeen === nonWsBefore) {
          started = true;
          localStart = i;
          localEnd = i + 1;
          remainingTarget -= 1;
          if (remainingTarget <= 0) {
            break;
          }
        } else {
          nonWsSeen += 1;
        }
      } else {
        if (localStart === -1) {
          localStart = i;
        }
        localEnd = i + 1;
        remainingTarget -= 1;
        if (remainingTarget <= 0) {
          break;
        }
      }
    }

    if (localStart !== -1 && localEnd > localStart) {
      slices.push({
        chunkIndex,
        startOffset: localStart,
        endOffset: localEnd,
      });
    }

    if (started && remainingTarget <= 0) {
      break;
    }
  }

  return slices;
}

/**
 * Unwraps any previously injected Active Focus <mark> elements inside an editor root
 * without disturbing surrounding formatting tags.
 */
export function clearSegmentHighlightFromDom(root: HTMLElement): boolean {
  const marks = root.querySelectorAll('mark[data-active-focus-segment="true"]');
  if (marks.length === 0) return false;

  marks.forEach((mark) => {
    const parent = mark.parentNode;
    if (!parent) return;
    while (mark.firstChild) {
      parent.insertBefore(mark.firstChild, mark);
    }
    parent.removeChild(mark);
  });
  root.normalize();
  return true;
}

/**
 * Highlights the active spoken segment in the editor DOM using <mark> wrappers
 * and returns the created mark elements for active-line geometry calculation.
 */
export function applySegmentHighlightToDom(
  root: HTMLElement,
  fullPlainText: string,
  segment: SpeechSegment
): HTMLElement[] {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let node: Node | null;
  while ((node = walker.nextNode()) !== null) {
    if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
      textNodes.push(node as Text);
    }
  }

  if (textNodes.length === 0) return [];

  const slices = locateSegmentInTextChunks(
    textNodes.map((n) => n.nodeValue ?? ''),
    fullPlainText,
    segment
  );

  const createdMarks: HTMLElement[] = [];

  // Process in reverse chunk order so splitting a Text node never shifts earlier offsets
  for (let i = slices.length - 1; i >= 0; i--) {
    const slice = slices[i];
    const textNode = textNodes[slice.chunkIndex];
    const parent = textNode.parentNode;
    if (!parent) continue;

    const value = textNode.nodeValue ?? '';
    const safeStart = Math.max(0, Math.min(slice.startOffset, value.length));
    const safeEnd = Math.max(safeStart, Math.min(slice.endOffset, value.length));
    if (safeEnd <= safeStart) continue;

    let targetNode: Text = textNode;
    if (safeEnd < value.length) {
      targetNode.splitText(safeEnd);
    }
    if (safeStart > 0) {
      targetNode = targetNode.splitText(safeStart);
    }

    const mark = document.createElement('mark');
    mark.setAttribute('data-active-focus-segment', 'true');
    mark.className = 'active-focus-segment';
    parent.insertBefore(mark, targetNode);
    mark.appendChild(targetNode);
    createdMarks.unshift(mark);
  }

  return createdMarks;
}

/**
 * Merges individual client rects from wrapped <mark> elements into clean, full-line
 * vertical bands relative to the editor wrapper element.
 */
export function computeActiveLineRects(
  marks: HTMLElement[],
  containerEl: HTMLElement
): LineGlowRect[] {
  if (marks.length === 0) return [];

  const containerRect = containerEl.getBoundingClientRect();
  const rawLines: { top: number; bottom: number }[] = [];

  for (const mark of marks) {
    const rects = mark.getClientRects();
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.width === 0 && r.height === 0) continue;
      const top = r.top - containerRect.top;
      const bottom = r.bottom - containerRect.top;

      const existing = rawLines.find(
        (line) => Math.abs(line.top - top) <= 8 && Math.abs(line.bottom - bottom) <= 8
      );
      if (existing) {
        existing.top = Math.min(existing.top, top);
        existing.bottom = Math.max(existing.bottom, bottom);
      } else {
        rawLines.push({ top, bottom });
      }
    }
  }

  return rawLines
    .sort((a, b) => a.top - b.top)
    .map((line) => ({
      top: Math.max(0, Math.round(line.top - 2)),
      height: Math.max(20, Math.round(line.bottom - line.top + 4)),
    }));
}
