import test from 'node:test';
import assert from 'node:assert/strict';
import { autoCorrectText } from './autoCorrect';

test('autoCorrectText fixes common phonetic typos while preserving sentence case', () => {
  const result = autoCorrectText('Teh team will recieve alot of feedback untill tommorow');
  assert.equal(result.text, 'The team will receive a lot of feedback until tomorrow');
  assert.ok(result.changes.length >= 4);
});

test('autoCorrectText fixes missing-apostrophe contractions and standalone lowercase i', () => {
  const result = autoCorrectText('i think youre right and we dont have to worry');
  assert.equal(result.text, "I think you're right and we don't have to worry");
});

test('autoCorrectText does not corrupt valid word ill or CamelCase brand names', () => {
  const result = autoCorrectText('She felt ill while testing VoiceScribe API and PDF export');
  assert.equal(result.text, 'She felt ill while testing VoiceScribe API and PDF export');
  assert.equal(result.changes.length, 0);
});

test('autoCorrectText fixes inverted caps, weekday casing, and post-sentence capitalization', () => {
  const result = autoCorrectText('THis meeting moves to tuesday. please bring your notes');
  assert.equal(result.text, 'This meeting moves to Tuesday. Please bring your notes');
});
