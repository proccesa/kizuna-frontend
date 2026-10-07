import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { catalogosService } from '../services/catalogosService';
import type { CupsFiltros, MunicipiosFiltros } from '../types';

/** Los catálogos base casi no cambian: se guardan en caché por largo tiempo. */
const ESTATICO = 60 * 60_000;

export const catalogosKeys = {
  all: ['catalogos'] as const,
  departamentos: ['catalogos', 'departamentos'] as const,
  municipiosDe: (departamentoId: number) => ['catalogos', 'departamentos', departamentoId, 'municipios'] as const,
  municipios: (filtros: MunicipiosFiltros) => ['catalogos', 'municipios', filtros] as const,
  regimenes: ['catalogos', 'regimenes'] as const,
  cups: (filtros: CupsFiltros) => ['catalogos', 'cups', filtros] as const,
  modalidades: ['catalogos', 'modalidades-contratacion'] as const,
};

export function useDepartamentos(enabled = true) {
  return useQuery({ queryKey: catalogosKeys.departamentos, queryFn: catalogosService.departamentos, staleTime: ESTATICO, enabled });
}

export function useMunicipiosDe(departamentoId: number | null) {
  return useQuery({
    queryKey: catalogosKeys.municipiosDe(departamentoId ?? 0),
    queryFn: () => catalogosService.municipiosPorDepartamento(departamentoId!),
    staleTime: ESTATICO,
    enabled: departamentoId !== null,
  });
}

export function useBuscarMunicipios(filtros: MunicipiosFiltros, enabled = true) {
  return useQuery({
    queryKey: catalogosKeys.municipios(filtros),
    queryFn: () => catalogosService.buscarMunicipios(filtros),
    staleTime: ESTATICO,
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useRegimenes(enabled = true) {
  return useQuery({ queryKey: catalogosKeys.regimenes, queryFn: catalogosService.regimenes, staleTime: ESTATICO, enabled });
}

export function useModalidadesContratacion(enabled = true) {
  return useQuery({ queryKey: catalogosKeys.modalidades, queryFn: catalogosService.modalidadesContratacion, staleTime: ESTATICO, enabled });
}

export function useBuscarCups(filtros: CupsFiltros, enabled = true) {
  return useQuery({
    queryKey: catalogosKeys.cups(filtros),
    queryFn: () => catalogosService.buscarCups(filtros),
    staleTime: ESTATICO,
    placeholderData: keepPreviousData,
    enabled,
  });
}
