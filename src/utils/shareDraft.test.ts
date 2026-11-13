import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSharePayload, shareDraftContent } from './shareDraft';

test('buildSharePayload formats title and body cleanly', () => {
  const withTitle = buildSharePayload('Sprint Notes', 'Ship clean UI.');
  assert.equal(withTitle.title, 'Sprint Notes');
  assert.equal(withTitle.text, 'Ship clean UI.');
  assert.equal(withTitle.combinedText, 'Sprint Notes\n\nShip clean UI.');

  const untitled = buildSharePayload('', 'Quick dictated memo.');
  assert.equal(untitled.title, 'VoiceScribe Note');
  assert.equal(untitled.combinedText, 'Quick dictated memo.');
});

test('shareDraftContent returns empty when both title and content are blank', async () => {
  const outcome = await shareDraftContent('   ', '\n  ');
  assert.equal(outcome, 'empty');
});

test('shareDraftContent uses native Web Share API when available', async () => {
  let received: { title?: string; text?: string } | null = null;
  const outcome = await shareDraftContent('Meeting', 'Action items listed.', {
    shareFn: async (data) => {
      received = data;
    },
  });
  assert.equal(outcome, 'shared');
  assert.deepEqual(received, { title: 'Meeting', text: 'Action items listed.' });
});

test('shareDraftContent returns cancelled on AbortError without falling back', async () => {
  let copied = false;
  const outcome = await shareDraftContent('Meeting', 'Body', {
    shareFn: async () => {
      const err = new Error('User aborted');
      err.name = 'AbortError';
      throw err;
    },
    copyFn: async () => {
      copied = true;
    },
  });
  assert.equal(outcome, 'cancelled');
  assert.equal(copied, false);
});

test('shareDraftContent falls back to clipboard when Web Share is absent or errors', async () => {
  let copiedText = '';
  const outcome = await shareDraftContent('Notes', 'Hello team', {
    shareFn: async () => {
      throw new Error('NotAllowedError');
    },
    copyFn: async (txt) => {
      copiedText = txt;
    },
  });
  assert.equal(outcome, 'copied');
  assert.equal(copiedText, 'Notes\n\nHello team');
});
