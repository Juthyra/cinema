/** Shared formatting helpers + card gradients (movies tab and admin view). */

export const GRADIENTS = [
  'linear-gradient(135deg, #1e3a5f, #0f1c2e)',
  'linear-gradient(135deg, #5f1e3a, #2e0f1c)',
  'linear-gradient(135deg, #3a5f1e, #1c2e0f)',
  'linear-gradient(135deg, #5f5a1e, #2e2a0f)',
  'linear-gradient(135deg, #1e5f5a, #0f2e2a)',
];

export function fmtDuration(min: number): string {
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

export function fmtShowtime(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const day =
    d.toDateString() === today.toDateString()
      ? 'Today'
      : d.toDateString() === tomorrow.toDateString()
        ? 'Tomorrow'
        : d.toLocaleDateString(undefined, { weekday: 'short' });
  return `${day} ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}

/** Full date + time, e.g. "Tue 17 Nov, 14:00". */
export function fmtWhen(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}, ${d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`;
}
