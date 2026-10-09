import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import type { ListParams } from '@/lib/api/types';
import { notify } from '@/lib/toast';
import { contratosService, entidadesService, poblacionesService } from '../services/contratacionService';
import type {
  ContratoPayload,
  ContratosFiltros,
  EntidadesFiltros,
  EntidadPayload,
  ModoCargue,
  PacientesFiltros,
  PoblacionesFiltros,
  PoblacionPayload,
} from '../types';

export const contratacionKeys = {
  all: ['contratacion'] as const,
  entidades: (f: EntidadesFiltros) => ['contratacion', 'entidades', f] as const,
  entidad: (id: number) => ['contratacion', 'entidad', id] as const,
  contratos: (f: ContratosFiltros) => ['contratacion', 'contratos', f] as const,
  contrato: (id: number) => ['contratacion', 'contrato', id] as const,
  contratoCups: (id: number, f: object) => ['contratacion', 'contrato-cups', id, f] as const,
  resumenContratos: ['contratacion', 'resumen-contratos'] as const,
  poblaciones: (f: PoblacionesFiltros) => ['contratacion', 'poblaciones', f] as const,
  poblacion: (id: number) => ['contratacion', 'poblacion', id] as const,
  pacientes: (id: number, f: PacientesFiltros) => ['contratacion', 'pacientes', id, f] as const,
  resumenPoblaciones: ['contratacion', 'resumen-poblaciones'] as const,
};

export function useEntidades(filtros: EntidadesFiltros, enabled = true) {
  return useQuery({ queryKey: contratacionKeys.entidades(filtros), queryFn: () => entidadesService.listar(filtros), placeholderData: keepPreviousData, enabled });
}

export function useContratos(filtros: ContratosFiltros, enabled = true) {
  return useQuery({ queryKey: contratacionKeys.contratos(filtros), queryFn: () => contratosService.listar(filtros), placeholderData: keepPreviousData, enabled });
}

export function useContrato(id: number | null) {
  return useQuery({ queryKey: contratacionKeys.contrato(id ?? 0), queryFn: () => contratosService.obtener(id!), enabled: id !== null });
}

export function useContratoCups(id: number | null, filtros: ListParams & { sin_portafolio?: boolean }) {
  return useQuery({
    queryKey: contratacionKeys.contratoCups(id ?? 0, filtros),
    queryFn: () => contratosService.cups(id!, filtros),
    placeholderData: keepPreviousData,
    enabled: id !== null,
  });
}

export function useResumenContratos(enabled = true) {
  return useQuery({ queryKey: contratacionKeys.resumenContratos, queryFn: contratosService.resumen, enabled });
}

export function usePoblaciones(filtros: PoblacionesFiltros, enabled = true) {
  return useQuery({ queryKey: contratacionKeys.poblaciones(filtros), queryFn: () => poblacionesService.listar(filtros), placeholderData: keepPreviousData, enabled });
}

export function usePoblacion(id: number | null) {
  return useQuery({ queryKey: contratacionKeys.poblacion(id ?? 0), queryFn: () => poblacionesService.obtener(id!), enabled: id !== null });
}

export function usePacientes(id: number | null, filtros: PacientesFiltros) {
  return useQuery({
    queryKey: contratacionKeys.pacientes(id ?? 0, filtros),
    queryFn: () => poblacionesService.pacientes(id!, filtros),
    placeholderData: keepPreviousData,
    enabled: id !== null,
  });
}

export function useResumenPoblaciones(enabled = true) {
  return useQuery({ queryKey: contratacionKeys.resumenPoblaciones, queryFn: poblacionesService.resumen, enabled });
}

/** Entidades, contratos y poblaciones comparten caché: los conteos de unos dependen de los otros. */
export function useContratacionMutations() {
  const queryClient = useQueryClient();
  const invalidar = () => queryClient.invalidateQueries({ queryKey: contratacionKeys.all });
  const onSuccess = (response: { mensaje: string }) => {
    notify.success(response.mensaje);
    invalidar();
  };
  const onError = (error: unknown) => notify.error(getErrorMessage(error));

  return {
    crearEntidad: useMutation({ mutationFn: (p: EntidadPayload) => entidadesService.crear(p), onSuccess }),
    actualizarEntidad: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<EntidadPayload> }) => entidadesService.actualizar(id, payload), onSuccess }),
    eliminarEntidad: useMutation({ mutationFn: entidadesService.eliminar, onSuccess, onError }),
    restaurarEntidad: useMutation({ mutationFn: entidadesService.restaurar, onSuccess, onError }),

    crearContrato: useMutation({ mutationFn: (p: ContratoPayload) => contratosService.crear(p), onSuccess }),
    actualizarContrato: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<ContratoPayload> }) => contratosService.actualizar(id, payload), onSuccess }),
    eliminarContrato: useMutation({ mutationFn: contratosService.eliminar, onSuccess, onError }),
    restaurarContrato: useMutation({ mutationFn: contratosService.restaurar, onSuccess, onError }),
    agregarCups: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: { cups_ids: number[]; cantidad?: number | null; tarifa?: number | null } }) => contratosService.agregarCups(id, payload),
      onSuccess: (r) => {
        notify.success(r.datos.existentes ? `${r.datos.creados} CUPS agregados · ${r.datos.existentes} ya estaban en el contrato` : `${r.datos.creados} CUPS agregados al contrato`);
        invalidar();
      },
    }),
    actualizarCups: useMutation({
      mutationFn: ({ id, cupsId, payload }: { id: number; cupsId: number; payload: { cantidad?: number | null; tarifa?: number | null } }) =>
        contratosService.actualizarCups(id, cupsId, payload),
      onSuccess: invalidar,
      onError,
    }),
    quitarCups: useMutation({ mutationFn: ({ id, cupsId }: { id: number; cupsId: number }) => contratosService.quitarCups(id, cupsId), onSuccess, onError }),

    crearPoblacion: useMutation({ mutationFn: (p: PoblacionPayload) => poblacionesService.crear(p), onSuccess }),
    actualizarPoblacion: useMutation({ mutationFn: ({ id, payload }: { id: number; payload: Partial<PoblacionPayload> }) => poblacionesService.actualizar(id, payload), onSuccess }),
    eliminarPoblacion: useMutation({ mutationFn: poblacionesService.eliminar, onSuccess, onError }),
    restaurarPoblacion: useMutation({ mutationFn: poblacionesService.restaurar, onSuccess, onError }),
    cargarPoblacion: useMutation({
      mutationFn: ({ id, archivo, simular, modo }: { id: number; archivo: File; simular: boolean; modo: ModoCargue }) => poblacionesService.cargar(id, archivo, simular, modo),
      onSuccess: (r) => {
        if (!r.datos.simulado) onSuccess(r);
      },
    }),
  };
}
