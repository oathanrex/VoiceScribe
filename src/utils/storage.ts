import {
  clampDailyGoalTarget,
  createInitialDailyGoalState,
  DailyGoalState,
  ensureCurrentDateState,
  getLocalDateKey,
} from './dailyGoal';
import { DraftVersionSnapshot, MAX_DRAFT_VERSIONS } from './versionHistory';

export type TypographySize = 'small' | 'medium' | 'large' | 'xlarge';

export interface SavedNote {
  id: string;
  title: string;
  content: string;
  htmlContent: string;
  languageId: string;
  updatedAt: number;
  wordCount: number;
  pinned?: boolean;
}

const KEYS = {
  NOTES: 'voicescribe_notes_v1',
  DRAFT: 'voicescribe_active_draft_v1',
  LANGUAGE: 'voicescribe_language_v1',
  THEME: 'voicescribe_theme_v1',
  VOICE_COMMANDS_ENABLED: 'voicescribe_voice_commands_v1',
  DAILY_GOAL: 'voicescribe_daily_goal_v1',
  TYPOGRAPHY: 'voicescribe_typography_v1',
  VERSION_HISTORY: 'voicescribe_version_history_v1',
  LAST_SYNCED: 'voicescribe_last_synced_v1',
  AUTO_CORRECT: 'voicescribe_autocorrect_v1',
};

const SEED_NOTES: SavedNote[] = [
  {
    id: 'seed-1',
    title: 'Weekly Product Design Review',
    content:
      'Focus this sprint is simplifying the dictation canvas, removing redundant toolbar clutter, and improving keyboard shortcuts for rapid voice capture.',
    htmlContent:
      '<p>Focus this sprint is simplifying the dictation canvas, removing redundant toolbar clutter, and improving keyboard shortcuts for rapid voice capture.</p>',
    languageId: 'en',
    updatedAt: Date.now() - 1000 * 60 * 60 * 4,
    wordCount: 21,
  },
];

export function loadSavedNotes(): SavedNote[] {
  try {
    const raw = localStorage.getItem(KEYS.NOTES);
    if (!raw) {
      localStorage.setItem(KEYS.NOTES, JSON.stringify(SEED_NOTES));
      return SEED_NOTES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistSavedNotes(notes: SavedNote[]): void {
  try {
    localStorage.setItem(KEYS.NOTES, JSON.stringify(notes));
  } catch {
    // Ignore storage quota errors safely
  }
}

export interface ActiveDraft {
  id: string;
  title: string;
  content: string;
  htmlContent: string;
}

export function loadActiveDraft(): ActiveDraft {
  try {
    const raw = localStorage.getItem(KEYS.DRAFT);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.content === 'string') {
        return {
          id: parsed.id || `note-${Date.now()}`,
          title: typeof parsed.title === 'string' ? parsed.title : '',
          content: parsed.content,
          htmlContent: typeof parsed.htmlContent === 'string' ? parsed.htmlContent : parsed.content,
        };
      }
    }
  } catch {
    // Fallback to empty draft
  }
  return {
    id: `note-${Date.now()}`,
    title: '',
    content: '',
    htmlContent: '',
  };
}

export function persistActiveDraft(draft: ActiveDraft): void {
  try {
    localStorage.setItem(KEYS.DRAFT, JSON.stringify(draft));
  } catch {
    // Ignore storage quota errors
  }
}

export function loadLanguagePreference(): string {
  try {
    return localStorage.getItem(KEYS.LANGUAGE) || 'en';
  } catch {
    return 'en';
  }
}

export function persistLanguagePreference(languageId: string): void {
  try {
    localStorage.setItem(KEYS.LANGUAGE, languageId);
  } catch {
    // Ignore
  }
}

export function loadThemePreference(): 'light' | 'dark' {
  try {
    const stored = localStorage.getItem(KEYS.THEME);
    if (stored === 'dark' || stored === 'light') return stored;
  } catch {
    // Ignore
  }
  return 'light';
}

export function persistThemePreference(theme: 'light' | 'dark'): void {
  try {
    localStorage.setItem(KEYS.THEME, theme);
  } catch {
    // Ignore
  }
}

export function loadVoiceCommandsEnabled(): boolean {
  try {
    const raw = localStorage.getItem(KEYS.VOICE_COMMANDS_ENABLED);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function persistVoiceCommandsEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEYS.VOICE_COMMANDS_ENABLED, String(enabled));
  } catch {
    // Ignore
  }
}

