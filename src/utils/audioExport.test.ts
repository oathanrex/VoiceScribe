import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSpeechExportText,
  isSpeechAudioExportSupported,
  pickSupportedAudioFormat,
  splitSpeechChunks,
} from './audioExport';

test('isSpeechAudioExportSupported verifies all required Web APIs', () => {
  assert.equal(
    isSpeechAudioExportSupported({
      hasWindow: true,
      hasSpeechSynthesis: true,
      hasSpeechSynthesisUtterance: true,
      hasMediaRecorder: true,
      hasDisplayMedia: true,
    }),
    true
  );

  assert.equal(
    isSpeechAudioExportSupported({
      hasWindow: true,
      hasSpeechSynthesis: true,
      hasSpeechSynthesisUtterance: true,
      hasMediaRecorder: true,
      hasDisplayMedia: false,
    }),
    false
  );

  assert.equal(
    isSpeechAudioExportSupported({
      hasWindow: true,
      hasSpeechSynthesis: false,
      hasSpeechSynthesisUtterance: true,
      hasMediaRecorder: true,
      hasDisplayMedia: true,
    }),
    false
  );

  // Without DOM globals in Node, default check returns false cleanly without throwing
  assert.equal(isSpeechAudioExportSupported(), false);
});

test('pickSupportedAudioFormat prefers opus webm, then webm, ogg, mp4, or safe fallback', () => {
  assert.deepEqual(
    pickSupportedAudioFormat((mime) => mime === 'audio/webm;codecs=opus' || mime === 'audio/webm'),
    { mimeType: 'audio/webm;codecs=opus', extension: 'webm' }
  );

  assert.deepEqual(
    pickSupportedAudioFormat((mime) => mime === 'audio/ogg;codecs=opus'),
    { mimeType: 'audio/ogg;codecs=opus', extension: 'ogg' }
  );

  assert.deepEqual(
    pickSupportedAudioFormat((mime) => mime === 'audio/mp4'),
    { mimeType: 'audio/mp4', extension: 'm4a' }
  );

  assert.deepEqual(
    pickSupportedAudioFormat(() => false),
    { mimeType: '', extension: 'webm' }
  );

  assert.deepEqual(pickSupportedAudioFormat(undefined), { mimeType: '', extension: 'webm' });
});

test('buildSpeechExportText combines title and content with natural pause punctuation', () => {
  assert.equal(
    buildSpeechExportText('Weekly Standup', 'Finished the audio export flow.'),
    'Weekly Standup. Finished the audio export flow.'
  );
  assert.equal(
    buildSpeechExportText('Any questions?', 'Let us review the notes.'),
    'Any questions? Let us review the notes.'
  );
  assert.equal(buildSpeechExportText('', 'Body only text'), 'Body only text');
  assert.equal(buildSpeechExportText('Title only', '   '), 'Title only');
  assert.equal(buildSpeechExportText('  ', '  '), '');
});

test('splitSpeechChunks breaks long drafts cleanly into bounded speech-safe chunks', () => {
  const longText =
    'First sentence is concise. Second sentence explains how VoiceScribe keeps drafts organized in plain language. ' +
    'Third sentence adds extra detail so the overall paragraph exceeds two hundred characters by a comfortable margin and splits at sentence boundaries.';

  const chunks = splitSpeechChunks(longText, 120);
  assert.ok(chunks.length >= 2);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 120, `Expected chunk <= 120 chars, got ${chunk.length}`);
  }
  assert.equal(chunks.join(' '), longText);
});

test('splitSpeechChunks splits oversized single sentences on word boundaries', () => {
  const words = Array.from({ length: 30 }, (_, i) => `word${i}`).join(' ');
  const chunks = splitSpeechChunks(words, 60);
  assert.ok(chunks.length >= 3);
  for (const chunk of chunks) {
    assert.ok(chunk.length <= 60);
  }
  assert.equal(chunks.join(' '), words);
});
