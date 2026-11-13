import assert from 'node:assert/strict';
import test from 'node:test';
import {
  computeDailyGoalProgress,
  createInitialDailyGoalState,
  ensureCurrentDateState,
  markDailyGoalCelebrated,
  recordNoteWordCount,
  shouldCelebrateDailyGoal,
  updateDailyGoalTarget,
} from './dailyGoal.ts';

test('dailyGoal tracks new words today without counting pre-existing seed notes', () => {
  let state = createInitialDailyGoalState(
    [{ id: 'seed-1', wordCount: 21 }],
    { id: 'draft-1', wordCount: 0 },
    100,
    '2026-11-12'
  );

  assert.equal(computeDailyGoalProgress(state).wordsToday, 0);

  state = recordNoteWordCount(state, 'draft-1', 45);
  assert.equal(computeDailyGoalProgress(state).wordsToday, 45);
  assert.equal(computeDailyGoalProgress(state).percentage, 45);

  // Creating a second note preserves words earned in draft-1
  state = recordNoteWordCount(state, 'draft-2', 55);
  const progress = computeDailyGoalProgress(state);
  assert.equal(progress.wordsToday, 100);
  assert.equal(progress.reached, true);
  assert.equal(shouldCelebrateDailyGoal(state), true);
});

test('dailyGoal triggers celebration once per target and re-arms if target is raised', () => {
  let state = createInitialDailyGoalState([], { id: 'draft-1', wordCount: 0 }, 50, '2026-11-12');
  state = recordNoteWordCount(state, 'draft-1', 50);
  assert.equal(shouldCelebrateDailyGoal(state), true);

  state = markDailyGoalCelebrated(state);
  assert.equal(shouldCelebrateDailyGoal(state), false);

  // Adding more words doesn't re-trigger
  state = recordNoteWordCount(state, 'draft-1', 80);
  assert.equal(shouldCelebrateDailyGoal(state), false);

  // Raising target above 80 re-arms celebration for the new milestone
  state = updateDailyGoalTarget(state, 120);
  assert.equal(shouldCelebrateDailyGoal(state), false);

  state = recordNoteWordCount(state, 'draft-1', 120);
  assert.equal(shouldCelebrateDailyGoal(state), true);
});

test('dailyGoal resets cleanly on day rollover while preserving target', () => {
  let state = createInitialDailyGoalState([], { id: 'draft-1', wordCount: 0 }, 750, '2026-11-11');
  state = recordNoteWordCount(state, 'draft-1', 300);

  const rolled = ensureCurrentDateState(
    state,
    [{ id: 'draft-1', wordCount: 300 }],
    { id: 'draft-2', wordCount: 0 },
    '2026-11-12'
  );
  assert.equal(rolled.dateKey, '2026-11-12');
  assert.equal(rolled.targetWords, 750);
  assert.equal(computeDailyGoalProgress(rolled).wordsToday, 0);
});
