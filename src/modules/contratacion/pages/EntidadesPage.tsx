import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Landmark, Pencil, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { ListToolbar } from '@/components/ListToolbar';
import { Badge, Button, Card, ConfirmDialog, EmptyState, PageHeader, Pagination, Select, Skeleton, StatusBadge } from '@/components/ui';
import { useEstadoCounts } from '@/hooks/useEstadoCounts';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { EntidadDrawer } from '../components/EntidadDrawer';
import { useContratacionMutations, useEntidades } from '../hooks/useContratacion';
import { TIPOS_ENTIDAD, type Entidad, type TipoEntidad } from '../types';

export function EntidadesPage() {
  const { can } = useAuth();
  const { buscar, estado, extras, update, apiParams } = useListParams(['tipo'] as const);
  const tipo = (extras.tipo || undefined) as TipoEntidad | undefined;
  const { data, isLoading, isFetching, isError, refetch } = useEntidades({ ...apiParams, tipo, por_pagina: 12 });
  const counts = useEstadoCounts(useEntidades, { buscar: buscar || undefined, tipo }, can(PERMISOS.entidades.restaurar));
  const { eliminarEntidad, restaurarEntidad } = useContratacionMutations();
  const [drawer, setDrawer] = useState<{ open: boolean; entidad: Entidad | null }>({ open: false, entidad: null });
  const [confirmar, setConfirmar] = useState<{ tipo: 'eliminar' | 'restaurar'; entidad: Entidad } | null>(null);

  const hayFiltros = !!(buscar || tipo || estado !== 'todos');
  const entidades = data?.datos ?? [];

  return (
    <>
      <PageHeader
        title="Entidades"
        description="EPS y demás pagadores con los que tu IPS tiene contratos. Cada paciente llega a Kizuna a través de una de ellas."
        actions={
          can(PERMISOS.entidades.crear) && (
            <Button icon={Plus} onClick={() => setDrawer({ open: true, entidad: null })}>
              Nueva entidad
            </Button>
          )
        }
      />

      <Card className="animate-enter mb-6 overflow-hidden">
        <ListToolbar
          buscar={buscar}
          onBuscar={(v) => update({ buscar: v })}
          placeholder="Nombre, sigla, NIT o código"
          estado={estado}
          onEstado={(v) => update({ estado: v })}
          counts={counts}
          mostrarEliminados={can(PERMISOS.entidades.restaurar)}
        >
          <Select aria-label="Tipo de entidad" value={extras.tipo} onChange={(e) => update({ tipo: e.target.value })} placeholder="Todo tipo" options={TIPOS_ENTIDAD} className="h-10 sm:w-48" />
        </ListToolbar>
      </Card>

      {isError ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <p className="text-sm text-muted">No fue posible cargar las entidades.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-5 md:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : entidades.length === 0 ? (
        <Card>
          <EmptyState
            title={hayFiltros ? 'Nada coincide con los filtros' : 'Registra la primera entidad'}
            description={hayFiltros ? 'Prueba con otra búsqueda, tipo o estado.' : 'Empieza por las EPS con las que tienes contrato; luego registra cada contrato y su población.'}
            action={
              !hayFiltros &&
              can(PERMISOS.entidades.crear) && (
                <Button icon={Landmark} onClick={() => setDrawer({ open: true, entidad: null })}>
                  Nueva entidad
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          <div className={cn('grid gap-5 md:grid-cols-2', isFetching && 'opacity-70')}>
            {entidades.map((e) => (
              <TarjetaEntidad
                key={e.id}
                entidad={e}
                onEditar={can(PERMISOS.entidades.editar) ? () => setDrawer({ open: true, entidad: e }) : undefined}
                onEliminar={can(PERMISOS.entidades.eliminar) ? () => setConfirmar({ tipo: 'eliminar', entidad: e }) : undefined}
                onRestaurar={can(PERMISOS.entidades.restaurar) ? () => setConfirmar({ tipo: 'restaurar', entidad: e }) : undefined}
              />
            ))}
          </div>
          {data && data.paginacion.total_paginas > 1 && (
            <Card className="mt-6 overflow-hidden">
              <Pagination paginacion={data.paginacion} onPageChange={(p) => update({ pagina: p })} disabled={isFetching} />
            </Card>
          )}
        </>
      )}

      <EntidadDrawer open={drawer.open} entidad={drawer.entidad} onClose={() => setDrawer({ open: false, entidad: null })} />
      <ConfirmDialog
        open={!!confirmar}
        tone={confirmar?.tipo === 'restaurar' ? 'primary' : 'danger'}
        title={confirmar?.tipo === 'restaurar' ? 'Restaurar entidad' : 'Eliminar entidad'}
        message={
          confirmar?.tipo === 'restaurar'
            ? `Se restaurará ${confirmar.entidad.razon_social}. Sus contratos eliminados se restauran por separado.`
            : confirmar
              ? `Se eliminará ${confirmar.entidad.razon_social}. Solo es posible si no tiene contratos; si dejaste de trabajar con ella, mejor desactívala.`
              : ''
        }
        confirmLabel={confirmar?.tipo === 'restaurar' ? 'Restaurar' : 'Eliminar'}
        isLoading={eliminarEntidad.isPending || restaurarEntidad.isPending}
        onConfirm={async () => {
          if (confirmar?.tipo === 'eliminar') await eliminarEntidad.mutateAsync(confirmar.entidad.id).catch(() => undefined);
          if (confirmar?.tipo === 'restaurar') await restaurarEntidad.mutateAsync(confirmar.entidad.id).catch(() => undefined);
          setConfirmar(null);
        }}
        onClose={() => setConfirmar(null)}
      />
    </>
  );
}

function TarjetaEntidad({ entidad: e, onEditar, onEliminar, onRestaurar }: { entidad: Entidad; onEditar?: () => void; onEliminar?: () => void; onRestaurar?: () => void }) {
  const eliminada = !!e.deleted_at;
  const sigla = e.sigla || e.razon_social.split(/\s+/).map((p) => p[0]).join('').slice(0, 4).toUpperCase();

  return (
    <Card className={cn('animate-enter flex flex-col', (!e.activo || eliminada) && 'opacity-70')}>
      <div className="flex items-start gap-4 px-6 pt-6">
        <span className="flex h-12 min-w-12 items-center justify-center rounded-2xl rounded-bl-md bg-petrol px-2 font-display text-xs font-bold tracking-tight text-white">{sigla}</span>
        <div className="min-w-0 flex-1">
          <h2 className="text-lg leading-snug font-bold">{e.razon_social}</h2>
          <p className="tabular text-sm text-muted">
            NIT {e.nit_completo}
            {e.codigo_minsalud && ` · ${e.codigo_minsalud}`}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge>{TIPOS_ENTIDAD.find((t) => t.value === e.tipo)?.label ?? e.tipo}</Badge>
            {e.regimenes.map((r) => (
              <Badge key={r.id} tone="mist">
                {r.nombre}
              </Badge>
            ))}
            {(eliminada || !e.activo) && <StatusBadge value={eliminada ? 'deleted' : 'inactive'} />}
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-px border-y border-line bg-line">
        <div className="bg-surface px-6 py-3">
          <p className="text-xs font-semibold text-muted">Contratos en ejecución</p>
          <p className="tabular font-display text-2xl font-bold text-ink">
            {e.contratos_en_ejecucion_count}
            {e.contratos_count > e.contratos_en_ejecucion_count && <span className="ml-1 text-sm font-semibold text-muted">de {e.contratos_count}</span>}
          </p>
        </div>
        <div className="bg-surface px-6 py-3">
          <p className="text-xs font-semibold text-muted">Pacientes</p>
          <p className="tabular font-display text-2xl font-bold text-ink">{formatNumber(e.pacientes_count)}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-2 px-4 py-3">
        <Link to={`/contratos?entidad=${e.id}`} className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-semibold text-petrol hover:bg-cream">
          Ver contratos <ArrowRight className="size-4" aria-hidden />
        </Link>
        <span className="flex gap-1">
          {eliminada ? (
            onRestaurar && <Button size="sm" variant="ghost" icon={RotateCcw} onClick={onRestaurar}>Restaurar</Button>
          ) : (
            <>
              {onEditar && <Button size="sm" variant="ghost" iconOnly icon={Pencil} aria-label={`Editar ${e.razon_social}`} onClick={onEditar} />}
              {onEliminar && <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Eliminar ${e.razon_social}`} onClick={onEliminar} />}
            </>
          )}
        </span>
      </div>
    </Card>
  );
}
