import { useState } from 'react';
import { AlertTriangle, Plus, Upload } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Pagination, SearchInput, Select, Skeleton, Table, type TableColumn } from '@/components/ui';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useSedes } from '@/modules/red/hooks/useRed';
import { useUnidades } from '../hooks/useInventario';
import { ESTADOS_UNIDAD, type EstadoUnidad, type TipoItem, type Unidad, type UnidadesFiltros } from '../types';
import { CargarInventarioModal } from './CargarInventarioModal';
import { UnidadDrawer } from './UnidadDrawer';

/** Lista de equipos biomédicos o de cajas de instrumental, con su estado y alertas. */
export function UnidadesVista({ tipo }: { tipo: Extract<TipoItem, 'EQUIPO' | 'INSTRUMENTAL'> }) {
  const { can } = useAuth();
  const { buscar, extras, update, pagina } = useListParams(['sede', 'estado_unidad', 'alerta', 'unidad'] as const);
  const { data, isLoading, isFetching } = useUnidades({
    tipo,
    buscar: buscar || undefined,
    sede_id: extras.sede ? Number(extras.sede) : undefined,
    estado: (extras.estado_unidad || undefined) as EstadoUnidad | undefined,
    alerta: (extras.alerta || undefined) as UnidadesFiltros['alerta'],
    pagina,
    por_pagina: 25,
  });
  const { data: sedes } = useSedes({ por_pagina: 100 });
  const [cargar, setCargar] = useState(false);
  const abierto = extras.unidad === 'nuevo' ? 'nuevo' : extras.unidad ? Number(extras.unidad) : null;
  const esEquipo = tipo === 'EQUIPO';

  const columns: TableColumn<Unidad>[] = [
    {
      key: 'codigo',
      header: esEquipo ? 'Placa' : 'Código',
      cell: (u) => (
        <button type="button" onClick={() => update({ unidad: u.id })} className="cursor-pointer text-left">
          <span className="tabular block font-display font-bold whitespace-nowrap text-ink hover:underline">{u.codigo}</span>
          <span className="block text-xs text-muted">{u.item.nombre}</span>
        </button>
      ),
    },
    { key: 'marca', header: 'Marca y modelo', cell: (u) => <span className="text-sm">{[u.marca, u.modelo].filter(Boolean).join(' · ') || '—'}</span> },
    {
      key: 'ubicacion',
      header: 'Ubicación',
      cell: (u) => (
        <span className="text-sm whitespace-nowrap">
          {u.sede.nombre}
          {esEquipo && <span className="block text-xs text-muted">{u.sala ? `Fijo en ${u.sala.nombre}` : 'Móvil'}</span>}
        </span>
      ),
    },
    ...(esEquipo
      ? [
          {
            key: 'mantenimiento',
            header: 'Mantenimiento',
            cell: (u: Unidad) => {
              const a = u.alertas.find((x) => x.tipo === 'proximo_mantenimiento');
              return (
                <span className={cn('tabular text-xs whitespace-nowrap', a?.nivel === 'bloqueo' ? 'font-semibold text-danger' : a ? 'font-semibold text-warning' : 'text-body')}>
                  {u.proximo_mantenimiento ? formatDate(u.proximo_mantenimiento) : '—'}
                </span>
              );
            },
          },
          {
            key: 'calibracion',
            header: 'Calibración',
            cell: (u: Unidad) => {
              if (!u.item.requiere_calibracion) return <span className="text-xs text-subtle">No aplica</span>;
              const a = u.alertas.find((x) => x.tipo === 'calibracion_vence');
              return (
                <span className={cn('tabular text-xs whitespace-nowrap', a?.nivel === 'bloqueo' || !u.calibracion_vence ? 'font-semibold text-danger' : a ? 'font-semibold text-warning' : 'text-body')}>
                  {u.calibracion_vence ? formatDate(u.calibracion_vence) : 'Sin registrar'}
                </span>
              );
            },
          },
        ]
      : [
          {
            key: 'esterilizacion',
            header: 'Esterilización',
            cell: (u: Unidad) => <span className="text-xs">{u.item.minutos_esterilizacion ? `${u.item.minutos_esterilizacion} min entre usos` : '—'}</span>,
          },
        ]),
    {
      key: 'estado',
      header: 'Estado',
      cell: (u) => {
        const e = ESTADOS_UNIDAD.find((x) => x.value === u.estado);
        return (
          <span className="flex items-center gap-1.5">
            <Badge tone={e?.tono} dot>
              {e?.label}
            </Badge>
            {u.alertas.some((a) => a.nivel === 'bloqueo') && <AlertTriangle className="size-4 text-danger" aria-label="Vencido: no se usa para programar" />}
          </span>
        );
      },
    },
  ];

  return (
    <Card className="animate-enter overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Select aria-label="Sede" value={extras.sede} onChange={(e) => update({ sede: e.target.value })} placeholder="Todas las sedes" options={(sedes?.datos ?? []).map((s) => ({ value: s.id, label: s.nombre }))} className="h-10 sm:w-44" />
          <Select aria-label="Estado" value={extras.estado_unidad} onChange={(e) => update({ estado_unidad: e.target.value })} placeholder="Todo estado (sin bajas)" options={ESTADOS_UNIDAD} className="h-10 sm:w-48" />
          {esEquipo && (
            <Select
              aria-label="Alertas"
              value={extras.alerta}
              onChange={(e) => update({ alerta: e.target.value })}
              placeholder="Sin filtro de alertas"
              options={[
                { value: 'vencidos', label: 'Calibración o mantenimiento vencidos' },
                { value: 'mantenimiento', label: 'Mantenimiento en 30 días' },
                { value: 'calibracion', label: 'Calibración en 30 días' },
              ]}
              className="h-10 sm:w-64"
            />
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput value={buscar} onChange={(v) => update({ buscar: v })} placeholder={esEquipo ? 'Placa, serie, marca o tipo' : 'Código o tipo de caja'} className="sm:w-60" />
          {can(PERMISOS.inventario.gestionar) && (
            <>
              <Button variant="secondary" icon={Upload} onClick={() => setCargar(true)}>
                Cargar
              </Button>
              <Button icon={Plus} onClick={() => update({ unidad: 'nuevo' })}>
                {esEquipo ? 'Registrar equipo' : 'Registrar caja'}
              </Button>
            </>
          )}
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
          title={esEquipo ? 'Sin equipos registrados' : 'Sin cajas registradas'}
          description={esEquipo ? 'Registra los equipos biomédicos por placa, o cárgalos desde el inventario de biomédica.' : 'Registra las cajas de instrumental de la central de esterilización.'}
        />
      ) : (
        <>
          <Table columns={columns} rows={data.datos} rowKey={(u) => u.id} className={isFetching ? 'opacity-70' : undefined} />
          <Pagination paginacion={data.paginacion} onPageChange={(p) => update({ pagina: p })} disabled={isFetching} />
        </>
      )}
      <UnidadDrawer abierto={abierto} tipo={tipo} onClose={() => update({ unidad: '' })} />
      <CargarInventarioModal tipo={cargar ? 'unidades' : null} onClose={() => setCargar(false)} />
    </Card>
  );
}
