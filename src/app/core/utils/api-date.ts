/**
 * Every timestamp the API sends is a UTC instant. Turning one into a Date has two traps:
 *
 * 1. PostgreSQL keeps microseconds (6 decimals); `Date` only parses milliseconds (3).
 * 2. If the string carries no zone designator, the browser reads it as *local* time,
 *    which silently shifts the instant by the viewer's offset.
 *
 * Both are handled here so parsing behaves identically everywhere — the elapsed-time
 * maths and the rendered date must never disagree about which instant they mean.
 */
export function parseApiDate(raw: string | Date | null | undefined): Date | null {
  if (raw == null || raw === '') return null;
  if (raw instanceof Date) return raw;

  const trimmed = raw.replace(/(\.\d{3})\d+/, '$1');
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2})$/.test(trimmed);
  const parsed = new Date(hasZone ? trimmed : `${trimmed}Z`);

  return isNaN(parsed.getTime()) ? null : parsed;
}
