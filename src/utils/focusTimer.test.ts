import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clampFocusMinutes,
  computeTimerProgressRatio,
  formatCountdown,
} from './focusTimer';

test('clampFocusMinutes enforces bounds and handles non-finite values', () => {
  assert.equal(clampFocusMinutes(25), 25);
  assert.equal(clampFocusMinutes(0), 1);
  assert.equal(clampFocusMinutes(-10), 1);
  assert.equal(clampFocusMinutes(999), 180);
  assert.equal(clampFocusMinutes(Number.NaN), 25);
  assert.equal(clampFocusMinutes(14.6), 15);
});

test('formatCountdown formats MM:SS cleanly including triple-digit minutes', () => {
  assert.equal(formatCountdown(1500), '25:00');
  assert.equal(formatCountdown(65), '01:05');
  assert.equal(formatCountdown(0), '00:00');
  assert.equal(formatCountdown(-5), '00:00');
  assert.equal(formatCountdown(6000), '100:00');
});

test('computeTimerProgressRatio tracks elapsed progress between 0 and 1', () => {
  assert.equal(computeTimerProgressRatio(1500, 25), 0);
  assert.equal(computeTimerProgressRatio(750, 25), 0.5);
  assert.equal(computeTimerProgressRatio(0, 25), 1);
  assert.equal(computeTimerProgressRatio(2000, 25), 0);
});
