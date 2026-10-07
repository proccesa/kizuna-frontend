import { api } from '@/lib/api/client';
import { toQueryParams } from '@/lib/api/params';
import type { ApiResponse, PaginatedResponse } from '@/lib/api/types';
import type { CatalogoSimple, Cups, CupsFiltros, Departamento, Municipio, MunicipiosFiltros } from '../types';

const BASE = '/catalogos';

export const catalogosService = {
  async departamentos(): Promise<Departamento[]> {
    const { data } = await api.get<ApiResponse<Departamento[]>>(`${BASE}/departamentos`);
    return data.datos;
  },

  async municipiosPorDepartamento(departamentoId: number): Promise<Municipio[]> {
    const { data } = await api.get<ApiResponse<Municipio[]>>(`${BASE}/departamentos/${departamentoId}/municipios`);
    return data.datos;
  },

  async buscarMunicipios(filtros: MunicipiosFiltros): Promise<PaginatedResponse<Municipio>> {
    const { data } = await api.get<PaginatedResponse<Municipio>>(`${BASE}/municipios`, { params: toQueryParams(filtros) });
    return data;
  },

  async regimenes(): Promise<CatalogoSimple[]> {
    const { data } = await api.get<ApiResponse<CatalogoSimple[]>>(`${BASE}/regimenes`);
    return data.datos;
  },

  async buscarCups(filtros: CupsFiltros): Promise<PaginatedResponse<Cups>> {
    const { data } = await api.get<PaginatedResponse<Cups>>(`${BASE}/cups`, { params: toQueryParams(filtros) });
    return data;
  },

  async modalidadesContratacion(): Promise<CatalogoSimple[]> {
    const { data } = await api.get<ApiResponse<CatalogoSimple[]>>(`${BASE}/modalidades-contratacion`);
    return data.datos;
  },
};
