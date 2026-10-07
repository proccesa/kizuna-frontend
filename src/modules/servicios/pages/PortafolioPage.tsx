import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, FilterTabs, PageHeader, Pagination, SearchInput, Select, Skeleton, Switch, Table, type TableColumn } from '@/components/ui';
import { useListParams } from '@/hooks/useListParams';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useSedes } from '@/modules/red/hooks/useRed';
import { AgregarServiciosModal } from '../components/AgregarServiciosModal';
import { useEspecialidades, usePortafolio, useServiciosMutations } from '../hooks/useServicios';
import type { PortafolioItem } from '../types';

const DURACIONES = [5, 10, 15, 20, 25, 30, 40, 45, 60, 90, 120];

export function PortafolioPage() {
  const { can } = useAuth();
  const { buscar, extras, update, pagina } = useListParams(['sede', 'especialidad', 'vista'] as const);
  const sedeId = extras.sede ? Number(extras.sede) : undefined;
  const especialidadId = extras.especialidad ? Number(extras.especialidad) : undefined;
  const sinEspecialidad = extras.vista === 'sin-especialidad';

  const filtrosBase = { sede_id: sedeId, especialidad_id: especialidadId, buscar: buscar || undefined };
  const { data, isLoading, isFetching } = usePortafolio({ ...filtrosBase, sin_especialidad: sinEspecialidad || undefined, pagina, por_pagina: 25 });
  const total = usePortafolio({ ...filtrosBase, por_pagina: 1 });
  const sinEsp = usePortafolio({ ...filtrosBase, sin_especialidad: true, por_pagina: 1 });
  const { data: sedes } = useSedes({ por_pagina: 100 });
  const { data: especialidades = [] } = useEspecialidades({}, can(PERMISOS.especialidades.listar));
  const { actualizarPortafolio, eliminarPortafolio } = useServiciosMutations();

  const [agregar, setAgregar] = useState(false);
  const [retirar, setRetirar] = useState<PortafolioItem | null>(null);
  const puedeEditar = can(PERMISOS.portafolio.editar);

  const columns: TableColumn<PortafolioItem>[] = [
    {
      key: 'cups',
      header: 'CUPS',
      className: 'min-w-72',
      cell: (i) => (
        <div>
          <p className="tabular font-display font-bold text-ink">{i.cups.codigo}</p>
          <p className="text-xs leading-snug text-body">{i.cups.nombre}</p>
        </div>
      ),
    },
    {
      key: 'sede',
      header: 'Sede',
      cell: (i) => (
        <div className="whitespace-nowrap">
          <p className="font-medium text-ink">{i.sede.nombre}</p>
          <p className="text-xs text-muted">{i.sede.prestador.nombre_comercial || i.sede.prestador.razon_social}</p>
        </div>
      ),
    },
    {
      key: 'duracion',
      header: 'Duración',
      cell: (i) =>
        puedeEditar ? (
          <Select
            aria-label={`Duración de ${i.cups.codigo} en ${i.sede.nombre}`}
            value={i.duracion_minutos}
            onChange={(e) => actualizarPortafolio.mutate({ id: i.id, payload: { duracion_minutos: Number(e.target.value) } })}
            options={[...new Set([...DURACIONES, i.duracion_minutos])].sort((a, b) => a - b).map((m) => ({ value: m, label: `${m} min` }))}
            className="h-9 w-28 text-sm"
          />
        ) : (
          <span className="tabular">{i.duracion_minutos} min</span>
        ),
    },
    {
      key: 'especialidades',
      header: 'Lo atiende',
      cell: (i) =>
        i.cups.especialidades.length ? (
          <span className="flex flex-wrap gap-1">
            {i.cups.especialidades.map((e) => (
              <Badge key={e.id} tone="mist">
                {e.nombre}
              </Badge>
            ))}
          </span>
        ) : (
          <Link to={`/especialidades?buscar=${i.cups.codigo}`} className="flex items-center gap-1.5 text-sm font-semibold whitespace-nowrap text-danger hover:underline">
            <Ban className="size-4" aria-hidden /> Sin especialidad
          </Link>
        ),
    },
    {
      key: 'activo',
      header: 'Activo',
      cell: (i) =>
        puedeEditar ? (
          <Switch
            checked={i.activo}
            onChange={(activo) => actualizarPortafolio.mutate({ id: i.id, payload: { activo } })}
            aria-label={`${i.activo ? 'Desactivar' : 'Activar'} ${i.cups.codigo} en ${i.sede.nombre}`}
          />
        ) : (
          <Badge tone={i.activo ? 'success' : 'neutral'}>{i.activo ? 'Activo' : 'Inactivo'}</Badge>
        ),
    },
    {
      key: 'acciones',
      header: <span className="sr-only">Acciones</span>,
      align: 'right',
      cell: (i) =>
        can(PERMISOS.portafolio.eliminar) && (
          <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Retirar ${i.cups.codigo} de ${i.sede.nombre}`} onClick={() => setRetirar(i)} />
        ),
    },
  ];

  const hayFiltros = !!(buscar || sedeId || especialidadId || sinEspecialidad);

  return (
    <>
      <PageHeader
        title="Portafolio CUPS"
        description="Los procedimientos que ofrece cada sede según el catálogo CUPS oficial, y cuánto dura cada atención. Kizuna solo programa servicios que estén en el portafolio."
        actions={
          can(PERMISOS.portafolio.crear) && (
            <Button icon={Plus} onClick={() => setAgregar(true)}>
              Agregar servicios
            </Button>
          )
        }
      />

      <Card className="animate-enter overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
          <FilterTabs
            aria-label="Vista"
            value={sinEspecialidad ? 'sin-especialidad' : 'todos'}
            onChange={(v) => update({ vista: v === 'todos' ? '' : v })}
            tabs={[
              { value: 'todos', label: 'Todos', count: total.data?.paginacion.total },
              { value: 'sin-especialidad', label: 'Sin especialidad', count: sinEsp.data?.paginacion.total },
            ]}
          />
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Select
              aria-label="Sede"
              value={extras.sede}
              onChange={(e) => update({ sede: e.target.value })}
              placeholder="Todas las sedes"
              options={(sedes?.datos ?? []).map((s) => ({ value: s.id, label: `${s.nombre} · ${s.prestador?.nombre_comercial || s.prestador?.razon_social}` }))}
              className="h-10 sm:w-56"
            />
            {especialidades.length > 0 && (
              <Select
                aria-label="Especialidad"
                value={extras.especialidad}
                onChange={(e) => update({ especialidad: e.target.value })}
                placeholder="Toda especialidad"
                options={especialidades.map((e) => ({ value: e.id, label: e.nombre }))}
                className="h-10 sm:w-52"
              />
            )}
            <SearchInput value={buscar} onChange={(v) => update({ buscar: v })} placeholder="Código o nombre" className="sm:w-56" />
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : !data?.datos.length ? (
          <EmptyState
            title={hayFiltros ? 'Nada coincide con los filtros' : 'El portafolio está vacío'}
            description={hayFiltros ? 'Prueba con otra sede, especialidad o búsqueda.' : 'Agrega los procedimientos CUPS que ofrece cada sede para que Kizuna pueda programarlos.'}
            action={
              !hayFiltros &&
              can(PERMISOS.portafolio.crear) && (
                <Button icon={Plus} onClick={() => setAgregar(true)}>
                  Agregar servicios
                </Button>
              )
            }
          />
        ) : (
          <>
            <Table columns={columns} rows={data.datos} rowKey={(i) => i.id} className={isFetching ? 'opacity-70' : undefined} />
            <Pagination paginacion={data.paginacion} onPageChange={(p) => update({ pagina: p })} disabled={isFetching} />
          </>
        )}
      </Card>

      <AgregarServiciosModal open={agregar} onClose={() => setAgregar(false)} sedeInicial={sedeId} />

      <ConfirmDialog
        open={!!retirar}
        title="Retirar servicio"
        message={retirar ? `¿Retirar ${retirar.cups.codigo} del portafolio de ${retirar.sede.nombre}? Kizuna dejará de programarlo en esa sede.` : ''}
        confirmLabel="Retirar"
        isLoading={eliminarPortafolio.isPending}
        onConfirm={async () => {
          if (retirar) await eliminarPortafolio.mutateAsync(retirar.id).catch(() => undefined);
          setRetirar(null);
        }}
        onClose={() => setRetirar(null)}
      />
    </>
  );
}
