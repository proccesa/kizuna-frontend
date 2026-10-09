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

          {
            element: <ProtectedRoute permiso={PERMISOS.programacion.listar} />,
            children: [{ path: 'programacion', element: page(() => import('@/modules/programacion/pages/ProgramacionPage'), 'ProgramacionPage') }],
          },

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
            element: <ProtectedRoute permiso={PERMISOS.ordenes.listar} />,
            children: [{ path: 'ordenes', element: page(() => import('@/modules/cirugia/pages/OrdenesPage'), 'OrdenesPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.citas.listar} />,
            children: [{ path: 'preanestesia', element: page(() => import('@/modules/cirugia/pages/PreanestesiaPage'), 'PreanestesiaPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.historias.listar} />,
            children: [{ path: 'historias', element: page(() => import('@/modules/historias/pages/HistoriasPage'), 'HistoriasPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.historias.ver} />,
            children: [{ path: 'historias/:id', element: page(() => import('@/modules/historias/pages/HistoriaPage'), 'HistoriaPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.integraciones.gestionar} />,
            children: [{ path: 'integraciones', element: page(() => import('@/modules/integraciones/pages/IntegracionesPage'), 'IntegracionesPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.inventario.listar} />,
            children: [{ path: 'biomedicos', element: page(() => import('@/modules/inventario/pages/BiomedicosPage'), 'BiomedicosPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.inventario.listar} />,
            children: [{ path: 'central', element: page(() => import('@/modules/inventario/pages/CentralPage'), 'CentralPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.inventario.listar} />,
            children: [{ path: 'requerimientos', element: page(() => import('@/modules/inventario/pages/RequerimientosPage'), 'RequerimientosPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.sedes.listar} />,
            children: [{ path: 'salas', element: page(() => import('@/modules/inventario/pages/SalasPage'), 'SalasPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.entidades.listar} />,
            children: [{ path: 'entidades', element: page(() => import('@/modules/contratacion/pages/EntidadesPage'), 'EntidadesPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.contratos.listar} />,
            children: [{ path: 'contratos', element: page(() => import('@/modules/contratacion/pages/ContratosPage'), 'ContratosPage') }],
          },
          {
            element: <ProtectedRoute permiso={PERMISOS.poblaciones.listar} />,
            children: [{ path: 'poblaciones', element: page(() => import('@/modules/contratacion/pages/PoblacionesPage'), 'PoblacionesPage') }],
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
            element: <ProtectedRoute permiso={PERMISOS.especialistas.listar} />,
            children: [{ path: 'especialistas', element: page(() => import('@/modules/talento/pages/EspecialistasPage'), 'EspecialistasPage') }],
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
