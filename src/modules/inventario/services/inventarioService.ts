import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, ListParams, PaginatedResponse } from '@/lib/api/types';
import type {
  CupsRequerimientos,
  DetalleRequerimientos,
  ExistenciasFiltros,
  InsumoExistencias,
  Item,
  ItemPayload,
  ItemsFiltros,
  Mantenimiento,
  Movimiento,
  ResultadoCargueInventario,
  ResumenInventario,
  Sala,
  Unidad,
  UnidadesFiltros,
  UnidadPayload,
  Verificacion,
} from '../types';

export const inventarioService = {
  async resumen(): Promise<ResumenInventario> {
    const { data } = await api.get<ApiResponse<ResumenInventario>>('/inventario/resumen');
    return data.datos;
  },
  async items(filtros: ItemsFiltros): Promise<PaginatedResponse<Item>> {
    const { data } = await api.get<PaginatedResponse<Item>>('/inventario/items', { params: toQueryParams(filtros) });
    return data;
  },
  async guardarItem(id: number | null, payload: Partial<ItemPayload>): Promise<ApiResponse<Item>> {
    const { data } = id ? await api.put<ApiResponse<Item>>(`/inventario/items/${id}`, payload) : await api.post<ApiResponse<Item>>('/inventario/items', payload);
    return data;
  },
  async eliminarItem(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`/inventario/items/${id}`);
    return data;
  },
  async unidades(filtros: UnidadesFiltros): Promise<PaginatedResponse<Unidad>> {
    const { data } = await api.get<PaginatedResponse<Unidad>>('/inventario/unidades', { params: toQueryParams(filtros) });
    return data;
  },
  async unidad(id: number): Promise<Unidad> {
    const { data } = await api.get<ApiResponse<Unidad>>(`/inventario/unidades/${id}`);
    return data.datos;
  },
  async guardarUnidad(id: number | null, payload: UnidadPayload): Promise<ApiResponse<Unidad>> {
    const { data } = id ? await api.put<ApiResponse<Unidad>>(`/inventario/unidades/${id}`, payload) : await api.post<ApiResponse<Unidad>>('/inventario/unidades', payload);
    return data;
  },
  async eliminarUnidad(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`/inventario/unidades/${id}`);
    return data;
  },
  async programarMantenimiento(unidadId: number, payload: Pick<Mantenimiento, 'tipo' | 'inicio' | 'fin' | 'responsable' | 'observaciones'>): Promise<ApiResponse<Mantenimiento>> {
    const { data } = await api.post<ApiResponse<Mantenimiento>>(`/inventario/unidades/${unidadId}/mantenimientos`, payload);
    return data;
  },
  async cerrarMantenimiento(id: number, estado: 'TERMINADO' | 'CANCELADO'): Promise<ApiResponse<Mantenimiento>> {
    const { data } = await api.patch<ApiResponse<Mantenimiento>>(`/inventario/mantenimientos/${id}`, { estado });
    return data;
  },
  async existencias(filtros: ExistenciasFiltros): Promise<PaginatedResponse<InsumoExistencias>> {
    const { data } = await api.get<PaginatedResponse<InsumoExistencias>>('/inventario/existencias', { params: toQueryParams(filtros) });
    return data;
  },
  async registrarMovimiento(payload: { item_id: number; sede_id: number; tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE'; cantidad: number; lote?: string | null; vence?: string | null; motivo?: string | null }) {
    const { data } = await api.post<ApiResponse<{ total_sede: number }>>('/inventario/movimientos', payload);
    return data;
  },
  async movimientos(itemId: number, sedeId?: number): Promise<Movimiento[]> {
    const { data } = await api.get<ApiResponse<Movimiento[]>>(`/inventario/items/${itemId}/movimientos`, { params: sedeId ? { sede_id: sedeId } : {} });
    return data.datos;
  },
  async importar(tipo: 'unidades' | 'existencias', archivo: File, simular: boolean): Promise<ApiResponse<ResultadoCargueInventario>> {
    const form = new FormData();
    form.append('archivo', archivo);
    form.append('simular', simular ? '1' : '0');
    const { data } = await api.post<ApiResponse<ResultadoCargueInventario>>(`/inventario/importar/${tipo}`, form, { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 5 * 60_000 });
    return data;
  },
  async cupsRequerimientos(filtros: ListParams & { sin_requerimientos?: boolean }): Promise<PaginatedResponse<CupsRequerimientos>> {
    const { data } = await api.get<PaginatedResponse<CupsRequerimientos>>('/inventario/requerimientos', { params: toQueryParams(filtros) });
    return data;
  },
  async requerimientos(cupsId: number): Promise<DetalleRequerimientos> {
    const { data } = await api.get<ApiResponse<DetalleRequerimientos>>(`/inventario/requerimientos/${cupsId}`);
    return data.datos;
  },
  async guardarRequerimientos(cupsId: number, sedeId: number | null, items: { item_id: number; cantidad: number; notas?: string | null }[]): Promise<ApiResponse<DetalleRequerimientos>> {
    const { data } = await api.put<ApiResponse<DetalleRequerimientos>>(`/inventario/requerimientos/${cupsId}`, { sede_id: sedeId, items });
    return data;
  },
  async verificar(params: { cups_id: number; sede_id: number; fecha: string; hora: string; duracion?: number }): Promise<Verificacion> {
    const { data } = await api.get<ApiResponse<Verificacion>>('/inventario/verificar', { params });
    return data.datos;
  },
  async salas(params: ListParams & { sede_id?: number; tipo?: string } = {}): Promise<Sala[]> {
    const { data } = await api.get<ApiResponse<Sala[]>>('/salas', { params: toQueryParams(params) });
    return data.datos;
  },
  async guardarSala(id: number | null, payload: Partial<Pick<Sala, 'sede_id' | 'codigo' | 'nombre' | 'tipo' | 'observaciones' | 'activo'>>): Promise<ApiResponse<Sala>> {
    const { data } = id ? await api.put<ApiResponse<Sala>>(`/salas/${id}`, payload) : await api.post<ApiResponse<Sala>>('/salas', payload);
    return data;
  },
  async eliminarSala(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`/salas/${id}`);
    return data;
  },
};
