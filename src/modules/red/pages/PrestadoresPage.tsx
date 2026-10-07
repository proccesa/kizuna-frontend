import { useState } from 'react';
import { Building2, Plus } from 'lucide-react';
import { ListToolbar } from '@/components/ListToolbar';
import { Button, Card, ConfirmDialog, EmptyState, PageHeader, Pagination, Select, Skeleton } from '@/components/ui';
import { useEstadoCounts } from '@/hooks/useEstadoCounts';
import { useListParams } from '@/hooks/useListParams';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { PrestadorCard } from '../components/PrestadorCard';
import { PrestadorDrawer } from '../components/PrestadorDrawer';
import { SedeModal } from '../components/SedeModal';
import { usePrestadores, useRedMutations } from '../hooks/useRed';
import { NATURALEZAS, type Naturaleza, type Prestador, type Sede } from '../types';

type Confirmacion =
  | { tipo: 'eliminar-prestador'; prestador: Prestador }
  | { tipo: 'restaurar-prestador'; prestador: Prestador }
  | { tipo: 'eliminar-sede'; sede: Sede }
  | null;

export function PrestadoresPage() {
  const { can } = useAuth();
  const { buscar, estado, extras, update, apiParams } = useListParams(['naturaleza'] as const);
  const naturaleza = (extras.naturaleza || undefined) as Naturaleza | undefined;
  const filtros = { ...apiParams, naturaleza, por_pagina: 5 };
  const { data, isLoading, isFetching, isError, refetch } = usePrestadores(filtros);
  const counts = useEstadoCounts(usePrestadores, { buscar: buscar || undefined, naturaleza }, can(PERMISOS.prestadores.restaurar));
  const { eliminarPrestador, restaurarPrestador, eliminarSede } = useRedMutations();

  const [drawer, setDrawer] = useState<{ open: boolean; prestador: Prestador | null }>({ open: false, prestador: null });
  const [sedeModal, setSedeModal] = useState<{ open: boolean; prestador: Prestador | null; sede: Sede | null }>({ open: false, prestador: null, sede: null });
  const [confirmacion, setConfirmacion] = useState<Confirmacion>(null);

  const permisos = {
    editar: can(PERMISOS.prestadores.editar),
    eliminar: can(PERMISOS.prestadores.eliminar),
    restaurar: can(PERMISOS.prestadores.restaurar),
    crearSede: can(PERMISOS.sedes.crear),
    editarSede: can(PERMISOS.sedes.editar),
    eliminarSede: can(PERMISOS.sedes.eliminar),
  };

  const confirmar = async () => {
    if (!confirmacion) return;
    try {
      if (confirmacion.tipo === 'eliminar-prestador') await eliminarPrestador.mutateAsync(confirmacion.prestador.id);
      if (confirmacion.tipo === 'restaurar-prestador') await restaurarPrestador.mutateAsync(confirmacion.prestador.id);
      if (confirmacion.tipo === 'eliminar-sede') await eliminarSede.mutateAsync(confirmacion.sede.id);
    } finally {
      setConfirmacion(null);
    }
  };

  const hayFiltros = !!(buscar || naturaleza || estado !== 'todos');
  const prestadores = data?.datos ?? [];

  return (
    <>
      <PageHeader
        title="Prestadores y sedes"
        description="Las IPS de tu red y las sedes donde se atiende a los pacientes. Kizuna solo programa citas en sedes activas."
        actions={
          can(PERMISOS.prestadores.crear) && (
            <Button icon={Plus} onClick={() => setDrawer({ open: true, prestador: null })}>
              Nuevo prestador
            </Button>
          )
        }
      />

      <Card className="animate-enter mb-6 overflow-hidden">
        <ListToolbar
          buscar={buscar}
          onBuscar={(value) => update({ buscar: value })}
          placeholder="Nombre, NIT o código REPS"
          estado={estado}
          onEstado={(value) => update({ estado: value })}
          counts={counts}
          mostrarEliminados={permisos.restaurar}
        >
          <Select
            aria-label="Naturaleza jurídica"
            value={extras.naturaleza}
            onChange={(e) => update({ naturaleza: e.target.value })}
            placeholder="Toda naturaleza"
            options={NATURALEZAS}
            className="h-10 sm:w-44"
          />
        </ListToolbar>
      </Card>

      {isError ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <p className="text-sm text-muted">No fue posible cargar los prestadores.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </Card>
      ) : isLoading ? (
        <div className="space-y-6">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-64 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : prestadores.length === 0 ? (
        <Card>
          <EmptyState
            title={hayFiltros ? 'Nada coincide con los filtros' : 'Registra tu primer prestador'}
            description={hayFiltros ? 'Prueba con otra búsqueda o estado.' : 'Empieza por la IPS y luego agrega sus sedes: son la base para programar a los pacientes.'}
            action={
              !hayFiltros &&
              can(PERMISOS.prestadores.crear) && (
                <Button icon={Building2} onClick={() => setDrawer({ open: true, prestador: null })}>
                  Nuevo prestador
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <div className={isFetching ? 'space-y-6 opacity-70 transition-opacity' : 'space-y-6'}>
          {prestadores.map((p) => (
            <PrestadorCard
              key={p.id}
              prestador={p}
              permisos={permisos}
              onEditar={() => setDrawer({ open: true, prestador: p })}
              onEliminar={() => setConfirmacion({ tipo: 'eliminar-prestador', prestador: p })}
              onRestaurar={() => setConfirmacion({ tipo: 'restaurar-prestador', prestador: p })}
              onNuevaSede={() => setSedeModal({ open: true, prestador: p, sede: null })}
              onEditarSede={(sede) => setSedeModal({ open: true, prestador: p, sede })}
              onEliminarSede={(sede) => setConfirmacion({ tipo: 'eliminar-sede', sede })}
            />
          ))}
          {data && data.paginacion.total_paginas > 1 && (
            <Card className="overflow-hidden">
              <Pagination paginacion={data.paginacion} onPageChange={(page) => update({ pagina: page })} disabled={isFetching} />
            </Card>
          )}
        </div>
      )}

      <PrestadorDrawer open={drawer.open} prestador={drawer.prestador} onClose={() => setDrawer({ open: false, prestador: null })} />
      <SedeModal
        open={sedeModal.open}
        prestador={sedeModal.prestador}
        sede={sedeModal.sede}
        onClose={() => setSedeModal({ open: false, prestador: null, sede: null })}
      />

      <ConfirmDialog
        open={!!confirmacion}
        tone={confirmacion?.tipo === 'restaurar-prestador' ? 'primary' : 'danger'}
        title={
          confirmacion?.tipo === 'eliminar-prestador' ? 'Eliminar prestador' : confirmacion?.tipo === 'restaurar-prestador' ? 'Restaurar prestador' : 'Eliminar sede'
        }
        message={
          confirmacion?.tipo === 'eliminar-prestador'
            ? `Se eliminará ${confirmacion.prestador.razon_social} junto con sus ${confirmacion.prestador.sedes_count ?? 0} sedes. Podrás restaurarlo después.`
            : confirmacion?.tipo === 'restaurar-prestador'
              ? `Se restaurará ${confirmacion.prestador.razon_social} con las sedes que se eliminaron junto a él.`
              : confirmacion?.tipo === 'eliminar-sede'
                ? `Se eliminará la sede ${confirmacion.sede.nombre}.${confirmacion.sede.es_principal ? ' Otra sede activa pasará a ser la principal.' : ''}`
                : ''
        }
        confirmLabel={confirmacion?.tipo === 'restaurar-prestador' ? 'Restaurar' : 'Eliminar'}
        isLoading={eliminarPrestador.isPending || restaurarPrestador.isPending || eliminarSede.isPending}
        onConfirm={confirmar}
        onClose={() => setConfirmacion(null)}
      />
    </>
  );
}
