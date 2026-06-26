/** Formats an ISO timestamp as a readable local date-time, or '—' when absent. */
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) {
    return '—';
  }
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Formats a 0..1 confidence score as a percentage string. */
export function formatConfidence(score: number): string {
  return `${Math.round(score * 100)}%`;
}
