import { Plus, UserPlus } from 'lucide-react';
import { ListToolbar } from '@/components/ListToolbar';
import { Roster, type RosterColumn } from '@/components/Roster';
import { Avatar, Badge, Button, Card, PageHeader, Pagination, Select, StatusBadge, Vinculo } from '@/components/ui';
import { useDrawerParam } from '@/hooks/useDrawerParam';
import { useEstadoCounts } from '@/hooks/useEstadoCounts';
import { useListParams } from '@/hooks/useListParams';
import { humanize } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useRoles } from '@/modules/roles/hooks/useRoles';
import { UsuarioDrawer } from '../components/UsuarioDrawer';
import { useUsuarios } from '../hooks/useUsuarios';
import type { Usuario } from '../types';

export function UsuariosPage() {
  const { can, usuario: sesion } = useAuth();
  const { buscar, estado, extras, update, apiParams } = useListParams(['rol'] as const);
  const drawer = useDrawerParam();
  const { data: roles = [] } = useRoles(can(PERMISOS.roles.listar));

  const rol = extras.rol || undefined;
  const { data, isLoading, isFetching, isError, refetch } = useUsuarios({ ...apiParams, rol });
  const counts = useEstadoCounts(useUsuarios, { buscar: buscar || undefined, rol }, can(PERMISOS.usuarios.restaurar));

  const columns: RosterColumn<Usuario>[] = [
    {
      key: 'persona',
      header: 'Cuenta',
      cell: (u) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={u.operador?.nombre_completo || u.name} size="sm" />
          <span className="min-w-0">
            <span className="flex items-center gap-2 truncate font-semibold text-ink">
              {u.operador?.nombre_completo || u.name}
              {u.id === sesion?.id && <Badge tone="lime">Tú</Badge>}
            </span>
            <span className="block truncate text-sm text-muted">{u.email}</span>
          </span>
        </span>
      ),
    },
    {
      key: 'vinculo',
      header: 'Vínculo',
      cell: (u) => (
        <Vinculo linked={!!u.operador} emptyLabel="Sin operador">
          {u.operador && `${u.operador.tipo_documento?.codigo ?? ''} ${u.operador.documento}`}
        </Vinculo>
      ),
    },
    {
      key: 'roles',
      header: 'Roles',
      hideOnMobile: true,
      cell: (u) =>
        u.roles.length ? (
          <span className="flex flex-wrap gap-1.5">
            {u.roles.map((r) => (
              <Badge key={r.id} tone={r.name === 'super-admin' ? 'petrol' : 'mist'}>
                {humanize(r.name)}
              </Badge>
            ))}
          </span>
        ) : (
          <span className="text-xs text-subtle">—</span>
        ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (u) => <StatusBadge value={u.deleted_at ? 'deleted' : u.activo ? 'active' : 'inactive'} />,
    },
  ];

  const hayFiltros = !!(buscar || rol || estado !== 'todos');

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Las cuentas que entran a Kizuna y la persona detrás de cada una."
        actions={
          can(PERMISOS.usuarios.crear) && (
            <Button icon={Plus} onClick={drawer.create}>
              Nuevo usuario
            </Button>
          )
        }
      />

      <Card className="animate-enter overflow-hidden">
        <ListToolbar
          buscar={buscar}
          onBuscar={(value) => update({ buscar: value })}
          placeholder="Nombre, correo o documento"
          estado={estado}
          onEstado={(value) => update({ estado: value })}
          counts={counts}
          mostrarEliminados={can(PERMISOS.usuarios.restaurar)}
        >
          {roles.length > 0 && (
            <Select
              aria-label="Filtrar por rol"
              value={extras.rol}
              onChange={(e) => update({ rol: e.target.value })}
              placeholder="Todos los roles"
              options={roles.map((r) => ({ value: r.name, label: humanize(r.name) }))}
              className="h-10 sm:w-44"
            />
          )}
        </ListToolbar>

        {isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted">No fue posible cargar los usuarios.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <Roster
              columns={columns}
              template="minmax(0,1.5fr) minmax(0,1fr) minmax(0,1fr) 7rem"
              rows={data?.datos ?? []}
              rowKey={(u) => u.id}
              rowLabel={(u) => `Ver ${u.operador?.nombre_completo || u.name}`}
              onRowClick={(u) => drawer.open(u.id)}
              isLoading={isLoading}
              dimmed={(u) => !!u.deleted_at}
              empty={{
                title: hayFiltros ? 'Nada coincide con los filtros' : 'Aún no hay usuarios',
                description: buscar ? `No encontramos cuentas para "${buscar}".` : 'Crea la primera cuenta para que tu equipo empiece a trabajar.',
                action: !hayFiltros && can(PERMISOS.usuarios.crear) && (
                  <Button icon={UserPlus} onClick={drawer.create}>
                    Crear usuario
                  </Button>
                ),
              }}
            />
            {data && data.paginacion.total > 0 && (
              <Pagination paginacion={data.paginacion} onPageChange={(page) => update({ pagina: page })} disabled={isFetching} />
            )}
          </>
        )}
      </Card>

      <UsuarioDrawer
        open={drawer.isOpen}
        usuarioId={drawer.selectedId}
        creating={drawer.isCreating}
        onClose={drawer.close}
        onCreated={drawer.open}
      />
    </>
  );
}
