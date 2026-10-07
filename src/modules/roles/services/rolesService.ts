import { api } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { PermisosAgrupados, Rol } from '../types';

export const rolesService = {
  async listarRoles(): Promise<Rol[]> {
    const { data } = await api.get<ApiResponse<Rol[]>>('/roles');
    return data.datos;
  },

  async listarPermisos(): Promise<PermisosAgrupados> {
    const { data } = await api.get<ApiResponse<PermisosAgrupados>>('/permisos');
    return data.datos;
  },
};
