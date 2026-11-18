import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_AI_SETTINGS,
  getActiveApiKey,
  saveAISettings,
  loadAISettings,
  type AISettings,
} from './aiTranscriber';

test('loadAISettings returns default settings when no storage', () => {
  const settings = loadAISettings();
  assert.equal(settings.provider, 'groq');
  assert.equal(settings.autoTranscribeChunks, true);
  assert.equal(settings.chunkDurationSeconds, 10);
});

test('getActiveApiKey retrieves correct provider key', () => {
  const config: AISettings = {
    provider: 'groq',
    groqKey: 'gsk_12345',
    openaiKey: 'sk_open_67890',
    geminiKey: 'AIzaSy_abc',
    autoTranscribeChunks: true,
    chunkDurationSeconds: 10,
  };

  assert.equal(getActiveApiKey(config), 'gsk_12345');

  config.provider = 'openai';
  assert.equal(getActiveApiKey(config), 'sk_open_67890');

  config.provider = 'gemini';
  assert.equal(getActiveApiKey(config), 'AIzaSy_abc');
});

test('saveAISettings updates and merges settings', () => {
  const updated = saveAISettings({
    provider: 'gemini',
    geminiKey: 'test_gemini_key',
  });

  assert.equal(updated.provider, 'gemini');
  assert.equal(updated.geminiKey, 'test_gemini_key');
  assert.equal(updated.autoTranscribeChunks, true);
});
