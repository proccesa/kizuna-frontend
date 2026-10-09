import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, ListParams, PaginatedResponse } from '@/lib/api/types';
import type {
  Agenda,
  AgendaPayload,
  Ausencia,
  AusenciaPayload,
  Especialista,
  EspecialistaPayload,
  EspecialistasFiltros,
  ResultadoImportacion,
  ResumenTalento,
} from '../types';

export const especialistasService = {
  async listar(filtros: EspecialistasFiltros): Promise<PaginatedResponse<Especialista>> {
    const { data } = await api.get<PaginatedResponse<Especialista>>('/especialistas', { params: toQueryParams(filtros) });
    return data;
  },
  async resumen(): Promise<ResumenTalento> {
    const { data } = await api.get<ApiResponse<ResumenTalento>>('/especialistas/resumen');
    return data.datos;
  },
  async obtener(id: number): Promise<Especialista> {
    const { data } = await api.get<ApiResponse<Especialista>>(`/especialistas/${id}`);
    return data.datos;
  },
  async crear(payload: EspecialistaPayload): Promise<ApiResponse<Especialista>> {
    const { data } = await api.post<ApiResponse<Especialista>>('/especialistas', payload);
    return data;
  },
  async actualizar(id: number, payload: Partial<EspecialistaPayload>): Promise<ApiResponse<Especialista>> {
    const { data } = await api.put<ApiResponse<Especialista>>(`/especialistas/${id}`, payload);
    return data;
  },
  async eliminar(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`/especialistas/${id}`);
    return data;
  },
  async restaurar(id: number): Promise<ApiResponse<Especialista>> {
    const { data } = await api.patch<ApiResponse<Especialista>>(`/especialistas/${id}/restaurar`);
    return data;
  },
  /** Con `simular` solo valida el archivo y devuelve el reporte. */
  async importar(archivo: File, simular: boolean): Promise<ApiResponse<ResultadoImportacion>> {
    const form = new FormData();
    form.append('archivo', archivo);
    form.append('simular', simular ? '1' : '0');
    const { data } = await api.post<ApiResponse<ResultadoImportacion>>('/especialistas/importar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
};

export const agendasService = {
  async listar(filtros: ListParams & { sede_id?: number; especialidad_id?: number; especialista_id?: number }): Promise<Agenda[]> {
    const { data } = await api.get<ApiResponse<Agenda[]>>('/agendas', { params: toQueryParams(filtros) });
    return data.datos;
  },
  async crear(especialistaId: number, payload: AgendaPayload): Promise<ApiResponse<Agenda>> {
    const { data } = await api.post<ApiResponse<Agenda>>(`/especialistas/${especialistaId}/agendas`, payload);
    return data;
  },
  async actualizar(id: number, payload: Partial<AgendaPayload>): Promise<ApiResponse<Agenda>> {
    const { data } = await api.put<ApiResponse<Agenda>>(`/agendas/${id}`, payload);
    return data;
  },
  async eliminar(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`/agendas/${id}`);
    return data;
  },
  async crearAusencia(especialistaId: number, payload: AusenciaPayload): Promise<ApiResponse<Ausencia>> {
    const { data } = await api.post<ApiResponse<Ausencia>>(`/especialistas/${especialistaId}/ausencias`, payload);
    return data;
  },
  async eliminarAusencia(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`/ausencias/${id}`);
    return data;
  },
};
