import { useState } from 'react';
import { CalendarSync, Plus, Settings2, Upload } from 'lucide-react';
import { Badge, Button, Card, EmptyState, FilterTabs, PageHeader, Pagination, SearchInput, Select, Skeleton, Table, type TableColumn } from '@/components/ui';
import { useDrawerParam } from '@/hooks/useDrawerParam';
import { useListParams } from '@/hooks/useListParams';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { CargarOrdenesModal } from '../components/CargarOrdenesModal';
import { EstadoOrdenBadge } from '../components/EstadoOrdenBadge';
import { NuevaOrdenDrawer } from '../components/NuevaOrdenDrawer';
import { OrdenDrawer } from '../components/OrdenDrawer';
import { ReglasModal } from '../components/ReglasModal';
import { useCirugiaMutations, useOrdenes, useResumenOrdenes } from '../hooks/useCirugia';
import { CONCEPTOS, ESTADOS_ORDEN, ROMANO, type FiltroOrden, type Orden } from '../types';

const ORIGEN = { API: 'Integración', CSV: 'Archivo', MANUAL: 'Manual' } as const;

/** Qué sigue con la orden, en una línea. */
function situacion(o: Orden): string {
  if (o.aval_vencido) return `Aval vencido el ${formatDate(o.aval_hasta)}: requiere nueva valoración`;
  switch (o.estado) {
    case 'CITA_ASIGNADA':
      return o.cita_actual ? `Pre-anestesia ${formatDate(o.cita_actual.fecha)} · ${o.cita_actual.hora_inicio} · ${o.cita_actual.especialista?.nombre_completo ?? ''}` : 'Cita asignada';
    case 'PROGRAMADA':
    case 'OPERADA':
      return o.cirugia ? `Cirugía ${o.estado === 'OPERADA' ? 'realizada' : 'programada'} ${formatDate(o.cirugia.fecha)} · ${o.cirugia.hora_inicio}${o.cirugia.sala ? ` · ${o.cirugia.sala.nombre}` : ''}` : 'Cirugía programada';
    case 'APTA':
      return `${CONCEPTOS[o.concepto ?? 'APTO']}${o.asa ? ` · ASA ${ROMANO[o.asa]}` : ''} · aval hasta ${formatDate(o.aval_hasta)} · cirugía desde ${formatDate(o.programable_desde)}`;
    default:
      return o.motivo_estado ?? '—';
  }
}

