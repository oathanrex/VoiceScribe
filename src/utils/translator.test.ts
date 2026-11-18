import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeLanguageCode, POPULAR_TARGET_LANGUAGES } from './translator';

test('normalizeLanguageCode extracts two-letter ISO language code', () => {
  assert.equal(normalizeLanguageCode('en-US'), 'en');
  assert.equal(normalizeLanguageCode('hi-IN'), 'hi');
  assert.equal(normalizeLanguageCode('es-ES'), 'es');
  assert.equal(normalizeLanguageCode('fr-FR'), 'fr');
  assert.equal(normalizeLanguageCode(''), 'en');
});

test('POPULAR_TARGET_LANGUAGES includes key international languages', () => {
  const codes = POPULAR_TARGET_LANGUAGES.map((l) => l.code);
  assert.ok(codes.includes('en'));
  assert.ok(codes.includes('hi'));
  assert.ok(codes.includes('es'));
  assert.ok(codes.includes('fr'));
  assert.ok(codes.includes('de'));
  assert.ok(codes.includes('ja'));
  assert.ok(codes.includes('zh'));
});
