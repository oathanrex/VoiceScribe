import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FONT_FAMILY_OPTIONS,
  getFontFamilyOption,
  parseStoredFontFamily,
  resolveFontFamilyCssVar,
} from './fontFamily';

test('FONT_FAMILY_OPTIONS exposes Sans, Serif, and Mono in order', () => {
  assert.deepEqual(
    FONT_FAMILY_OPTIONS.map((opt) => opt.label),
    ['Sans', 'Serif', 'Mono']
  );
});

test('resolveFontFamilyCssVar returns expected CSS font stacks for --font-sans', () => {
  assert.match(resolveFontFamilyCssVar('sans'), /Instrument Sans/);
  assert.match(resolveFontFamilyCssVar('serif'), /Lora.*serif/);
  assert.match(resolveFontFamilyCssVar('mono'), /Geist Mono.*monospace/);
});

test('parseStoredFontFamily validates persisted values and falls back to sans', () => {
  assert.equal(parseStoredFontFamily('sans'), 'sans');
  assert.equal(parseStoredFontFamily('serif'), 'serif');
  assert.equal(parseStoredFontFamily('mono'), 'mono');
  assert.equal(parseStoredFontFamily(null), 'sans');
  assert.equal(parseStoredFontFamily('comic-sans'), 'sans');
  assert.equal(getFontFamilyOption('serif').id, 'serif');
});
