// Date-only ('YYYY-MM-DD') values must be handled in local calendar time.
// `new Date('YYYY-MM-DD')` parses as UTC midnight, which shifts the day
// backwards for any negative-UTC-offset timezone (e.g. Brazil, UTC-3) once
// rendered/compared in local time.

export function formatLocalISODate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function todayLocalISODate(): string {
  return formatLocalISODate(new Date());
}

export function addDaysLocalISODate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return formatLocalISODate(d);
}

export function parseLocalDate(dateOnly: string): Date {
  return new Date(`${dateOnly}T00:00:00`);
}
