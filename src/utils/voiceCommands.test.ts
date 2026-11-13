import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchVoiceCommand,
  processDictationSegment,
  computeTextMetrics,
  detectPunctuationKeywordInSpeech,
  formatDuration,
  getPunctuationCommands,
  shouldCapitalizeNext,
} from './voiceCommands';

test('matchVoiceCommand matches punctuation with and without add/insert prefix', () => {
  assert.equal(matchVoiceCommand('comma')?.insertText, ',');
  assert.equal(matchVoiceCommand('add comma')?.insertText, ',');
  assert.equal(matchVoiceCommand('insert question mark')?.insertText, '?');
  assert.equal(matchVoiceCommand('पूर्ण विराम')?.insertText, '।');
});

test('matchVoiceCommand matches control commands without requiring prefix', () => {
  assert.equal(matchVoiceCommand('new paragraph')?.action, 'newparagraph');
  assert.equal(matchVoiceCommand('Stop Listening')?.action, 'stop');
  assert.equal(matchVoiceCommand('clear everything')?.action, 'clear');
  assert.equal(matchVoiceCommand('copy to clipboard')?.action, 'copy');
});

test('processDictationSegment handles spacing, punctuation attachment, and capitalization', () => {
  const first = processDictationSegment('hello world', '');
  assert.equal(first.textToAppend, 'Hello world');

  const comma = processDictationSegment('comma', 'Hello world');
  assert.equal(comma.textToAppend, ',');
  assert.equal(comma.matchedCommand, ',');

  const secondPart = processDictationSegment('this is a test', 'Hello world,');
  assert.equal(secondPart.textToAppend, ' this is a test');

  const period = processDictationSegment('full stop', 'Hello world, this is a test');
  assert.equal(period.textToAppend, '.');

  const nextSentence = processDictationSegment('next sentence starts capitalized', 'Hello world, this is a test.');
  assert.equal(nextSentence.textToAppend, ' Next sentence starts capitalized');
});

test('processDictationSegment handles inline voice commands inside continuous speech', () => {
  const result = processDictationSegment('meeting starts at nine comma please join new line thanks', '');
  assert.equal(result.textToAppend, 'Meeting starts at nine, please join\nthanks');
  assert.equal(result.matchedCommand, ',');

  const leadingNewLine = processDictationSegment('new line second item', 'First item');
  assert.equal(leadingNewLine.textToAppend, '\nsecond item');
});

test('processDictationSegment respects enableVoiceCommands = false', () => {
  const result = processDictationSegment('comma', 'Hello', false);
  assert.equal(result.textToAppend, ' comma');
  assert.equal(result.matchedCommand, undefined);
});

test('processDictationSegment applies real-time auto-correction only when enabled', () => {
  const corrected = processDictationSegment('teh meeting with i and tuesday', '', true, true);
  assert.equal(corrected.textToAppend, 'The meeting with I and Tuesday');
  assert.ok(corrected.autoCorrections && corrected.autoCorrections.length >= 3);

  const raw = processDictationSegment('teh meeting with i and tuesday', '', true, false);
  assert.equal(raw.textToAppend, 'Teh meeting with i and tuesday');
  assert.equal(raw.autoCorrections, undefined);
});

test('shouldCapitalizeNext checks trailing sentence punctuation and newlines', () => {
  assert.equal(shouldCapitalizeNext(''), true);
  assert.equal(shouldCapitalizeNext('Hello.'), true);
  assert.equal(shouldCapitalizeNext('Hello?\n'), true);
  assert.equal(shouldCapitalizeNext('Hello,'), false);
});

test('detectPunctuationKeywordInSpeech identifies live spoken punctuation keywords', () => {
  assert.equal(detectPunctuationKeywordInSpeech('Good morning comma'), ',');
  assert.equal(detectPunctuationKeywordInSpeech('Are we ready question mark'), '?');
  assert.equal(detectPunctuationKeywordInSpeech('just ordinary words'), null);
  assert.ok(getPunctuationCommands().length >= 12);
});

test('computeTextMetrics accurately counts words, characters, and sentences', () => {
  assert.deepEqual(computeTextMetrics(''), { words: 0, characters: 0, sentences: 0 });
  assert.deepEqual(computeTextMetrics('Hello world. How are you?'), {
    words: 5,
    characters: 25,
    sentences: 2,
  });
});

test('formatDuration formats mm:ss consistently', () => {
  assert.equal(formatDuration(0), '00:00');
  assert.equal(formatDuration(9), '00:09');
  assert.equal(formatDuration(65), '01:05');
  assert.equal(formatDuration(-5), '00:00');
});
