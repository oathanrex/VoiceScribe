import assert from 'node:assert/strict';
import test from 'node:test';
import { suggestNoteTitle } from './autoTitle.ts';

test('suggestNoteTitle extracts concise title from opening words', () => {
  const text =
    'Good morning team, today we are launching the redesigned VoiceScribe workspace.';
  assert.equal(suggestNoteTitle(text), 'Good morning team, today we are');
});

test('suggestNoteTitle stops cleanly at early sentence boundary', () => {
  const text = 'Weekly sprint review. We discussed dictation accuracy and keyboard shortcuts.';
  assert.equal(suggestNoteTitle(text), 'Weekly sprint review');
});

test('suggestNoteTitle preserves short titles and strips trailing commas', () => {
  assert.equal(suggestNoteTitle('Buy milk and eggs'), 'Buy milk and eggs');
  assert.equal(suggestNoteTitle('First item, second item,'), 'First item, second item');
  assert.equal(suggestNoteTitle('   \n\n  '), '');
});

test('suggestNoteTitle preserves Unicode and Hindi text', () => {
  const hindi = 'नमस्ते टीम आज हम नया प्रोजेक्ट शुरू कर रहे हैं';
  assert.equal(suggestNoteTitle(hindi), 'नमस्ते टीम आज हम नया प्रोजेक्ट');
});
