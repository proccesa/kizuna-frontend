import { api } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { Cirugia, Corrida, EnCola, ResumenProgramacion } from '../types';

export const programacionService = {
  async resumen(): Promise<ResumenProgramacion> {
    const { data } = await api.get<ApiResponse<ResumenProgramacion>>('/programacion/resumen');
    return data.datos;
  },
  async cola(): Promise<EnCola[]> {
    const { data } = await api.get<ApiResponse<EnCola[]>>('/programacion/cola');
    return data.datos;
  },
  async propuesta(): Promise<Corrida | null> {
    const { data } = await api.get<ApiResponse<Corrida | null>>('/programacion/propuesta');
    return data.datos;
  },
  async programa(desde: string, hasta: string, sedeId?: number): Promise<Cirugia[]> {
    const { data } = await api.get<ApiResponse<Cirugia[]>>('/programacion/programa', { params: { desde, hasta, ...(sedeId ? { sede_id: sedeId } : {}) } });
    return data.datos;
  },
  async generar(payload: { desde: string; hasta: string; sede_ids?: number[] }): Promise<ApiResponse<Corrida>> {
    const { data } = await api.post<ApiResponse<Corrida>>('/programacion/generar', payload, { timeout: 5 * 60_000 });
    return data;
  },
  async aprobar(corridaId: number): Promise<ApiResponse<Corrida>> {
    const { data } = await api.post<ApiResponse<Corrida>>(`/programacion/corridas/${corridaId}/aprobar`);
    return data;
  },
  async descartar(corridaId: number): Promise<ApiResponse<Corrida>> {
    const { data } = await api.post<ApiResponse<Corrida>>(`/programacion/corridas/${corridaId}/descartar`);
    return data;
  },
  async rechazar(id: number, motivo: string): Promise<ApiResponse<Cirugia>> {
    const { data } = await api.post<ApiResponse<Cirugia>>(`/programacion/cirugias/${id}/rechazar`, { motivo });
    return data;
  },
  async cancelar(id: number, motivo: string): Promise<ApiResponse<Cirugia>> {
    const { data } = await api.post<ApiResponse<Cirugia>>(`/programacion/cirugias/${id}/cancelar`, { motivo });
    return data;
  },
  async realizar(id: number): Promise<ApiResponse<{ cirugia: Cirugia; avisos: string[] }>> {
    const { data } = await api.post<ApiResponse<{ cirugia: Cirugia; avisos: string[] }>>(`/programacion/cirugias/${id}/realizar`);
    return data;
  },
};
