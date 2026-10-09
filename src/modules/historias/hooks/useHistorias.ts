import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { cirugiaKeys } from '@/modules/cirugia/hooks/useCirugia';
import { historiasService } from '../services/historiasService';
import type { HistoriasFiltros, Respuestas } from '../types';

export const historiasKeys = {
  all: ['historias'] as const,
  lista: (f: HistoriasFiltros) => ['historias', 'lista', f] as const,
  detalle: (id: number) => ['historias', 'detalle', id] as const,
  plantillas: ['historias', 'plantillas'] as const,
};

export function useHistorias(filtros: HistoriasFiltros) {
  return useQuery({ queryKey: historiasKeys.lista(filtros), queryFn: () => historiasService.listar(filtros), placeholderData: keepPreviousData });
}

export function useHistoria(id: number | null) {
  return useQuery({ queryKey: historiasKeys.detalle(id ?? 0), queryFn: () => historiasService.obtener(id!), enabled: id !== null, refetchOnWindowFocus: false });
}

export function usePlantillas(enabled = true) {
  return useQuery({ queryKey: historiasKeys.plantillas, queryFn: historiasService.plantillas, staleTime: 5 * 60_000, enabled });
}

export function useHistoriasMutations() {
  const queryClient = useQueryClient();
  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: historiasKeys.all });
    queryClient.invalidateQueries({ queryKey: cirugiaKeys.all });
  };

  return {
    abrir: useMutation({ mutationFn: historiasService.abrir, onSuccess: invalidar, onError: (e) => notify.error(getErrorMessage(e)) }),
    /** Autoguardado: no notifica; el editor muestra el estado. */
    guardar: useMutation({
      mutationFn: ({ id, respuestas }: { id: number; respuestas: Respuestas }) => historiasService.guardar(id, respuestas),
      onSuccess: (r) => queryClient.setQueryData(historiasKeys.detalle(r.datos.id), (prev: object | undefined) => ({ ...prev, ...r.datos })),
    }),
    finalizar: useMutation({
      mutationFn: ({ id, respuestas }: { id: number; respuestas: Respuestas }) => historiasService.finalizar(id, respuestas),
      onSuccess: (r) => {
        notify.success(r.mensaje);
        invalidar();
      },
    }),
    anular: useMutation({
      mutationFn: ({ id, motivo }: { id: number; motivo: string }) => historiasService.anular(id, motivo),
      onSuccess: (r) => {
        notify.success(r.mensaje);
        invalidar();
      },
      onError: (e) => notify.error(getErrorMessage(e)),
    }),
  };
}
