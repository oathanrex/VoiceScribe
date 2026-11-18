import test from 'node:test';
import assert from 'node:assert/strict';
import { createRangeFromOffsets, computeIssueClientRects } from './editorRange';
import { WritingIssue } from './writingIntelligence';

test('createRangeFromOffsets returns null on invalid or out-of-bound ranges', () => {
  assert.equal(createRangeFromOffsets({} as any, -1, 5), null);
  assert.equal(createRangeFromOffsets({} as any, 5, 2), null);
  assert.equal(createRangeFromOffsets(null as any, 0, 5), null);
});

test('computeIssueClientRects degrades safely in node environment without DOM', () => {
  const issues: WritingIssue[] = [
    {
      id: 'test-1',
      category: 'correctness',
      title: 'Typo',
      original: 'teh',
      replacement: 'the',
      description: 'Spelling correction',
      context: 'teh',
      index: 0,
    },
  ];

  // In non-DOM environment, returns empty array gracefully without throwing
  const result = computeIssueClientRects(issues, {} as any, {} as any);
  assert.deepEqual(result, []);
});

test('computeIssueClientRects respects ignoredIssueIds', () => {
  const issues: WritingIssue[] = [
    {
      id: 'ignored-1',
      category: 'clarity',
      title: 'Wordy',
      original: 'in order to',
      replacement: 'to',
      description: 'Be concise',
      context: 'in order to',
      index: 5,
    },
  ];

  const ignored = new Set(['ignored-1']);
  const result = computeIssueClientRects(issues, {} as any, {} as any, ignored);
  assert.deepEqual(result, []);
});
