import { useQuery } from '@tanstack/react-query';
import { rolesService } from '../services/rolesService';

export const rolesKeys = {
  roles: ['roles'] as const,
  permisos: ['permisos'] as const,
};

export function useRoles(enabled = true) {
  return useQuery({ queryKey: rolesKeys.roles, queryFn: rolesService.listarRoles, staleTime: 5 * 60_000, enabled });
}

export function usePermisos(enabled = true) {
  return useQuery({ queryKey: rolesKeys.permisos, queryFn: rolesService.listarPermisos, staleTime: 5 * 60_000, enabled });
}
