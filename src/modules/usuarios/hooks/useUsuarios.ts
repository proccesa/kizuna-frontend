import { keepPreviousData, useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { usuariosService } from '../services/usuariosService';
import type { UsuarioPayload, UsuariosFiltros } from '../types';

export const usuariosKeys = {
  all: ['usuarios'] as const,
  list: (filtros: UsuariosFiltros) => [...usuariosKeys.all, 'list', filtros] as const,
  detail: (id: number) => [...usuariosKeys.all, 'detail', id] as const,
};

export function useUsuarios(filtros: UsuariosFiltros, enabled = true) {
  return useQuery({
    queryKey: usuariosKeys.list(filtros),
    queryFn: () => usuariosService.listar(filtros),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useUsuario(id: number | null) {
  return useQuery({
    queryKey: usuariosKeys.detail(id ?? 0),
    queryFn: () => usuariosService.obtener(id!),
    enabled: id !== null,
  });
}

/** Mutaciones del módulo: al terminar invalidan la caché y notifican el resultado. */
export function useUsuarioMutations() {
  const queryClient = useQueryClient();

  const onSuccess = (response: { mensaje: string }) => {
    notify.success(response.mensaje);
    // Los operadores dependen de los usuarios (se crean y eliminan juntos).
    queryClient.invalidateQueries({ queryKey: usuariosKeys.all });
    queryClient.invalidateQueries({ queryKey: ['operadores'] });
  };
  const onError = (error: unknown) => notify.error(getErrorMessage(error));

  return {
    crear: useMutation({ mutationFn: (payload: UsuarioPayload) => usuariosService.crear(payload), onSuccess }),
    actualizar: useMutation({
      mutationFn: ({ id, payload }: { id: number; payload: Partial<UsuarioPayload> }) => usuariosService.actualizar(id, payload),
      onSuccess,
    }),
    eliminar: useMutation({ mutationFn: usuariosService.eliminar, onSuccess, onError }),
    restaurar: useMutation({ mutationFn: usuariosService.restaurar, onSuccess, onError }),
    cambiarEstado: useMutation({
      mutationFn: ({ id, activo }: { id: number; activo: boolean }) => usuariosService.cambiarEstado(id, activo),
      onSuccess,
      onError,
    }),
  };
}

/** Cantidad de usuarios por rol (una consulta mínima por rol, en paralelo). */
export function useConteoPorRol(roles: string[], enabled = true) {
  return useQueries({
    queries: roles.map((rol) => ({
      queryKey: usuariosKeys.list({ rol, por_pagina: 1 }),
      queryFn: () => usuariosService.listar({ rol, por_pagina: 1 }),
      enabled,
    })),
    combine: (results) =>
      Object.fromEntries(roles.map((rol, i) => [rol, results[i]?.data?.paginacion.total])) as Record<string, number | undefined>,
  });
}
