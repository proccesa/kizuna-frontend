/**
 * Contrato de respuestas de la API Kizuna (RespuestaApiTrait en el backend).
 */
export interface ApiResponse<T> {
  exito: boolean;
  mensaje: string;
  datos: T;
}

export interface Paginacion {
  total: number;
  por_pagina: number;
  pagina_actual: number;
  total_paginas: number;
  desde: number | null;
  hasta: number | null;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  paginacion: Paginacion;
}

export interface ApiErrorBody {
  exito: false;
  mensaje: string;
  errores?: Record<string, string[]> | string | null;
}

/** Parámetros comunes de listados paginados. */
export interface ListParams {
  pagina?: number;
  por_pagina?: number;
  buscar?: string;
  activo?: boolean;
  incluir_eliminados?: boolean;
  solo_eliminados?: boolean;
  ordenar_por?: string;
  orden_direccion?: 'asc' | 'desc';
}
