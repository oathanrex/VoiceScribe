import test from 'node:test';
import assert from 'node:assert/strict';
import { formatLastSyncedTime, formatLastSyncedTooltip } from './syncStatus';

test('formatLastSyncedTime returns Not yet for null or invalid timestamps', () => {
  assert.equal(formatLastSyncedTime(null), 'Not yet');
  assert.equal(formatLastSyncedTime(0), 'Not yet');
  assert.equal(formatLastSyncedTime(Number.NaN), 'Not yet');
});

test('formatLastSyncedTime formats same-day saves with time including seconds', () => {
  const now = new Date(2026, 10, 13, 14, 5, 30).getTime();
  const saved = new Date(2026, 10, 13, 9, 42, 8).getTime();
  const formatted = formatLastSyncedTime(saved, now, 'en-US');

  assert.match(formatted, /9:42:08/);
});

test('formatLastSyncedTime includes date when save occurred on an earlier day', () => {
  const now = new Date(2026, 10, 13, 14, 5, 30).getTime();
  const yesterday = new Date(2026, 10, 12, 16, 15, 0).getTime();
  const formatted = formatLastSyncedTime(yesterday, now, 'en-US');

  assert.match(formatted, /Nov 12/);
  assert.match(formatted, /4:15/);
});

test('formatLastSyncedTooltip returns descriptive full timestamp string', () => {
  assert.equal(formatLastSyncedTooltip(null), 'No local saves recorded yet');
  const saved = new Date(2026, 10, 13, 9, 42, 8).getTime();
  const tooltip = formatLastSyncedTooltip(saved, 'en-US');
  assert.match(tooltip, /^Last saved locally on /);
  assert.match(tooltip, /2026/);
});
