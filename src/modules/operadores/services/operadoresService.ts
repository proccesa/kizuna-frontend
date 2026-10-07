import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types';
import type { Operador, OperadorPayload, OperadoresFiltros } from '../types';

const BASE = '/operadores';

export const operadoresService = {
  async listar(filtros: OperadoresFiltros): Promise<PaginatedResponse<Operador>> {
    const { data } = await api.get<PaginatedResponse<Operador>>(BASE, { params: toQueryParams(filtros) });
    return data;
  },

  async obtener(id: number): Promise<Operador> {
    const { data } = await api.get<ApiResponse<Operador>>(`${BASE}/${id}`);
    return data.datos;
  },

  async crear(payload: OperadorPayload): Promise<ApiResponse<Operador>> {
    const { data } = await api.post<ApiResponse<Operador>>(BASE, payload);
    return data;
  },

  async actualizar(id: number, payload: Partial<OperadorPayload>): Promise<ApiResponse<Operador>> {
    const { data } = await api.put<ApiResponse<Operador>>(`${BASE}/${id}`, payload);
    return data;
  },

  async eliminar(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`${BASE}/${id}`);
    return data;
  },

  async restaurar(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.patch<ApiResponse<null>>(`${BASE}/${id}/restaurar`);
    return data;
  },
};