export function OrdenesPage() {
  const { can } = useAuth();
  const { buscar, extras, update, pagina } = useListParams(['estado_orden', 'prioridad'] as const);
  const drawer = useDrawerParam();
  const estado = (extras.estado_orden || '') as FiltroOrden | '';
  const { data, isLoading, isFetching, isError, refetch } = useOrdenes({
    estado: estado || undefined,
    prioridad: extras.prioridad || undefined,
    buscar: buscar || undefined,
    pagina,
    por_pagina: 20,
  });
  const { data: resumen } = useResumenOrdenes();
  const { asignarPendientes } = useCirugiaMutations();
  const [nueva, setNueva] = useState(false);
  const [cargar, setCargar] = useState(false);
  const [reglas, setReglas] = useState(false);

  const columns: TableColumn<Orden>[] = [
    {
      key: 'paciente',
      header: 'Paciente',
      cell: (o) => (
        <button type="button" onClick={() => drawer.open(o.id)} className="cursor-pointer text-left">
          <span className="block font-semibold text-ink hover:underline">{o.paciente.nombre_completo}</span>
          <span className="tabular block text-xs text-muted">
            {o.paciente.tipo_documento?.codigo} {o.paciente.numero_documento} · {o.paciente.edad} años
          </span>
        </button>
      ),
    },
    {
      key: 'cirugia',
      header: 'Cirugía',
      className: 'min-w-56',
      cell: (o) => (
        <div>
          <p className="tabular font-display font-bold text-ink">{o.cups.codigo}</p>
          <p className="line-clamp-1 text-xs text-body">{o.cups.nombre.toLowerCase()}</p>
        </div>
      ),
    },
    {
      key: 'estado',
      header: 'Estado',
      cell: (o) => (
        <span className="flex flex-col items-start gap-1">
          <EstadoOrdenBadge orden={o} />
          {o.prioridad === 'PRIORITARIA' && <Badge tone="warning">Prioritaria</Badge>}
        </span>
      ),
    },
    { key: 'situacion', header: 'Situación', className: 'min-w-64', cell: (o) => <span className="text-sm text-body">{situacion(o)}</span> },
    {
      key: 'origen',
      header: 'Origen',
      cell: (o) => (
        <span className="text-xs whitespace-nowrap text-muted">
          {ORIGEN[o.origen]}
          {o.referencia_externa && <span className="tabular block">{o.referencia_externa}</span>}
        </span>
      ),
    },
    { key: 'fecha', header: 'Orden', cell: (o) => <span className="tabular text-xs whitespace-nowrap">{formatDate(o.fecha_orden)}</span> },
  ];

  const pendientes = resumen?.PENDIENTE_CITA ?? 0;

  return (
    <>
      <PageHeader
        title="Órdenes quirúrgicas"
        description="Cada orden válida recibe automáticamente su cita de pre-anestesia. Con el concepto apto, el paciente queda listo para programar la cirugía."
        actions={
          <>
            {can(PERMISOS.preanestesia.configurar) && (
              <Button variant="ghost" icon={Settings2} onClick={() => setReglas(true)}>
                Reglas
              </Button>
            )}
            {can(PERMISOS.ordenes.crear) && (
              <>
                <Button variant="secondary" icon={Upload} onClick={() => setCargar(true)}>
                  Cargar archivo
                </Button>
                <Button icon={Plus} onClick={() => setNueva(true)}>
                  Nueva orden
                </Button>
              </>
            )}
          </>
        }
      />

      {pendientes > 0 && can(PERMISOS.ordenes.gestionar) && (
        <div className="animate-enter mb-5 flex flex-col gap-3 rounded-[var(--radius-card)] bg-warning-soft px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-warning">
            <b>
              {pendientes} {pendientes === 1 ? 'orden no encontró' : 'órdenes no encontraron'} cupo de pre-anestesia.
            </b>{' '}
            Kizuna reintenta cada hora; si acabas de abrir agenda, reintenta ahora.
          </p>
          <Button variant="secondary" size="sm" icon={CalendarSync} onClick={() => asignarPendientes.mutate()} isLoading={asignarPendientes.isPending} className="shrink-0">
            Buscar cupo ahora
          </Button>
        </div>
      )}

      <Card className="animate-enter overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs
            aria-label="Estado de la orden"
            value={estado || 'todas'}
            onChange={(v) => update({ estado_orden: v === 'todas' ? '' : v })}
            tabs={[
              { value: 'todas', label: 'Todas', count: resumen?.TOTAL },
              ...ESTADOS_ORDEN.map((e) => ({ value: e.value, label: e.label, count: resumen?.[e.value] })),
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              aria-label="Prioridad"
              value={extras.prioridad}
              onChange={(e) => update({ prioridad: e.target.value })}
              placeholder="Toda prioridad"
              options={[
                { value: 'PRIORITARIA', label: 'Prioritarias' },
                { value: 'ELECTIVA', label: 'Electivas' },
              ]}
              className="h-10 sm:w-40"
            />
            <SearchInput value={buscar} onChange={(v) => update({ buscar: v })} placeholder="Paciente, CUPS o referencia" className="sm:w-64" />
          </div>
        </div>

        {isError ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm text-muted">No fue posible cargar las órdenes.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !data?.datos.length ? (
          <EmptyState
            title={estado || buscar ? 'Nada coincide' : 'Aún no hay órdenes'}
            description={
              estado || buscar
                ? 'Prueba con otro estado o búsqueda.'
                : 'Las órdenes llegan del sistema externo por la integración, por archivo o se registran a mano.'
            }
            action={
              !estado &&
              !buscar &&
              can(PERMISOS.ordenes.crear) && (
                <Button icon={Plus} onClick={() => setNueva(true)}>
                  Nueva orden
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table columns={columns} rows={data.datos} rowKey={(o) => o.id} className={isFetching ? 'opacity-70' : undefined} />
            <Pagination paginacion={data.paginacion} onPageChange={(p) => update({ pagina: p })} disabled={isFetching} />
          </>
        )}
      </Card>

      <OrdenDrawer id={drawer.selectedId} onClose={drawer.close} />
      <NuevaOrdenDrawer
        open={nueva}
        onClose={() => setNueva(false)}
        onCreada={(o) => {
          setNueva(false);
          drawer.open(o.id);
        }}
      />
      <CargarOrdenesModal open={cargar} onClose={() => setCargar(false)} />
      <ReglasModal open={reglas} onClose={() => setReglas(false)} />
    </>
  );
}
