import assert from 'node:assert/strict';
import test from 'node:test';
import {
  cleanTranscriptText,
  countQueryMatches,
  formatTimestampTag,
  replaceAllMatches,
  replaceFirstMatch,
} from './textTools.ts';

test('formatTimestampTag formats HH:MM bracket tag', () => {
  const sample = new Date(2026, 10, 12, 9, 5);
  assert.equal(formatTimestampTag(sample), '[09:05] ');
});

test('cleanTranscriptText normalizes spacing, punctuation, and sentence capitalization', () => {
  const messy = 'hello   world , how are you ?this is great .\n\n\nnext paragraph starts here.';
  assert.equal(
    cleanTranscriptText(messy),
    'Hello world, how are you? This is great.\n\nNext paragraph starts here.'
  );
});

test('countQueryMatches and replaceAllMatches handle special regex chars safely', () => {
  const text = 'Cost is $10.00 (plus $10.00 tax).';
  assert.equal(countQueryMatches(text, '$10.00'), 2);
  const res = replaceAllMatches(text, '$10.00', '$12.50');
  assert.equal(res.count, 2);
  assert.equal(res.text, 'Cost is $12.50 (plus $12.50 tax).');

  const firstOnly = replaceFirstMatch(text, '$10.00', '$15.00');
  assert.equal(firstOnly.replaced, true);
  assert.equal(firstOnly.text, 'Cost is $15.00 (plus $10.00 tax).');
});
