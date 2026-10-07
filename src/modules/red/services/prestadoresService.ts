import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types';
import type { Prestador, PrestadoresFiltros, PrestadorPayload, Sede, SedePayload } from '../types';

const BASE = '/prestadores';

export const prestadoresService = {
  async listar(filtros: PrestadoresFiltros): Promise<PaginatedResponse<Prestador>> {
    const { data } = await api.get<PaginatedResponse<Prestador>>(BASE, { params: toQueryParams(filtros) });
    return data;
  },

  async obtener(id: number): Promise<Prestador> {
    const { data } = await api.get<ApiResponse<Prestador>>(`${BASE}/${id}`);
    return data.datos;
  },

  async crear(payload: PrestadorPayload): Promise<ApiResponse<Prestador>> {
    const { data } = await api.post<ApiResponse<Prestador>>(BASE, payload);
    return data;
  },

  async actualizar(id: number, payload: Partial<PrestadorPayload>): Promise<ApiResponse<Prestador>> {
    const { data } = await api.put<ApiResponse<Prestador>>(`${BASE}/${id}`, payload);
    return data;
  },

  async eliminar(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`${BASE}/${id}`);
    return data;
  },

  async restaurar(id: number): Promise<ApiResponse<Prestador>> {
    const { data } = await api.patch<ApiResponse<Prestador>>(`${BASE}/${id}/restaurar`);
    return data;
  },

  async crearSede(prestadorId: number, payload: SedePayload): Promise<ApiResponse<Sede>> {
    const { data } = await api.post<ApiResponse<Sede>>(`${BASE}/${prestadorId}/sedes`, payload);
    return data;
  },
};
