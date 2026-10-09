import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { cirugiaKeys } from '@/modules/cirugia/hooks/useCirugia';
import { contratacionKeys } from '@/modules/contratacion/hooks/useContratacion';
import { inventarioKeys } from '@/modules/inventario/hooks/useInventario';
import { programacionService } from '../services/programacionService';

export const programacionKeys = {
  all: ['programacion'] as const,
  resumen: ['programacion', 'resumen'] as const,
  cola: ['programacion', 'cola'] as const,
  propuesta: ['programacion', 'propuesta'] as const,
  programa: (desde: string, hasta: string, sede?: number) => ['programacion', 'programa', desde, hasta, sede] as const,
};

export const useResumenProgramacion = (enabled = true) => useQuery({ queryKey: programacionKeys.resumen, queryFn: programacionService.resumen, enabled });
export const useCola = (enabled = true) => useQuery({ queryKey: programacionKeys.cola, queryFn: programacionService.cola, enabled });
export const usePropuesta = () => useQuery({ queryKey: programacionKeys.propuesta, queryFn: programacionService.propuesta });
export const usePrograma = (desde: string, hasta: string, sede?: number) =>
  useQuery({ queryKey: programacionKeys.programa(desde, hasta, sede), queryFn: () => programacionService.programa(desde, hasta, sede), placeholderData: keepPreviousData });

export function useProgramacionMutations() {
  const queryClient = useQueryClient();
  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: programacionKeys.all });
    queryClient.invalidateQueries({ queryKey: cirugiaKeys.all });
    queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
    queryClient.invalidateQueries({ queryKey: contratacionKeys.all });
  };
  const onSuccess = (r: { mensaje: string }) => {
    notify.success(r.mensaje);
    invalidar();
  };
  const onError = (e: unknown) => notify.error(getErrorMessage(e));

  return {
    generar: useMutation({ mutationFn: programacionService.generar, onSuccess, onError }),
    aprobar: useMutation({ mutationFn: programacionService.aprobar, onSuccess, onError }),
    descartar: useMutation({ mutationFn: programacionService.descartar, onSuccess, onError }),
    rechazar: useMutation({ mutationFn: ({ id, motivo }: { id: number; motivo: string }) => programacionService.rechazar(id, motivo), onSuccess, onError }),
    cancelar: useMutation({ mutationFn: ({ id, motivo }: { id: number; motivo: string }) => programacionService.cancelar(id, motivo), onSuccess, onError }),
    realizar: useMutation({
      mutationFn: programacionService.realizar,
      onSuccess: (r) => {
        if (r.datos.avisos.length) notify.info(`${r.mensaje} ${r.datos.avisos.join(' ')}`);
        else notify.success(r.mensaje);
        invalidar();
      },
      onError,
    }),
  };
}
