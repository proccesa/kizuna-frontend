import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types';
import type { AgregarPortafolioPayload, Especialidad, EspecialidadPayload, PortafolioFiltros, PortafolioItem } from '../types';

export const especialidadesService = {
  async listar(params: { buscar?: string; solo_eliminados?: boolean } = {}): Promise<Especialidad[]> {
    const { data } = await api.get<ApiResponse<Especialidad[]>>('/especialidades', { params: toQueryParams(params) });
    return data.datos;
  },
  async crear(payload: EspecialidadPayload): Promise<ApiResponse<Especialidad>> {
    const { data } = await api.post<ApiResponse<Especialidad>>('/especialidades', payload);
    return data;
  },
  async actualizar(id: number, payload: Partial<EspecialidadPayload>): Promise<ApiResponse<Especialidad>> {
    const { data } = await api.put<ApiResponse<Especialidad>>(`/especialidades/${id}`, payload);
    return data;
  },
  async eliminar(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`/especialidades/${id}`);
    return data;
  },
  async restaurar(id: number): Promise<ApiResponse<Especialidad>> {
    const { data } = await api.patch<ApiResponse<Especialidad>>(`/especialidades/${id}/restaurar`);
    return data;
  },
  async asignarCups(id: number, cupsId: number): Promise<ApiResponse<Especialidad>> {
    const { data } = await api.post<ApiResponse<Especialidad>>(`/especialidades/${id}/cups/${cupsId}`);
    return data;
  },
  async quitarCups(id: number, cupsId: number): Promise<ApiResponse<Especialidad>> {
    const { data } = await api.delete<ApiResponse<Especialidad>>(`/especialidades/${id}/cups/${cupsId}`);
    return data;
  },
};

export const portafolioService = {
  async listar(filtros: PortafolioFiltros): Promise<PaginatedResponse<PortafolioItem>> {
    const { data } = await api.get<PaginatedResponse<PortafolioItem>>('/portafolio', { params: toQueryParams(filtros) });
    return data;
  },
  async agregar(payload: AgregarPortafolioPayload): Promise<ApiResponse<{ creados: number; existentes: number }>> {
    const { data } = await api.post<ApiResponse<{ creados: number; existentes: number }>>('/portafolio', payload);
    return data;
  },
  async actualizar(id: number, payload: { duracion_minutos?: number; activo?: boolean; tipo_sala?: string | null }): Promise<ApiResponse<PortafolioItem>> {
    const { data } = await api.put<ApiResponse<PortafolioItem>>(`/portafolio/${id}`, payload);
    return data;
  },
  async eliminar(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`/portafolio/${id}`);
    return data;
  },
};
