import test from 'node:test';
import assert from 'node:assert/strict';
import {
  locateSegmentInTextChunks,
  splitTextIntoSpeechSegments,
} from './activeFocus';

test('splitTextIntoSpeechSegments preserves exact start and end offsets across paragraphs', () => {
  const draft =
    'First sentence is short.\n\nSecond paragraph starts here. It also has a second sentence.';
  const segments = splitTextIntoSpeechSegments(draft, 200);

  assert.equal(segments.length, 2);
  assert.equal(segments[0].text, 'First sentence is short.');
  assert.equal(draft.slice(segments[0].start, segments[0].end), segments[0].text);

  assert.equal(
    segments[1].text,
    'Second paragraph starts here. It also has a second sentence.'
  );
  assert.equal(draft.slice(segments[1].start, segments[1].end), segments[1].text);
});

test('splitTextIntoSpeechSegments groups short sentences up to maxChars and splits long sentences cleanly', () => {
  const draft =
    'One. Two. Three sentence is deliberately longer so we force a clean segment boundary between sentences here.';
  const segments = splitTextIntoSpeechSegments(draft, 60);

  assert.ok(segments.length >= 2);
  for (const seg of segments) {
    assert.ok(seg.text.length <= 60, `Expected <= 60 chars, got ${seg.text.length}`);
    assert.equal(draft.slice(seg.start, seg.end), seg.text);
  }
});

test('locateSegmentInTextChunks maps segments across formatted HTML text nodes accurately', () => {
  const plain = 'Hello world.\n\nFocus on this bold part now.';
  const segments = splitTextIntoSpeechSegments(plain, 200);
  assert.equal(segments.length, 2);

  // Simulated DOM text nodes for:
  // <p>Hello world.</p><p>Focus on <b>this bold</b> part now.</p>
  const domChunks = ['Hello world.', 'Focus on ', 'this bold', ' part now.'];
  const slices = locateSegmentInTextChunks(domChunks, plain, segments[1]);

  assert.deepEqual(slices, [
    { chunkIndex: 1, startOffset: 0, endOffset: 9 },
    { chunkIndex: 2, startOffset: 0, endOffset: 9 },
    { chunkIndex: 3, startOffset: 0, endOffset: 10 },
  ]);

  const reconstructed = slices
    .map((s) => domChunks[s.chunkIndex].slice(s.startOffset, s.endOffset))
    .join('');
  assert.equal(reconstructed, 'Focus on this bold part now.');
});

test('locateSegmentInTextChunks handles inline formatting splitting mid-segment', () => {
  const plain = 'Start this longer opening sentence here. Second sentence continues right after.';
  const segments = splitTextIntoSpeechSegments(plain, 45);
  const target = segments.find((s) => s.text.includes('Second'));
  assert.ok(target);

  const domChunks = ['Start this ', 'longer opening sentence here. Second ', 'sentence continues right after.'];
  const slices = locateSegmentInTextChunks(domChunks, plain, target);
  const highlighted = slices
    .map((s) => domChunks[s.chunkIndex].slice(s.startOffset, s.endOffset))
    .join('')
    .trim();
  assert.equal(highlighted, target.text);
});
