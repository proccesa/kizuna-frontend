import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types';
import type { Historia, HistoriasFiltros, Plantilla, Respuestas } from '../types';

export const historiasService = {
  async plantillas(): Promise<Plantilla[]> {
    const { data } = await api.get<ApiResponse<Plantilla[]>>('/plantillas-hc');
    return data.datos;
  },
  async listar(filtros: HistoriasFiltros): Promise<PaginatedResponse<Historia>> {
    const { data } = await api.get<PaginatedResponse<Historia>>('/historias', { params: toQueryParams(filtros) });
    return data;
  },
  async obtener(id: number): Promise<Historia> {
    const { data } = await api.get<ApiResponse<Historia>>(`/historias/${id}`);
    return data.datos;
  },
  async abrir(payload: { cita_id?: number; paciente_id?: number; orden_id?: number; plantilla?: string }): Promise<ApiResponse<Historia>> {
    const { data } = await api.post<ApiResponse<Historia>>('/historias', payload);
    return data;
  },
  async guardar(id: number, respuestas: Respuestas): Promise<ApiResponse<Historia>> {
    const { data } = await api.put<ApiResponse<Historia>>(`/historias/${id}`, { respuestas });
    return data;
  },
  async finalizar(id: number, respuestas: Respuestas): Promise<ApiResponse<Historia>> {
    const { data } = await api.post<ApiResponse<Historia>>(`/historias/${id}/finalizar`, { respuestas });
    return data;
  },
  async anular(id: number, motivo: string): Promise<ApiResponse<Historia>> {
    const { data } = await api.post<ApiResponse<Historia>>(`/historias/${id}/anular`, { motivo });
    return data;
  },
};
