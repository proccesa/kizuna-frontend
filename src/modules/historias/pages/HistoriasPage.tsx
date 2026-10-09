import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Badge, Card, EmptyState, FilterTabs, PageHeader, Pagination, SearchInput, Select, Skeleton, Table, type TableColumn } from '@/components/ui';
import { useListParams } from '@/hooks/useListParams';
import { formatDateTime } from '@/lib/format';
import { CONCEPTOS, ROMANO } from '@/modules/cirugia/types';
import { useHistorias, usePlantillas } from '../hooks/useHistorias';
import type { EstadoHistoria, Historia } from '../types';

const ESTADOS: { value: EstadoHistoria | 'todos'; label: string }[] = [
  { value: 'todos', label: 'Todas' },
  { value: 'BORRADOR', label: 'En curso' },
  { value: 'FINALIZADA', label: 'Finalizadas' },
  { value: 'ANULADA', label: 'Anuladas' },
];

export function HistoriasPage() {
  const { buscar, extras, update, pagina } = useListParams(['estado_hc', 'plantilla'] as const);
  const estado = (extras.estado_hc || 'todos') as EstadoHistoria | 'todos';
  const { data, isLoading, isFetching } = useHistorias({
    buscar: buscar || undefined,
    estado: estado === 'todos' ? undefined : estado,
    plantilla: extras.plantilla || undefined,
    pagina,
    por_pagina: 20,
  });
  const { data: plantillas = [] } = usePlantillas();

  const columns: TableColumn<Historia>[] = [
    {
      key: 'paciente',
      header: 'Paciente',
      cell: (h) => (
        <Link to={`/historias/${h.id}`} className="block hover:underline">
          <span className="block font-semibold text-ink">{h.paciente.nombre_completo}</span>
          <span className="tabular block text-xs text-muted">
            {h.paciente.tipo_documento?.codigo} {h.paciente.numero_documento}
          </span>
        </Link>
      ),
    },
    { key: 'plantilla', header: 'Historia', cell: (h) => <span className="text-sm">{h.version.plantilla.nombre}</span> },
    { key: 'cirugia', header: 'Cirugía', cell: (h) => (h.orden?.cups ? <span className="tabular text-sm">{h.orden.cups.codigo}</span> : '—') },
    {
      key: 'concepto',
      header: 'Concepto',
      cell: (h) => {
        const c = h.resultado?.concepto;
        return c ? (
          <span className="text-sm whitespace-nowrap">
            {CONCEPTOS[c]}
            {h.resultado?.asa ? ` · ASA ${ROMANO[h.resultado.asa]}` : ''}
          </span>
        ) : (
          '—'
        );
      },
    },
    { key: 'profesional', header: 'Profesional', cell: (h) => <span className="text-sm">{h.especialista?.nombre_completo ?? h.profesional_externo ?? '—'}</span> },
    { key: 'fecha', header: 'Actualizada', cell: (h) => <span className="tabular text-xs whitespace-nowrap">{formatDateTime(h.finalizada_en ?? h.updated_at)}</span> },
    {
      key: 'estado',
      header: 'Estado',
      cell: (h) => (
        <span className="flex gap-1">
          <Badge tone={h.estado === 'FINALIZADA' ? 'success' : h.estado === 'ANULADA' ? 'danger' : 'lime'}>
            {h.estado === 'BORRADOR' ? 'En curso' : h.estado === 'FINALIZADA' ? 'Finalizada' : 'Anulada'}
          </Badge>
          {h.origen === 'EXTERNO' && <Badge>Externa</Badge>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Historias clínicas"
        description="Historias diligenciadas en Kizuna o recibidas de otros sistemas. Una historia finalizada no se modifica: si hay un error se anula con justificación."
      />
      <Card className="animate-enter overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs aria-label="Estado" value={estado} onChange={(v) => update({ estado_hc: v === 'todos' ? '' : v })} tabs={ESTADOS} />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select
              aria-label="Plantilla"
              value={extras.plantilla}
              onChange={(e) => update({ plantilla: e.target.value })}
              placeholder="Todas las plantillas"
              options={plantillas.map((p) => ({ value: p.codigo, label: p.nombre }))}
              className="h-10 sm:w-56"
            />
            <SearchInput value={buscar} onChange={(v) => update({ buscar: v })} placeholder="Documento o nombre del paciente" className="sm:w-64" />
          </div>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !data?.datos.length ? (
          <EmptyState
            title="Sin historias"
            description="Las historias de pre-anestesia se abren desde la agenda, con el botón Atender de cada cita."
            action={
              <Link to="/preanestesia" className="inline-flex items-center gap-2 rounded-xl bg-petrol px-4 py-2.5 text-sm font-semibold text-white hover:bg-petrol-hover">
                <FileText className="size-4" aria-hidden /> Ir a la agenda
              </Link>
            }
          />
        ) : (
          <>
            <Table columns={columns} rows={data.datos} rowKey={(h) => h.id} className={isFetching ? 'opacity-70' : undefined} />
            <Pagination paginacion={data.paginacion} onPageChange={(p) => update({ pagina: p })} disabled={isFetching} />
          </>
        )}
      </Card>
    </>
  );
}
