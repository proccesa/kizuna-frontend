import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types';
import type { Cita, CitasFiltros, Cupo, Orden, OrdenesFiltros, OrdenPayload, PacienteResumen, ReglasPreanestesia, ResultadoCargueOrdenes, ResumenOrdenes } from '../types';

export const ordenesService = {
  async listar(filtros: OrdenesFiltros): Promise<PaginatedResponse<Orden>> {
    const { data } = await api.get<PaginatedResponse<Orden>>('/ordenes', { params: toQueryParams(filtros) });
    return data;
  },
  async resumen(): Promise<ResumenOrdenes> {
    const { data } = await api.get<ApiResponse<ResumenOrdenes>>('/ordenes/resumen');
    return data.datos;
  },
  async obtener(id: number): Promise<Orden> {
    const { data } = await api.get<ApiResponse<Orden>>(`/ordenes/${id}`);
    return data.datos;
  },
  async crear(payload: OrdenPayload): Promise<ApiResponse<Orden>> {
    const { data } = await api.post<ApiResponse<Orden>>('/ordenes', payload);
    return data;
  },
  async importar(archivo: File, simular: boolean): Promise<ApiResponse<ResultadoCargueOrdenes>> {
    const form = new FormData();
    form.append('archivo', archivo);
    form.append('simular', simular ? '1' : '0');
    const { data } = await api.post<ApiResponse<ResultadoCargueOrdenes>>('/ordenes/importar', form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 5 * 60_000 });
    return data;
  },
  async cupos(id: number, desde?: string): Promise<Cupo[]> {
    const { data } = await api.get<ApiResponse<Cupo[]>>(`/ordenes/${id}/cupos`, { params: desde ? { desde } : {} });
    return data.datos;
  },
  async reprogramar(id: number, cupo: Pick<Cupo, 'fecha' | 'hora_inicio' | 'especialista_id' | 'sede_id'>): Promise<ApiResponse<Orden>> {
    const { data } = await api.post<ApiResponse<Orden>>(`/ordenes/${id}/reprogramar`, cupo);
    return data;
  },
  async revalidar(id: number): Promise<ApiResponse<Orden>> {
    const { data } = await api.post<ApiResponse<Orden>>(`/ordenes/${id}/revalidar`);
    return data;
  },
  async cancelar(id: number, motivo: string): Promise<ApiResponse<Orden>> {
    const { data } = await api.post<ApiResponse<Orden>>(`/ordenes/${id}/cancelar`, { motivo });
    return data;
  },
  async asignarPendientes(): Promise<ApiResponse<{ revisadas: number; asignadas: number }>> {
    const { data } = await api.post<ApiResponse<{ revisadas: number; asignadas: number }>>('/ordenes/asignar-pendientes');
    return data;
  },
  async paciente(tipo_documento: string, numero_documento: string): Promise<PacienteResumen | null> {
    const { data } = await api.get<ApiResponse<PacienteResumen | null>>('/ordenes/paciente', { params: { tipo_documento, numero_documento } });
    return data.datos;
  },
  async reglas(): Promise<ReglasPreanestesia> {
    const { data } = await api.get<ApiResponse<ReglasPreanestesia>>('/ordenes/reglas');
    return data.datos;
  },
  async guardarReglas(payload: Partial<ReglasPreanestesia>): Promise<ApiResponse<ReglasPreanestesia>> {
    const { data } = await api.put<ApiResponse<ReglasPreanestesia>>('/ordenes/reglas', payload);
    return data;
  },
};

export const citasService = {
  async listar(filtros: CitasFiltros): Promise<PaginatedResponse<Cita>> {
    const { data } = await api.get<PaginatedResponse<Cita>>('/citas', { params: toQueryParams(filtros) });
    return data;
  },
  async cambiarEstado(id: number, estado: 'CANCELADA' | 'NO_ASISTIO', motivo?: string): Promise<ApiResponse<Cita>> {
    const { data } = await api.patch<ApiResponse<Cita>>(`/citas/${id}/estado`, { estado, motivo });
    return data;
  },
};
