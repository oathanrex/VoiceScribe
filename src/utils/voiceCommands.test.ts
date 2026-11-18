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
import { getVoiceCommandsForLanguage } from '../data/voiceCommands';

test('matchVoiceCommand matches punctuation with and without add/insert prefix in English', () => {
  assert.equal(matchVoiceCommand('comma')?.insertText, ',');
  assert.equal(matchVoiceCommand('add comma')?.insertText, ',');
  assert.equal(matchVoiceCommand('insert question mark')?.insertText, '?');
  assert.equal(matchVoiceCommand('period')?.insertText, '.');
});

test('matchVoiceCommand matches localized commands in Hindi and other languages', () => {
  assert.equal(matchVoiceCommand('पूर्ण विराम', 'hi')?.insertText, '।');
  assert.equal(matchVoiceCommand('अल्पविराम', 'hi')?.insertText, ',');
  assert.equal(matchVoiceCommand('नई पंक्ति', 'hi')?.action, 'newline');
  assert.equal(matchVoiceCommand('नया अनुच्छेद', 'hi')?.action, 'newparagraph');
  assert.equal(matchVoiceCommand('डिक्टेशन रोको', 'hi')?.action, 'stop');

  // Spanish
  assert.equal(matchVoiceCommand('punto', 'es')?.insertText, '.');
  assert.equal(matchVoiceCommand('nueva línea', 'es')?.action, 'newline');

  // French
  assert.equal(matchVoiceCommand('nouvelle ligne', 'fr')?.action, 'newline');
  assert.equal(matchVoiceCommand('point', 'fr')?.insertText, '.');

  // Bengali
  assert.equal(matchVoiceCommand('দাঁড়ি', 'bn')?.insertText, '।');
  assert.equal(matchVoiceCommand('নতুন লাইন', 'bn')?.action, 'newline');

  // Urdu
  assert.equal(matchVoiceCommand('ختمہ', 'ur')?.insertText, '۔');
});

test('matchVoiceCommand matches control commands without requiring prefix', () => {
  assert.equal(matchVoiceCommand('new paragraph')?.action, 'newparagraph');
  assert.equal(matchVoiceCommand('Stop Listening')?.action, 'stop');
  assert.equal(matchVoiceCommand('clear everything')?.action, 'clear');
  assert.equal(matchVoiceCommand('copy to clipboard')?.action, 'copy');
});

test('processDictationSegment handles spacing, punctuation attachment, and capitalization in English', () => {
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

test('processDictationSegment handles Hindi dictation with Purn Viram and new lines', () => {
  const first = processDictationSegment('नमस्ते भारत', '');
  assert.equal(first.textToAppend, 'नमस्ते भारत');

  const purnviram = processDictationSegment('पूर्ण विराम', 'नमस्ते भारत', true, false, 'hi-IN');
  assert.equal(purnviram.textToAppend, '।');

  const newline = processDictationSegment('नई पंक्ति', 'नमस्ते भारत।', true, false, 'hi-IN');
  assert.equal(newline.textToAppend, '\n');
});

test('processDictationSegment handles continuous multi-lingual speech with inline commands', () => {
  const resultEn = processDictationSegment('meeting starts at nine comma please join new line thanks', '');
  assert.equal(resultEn.textToAppend, 'Meeting starts at nine, please join\nthanks');

  const resultHi = processDictationSegment('हम सब मिलेंगे पूर्ण विराम कृपया समय पर आएं', '', true, false, 'hi-IN');
  assert.equal(resultHi.textToAppend, 'हम सब मिलेंगे। कृपया समय पर आएं');
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

test('shouldCapitalizeNext checks trailing sentence punctuation and newlines across scripts', () => {
  assert.equal(shouldCapitalizeNext(''), true);
  assert.equal(shouldCapitalizeNext('Hello.'), true);
  assert.equal(shouldCapitalizeNext('नमस्ते।'), true);
  assert.equal(shouldCapitalizeNext('اردو۔'), true);
  assert.equal(shouldCapitalizeNext('日本語。'), true);
  assert.equal(shouldCapitalizeNext('Hello?\n'), true);
  assert.equal(shouldCapitalizeNext('Hello,'), false);
});

test('detectPunctuationKeywordInSpeech identifies live spoken punctuation keywords', () => {
  assert.equal(detectPunctuationKeywordInSpeech('Good morning comma'), ',');
  assert.equal(detectPunctuationKeywordInSpeech('Are we ready question mark'), '?');
  assert.equal(detectPunctuationKeywordInSpeech('नमस्ते पूर्ण विराम', 'hi'), '।');
  assert.equal(detectPunctuationKeywordInSpeech('just ordinary words'), null);
  assert.ok(getPunctuationCommands('en').length >= 10);
  assert.ok(getPunctuationCommands('hi').length >= 5);
});

test('getVoiceCommandsForLanguage returns language-specific commands and filters', () => {
  const hiCommands = getVoiceCommandsForLanguage('hi');
  assert.ok(hiCommands.some((c) => c.phrases.includes('पूर्ण विराम')));

  const esCommands = getVoiceCommandsForLanguage('es');
  assert.ok(esCommands.some((c) => c.phrases.includes('punto')));

  const allCommands = getVoiceCommandsForLanguage('all');
  assert.ok(allCommands.length > 50);
});

test('computeTextMetrics accurately counts words, characters, and sentences including Devanagari and Urdu', () => {
  assert.deepEqual(computeTextMetrics(''), { words: 0, characters: 0, sentences: 0 });
  assert.deepEqual(computeTextMetrics('Hello world. How are you?'), {
    words: 5,
    characters: 25,
    sentences: 2,
  });
  assert.deepEqual(computeTextMetrics('नमस्ते भारत। आप कैसे हैं?'), {
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
