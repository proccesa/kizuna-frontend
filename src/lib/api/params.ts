import type { ListParams } from './types';

/**
 * Convierte filtros del frontend a query params del backend:
 * elimina vacíos y traduce `pagina` al parámetro `page` de Laravel.
 */
export function toQueryParams<T extends ListParams>(params: T): Record<string, string | number> {
  const { pagina, ...rest } = params;
  const query: Record<string, string | number> = {};

  if (pagina) query.page = pagina;

  for (const [key, value] of Object.entries(rest)) {
    if (value === undefined || value === null || value === '') continue;
    query[key] = typeof value === 'boolean' ? (value ? 1 : 0) : (value as string | number);
  }

  return query;
}
