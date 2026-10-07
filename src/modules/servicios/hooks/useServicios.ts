import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { especialidadesService, portafolioService } from '../services/serviciosService';
import type { AgregarPortafolioPayload, EspecialidadPayload, PortafolioFiltros } from '../types';

export const serviciosKeys = {
  all: ['servicios'] as const,
  especialidades: (params: object) => ['servicios', 'especialidades', params] as const,
  portafolio: (filtros: PortafolioFiltros) => ['servicios', 'portafolio', filtros] as const,
};

export function useEspecialidades(params: { buscar?: string; solo_eliminados?: boolean } = {}, enabled = true) {
  return useQuery({
    queryKey: serviciosKeys.especialidades(params),
    queryFn: () => especialidadesService.listar(params),
    staleTime: 5 * 60_000,
    enabled,
  });
}

export function usePortafolio(filtros: PortafolioFiltros, enabled = true) {
  return useQuery({
    queryKey: serviciosKeys.portafolio(filtros),
    queryFn: () => portafolioService.listar(filtros),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useServiciosMutations() {
  const queryClient = useQueryClient();
  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: serviciosKeys.all });
    queryClient.invalidateQueries({ queryKey: ['catalogos', 'cups'] });
  };
  const onSuccess = (response: { mensaje: string }) => {
    notify.success(response.mensaje);
    invalidar();
  };
  const onError = (error: unknown) => notify.error(getErrorMessage(error));

  return {
    crearEspecialidad: useMutation({ mutationFn: (p: EspecialidadPayload) => especialidadesService.crear(p), onSuccess }),
    actualizarEspecialidad: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<EspecialidadPayload> }) => especialidadesService.actualizar(id, payload),
      onSuccess,
    }),
    eliminarEspecialidad: useMutation({ mutationFn: especialidadesService.eliminar, onSuccess, onError }),
    restaurarEspecialidad: useMutation({ mutationFn: especialidadesService.restaurar, onSuccess, onError }),
    /** Asignar o quitar CUPS es frecuente: solo se notifica si falla. */
    alternarCups: useMutation({
      mutationFn: ({ especialidadId, cupsId, asignar }: { especialidadId: number; cupsId: number; asignar: boolean }) =>
        asignar ? especialidadesService.asignarCups(especialidadId, cupsId) : especialidadesService.quitarCups(especialidadId, cupsId),
      onSuccess: invalidar,
      onError,
    }),
    agregarPortafolio: useMutation({ mutationFn: (p: AgregarPortafolioPayload) => portafolioService.agregar(p), onSuccess }),
    actualizarPortafolio: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: { duracion_minutos?: number; activo?: boolean } }) => portafolioService.actualizar(id, payload),
      onSuccess,
      onError,
    }),
    eliminarPortafolio: useMutation({ mutationFn: portafolioService.eliminar, onSuccess, onError }),
  };
}
