import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { agendasService, especialistasService } from '../services/talentoService';
import type { AgendaPayload, AusenciaPayload, EspecialistaPayload, EspecialistasFiltros } from '../types';

export const talentoKeys = {
  all: ['talento'] as const,
  especialistas: (filtros: EspecialistasFiltros) => ['talento', 'especialistas', filtros] as const,
  especialista: (id: number) => ['talento', 'especialista', id] as const,
  resumen: ['talento', 'resumen'] as const,
  agendas: (filtros: object) => ['talento', 'agendas', filtros] as const,
};

export function useEspecialistas(filtros: EspecialistasFiltros, enabled = true) {
  return useQuery({
    queryKey: talentoKeys.especialistas(filtros),
    queryFn: () => especialistasService.listar(filtros),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useEspecialista(id: number | null) {
  return useQuery({
    queryKey: talentoKeys.especialista(id ?? 0),
    queryFn: () => especialistasService.obtener(id!),
    enabled: id !== null,
  });
}

export function useResumenTalento(enabled = true) {
  return useQuery({ queryKey: talentoKeys.resumen, queryFn: especialistasService.resumen, enabled });
}

export function useAgendas(filtros: { sede_id?: number; especialidad_id?: number }, enabled = true) {
  return useQuery({
    queryKey: talentoKeys.agendas(filtros),
    queryFn: () => agendasService.listar(filtros),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Todas las mutaciones del talento humano comparten caché: listado, detalle, resumen y agendas. */
export function useTalentoMutations() {
  const queryClient = useQueryClient();
  const onSuccess = (response: { mensaje: string }) => {
    notify.success(response.mensaje);
    queryClient.invalidateQueries({ queryKey: talentoKeys.all });
  };
  const onError = (error: unknown) => notify.error(getErrorMessage(error));

  return {
    crearEspecialista: useMutation({ mutationFn: (p: EspecialistaPayload) => especialistasService.crear(p), onSuccess }),
    actualizarEspecialista: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<EspecialistaPayload> }) => especialistasService.actualizar(id, payload),
      onSuccess,
    }),
    eliminarEspecialista: useMutation({ mutationFn: especialistasService.eliminar, onSuccess, onError }),
    restaurarEspecialista: useMutation({ mutationFn: especialistasService.restaurar, onSuccess, onError }),
    importar: useMutation({
      mutationFn: ({ archivo, simular }: { archivo: File; simular: boolean }) => especialistasService.importar(archivo, simular),
      onSuccess: (response) => {
        if (!response.datos.simulado) onSuccess(response);
      },
    }),
    crearAgenda: useMutation({
      mutationFn: ({ especialistaId, payload }: { especialistaId: number; payload: AgendaPayload }) => agendasService.crear(especialistaId, payload),
      onSuccess,
    }),
    actualizarAgenda: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<AgendaPayload> }) => agendasService.actualizar(id, payload),
      onSuccess,
    }),
    eliminarAgenda: useMutation({ mutationFn: agendasService.eliminar, onSuccess, onError }),
    crearAusencia: useMutation({
      mutationFn: ({ especialistaId, payload }: { especialistaId: number; payload: AusenciaPayload }) => agendasService.crearAusencia(especialistaId, payload),
      onSuccess,
    }),
    eliminarAusencia: useMutation({ mutationFn: agendasService.eliminarAusencia, onSuccess, onError }),
  };
}
