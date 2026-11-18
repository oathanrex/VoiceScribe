import test from 'node:test';
import assert from 'node:assert/strict';
import {
  phoneticTransliterateWord,
  getTransliterationSuggestions,
  transliterateText,
  isTransliterationSupported,
} from './transliterate';

test('phoneticTransliterateWord converts conversational words to Devanagari', () => {
  assert.equal(phoneticTransliterateWord('namaste'), 'नमस्ते');
  assert.equal(phoneticTransliterateWord('kaise'), 'कैसे');
  assert.equal(phoneticTransliterateWord('kya'), 'क्या');
  assert.equal(phoneticTransliterateWord('hai'), 'है');
  assert.equal(phoneticTransliterateWord('shukriya'), 'शुक्रिया');
  assert.equal(phoneticTransliterateWord('dhanyawad'), 'धन्यवाद');
});

test('getTransliterationSuggestions returns Gboard-style 3 chips', () => {
  const suggestions = getTransliterationSuggestions('namaste');
  assert.equal(suggestions[0], 'नमस्ते');
  assert.ok(suggestions.length >= 2);
});

test('transliterateText preserves punctuation and spaces across full sentences', () => {
  const sentence = 'namaste, aap kaise hain?';
  const converted = transliterateText(sentence);
  assert.ok(converted.includes('नमस्ते'));
  assert.ok(converted.includes('आप'));
  assert.ok(converted.includes('कैसे'));
  assert.ok(converted.includes('हैं'));
  assert.ok(converted.includes(','));
  assert.ok(converted.includes('?'));
});

test('isTransliterationSupported recognizes Indic languages', () => {
  assert.equal(isTransliterationSupported('hi-IN'), true);
  assert.equal(isTransliterationSupported('mr-IN'), true);
  assert.equal(isTransliterationSupported('en-US'), false);
  assert.equal(isTransliterationSupported('es-ES'), false);
});
