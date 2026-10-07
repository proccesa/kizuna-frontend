import type { ReactNode } from 'react';
import { useAuth } from '../hooks/useAuth';

interface CanProps {
  permiso: string;
  children: ReactNode;
  fallback?: ReactNode;
}

/** Renderiza su contenido solo si el usuario tiene el permiso. */
export function Can({ permiso, children, fallback = null }: CanProps) {
  const { can } = useAuth();
  return <>{can(permiso) ? children : fallback}</>;
}
