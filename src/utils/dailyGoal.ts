export interface DailyGoalState {
  dateKey: string;
  targetWords: number;
  /** Baseline word count for pre-existing notes when the day started */
  baselineByNote: Record<string, number>;
  /** Net positive words written today per note ID */
  wordsTodayByNote: Record<string, number>;
  /** Highest target already celebrated on dateKey to avoid duplicate toasts */
  celebratedTarget: number | null;
}

export interface DailyGoalProgress {
  wordsToday: number;
  targetWords: number;
  percentage: number;
  reached: boolean;
}

export const DEFAULT_DAILY_WORD_GOAL = 500;
export const MIN_DAILY_WORD_GOAL = 10;
export const MAX_DAILY_WORD_GOAL = 50000;

export function getLocalDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function clampDailyGoalTarget(target: number): number {
  if (!Number.isFinite(target)) return DEFAULT_DAILY_WORD_GOAL;
  return Math.min(MAX_DAILY_WORD_GOAL, Math.max(MIN_DAILY_WORD_GOAL, Math.round(target)));
}

export function createInitialDailyGoalState(
  existingNotes: { id: string; wordCount: number }[],
  activeDraft: { id: string; wordCount: number },
  targetWords: number = DEFAULT_DAILY_WORD_GOAL,
  dateKey: string = getLocalDateKey()
): DailyGoalState {
  const baselineByNote: Record<string, number> = {};
  for (const note of existingNotes) {
    baselineByNote[note.id] = Math.max(0, note.wordCount);
  }
  if (!(activeDraft.id in baselineByNote)) {
    baselineByNote[activeDraft.id] = Math.max(0, activeDraft.wordCount);
  }

  return {
    dateKey,
    targetWords: clampDailyGoalTarget(targetWords),
    baselineByNote,
    wordsTodayByNote: {},
    celebratedTarget: null,
  };
}

export function ensureCurrentDateState(
  state: DailyGoalState,
  existingNotes: { id: string; wordCount: number }[],
  activeDraft: { id: string; wordCount: number },
  todayKey: string = getLocalDateKey()
): DailyGoalState {
  if (state.dateKey === todayKey) {
    return state;
  }
  return createInitialDailyGoalState(existingNotes, activeDraft, state.targetWords, todayKey);
}

/**
 * Updates today's word contribution for a given note while keeping
 * words earned earlier in other notes intact.
 */
export function recordNoteWordCount(
  state: DailyGoalState,
  noteId: string,
  currentWordCount: number
): DailyGoalState {
  const safeCount = Math.max(0, currentWordCount);
  const baseline = state.baselineByNote[noteId] ?? 0;

  // If the user trimmed an existing pre-day note below its initial baseline,
  // shift baseline down so new typing still counts accurately from the edited point.
  const nextBaseline =
    noteId in state.baselineByNote && safeCount < baseline ? safeCount : baseline;

  const earned = Math.max(0, safeCount - nextBaseline);
  const prevEarned = state.wordsTodayByNote[noteId] ?? 0;
  const prevBaseline = state.baselineByNote[noteId];

  if (prevEarned === earned && prevBaseline === nextBaseline && noteId in state.baselineByNote) {
    return state;
  }

  return {
    ...state,
    baselineByNote:
      prevBaseline === nextBaseline && noteId in state.baselineByNote
        ? state.baselineByNote
        : { ...state.baselineByNote, [noteId]: nextBaseline },
    wordsTodayByNote: {
      ...state.wordsTodayByNote,
      [noteId]: earned,
    },
  };
}

export function updateDailyGoalTarget(state: DailyGoalState, nextTarget: number): DailyGoalState {
  const clamped = clampDailyGoalTarget(nextTarget);
  return {
    ...state,
    targetWords: clamped,
    // Allow a new celebration if the user raises their daily target above what was previously celebrated
    celebratedTarget:
      state.celebratedTarget !== null && clamped > state.celebratedTarget
        ? null
        : state.celebratedTarget,
  };
}

export function computeDailyGoalProgress(state: DailyGoalState): DailyGoalProgress {
  let wordsToday = 0;
  for (const val of Object.values(state.wordsTodayByNote)) {
    if (Number.isFinite(val) && val > 0) {
      wordsToday += val;
    }
  }
  const targetWords = clampDailyGoalTarget(state.targetWords);
  const percentage = Math.min(100, Math.round((wordsToday / targetWords) * 100));
  return {
    wordsToday,
    targetWords,
    percentage,
    reached: wordsToday >= targetWords,
  };
}

export function shouldCelebrateDailyGoal(state: DailyGoalState): boolean {
  const progress = computeDailyGoalProgress(state);
  if (!progress.reached) return false;
  return state.celebratedTarget === null || state.celebratedTarget < progress.targetWords;
}

export function markDailyGoalCelebrated(state: DailyGoalState): DailyGoalState {
  return {
    ...state,
    celebratedTarget: clampDailyGoalTarget(state.targetWords),
  };
}
