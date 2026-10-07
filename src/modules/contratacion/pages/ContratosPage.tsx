import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Badge, Button, Card, DemoBanner, FilterTabs, PageHeader, Progress, Table, type TableColumn } from '@/components/ui';
import { CONTRATOS, ENTIDADES, POBLACIONES, type Contrato, type Modalidad } from '@/demo/datos';
import { accionDemo } from '@/lib/demo';
import { formatCOPCompact, formatDate, formatNumber } from '@/lib/format';
import { ModalidadBadge } from '../components/ModalidadBadge';

const MODALIDADES: { modalidad: Modalidad; titulo: string; texto: string }[] = [
  { modalidad: 'PGP', titulo: 'Pago global prospectivo', texto: 'Valor fijo por un volumen esperado de servicios. Kizuna reparte los cupos a lo largo de la vigencia.' },
  { modalidad: 'Evento', titulo: 'Por evento', texto: 'Se factura cada servicio prestado. Kizuna programa según la demanda y la autorización.' },
  { modalidad: 'Cápita', titulo: 'Cápita', texto: 'Valor fijo por afiliado. Kizuna prioriza la cobertura de toda la población asignada.' },
];

const estadoTono = { Vigente: 'success', 'Por vencer': 'warning', 'En negociación': 'neutral' } as const;

export function ContratosPage() {
  const [filtro, setFiltro] = useState<'todos' | Modalidad>('todos');
  const filas = CONTRATOS.filter((c) => filtro === 'todos' || c.modalidad === filtro);

  const columns: TableColumn<Contrato>[] = [
    {
      key: 'contrato',
      header: 'Contrato',
      cell: (c) => (
        <div>
          <p className="tabular font-semibold whitespace-nowrap text-ink">{c.codigo}</p>
          <p className="text-xs text-muted">{ENTIDADES.find((e) => e.id === c.entidadId)?.nombre}</p>
        </div>
      ),
    },
    { key: 'modalidad', header: 'Modalidad', cell: (c) => <ModalidadBadge modalidad={c.modalidad} /> },
    { key: 'regimen', header: 'Régimen', cell: (c) => c.regimen },
    {
      key: 'vigencia',
      header: 'Vigencia',
      cell: (c) => (
        <span className="tabular text-xs whitespace-nowrap">
          {formatDate(c.inicio)} – {formatDate(c.fin)}
        </span>
      ),
    },
    { key: 'valor', header: 'Valor', align: 'right', cell: (c) => <span className="tabular font-semibold text-ink">{formatCOPCompact(c.valor)}</span> },
    {
      key: 'ejecucion',
      header: 'Ejecución',
      cell: (c) => (
        <div className="w-32">
          <div className="tabular mb-1 text-xs text-muted">{c.ejecucion}%</div>
          <Progress value={c.ejecucion} tone={c.ejecucion > 85 ? 'warning' : 'petrol'} label={`Ejecución ${c.codigo}`} />
        </div>
      ),
    },
    {
      key: 'poblacion',
      header: 'Población',
      align: 'right',
      cell: (c) => {
        const n = POBLACIONES.filter((p) => p.contratoId === c.id).reduce((s, p) => s + p.pacientes, 0);
        return <span className="tabular">{n ? formatNumber(n) : '—'}</span>;
      },
    },
    { key: 'cups', header: 'CUPS', align: 'right', cell: (c) => <span className="tabular">{c.cups.length}</span> },
    { key: 'estado', header: 'Estado', cell: (c) => <Badge tone={estadoTono[c.estado]}>{c.estado}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Contratos"
        description="Qué servicios cubre cada entidad, bajo qué modalidad y por cuánto tiempo. Definen qué pacientes y qué CUPS puede programar Kizuna."
        actions={
          <Button icon={Plus} onClick={accionDemo('Crear contrato')}>
            Nuevo contrato
          </Button>
        }
      />
      <DemoBanner />

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        {MODALIDADES.map((m) => {
          const delTipo = CONTRATOS.filter((c) => c.modalidad === m.modalidad);
          return (
            <Card key={m.modalidad} className="animate-enter p-5">
              <div className="flex items-center justify-between">
                <ModalidadBadge modalidad={m.modalidad} />
                <span className="tabular text-sm text-muted">
                  {delTipo.length} {delTipo.length === 1 ? 'contrato' : 'contratos'}
                </span>
              </div>
              <h2 className="mt-3 text-base font-bold">{m.titulo}</h2>
              <p className="mt-1 text-sm leading-relaxed text-muted">{m.texto}</p>
              <p className="tabular mt-3 font-display text-2xl font-bold text-ink">{formatCOPCompact(delTipo.reduce((s, c) => s + c.valor, 0))}</p>
            </Card>
          );
        })}
      </div>

      <Card className="animate-enter overflow-hidden">
        <div className="border-b border-line p-4">
          <FilterTabs
            aria-label="Filtrar por modalidad"
            value={filtro}
            onChange={setFiltro}
            tabs={[
              { value: 'todos', label: 'Todos', count: CONTRATOS.length },
              ...MODALIDADES.map((m) => ({ value: m.modalidad, label: m.modalidad, count: CONTRATOS.filter((c) => c.modalidad === m.modalidad).length })),
            ]}
          />
        </div>
        <Table columns={columns} rows={filas} rowKey={(c) => c.id} />
      </Card>
    </>
  );
}
