import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types';
import type { Sede, SedePayload, SedesFiltros } from '../types';

const BASE = '/sedes';

export const sedesService = {
  async listar(filtros: SedesFiltros): Promise<PaginatedResponse<Sede>> {
    const { data } = await api.get<PaginatedResponse<Sede>>(BASE, { params: toQueryParams(filtros) });
    return data;
  },

  async actualizar(id: number, payload: Partial<SedePayload>): Promise<ApiResponse<Sede>> {
    const { data } = await api.put<ApiResponse<Sede>>(`${BASE}/${id}`, payload);
    return data;
  },

  async eliminar(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`${BASE}/${id}`);
    return data;
  },

  async restaurar(id: number): Promise<ApiResponse<Sede>> {
    const { data } = await api.patch<ApiResponse<Sede>>(`${BASE}/${id}/restaurar`);
    return data;
  },
};
