import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { prestadoresService } from '../services/prestadoresService';
import { sedesService } from '../services/sedesService';
import type { PrestadoresFiltros, PrestadorPayload, SedePayload, SedesFiltros } from '../types';

export const redKeys = {
  all: ['red'] as const,
  prestadores: (filtros: PrestadoresFiltros) => ['red', 'prestadores', filtros] as const,
  prestador: (id: number) => ['red', 'prestador', id] as const,
  sedes: (filtros: SedesFiltros) => ['red', 'sedes', filtros] as const,
};

export function usePrestadores(filtros: PrestadoresFiltros, enabled = true) {
  return useQuery({
    queryKey: redKeys.prestadores(filtros),
    queryFn: () => prestadoresService.listar(filtros),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function usePrestador(id: number | null) {
  return useQuery({
    queryKey: redKeys.prestador(id ?? 0),
    queryFn: () => prestadoresService.obtener(id!),
    enabled: id !== null,
  });
}

export function useSedes(filtros: SedesFiltros, enabled = true) {
  return useQuery({
    queryKey: redKeys.sedes(filtros),
    queryFn: () => sedesService.listar(filtros),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Mutaciones de la red: prestadores y sedes comparten caché (las tarjetas muestran ambos). */
export function useRedMutations() {
  const queryClient = useQueryClient();
  const onSuccess = (response: { mensaje: string }) => {
    notify.success(response.mensaje);
    queryClient.invalidateQueries({ queryKey: redKeys.all });
  };
  const onError = (error: unknown) => notify.error(getErrorMessage(error));

  return {
    crearPrestador: useMutation({ mutationFn: (payload: PrestadorPayload) => prestadoresService.crear(payload), onSuccess }),
    actualizarPrestador: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<PrestadorPayload> }) => prestadoresService.actualizar(id, payload),
      onSuccess,
    }),
    eliminarPrestador: useMutation({ mutationFn: prestadoresService.eliminar, onSuccess, onError }),
    restaurarPrestador: useMutation({ mutationFn: prestadoresService.restaurar, onSuccess, onError }),
    crearSede: useMutation({
      mutationFn: ({ prestadorId, payload }: { prestadorId: number; payload: SedePayload }) => prestadoresService.crearSede(prestadorId, payload),
      onSuccess,
    }),
    actualizarSede: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<SedePayload> }) => sedesService.actualizar(id, payload),
      onSuccess,
    }),
    eliminarSede: useMutation({ mutationFn: sedesService.eliminar, onSuccess, onError }),
    restaurarSede: useMutation({ mutationFn: sedesService.restaurar, onSuccess, onError }),
  };
}
