import { useState } from 'react';
import { FileText, Plus, RotateCcw, Trash2 } from 'lucide-react';
import { Button, Card, ConfirmDialog, EmptyState, FilterTabs, PageHeader, Pagination, SearchInput, Select, Skeleton, Table, type TableColumn } from '@/components/ui';
import { useDrawerParam } from '@/hooks/useDrawerParam';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/cn';
import { formatCOPCompact, formatDate, formatNumber } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useModalidadesContratacion } from '@/modules/catalogos/hooks/useCatalogos';
import { ContratoDrawer } from '../components/ContratoDrawer';
import { CumplimientoCelda } from '../components/Cumplimiento';
import { EstadoContratoBadge } from '../components/EstadoContratoBadge';
import { ModalidadBadge } from '../components/ModalidadBadge';
import { useContratacionMutations, useContratos, useEntidades, useResumenContratos } from '../hooks/useContratacion';
import { ESTADOS_CONTRATO, type Contrato, type EstadoContrato } from '../types';

const TEXTO_MODALIDAD: Record<string, string> = {
  PGP: 'Valor fijo por un volumen esperado de servicios. Kizuna reparte los cupos a lo largo de la vigencia.',
  EVENTO: 'Se factura cada servicio prestado. Kizuna programa según la demanda.',
  CAPITA: 'Valor fijo por afiliado. Kizuna prioriza la cobertura de toda la población asignada.',
};

type FiltroEstado = 'todos' | EstadoContrato | 'eliminados';

