import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { citasService, ordenesService } from '../services/cirugiaService';
import type { CitasFiltros, Cupo, OrdenesFiltros, OrdenPayload, ReglasPreanestesia } from '../types';

export const cirugiaKeys = {
  all: ['cirugia'] as const,
  ordenes: (f: OrdenesFiltros) => ['cirugia', 'ordenes', f] as const,
  orden: (id: number) => ['cirugia', 'orden', id] as const,
  resumen: ['cirugia', 'resumen'] as const,
  cupos: (id: number, desde?: string) => ['cirugia', 'cupos', id, desde] as const,
  citas: (f: CitasFiltros) => ['cirugia', 'citas', f] as const,
  reglas: ['cirugia', 'reglas'] as const,
};

export function useOrdenes(filtros: OrdenesFiltros) {
  return useQuery({ queryKey: cirugiaKeys.ordenes(filtros), queryFn: () => ordenesService.listar(filtros), placeholderData: keepPreviousData });
}

export function useOrden(id: number | null) {
  return useQuery({ queryKey: cirugiaKeys.orden(id ?? 0), queryFn: () => ordenesService.obtener(id!), enabled: id !== null });
}

export function useResumenOrdenes(enabled = true) {
  return useQuery({ queryKey: cirugiaKeys.resumen, queryFn: ordenesService.resumen, enabled });
}

export function useCupos(id: number | null, desde?: string) {
  return useQuery({ queryKey: cirugiaKeys.cupos(id ?? 0, desde), queryFn: () => ordenesService.cupos(id!, desde), enabled: id !== null, staleTime: 0 });
}

export function useCitas(filtros: CitasFiltros, enabled = true) {
  return useQuery({ queryKey: cirugiaKeys.citas(filtros), queryFn: () => citasService.listar(filtros), placeholderData: keepPreviousData, enabled });
}

export function useReglasPreanestesia(enabled = true) {
  return useQuery({ queryKey: cirugiaKeys.reglas, queryFn: ordenesService.reglas, enabled });
}

export function useCirugiaMutations() {
  const queryClient = useQueryClient();
  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: cirugiaKeys.all });
    queryClient.invalidateQueries({ queryKey: ['historias'] });
  };
  const onSuccess = (r: { mensaje: string }) => {
    notify.success(r.mensaje);
    invalidar();
  };
  const onError = (e: unknown) => notify.error(getErrorMessage(e));

  return {
    crear: useMutation({ mutationFn: (p: OrdenPayload) => ordenesService.crear(p), onSuccess: invalidar }),
    importar: useMutation({
      mutationFn: ({ archivo, simular }: { archivo: File; simular: boolean }) => ordenesService.importar(archivo, simular),
      onSuccess: (r) => {
        if (!r.datos.simulado) onSuccess(r);
      },
    }),
    reprogramar: useMutation({
      mutationFn: ({ id, cupo }: { id: number; cupo: Pick<Cupo, 'fecha' | 'hora_inicio' | 'especialista_id' | 'sede_id'> }) => ordenesService.reprogramar(id, cupo),
      onSuccess,
      onError,
    }),
    revalidar: useMutation({ mutationFn: ordenesService.revalidar, onSuccess, onError }),
    cancelar: useMutation({ mutationFn: ({ id, motivo }: { id: number; motivo: string }) => ordenesService.cancelar(id, motivo), onSuccess, onError }),
    asignarPendientes: useMutation({
      mutationFn: ordenesService.asignarPendientes,
      onSuccess: (r) => {
        notify.success(r.datos.asignadas ? `${r.datos.asignadas} de ${r.datos.revisadas} órdenes recibieron cita` : `Ninguna de las ${r.datos.revisadas} órdenes encontró cupo`);
        invalidar();
      },
      onError,
    }),
    cambiarEstadoCita: useMutation({
      mutationFn: ({ id, estado, motivo }: { id: number; estado: 'CANCELADA' | 'NO_ASISTIO'; motivo?: string }) => citasService.cambiarEstado(id, estado, motivo),
      onSuccess,
      onError,
    }),
    guardarReglas: useMutation({ mutationFn: (p: Partial<ReglasPreanestesia>) => ordenesService.guardarReglas(p), onSuccess, onError }),
  };
}
