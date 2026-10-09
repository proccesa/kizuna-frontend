import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, ListParams, PaginatedResponse } from '@/lib/api/types';
import type {
  Contrato,
  ContratoCups,
  ContratoPayload,
  ContratosFiltros,
  EntidadesFiltros,
  Entidad,
  EntidadPayload,
  ModoCargue,
  Paciente,
  PacientesFiltros,
  Poblacion,
  PoblacionesFiltros,
  PoblacionPayload,
  ResultadoCarguePoblacion,
  ResumenContratos,
  ResumenPoblaciones,
} from '../types';

/** CRUD estándar con soft delete y restauración. */
function crud<T, P, F extends ListParams>(base: string) {
  return {
    async listar(filtros: F): Promise<PaginatedResponse<T>> {
      const { data } = await api.get<PaginatedResponse<T>>(base, { params: toQueryParams(filtros) });
      return data;
    },
    async obtener(id: number): Promise<T> {
      const { data } = await api.get<ApiResponse<T>>(`${base}/${id}`);
      return data.datos;
    },
    async crear(payload: P): Promise<ApiResponse<T>> {
      const { data } = await api.post<ApiResponse<T>>(base, payload);
      return data;
    },
    async actualizar(id: number, payload: Partial<P>): Promise<ApiResponse<T>> {
      const { data } = await api.put<ApiResponse<T>>(`${base}/${id}`, payload);
      return data;
    },
    async eliminar(id: number): Promise<ApiResponse<null>> {
      const { data } = await api.delete<ApiResponse<null>>(`${base}/${id}`);
      return data;
    },
    async restaurar(id: number): Promise<ApiResponse<T>> {
      const { data } = await api.patch<ApiResponse<T>>(`${base}/${id}/restaurar`);
      return data;
    },
  };
}

export const entidadesService = crud<Entidad, EntidadPayload, EntidadesFiltros>('/entidades');

export const contratosService = {
  ...crud<Contrato, ContratoPayload, ContratosFiltros>('/contratos'),
  async resumen(): Promise<ResumenContratos> {
    const { data } = await api.get<ApiResponse<ResumenContratos>>('/contratos/resumen');
    return data.datos;
  },
  async cups(id: number, filtros: ListParams & { sin_portafolio?: boolean }): Promise<PaginatedResponse<ContratoCups>> {
    const { data } = await api.get<PaginatedResponse<ContratoCups>>(`/contratos/${id}/cups`, { params: toQueryParams(filtros) });
    return data;
  },
  async agregarCups(id: number, payload: { cups_ids: number[]; cantidad?: number | null; tarifa?: number | null }): Promise<ApiResponse<{ creados: number; existentes: number }>> {
    const { data } = await api.post<ApiResponse<{ creados: number; existentes: number }>>(`/contratos/${id}/cups`, payload);
    return data;
  },
  async actualizarCups(id: number, cupsId: number, payload: { cantidad?: number | null; tarifa?: number | null }): Promise<ApiResponse<boolean>> {
    const { data } = await api.put<ApiResponse<boolean>>(`/contratos/${id}/cups/${cupsId}`, payload);
    return data;
  },
  async quitarCups(id: number, cupsId: number): Promise<ApiResponse<boolean>> {
    const { data } = await api.delete<ApiResponse<boolean>>(`/contratos/${id}/cups/${cupsId}`);
    return data;
  },
};

export const poblacionesService = {
  ...crud<Poblacion, PoblacionPayload, PoblacionesFiltros>('/poblaciones'),
  async resumen(): Promise<ResumenPoblaciones> {
    const { data } = await api.get<ApiResponse<ResumenPoblaciones>>('/poblaciones/resumen');
    return data.datos;
  },
  async pacientes(id: number, filtros: PacientesFiltros): Promise<PaginatedResponse<Paciente>> {
    const { data } = await api.get<PaginatedResponse<Paciente>>(`/poblaciones/${id}/pacientes`, { params: toQueryParams(filtros) });
    return data;
  },
  /** Con `simular` solo valida el archivo y devuelve el reporte. */
  async cargar(id: number, archivo: File, simular: boolean, modo: ModoCargue): Promise<ApiResponse<ResultadoCarguePoblacion>> {
    const form = new FormData();
    form.append('archivo', archivo);
    form.append('simular', simular ? '1' : '0');
    form.append('modo', modo);
    const { data } = await api.post<ApiResponse<ResultadoCarguePoblacion>>(`/poblaciones/${id}/cargar`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 5 * 60_000,
    });
    return data;
  },
};
