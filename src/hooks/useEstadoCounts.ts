import type { UseQueryResult } from '@tanstack/react-query';
import type { ListParams, PaginatedResponse } from '@/lib/api/types';
import type { EstadoFiltro } from './useListParams';

type Fetcher<F extends ListParams> = (filtros: F, enabled?: boolean) => UseQueryResult<PaginatedResponse<unknown>>;

/**
 * Totales por estado para las pestañas de filtro. Pide páginas de un solo
 * registro, por lo que el costo es mínimo y los números son exactos.
 */
export function useEstadoCounts<F extends ListParams>(useList: Fetcher<F>, base: F, incluirEliminados: boolean) {
  const todos = useList({ ...base, por_pagina: 1 });
  const activos = useList({ ...base, por_pagina: 1, activo: true });
  const inactivos = useList({ ...base, por_pagina: 1, activo: false });
  const eliminados = useList({ ...base, por_pagina: 1, solo_eliminados: true }, incluirEliminados);

  return {
    todos: todos.data?.paginacion.total,
    activos: activos.data?.paginacion.total,
    inactivos: inactivos.data?.paginacion.total,
    eliminados: incluirEliminados ? eliminados.data?.paginacion.total : undefined,
  } satisfies Partial<Record<EstadoFiltro, number>>;
}
