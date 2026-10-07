import { api } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { TipoDocumento } from '../types';

export const tiposDocumentoService = {
  async listar(): Promise<TipoDocumento[]> {
    const { data } = await api.get<ApiResponse<TipoDocumento[]>>('/tipos-documento');
    return data.datos;
  },
};
