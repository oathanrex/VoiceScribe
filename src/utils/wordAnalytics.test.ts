import test from 'node:test';
import assert from 'node:assert/strict';
import { computeDraftAnalytics, computeTopWords, tokenizeWords } from './wordAnalytics';

test('tokenizeWords strips punctuation and preserves apostrophes and Unicode', () => {
  assert.deepEqual(tokenizeWords("Hello, world! It's a test — हिन्दी."), [
    'hello',
    'world',
    "it's",
    'a',
    'test',
    'हिन्दी',
  ]);
});

test('computeTopWords filters stop words by default and sorts deterministically', () => {
  const text = 'Voice design is clean. Voice tools need clean design and voice clarity.';
  const top = computeTopWords(text, { limit: 3, ignoreStopWords: true });
  assert.deepEqual(top, [
    { word: 'voice', count: 3 },
    { word: 'clean', count: 2 },
    { word: 'design', count: 2 },
  ]);
});

test('computeTopWords includes stop words when ignoreStopWords is false', () => {
  const text = 'the voice of the user and the team';
  const top = computeTopWords(text, { limit: 2, ignoreStopWords: false });
  assert.deepEqual(top, [
    { word: 'the', count: 3 },
    { word: 'and', count: 1 },
  ]);
});

test('computeDraftAnalytics handles empty and populated drafts', () => {
  assert.deepEqual(computeDraftAnalytics(''), {
    totalWords: 0,
    uniqueWords: 0,
    readingTimeSeconds: 0,
    speakingTimeSeconds: 0,
    sentences: 0,
    paragraphs: 0,
    topWords: [],
  });

  const summary = computeDraftAnalytics('Focus mode keeps focus sharp.\n\nSecond paragraph.');
  assert.equal(summary.totalWords, 7);
  assert.equal(summary.uniqueWords, 6);
  assert.equal(summary.sentences, 2);
  assert.equal(summary.paragraphs, 2);
  assert.ok(summary.speakingTimeSeconds >= 1);
  assert.equal(summary.topWords[0].word, 'focus');
  assert.equal(summary.topWords[0].count, 2);
});
