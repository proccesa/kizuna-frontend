import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ListParams } from '@/lib/api/types';

export type EstadoFiltro = 'todos' | 'activos' | 'inactivos' | 'eliminados';

const ESTADOS: EstadoFiltro[] = ['todos', 'activos', 'inactivos', 'eliminados'];

/**
 * Estado de un listado (página, búsqueda, estado y filtros extra) guardado en la URL,
 * para que los filtros se puedan compartir y sobrevivan a recargas.
 */
export function useListParams<K extends string = never>(extraKeys: readonly K[] = []) {
  const [searchParams, setSearchParams] = useSearchParams();

  const pagina = Math.max(1, Number(searchParams.get('pagina')) || 1);
  const buscar = searchParams.get('buscar') ?? '';
  const estadoParam = searchParams.get('estado') as EstadoFiltro | null;
  const estado: EstadoFiltro = estadoParam && ESTADOS.includes(estadoParam) ? estadoParam : 'todos';

  const extrasKey = extraKeys.map((key) => searchParams.get(key) ?? '').join('|');
  const extras = useMemo(
    () => Object.fromEntries(extraKeys.map((key) => [key, searchParams.get(key) ?? ''])) as Record<K, string>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [extrasKey],
  );

  /** Actualiza parámetros. Cualquier cambio de filtro vuelve a la página 1. */
  const update = useCallback(
    (changes: Partial<Record<'pagina' | 'buscar' | 'estado' | K, string | number>>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (!('pagina' in changes)) next.delete('pagina');
          for (const [key, value] of Object.entries(changes)) {
            const isDefault = value === '' || value === undefined || (key === 'estado' && value === 'todos') || (key === 'pagina' && Number(value) <= 1);
            if (isDefault) next.delete(key);
            else next.set(key, String(value));
          }
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  /** Parámetros listos para la API. */
  const apiParams = useMemo<ListParams>(
    () => ({
      pagina,
      buscar: buscar || undefined,
      activo: estado === 'activos' ? true : estado === 'inactivos' ? false : undefined,
      solo_eliminados: estado === 'eliminados' || undefined,
      por_pagina: 10,
    }),
    [pagina, buscar, estado],
  );

  return { pagina, buscar, estado, extras, update, apiParams };
}
