import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { operadoresService } from '../services/operadoresService';
import type { OperadorPayload, OperadoresFiltros } from '../types';

export const operadoresKeys = {
  all: ['operadores'] as const,
  list: (filtros: OperadoresFiltros) => [...operadoresKeys.all, 'list', filtros] as const,
};

export function useOperadores(filtros: OperadoresFiltros, enabled = true) {
  return useQuery({
    queryKey: operadoresKeys.list(filtros),
    queryFn: () => operadoresService.listar(filtros),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useOperadorMutations() {
  const queryClient = useQueryClient();

  const onSuccess = (response: { mensaje: string }) => {
    notify.success(response.mensaje);
    queryClient.invalidateQueries({ queryKey: operadoresKeys.all });
    queryClient.invalidateQueries({ queryKey: ['usuarios'] });
  };
  const onError = (error: unknown) => notify.error(getErrorMessage(error));

  return {
    crear: useMutation({ mutationFn: (payload: OperadorPayload) => operadoresService.crear(payload), onSuccess }),
    actualizar: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<OperadorPayload> }) => operadoresService.actualizar(id, payload),
      onSuccess,
    }),
    eliminar: useMutation({ mutationFn: operadoresService.eliminar, onSuccess, onError }),
    restaurar: useMutation({ mutationFn: operadoresService.restaurar, onSuccess, onError }),
    /** El backend no tiene endpoint de estado para operadores: se usa PUT con `activo`. */
    cambiarEstado: useMutation({
      mutationFn: ({ id, activo }: { id: number; activo: boolean }) => operadoresService.actualizar(id, { activo }),
      onSuccess,
      onError,
    }),
  };
}

export function useOperador(id: number | null) {
  return useQuery({
    queryKey: [...operadoresKeys.all, 'detail', id ?? 0],
    queryFn: () => operadoresService.obtener(id!),
    enabled: id !== null,
  });
}
