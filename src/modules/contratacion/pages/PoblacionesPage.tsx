import { useState, type ReactNode } from 'react';
import { AlertTriangle, Ban, FileSpreadsheet, Plus, RotateCcw, Trash2, UsersRound } from 'lucide-react';
import { ListToolbar } from '@/components/ListToolbar';
import { Badge, Button, Card, ConfirmDialog, EmptyState, PageHeader, Pagination, Select, Skeleton } from '@/components/ui';
import { useDrawerParam } from '@/hooks/useDrawerParam';
import { useEstadoCounts } from '@/hooks/useEstadoCounts';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/cn';
import { formatDate, formatNumber } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { ModalidadBadge } from '../components/ModalidadBadge';
import { PoblacionDrawer } from '../components/PoblacionDrawer';
import { PoblacionModal } from '../components/PoblacionModal';
import { useContratacionMutations, useContratos, usePoblaciones, useResumenPoblaciones } from '../hooks/useContratacion';
import type { Poblacion } from '../types';

export function PoblacionesPage() {
  const { can } = useAuth();
  const { buscar, estado, extras, update, apiParams } = useListParams(['contrato', 'sin_cargue'] as const);
  const drawer = useDrawerParam();
  const contratoId = extras.contrato ? Number(extras.contrato) : undefined;
  const sinCargue = extras.sin_cargue === '1';
  const base = { buscar: buscar || undefined, contrato_id: contratoId, sin_cargue_mes: sinCargue || undefined };
  const { data, isLoading, isFetching, isError, refetch } = usePoblaciones({ ...apiParams, ...base, por_pagina: 12 });
  const counts = useEstadoCounts(usePoblaciones, base, can(PERMISOS.poblaciones.restaurar));
  const { data: resumen } = useResumenPoblaciones();
  const { data: contratos } = useContratos({ por_pagina: 100 });
  const { eliminarPoblacion, restaurarPoblacion } = useContratacionMutations();
  const [crear, setCrear] = useState(false);
  const [confirmar, setConfirmar] = useState<{ tipo: 'eliminar' | 'restaurar'; poblacion: Poblacion } | null>(null);

  const hayFiltros = !!(buscar || contratoId || sinCargue || estado !== 'todos');
  const poblaciones = data?.datos ?? [];

  return (
    <>
      <PageHeader
        title="Poblaciones"
        description="Los pacientes asignados a cada contrato. La entidad envía la base cada mes; Kizuna la cruza con los servicios pactados para saber a quién programar."
        actions={
          can(PERMISOS.poblaciones.crear) && (
            <Button icon={Plus} onClick={() => setCrear(true)}>
              Nueva población
            </Button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
        <Cifra titulo="Pacientes activos" valor={resumen?.pacientes} />
        <Cifra titulo="Poblaciones en contratos vigentes" valor={resumen?.poblaciones} />
        <Cifra
          titulo="Sin cargue este mes"
          valor={resumen?.sin_cargue_mes}
          icono={resumen?.sin_cargue_mes ? <Ban className="size-4 text-danger" aria-hidden /> : undefined}
          tono={resumen?.sin_cargue_mes ? 'danger' : undefined}
          activo={sinCargue}
          onClick={resumen?.sin_cargue_mes || sinCargue ? () => update({ sin_cargue: sinCargue ? '' : '1' }) : undefined}
          className="col-span-2 lg:col-span-1"
        />
      </div>

      <Card className="animate-enter mb-6 overflow-hidden">
        <ListToolbar
          buscar={buscar}
          onBuscar={(v) => update({ buscar: v })}
          placeholder="Nombre o número de contrato"
          estado={estado}
          onEstado={(v) => update({ estado: v })}
          counts={counts}
          mostrarEliminados={can(PERMISOS.poblaciones.restaurar)}
        >
          <Select
            aria-label="Contrato"
            value={extras.contrato}
            onChange={(e) => update({ contrato: e.target.value })}
            placeholder="Todos los contratos"
            options={(contratos?.datos ?? []).map((c) => ({ value: c.id, label: `${c.numero} · ${c.entidad.sigla || c.entidad.razon_social}` }))}
            className="h-10 sm:w-60"
          />
        </ListToolbar>
      </Card>

      {isError ? (
        <Card className="flex flex-col items-center gap-3 py-14 text-center">
          <p className="text-sm text-muted">No fue posible cargar las poblaciones.</p>
          <Button variant="secondary" size="sm" onClick={() => refetch()}>
            Reintentar
          </Button>
        </Card>
      ) : isLoading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-52 rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : poblaciones.length === 0 ? (
        <Card>
          <EmptyState
            title={hayFiltros ? 'Nada coincide con los filtros' : 'Crea la primera población'}
            description={hayFiltros ? 'Prueba con otra búsqueda o contrato.' : 'Asóciala a un contrato y carga el archivo de pacientes que envía la entidad.'}
            action={
              !hayFiltros &&
              can(PERMISOS.poblaciones.crear) && (
                <Button icon={UsersRound} onClick={() => setCrear(true)}>
                  Nueva población
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          <div className={cn('grid gap-5 lg:grid-cols-2', isFetching && 'opacity-70')}>
            {poblaciones.map((p) => (
              <TarjetaPoblacion
                key={p.id}
                poblacion={p}
                onAbrir={() => drawer.open(p.id)}
                onEliminar={can(PERMISOS.poblaciones.eliminar) ? () => setConfirmar({ tipo: 'eliminar', poblacion: p }) : undefined}
                onRestaurar={can(PERMISOS.poblaciones.restaurar) ? () => setConfirmar({ tipo: 'restaurar', poblacion: p }) : undefined}
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

      <PoblacionDrawer id={drawer.selectedId} onClose={drawer.close} />
      <PoblacionModal open={crear} poblacion={null} contratoId={contratoId} onClose={() => setCrear(false)} onCreada={(p) => drawer.open(p.id)} />
      <ConfirmDialog
        open={!!confirmar}
        tone={confirmar?.tipo === 'restaurar' ? 'primary' : 'danger'}
        title={confirmar?.tipo === 'restaurar' ? 'Restaurar población' : 'Eliminar población'}
        message={
          confirmar?.tipo === 'restaurar'
            ? `Se restaurará ${confirmar.poblacion.nombre} con sus pacientes.`
            : confirmar
              ? `Se eliminará ${confirmar.poblacion.nombre}. Sus ${formatNumber(confirmar.poblacion.pacientes_count)} pacientes dejarán de programarse por este contrato.`
              : ''
        }
        confirmLabel={confirmar?.tipo === 'restaurar' ? 'Restaurar' : 'Eliminar'}
        isLoading={eliminarPoblacion.isPending || restaurarPoblacion.isPending}
        onConfirm={async () => {
          if (confirmar?.tipo === 'eliminar') await eliminarPoblacion.mutateAsync(confirmar.poblacion.id).catch(() => undefined);
          if (confirmar?.tipo === 'restaurar') await restaurarPoblacion.mutateAsync(confirmar.poblacion.id).catch(() => undefined);
          setConfirmar(null);
        }}
        onClose={() => setConfirmar(null)}
      />
    </>
  );
}

function Cifra({
  titulo,
  valor,
  tono,
  icono,
  activo,
  onClick,
  className,
}: {
  titulo: string;
  valor?: number;
  tono?: 'danger';
  icono?: ReactNode;
  activo?: boolean;
  onClick?: () => void;
  className?: string;
}) {
  const Etiqueta = onClick ? 'button' : 'div';
  return (
    <Etiqueta
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? activo : undefined}
      className={cn(
        'animate-enter rounded-[var(--radius-card)] border bg-surface p-4 text-left',
        activo ? 'border-danger ring-1 ring-danger' : 'border-line',
        onClick && 'cursor-pointer transition-colors hover:bg-cream',
        className,
      )}
    >
      <p className="flex items-center gap-1.5 text-sm font-semibold text-muted">
        {icono}
        {titulo}
      </p>
      <p className={cn('tabular mt-1 font-display text-3xl font-bold', tono === 'danger' ? 'text-danger' : 'text-ink')}>{valor === undefined ? '—' : formatNumber(valor)}</p>
      {onClick && <p className="mt-1 text-xs text-muted">{activo ? 'Mostrando solo estas · quitar filtro' : 'Sus pacientes nuevos no se programan · ver cuáles'}</p>}
    </Etiqueta>
  );
}

function TarjetaPoblacion({ poblacion: p, onAbrir, onEliminar, onRestaurar }: { poblacion: Poblacion; onAbrir: () => void; onEliminar?: () => void; onRestaurar?: () => void }) {
  const eliminada = !!p.deleted_at;
  const contrato = p.contrato;

  return (
    <Card className={cn('animate-enter relative flex flex-col p-6 transition-colors hover:bg-cream/40', (!p.activo || eliminada) && 'opacity-70')}>
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={onAbrir} className="min-w-0 cursor-pointer text-left after:absolute after:inset-0">
          <span className="block text-sm font-semibold text-muted">
            {contrato?.entidad?.sigla || contrato?.entidad?.razon_social} · <span className="tabular">{contrato?.numero}</span>
          </span>
          <span className="mt-0.5 block text-lg font-bold text-ink">{p.nombre}</span>
        </button>
        <span className="flex shrink-0 items-center gap-1.5">
          {contrato?.modalidad && <ModalidadBadge modalidad={contrato.modalidad.codigo} />}
          {eliminada && <Badge tone="danger">Eliminada</Badge>}
          {!p.activo && !eliminada && <Badge>Inactiva</Badge>}
        </span>
      </div>

      <div className="mt-5 flex items-end justify-between gap-4">
        <div>
          <p className="tabular font-display text-4xl leading-none font-bold text-ink">{formatNumber(p.pacientes_count)}</p>
          <p className="mt-1 text-sm text-muted">pacientes activos</p>
        </div>
        <span className="relative z-10">
          {eliminada
            ? onRestaurar && <Button size="sm" variant="ghost" icon={RotateCcw} onClick={onRestaurar}>Restaurar</Button>
            : onEliminar && <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Eliminar ${p.nombre}`} onClick={onEliminar} />}
        </span>
      </div>

      <div className="mt-5 border-t border-line pt-4 text-sm">
        {p.cargue_al_dia ? (
          <p className="flex items-center gap-2 text-muted">
            <FileSpreadsheet className="size-4 text-success" aria-hidden />
            Cargue del mes al día · {formatDate(p.ultimo_cargue_en)}
          </p>
        ) : (
          <p className="flex items-center gap-2 font-medium text-danger">
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            {p.ultimo_cargue_en ? 'Sin cargue este mes' : 'Sin cargues todavía'}: los pacientes nuevos no se programarán.
          </p>
        )}
      </div>
    </Card>
  );
}
