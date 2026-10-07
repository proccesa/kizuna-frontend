import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageLoader } from '@/components/layout/FullPageLoader';
import { useAuth } from '../hooks/useAuth';

interface ProtectedRouteProps {
  /** Permiso requerido para la ruta. Sin permiso redirige al inicio. */
  permiso?: string;
}

export function ProtectedRoute({ permiso }: ProtectedRouteProps) {
  const { status, can } = useAuth();
  const location = useLocation();

  if (status === 'loading') return <FullPageLoader />;

  if (status === 'guest') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (permiso && !can(permiso)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}

/** Solo para invitados (p. ej. login). Si ya hay sesión, va al inicio. */
export function GuestRoute() {
  const { status } = useAuth();

  if (status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') return <Navigate to="/" replace />;

  return <Outlet />;
}
