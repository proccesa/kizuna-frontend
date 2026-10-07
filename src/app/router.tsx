import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { FullPageLoader } from '@/components/layout/FullPageLoader';
import { NotFoundPage } from '@/components/layout/NotFoundPage';
import { Spinner } from '@/components/ui';
import { GuestRoute, ProtectedRoute } from '@/modules/auth/components/ProtectedRoute';
import { PERMISOS } from '@/modules/auth/permisos';

/** Carga diferida por módulo: cada página se descarga solo cuando se visita. */
function page<K extends string>(loader: () => Promise<Record<K, ComponentType>>, name: K, fullPage = false) {
  const Component = lazy<ComponentType>(async () => ({ default: (await loader())[name] }));
  const fallback = fullPage ? (
    <FullPageLoader />
  ) : (
    <div className="flex min-h-[50vh] items-center justify-center text-mint-ink">
      <Spinner className="size-6" />
    </div>
  );
  return (
    <Suspense fallback={fallback}>
      <Component />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <GuestRoute />,
    children: [
      { path: '/login', element: page(() => import('@/modules/auth/pages/LoginPage'), 'LoginPage', true) },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { index: true, element: page(() => import('@/modules/dashboard/pages/DashboardPage'), 'DashboardPage') },
          { path: 'perfil', element: page(() => import('@/modules/perfil/pages/PerfilPage'), 'PerfilPage') },

          // Módulos clínicos (diseño con datos de ejemplo: src/demo/datos.ts)
          { path: 'programacion', element: page(() => import('@/modules/programacion/pages/ProgramacionPage'), 'ProgramacionPage') },
          { path: 'entidades', element: page(() => import('@/modules/contratacion/pages/EntidadesPage'), 'EntidadesPage') },
          { path: 'contratos', element: page(() => import('@/modules/contratacion/pages/ContratosPage'), 'ContratosPage') },
          { path: 'poblaciones', element: page(() => import('@/modules/contratacion/pages/PoblacionesPage'), 'PoblacionesPage') },
          { path: 'especialistas', element: page(() => import('@/modules/talento/pages/EspecialistasPage'), 'EspecialistasPage') },

          {
            element: <ProtectedRoute permiso={PERMISOS.usuarios.listar} />,
            children: [{ path: 'usuarios', element: page(() => import('@/modules/usuarios/pages/UsuariosPage'), 'UsuariosPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.operadores.listar} />,
            children: [{ path: 'operadores', element: page(() => import('@/modules/operadores/pages/OperadoresPage'), 'OperadoresPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.prestadores.listar} />,
            children: [{ path: 'prestadores', element: page(() => import('@/modules/red/pages/PrestadoresPage'), 'PrestadoresPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.portafolio.listar} />,
            children: [{ path: 'portafolio', element: page(() => import('@/modules/servicios/pages/PortafolioPage'), 'PortafolioPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.especialidades.listar} />,
            children: [{ path: 'especialidades', element: page(() => import('@/modules/servicios/pages/EspecialidadesPage'), 'EspecialidadesPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.catalogos.listar} />,
            children: [{ path: 'catalogos', element: page(() => import('@/modules/catalogos/pages/CatalogosPage'), 'CatalogosPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.roles.listar} />,
            children: [{ path: 'roles', element: page(() => import('@/modules/roles/pages/RolesPage'), 'RolesPage') }],
          },
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
]);
