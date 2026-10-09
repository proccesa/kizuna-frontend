import { api } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';

export type PermisoIntegracion = 'ordenes:escribir' | 'ordenes:leer' | 'historias:escribir' | 'inventario:escribir';

export interface ClienteIntegracion {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  ultimo_uso_en: string | null;
  created_at: string;
  tokens: { id: number; name: string; abilities: PermisoIntegracion[]; last_used_at: string | null; created_at: string }[];
}

export const integracionesService = {
  async listar(): Promise<ClienteIntegracion[]> {
    const { data } = await api.get<ApiResponse<ClienteIntegracion[]>>('/clientes-integracion');
    return data.datos;
  },
  async crear(payload: { nombre: string; descripcion?: string | null; permisos: PermisoIntegracion[] }): Promise<ApiResponse<{ cliente: ClienteIntegracion; token: string }>> {
    const { data } = await api.post<ApiResponse<{ cliente: ClienteIntegracion; token: string }>>('/clientes-integracion', payload);
    return data;
  },
  async regenerar(id: number, permisos: PermisoIntegracion[]): Promise<ApiResponse<{ cliente: ClienteIntegracion; token: string }>> {
    const { data } = await api.post<ApiResponse<{ cliente: ClienteIntegracion; token: string }>>(`/clientes-integracion/${id}/regenerar`, { permisos });
    return data;
  },
  async actualizar(id: number, payload: { activo?: boolean }): Promise<ApiResponse<ClienteIntegracion>> {
    const { data } = await api.put<ApiResponse<ClienteIntegracion>>(`/clientes-integracion/${id}`, payload);
    return data;
  },
  async eliminar(id: number): Promise<ApiResponse<null>> {
    const { data } = await api.delete<ApiResponse<null>>(`/clientes-integracion/${id}`);
    return data;
  },
};
