import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { integracionesService, type PermisoIntegracion } from '../services/integracionesService';

const KEY = ['integraciones'] as const;

export function useClientesIntegracion() {
  return useQuery({ queryKey: KEY, queryFn: integracionesService.listar });
}

export function useIntegracionesMutations() {
  const queryClient = useQueryClient();
  const invalidar = () => queryClient.invalidateQueries({ queryKey: KEY });
  const onError = (e: unknown) => notify.error(getErrorMessage(e));

  return {
    crear: useMutation({ mutationFn: integracionesService.crear, onSuccess: invalidar }),
    regenerar: useMutation({ mutationFn: ({ id, permisos }: { id: number; permisos: PermisoIntegracion[] }) => integracionesService.regenerar(id, permisos), onSuccess: invalidar, onError }),
    actualizar: useMutation({
      mutationFn: ({ id, activo }: { id: number; activo: boolean }) => integracionesService.actualizar(id, { activo }),
      onSuccess: (r) => {
        notify.success(r.mensaje);
        invalidar();
      },
      onError,
    }),
    eliminar: useMutation({
      mutationFn: integracionesService.eliminar,
      onSuccess: (r) => {
        notify.success(r.mensaje);
        invalidar();
      },
      onError,
    }),
  };
}
