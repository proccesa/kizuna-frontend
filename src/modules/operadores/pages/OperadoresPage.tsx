import { Plus, UserPlus } from 'lucide-react';
import { ListToolbar } from '@/components/ListToolbar';
import { Roster, type RosterColumn } from '@/components/Roster';
import { Avatar, Button, Card, PageHeader, Pagination, Select, StatusBadge, Vinculo } from '@/components/ui';
import { useDrawerParam } from '@/hooks/useDrawerParam';
import { useEstadoCounts } from '@/hooks/useEstadoCounts';
import { useListParams } from '@/hooks/useListParams';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useTiposDocumento } from '@/modules/catalogos/hooks/useTiposDocumento';
import { OperadorDrawer } from '../components/OperadorDrawer';
import { useOperadores } from '../hooks/useOperadores';
import type { Operador } from '../types';

export function OperadoresPage() {
  const { can } = useAuth();
  const { buscar, estado, extras, update, apiParams } = useListParams(['tipo'] as const);
  const drawer = useDrawerParam();
  const { data: tipos = [] } = useTiposDocumento();

  const tipo_documento_id = extras.tipo ? Number(extras.tipo) : undefined;
  const { data, isLoading, isFetching, isError, refetch } = useOperadores({ ...apiParams, tipo_documento_id });
  const counts = useEstadoCounts(useOperadores, { buscar: buscar || undefined, tipo_documento_id }, can(PERMISOS.operadores.restaurar));

  const columns: RosterColumn<Operador>[] = [
    {
      key: 'persona',
      header: 'Persona',
      cell: (op) => (
        <span className="flex min-w-0 items-center gap-3">
          <Avatar name={op.nombre_completo} size="sm" />
          <span className="min-w-0">
            <span className="block truncate font-semibold text-ink">{op.nombre_completo}</span>
            <span className="tabular block truncate text-sm text-muted">
              {op.tipo_documento?.codigo} {op.documento}
            </span>
          </span>
        </span>
      ),
    },
    {
      key: 'vinculo',
      header: 'Cuenta vinculada',
      cell: (op) => (
        <Vinculo linked={!!op.usuario} emptyLabel="Sin cuenta">
          {op.usuario?.email}
        </Vinculo>
      ),
    },
    {
      key: 'telefono',
      header: 'Teléfono',
      hideOnMobile: true,
      cell: (op) => <span className="tabular text-sm text-body">{op.telefono ?? <span className="text-subtle">—</span>}</span>,
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (op) => <StatusBadge value={op.deleted_at ? 'deleted' : op.activo ? 'active' : 'inactive'} />,
    },
  ];

  const hayFiltros = !!(buscar || tipo_documento_id || estado !== 'todos');

  return (
    <>
      <PageHeader
        title="Operadores"
        description="Las personas de tu operación, tengan o no una cuenta en Kizuna."
        actions={
          can(PERMISOS.operadores.crear) && (
            <Button icon={Plus} onClick={drawer.create}>
              Nuevo operador
            </Button>
          )
        }
      />

      <Card className="animate-enter overflow-hidden">
        <ListToolbar
          buscar={buscar}
          onBuscar={(value) => update({ buscar: value })}
          placeholder="Nombre, documento o teléfono"
          estado={estado}
          onEstado={(value) => update({ estado: value })}
          counts={counts}
          mostrarEliminados={can(PERMISOS.operadores.restaurar)}
        >
          <Select
            aria-label="Tipo de documento"
            value={extras.tipo}
            onChange={(e) => update({ tipo: e.target.value })}
            placeholder="Todo documento"
            options={tipos.map((t) => ({ value: t.id, label: `${t.codigo} · ${t.nombre}` }))}
            className="h-10 sm:w-48"
          />
        </ListToolbar>

        {isError ? (
          <div className="flex flex-col items-center gap-3 py-16 text-center">
            <p className="text-sm text-muted">No fue posible cargar los operadores.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : (
          <>
            <Roster
              columns={columns}
              template="minmax(0,1.4fr) minmax(0,1.3fr) minmax(0,0.8fr) 7rem"
              rows={data?.datos ?? []}
              rowKey={(op) => op.id}
              rowLabel={(op) => `Ver ${op.nombre_completo}`}
              onRowClick={(op) => drawer.open(op.id)}
              isLoading={isLoading}
              dimmed={(op) => !!op.deleted_at}
              empty={{
                title: hayFiltros ? 'Nada coincide con los filtros' : 'Aún no hay operadores',
                description: buscar ? `No encontramos personas para "${buscar}".` : 'Registra a las personas de tu operación.',
                action: !hayFiltros && can(PERMISOS.operadores.crear) && (
                  <Button icon={UserPlus} onClick={drawer.create}>
                    Registrar operador
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

      <OperadorDrawer
        open={drawer.isOpen}
        operadorId={drawer.selectedId}
        creating={drawer.isCreating}
        onClose={drawer.close}
        onCreated={drawer.open}
      />
    </>
  );
}
