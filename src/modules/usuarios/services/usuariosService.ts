import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types';
import type { Usuario, UsuarioPayload, UsuariosFiltros } from '../types';

const BASE = '/usuarios';

export const usuariosService = {
  async listar(filtros: UsuariosFiltros): Promise<PaginatedResponse<Usuario>> {
    const { data } = await api.get<PaginatedResponse<Usuario>>(BASE, { params: toQueryParams(filtros) });
    return data;
  },

  async obtener(id: number): Promise<Usuario> {
    const { data } = await api.get<ApiResponse<Usuario>>(`${BASE}/${id}`);
    return data.datos;
  },

  async crear(payload: UsuarioPayload): Promise<ApiResponse<Usuario>> {
    const { data } = await api.post<ApiResponse<Usuario>>(BASE, payload);
    return data;
  },

  async actualizar(id: number, payload: Partial<UsuarioPayload>): Promise<ApiResponse<Usuario>> {
    const { data } = await api.put<ApiResponse<Usuario>>(`${BASE}/${id}`, payload);
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

  async cambiarEstado(id: number, activo: boolean): Promise<ApiResponse<Usuario>> {
    const { data } = await api.patch<ApiResponse<Usuario>>(`${BASE}/${id}/estado`, { activo });
    return data;
  },
};
