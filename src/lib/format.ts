const dateFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' });
const dateTimeFormatter = new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium', timeStyle: 'short' });

/** Las fechas sin hora ("2026-10-31") se interpretan en hora local, no en UTC. */
const toDate = (value: string) => new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00` : value);

export function formatDate(value?: string | null): string {
  return value ? dateFormatter.format(toDate(value)) : '—';
}

export function formatDateTime(value?: string | null): string {
  return value ? dateTimeFormatter.format(toDate(value)) : '—';
}

/** "super-admin" → "Super admin" */
export function humanize(value: string): string {
  const text = value.replace(/[-_.]+/g, ' ').trim();
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function initials(name?: string | null): string {
  if (!name) return '?';
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join('');
}

const numberFormatter = new Intl.NumberFormat('es-CO');
const copFormatter = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });

export const formatNumber = (value: number) => numberFormatter.format(value);
export const formatCOP = (value: number) => copFormatter.format(value);
/** Valores de contratos en millones de pesos: 4.850.000.000 → "$4.850 M". */
export const formatCOPCompact = (value: number) => `$${numberFormatter.format(Math.round(value / 1_000_000))} M`;