export function ContratosPage() {
  const { can } = useAuth();
  const { buscar, extras, update, pagina } = useListParams(['entidad', 'modalidad', 'estado_contrato'] as const);
  const drawer = useDrawerParam();
  const entidadId = extras.entidad ? Number(extras.entidad) : undefined;
  const modalidadId = extras.modalidad ? Number(extras.modalidad) : undefined;
  const filtroEstado = (extras.estado_contrato || 'todos') as FiltroEstado;

  const base = { buscar: buscar || undefined, entidad_id: entidadId, modalidad_contratacion_id: modalidadId };
  const { data, isLoading, isFetching, isError, refetch } = useContratos({
    ...base,
    estado: filtroEstado !== 'todos' && filtroEstado !== 'eliminados' ? filtroEstado : undefined,
    solo_eliminados: filtroEstado === 'eliminados' || undefined,
    pagina,
    por_pagina: 15,
  });
  const total = useContratos({ ...base, por_pagina: 1 });
  const porVencer = useContratos({ ...base, estado: 'POR_VENCER', por_pagina: 1 });
  const { data: resumen } = useResumenContratos();
  const { data: entidades } = useEntidades({ por_pagina: 100 });
  const { data: modalidades = [] } = useModalidadesContratacion();
  const { eliminarContrato, restaurarContrato } = useContratacionMutations();
  const [confirmar, setConfirmar] = useState<{ tipo: 'eliminar' | 'restaurar'; contrato: Contrato } | null>(null);

  const columns: TableColumn<Contrato>[] = [
    {
      key: 'contrato',
      header: 'Contrato',
      cell: (c) => (
        <button type="button" onClick={() => drawer.open(c.id)} className="cursor-pointer text-left">
          <span className="tabular block font-semibold whitespace-nowrap text-ink hover:underline">{c.numero}</span>
          <span className="block text-xs text-muted">{c.entidad.sigla || c.entidad.razon_social}</span>
        </button>
      ),
    },
    { key: 'modalidad', header: 'Modalidad', cell: (c) => <ModalidadBadge modalidad={c.modalidad.codigo} /> },
    { key: 'regimen', header: 'Régimen', cell: (c) => c.regimen.nombre },
    {
      key: 'vigencia',
      header: 'Vigencia',
      cell: (c) => (
        <span className="tabular text-xs whitespace-nowrap">
          {formatDate(c.fecha_inicio)} – {formatDate(c.fecha_fin)}
        </span>
      ),
    },
    { key: 'valor', header: 'Valor', align: 'right', cell: (c) => <span className="tabular font-semibold text-ink">{c.valor ? formatCOPCompact(c.valor) : '—'}</span> },
    { key: 'cumplimiento', header: 'Cumplimiento', cell: (c) => <CumplimientoCelda cumplimiento={c.cumplimiento} /> },
    { key: 'cups', header: 'CUPS', align: 'right', cell: (c) => <span className="tabular">{c.cups_count}</span> },
    { key: 'pacientes', header: 'Pacientes', align: 'right', cell: (c) => <span className="tabular">{c.pacientes_count ? formatNumber(c.pacientes_count) : '—'}</span> },
    { key: 'estado', header: 'Estado', cell: (c) => <EstadoContratoBadge estado={c.estado} /> },
    {
      key: 'acciones',
      header: <span className="sr-only">Acciones</span>,
      align: 'right',
      cell: (c) =>
        c.deleted_at
          ? can(PERMISOS.contratos.restaurar) && (
              <Button size="sm" variant="ghost" iconOnly icon={RotateCcw} aria-label={`Restaurar ${c.numero}`} onClick={() => setConfirmar({ tipo: 'restaurar', contrato: c })} />
            )
          : can(PERMISOS.contratos.eliminar) && (
              <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Eliminar ${c.numero}`} onClick={() => setConfirmar({ tipo: 'eliminar', contrato: c })} />
            ),
    },
  ];

  const hayFiltros = !!(buscar || entidadId || modalidadId || filtroEstado !== 'todos');
  const contratos = data?.datos ?? [];

  return (
    <>
      <PageHeader
        title="Contratos"
        description="Qué servicios cubre cada entidad, bajo qué modalidad, en qué sedes y por cuánto tiempo. Definen qué pacientes y qué CUPS puede programar Kizuna."
        actions={
          can(PERMISOS.contratos.crear) && (
            <Button icon={Plus} onClick={drawer.create}>
              Nuevo contrato
            </Button>
          )
        }
      />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {modalidades
          .filter((m) => m.activo)
          .map((m) => {
            const fila = resumen?.por_modalidad.find((x) => x.modalidad?.id === m.id);
            const activa = modalidadId === m.id;
            return (
              <button
                key={m.id}
                type="button"
                aria-pressed={activa}
                onClick={() => update({ modalidad: activa ? '' : m.id })}
                className={cn(
                  'animate-enter cursor-pointer rounded-[var(--radius-card)] border bg-surface p-5 text-left transition-colors hover:bg-cream',
                  activa ? 'border-petrol ring-1 ring-petrol' : 'border-line',
                )}
              >
                <span className="flex items-center justify-between">
                  <ModalidadBadge modalidad={m.codigo} />
                  <span className="tabular text-sm text-muted">
                    {fila?.cantidad ?? 0} en ejecución
                  </span>
                </span>
                <span className="mt-3 block text-base font-bold text-ink">{m.nombre}</span>
                <span className="mt-1 block text-sm leading-relaxed text-muted">{TEXTO_MODALIDAD[m.codigo] ?? m.descripcion}</span>
                <span className="tabular mt-3 block font-display text-2xl font-bold text-ink">{formatCOPCompact(fila?.valor ?? 0)}</span>
              </button>
            );
          })}
      </div>

      <Card className="animate-enter overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs
            aria-label="Filtrar por estado"
            value={filtroEstado}
            onChange={(v) => update({ estado_contrato: v === 'todos' ? '' : v })}
            tabs={[
              { value: 'todos', label: 'Todos', count: total.data?.paginacion.total },
              ...ESTADOS_CONTRATO.map((e) => ({
                value: e.value as FiltroEstado,
                label: e.label,
                count: e.value === 'POR_VENCER' ? porVencer.data?.paginacion.total : undefined,
              })),
              ...(can(PERMISOS.contratos.restaurar) ? [{ value: 'eliminados' as const, label: 'Eliminados' }] : []),
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              aria-label="Entidad"
              value={extras.entidad}
              onChange={(e) => update({ entidad: e.target.value })}
              placeholder="Todas las entidades"
              options={(entidades?.datos ?? []).map((e) => ({ value: e.id, label: e.sigla || e.razon_social }))}
              className="h-10 sm:w-52"
            />
            <SearchInput value={buscar} onChange={(v) => update({ buscar: v })} placeholder="Número o entidad" className="sm:w-56" />
          </div>
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm text-muted">No fue posible cargar los contratos.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : contratos.length === 0 ? (
          <EmptyState
            title={hayFiltros ? 'Nada coincide con los filtros' : 'Registra el primer contrato'}
            description={hayFiltros ? 'Prueba con otra entidad, modalidad o estado.' : 'Cada contrato indica la entidad, la modalidad, la vigencia, las sedes y los CUPS que cubre.'}
            action={
              !hayFiltros &&
              can(PERMISOS.contratos.crear) && (
                <Button icon={FileText} onClick={drawer.create}>
                  Nuevo contrato
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table columns={columns} rows={contratos} rowKey={(c) => c.id} className={isFetching ? 'opacity-70' : undefined} />
            {data && <Pagination paginacion={data.paginacion} onPageChange={(p) => update({ pagina: p })} disabled={isFetching} />}
          </>
        )}
      </Card>

      <ContratoDrawer abierto={drawer.isCreating ? 'nuevo' : drawer.selectedId} entidadId={entidadId} onAbrir={drawer.open} onClose={drawer.close} />
      <ConfirmDialog
        open={!!confirmar}
        tone={confirmar?.tipo === 'restaurar' ? 'primary' : 'danger'}
        title={confirmar?.tipo === 'restaurar' ? 'Restaurar contrato' : 'Eliminar contrato'}
        message={
          confirmar?.tipo === 'restaurar'
            ? `Se restaurará ${confirmar.contrato.numero} con las poblaciones que se eliminaron junto a él.`
            : confirmar
              ? `Se eliminará ${confirmar.contrato.numero} y sus ${confirmar.contrato.poblaciones_count} poblaciones. Si se suspendió o terminó, mejor desactívalo o deja que venza.`
              : ''
        }
        confirmLabel={confirmar?.tipo === 'restaurar' ? 'Restaurar' : 'Eliminar'}
        isLoading={eliminarContrato.isPending || restaurarContrato.isPending}
        onConfirm={async () => {
          if (confirmar?.tipo === 'eliminar') await eliminarContrato.mutateAsync(confirmar.contrato.id).catch(() => undefined);
          if (confirmar?.tipo === 'restaurar') await restaurarContrato.mutateAsync(confirmar.contrato.id).catch(() => undefined);
          setConfirmar(null);
        }}
        onClose={() => setConfirmar(null)}
      />
    </>
  );
}