export function loadDailyGoalState(
  existingNotes: { id: string; wordCount: number }[],
  activeDraft: { id: string; wordCount: number }
): DailyGoalState {
  const todayKey = getLocalDateKey();
  try {
    const raw = localStorage.getItem(KEYS.DAILY_GOAL);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<DailyGoalState>;
      if (parsed && typeof parsed.dateKey === 'string' && typeof parsed.targetWords === 'number') {
        const sanitized: DailyGoalState = {
          dateKey: parsed.dateKey,
          targetWords: clampDailyGoalTarget(parsed.targetWords),
          baselineByNote:
            parsed.baselineByNote && typeof parsed.baselineByNote === 'object'
              ? parsed.baselineByNote
              : {},
          wordsTodayByNote:
            parsed.wordsTodayByNote && typeof parsed.wordsTodayByNote === 'object'
              ? parsed.wordsTodayByNote
              : {},
          celebratedTarget:
            typeof parsed.celebratedTarget === 'number' ? parsed.celebratedTarget : null,
        };
        return ensureCurrentDateState(sanitized, existingNotes, activeDraft, todayKey);
      }
    }
  } catch {
    // Fall back to fresh state
  }
  return createInitialDailyGoalState(existingNotes, activeDraft, undefined, todayKey);
}

export function persistDailyGoalState(state: DailyGoalState): void {
  try {
    localStorage.setItem(KEYS.DAILY_GOAL, JSON.stringify(state));
  } catch {
    // Ignore
  }
}

export function loadTypographyPreference(): TypographySize {
  try {
    const raw = localStorage.getItem(KEYS.TYPOGRAPHY);
    if (raw === 'small' || raw === 'medium' || raw === 'large' || raw === 'xlarge') {
      return raw;
    }
  } catch {
    // Ignore
  }
  return 'medium';
}

export function persistTypographyPreference(size: TypographySize): void {
  try {
    localStorage.setItem(KEYS.TYPOGRAPHY, size);
  } catch {
    // Ignore
  }
}

export function loadVersionHistory(): DraftVersionSnapshot[] {
  try {
    const raw = localStorage.getItem(KEYS.VERSION_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (item): item is DraftVersionSnapshot =>
          Boolean(item) &&
          typeof item.id === 'string' &&
          typeof item.content === 'string' &&
          typeof item.savedAt === 'number'
      )
      .slice(0, MAX_DRAFT_VERSIONS);
  } catch {
    return [];
  }
}

export function persistVersionHistory(history: DraftVersionSnapshot[]): void {
  try {
    localStorage.setItem(
      KEYS.VERSION_HISTORY,
      JSON.stringify(history.slice(0, MAX_DRAFT_VERSIONS))
    );
  } catch {
    // Ignore storage quota errors
  }
}

export function loadLastSyncedAt(): number | null {
  try {
    const raw = localStorage.getItem(KEYS.LAST_SYNCED);
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export function persistLastSyncedAt(timestampMs: number): void {
  try {
    if (Number.isFinite(timestampMs) && timestampMs > 0) {
      localStorage.setItem(KEYS.LAST_SYNCED, String(timestampMs));
    }
  } catch {
    // Ignore storage quota errors
  }
}

export function loadAutoCorrectEnabled(): boolean {
  try {
    const raw = localStorage.getItem(KEYS.AUTO_CORRECT);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export function persistAutoCorrectEnabled(enabled: boolean): void {
  try {
    localStorage.setItem(KEYS.AUTO_CORRECT, String(enabled));
  } catch {
    // Ignore storage quota errors
  }
}
