/**
 * Formats a persisted local save timestamp for compact display next to save status.
 * Shows exact HH:MM:SS local time for today's saves, or short month/day + time for older days.
 */
export function formatLastSyncedTime(
  timestampMs: number | null,
  nowMs: number = Date.now(),
  locale?: string
): string {
  if (timestampMs === null || !Number.isFinite(timestampMs) || timestampMs <= 0) {
    return 'Not yet';
  }

  const savedDate = new Date(timestampMs);
  const nowDate = new Date(nowMs);

  const isSameDay =
    savedDate.getFullYear() === nowDate.getFullYear() &&
    savedDate.getMonth() === nowDate.getMonth() &&
    savedDate.getDate() === nowDate.getDate();

  if (isSameDay) {
    return savedDate.toLocaleTimeString(locale, {
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  return savedDate.toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function formatLastSyncedTooltip(
  timestampMs: number | null,
  locale?: string
): string {
  if (timestampMs === null || !Number.isFinite(timestampMs) || timestampMs <= 0) {
    return 'No local saves recorded yet';
  }
  const formatted = new Date(timestampMs).toLocaleString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
  });
  return `Last saved locally on ${formatted}`;
}
