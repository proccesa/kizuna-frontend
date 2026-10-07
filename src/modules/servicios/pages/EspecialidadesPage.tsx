import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Pencil, Plus, RotateCcw, Trash2, X } from 'lucide-react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, FilterTabs, PageHeader, SearchInput, Skeleton, Switch } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useListParams } from '@/hooks/useListParams';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { EspecialidadModal } from '../components/EspecialidadModal';
import { EspecialidadesPicker } from '../components/EspecialidadesPicker';
import { useEspecialidades, usePortafolio, useServiciosMutations } from '../hooks/useServicios';
import type { Especialidad, PortafolioItem } from '../types';

type Pestana = 'servicios' | 'especialidades';

/** Servicios del portafolio agrupados por CUPS (un CUPS puede estar en varias sedes). */
function agruparPorCups(items: PortafolioItem[]) {
  const mapa = new Map<number, { cups: PortafolioItem['cups']; sedes: string[] }>();
  for (const i of items) {
    const actual = mapa.get(i.cups.id);
    if (actual) actual.sedes.push(i.sede.nombre);
    else mapa.set(i.cups.id, { cups: i.cups, sedes: [i.sede.nombre] });
  }
  return [...mapa.values()];
}

function ServiciosEspecialidades({ buscar, onBuscar }: { buscar: string; onBuscar: (v: string) => void }) {
  const { can } = useAuth();
  const [soloSinEspecialidad, setSoloSinEspecialidad] = useState(false);
  const portafolio = usePortafolio({ buscar: buscar || undefined, sin_especialidad: soloSinEspecialidad || undefined, por_pagina: 100 });
  const { data: especialidades = [] } = useEspecialidades();
  const { alternarCups } = useServiciosMutations();
  const puedeEditar = can(PERMISOS.especialidades.editar);

  const filas = useMemo(() => agruparPorCups(portafolio.data?.datos ?? []), [portafolio.data]);
  const sinEspecialidad = filas.filter((f) => !f.cups.especialidades.length).length;

  return (
    <>
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <Switch
          checked={soloSinEspecialidad}
          onChange={setSoloSinEspecialidad}
          label="Solo servicios sin especialidad"
          description={soloSinEspecialidad ? undefined : `${sinEspecialidad} en esta vista no se pueden programar todavía.`}
        />
        <SearchInput value={buscar} onChange={onBuscar} placeholder="Código o nombre del CUPS" className="sm:w-72" />
      </div>

      {portafolio.isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : filas.length === 0 ? (
        <EmptyState
          title={buscar || soloSinEspecialidad ? 'Nada coincide' : 'Aún no hay servicios en el portafolio'}
          description="Aquí aparecen los CUPS del portafolio para asignarles la especialidad que los atiende."
          action={
            !buscar && (
              <Link to="/portafolio" className="text-sm font-semibold text-mint-ink hover:underline">
                Ir al portafolio CUPS
              </Link>
            )
          }
        />
      ) : (
        <ul className={cn('divide-y divide-line', portafolio.isFetching && 'opacity-70')}>
          {filas.map(({ cups, sedes }) => {
            const asignadas = cups.especialidades.map((e) => e.id);
            return (
              <li key={cups.id} className={cn('flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center', !asignadas.length && 'bg-danger-soft/40')}>
                <div className="min-w-0 lg:w-[26rem] lg:shrink-0">
                  <p className="tabular font-display font-bold text-ink">{cups.codigo}</p>
                  <p className="text-xs leading-snug text-body">{cups.nombre}</p>
                  <p className="mt-0.5 text-xs text-muted">En {sedes.join(', ')}</p>
                </div>
                <div className="flex flex-1 flex-wrap items-center gap-1.5">
                  {cups.especialidades.map((e) => (
                    <span key={e.id} className="inline-flex items-center gap-1 rounded-full bg-mist py-0.5 pr-1 pl-2.5 text-xs font-semibold text-mist-ink">
                      {e.nombre}
                      {puedeEditar && (
                        <button
                          type="button"
                          onClick={() => alternarCups.mutate({ especialidadId: e.id, cupsId: cups.id, asignar: false })}
                          aria-label={`Quitar ${e.nombre} de ${cups.codigo}`}
                          className="flex size-4 cursor-pointer items-center justify-center rounded-full hover:bg-mist-ink/15"
                        >
                          <X className="size-3" />
                        </button>
                      )}
                    </span>
                  ))}
                  {!asignadas.length && (
                    <span className="flex items-center gap-1.5 text-sm font-semibold text-danger">
                      <Ban className="size-4" aria-hidden /> Sin especialidad: no se puede programar
                    </span>
                  )}
                </div>
                {puedeEditar && (
                  <EspecialidadesPicker
                    especialidades={especialidades}
                    seleccionadas={asignadas}
                    etiqueta={`Asignar especialidades a ${cups.codigo}`}
                    onAlternar={(especialidadId, asignar) => alternarCups.mutate({ especialidadId, cupsId: cups.id, asignar })}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}
      {portafolio.data && portafolio.data.paginacion.total > 100 && (
        <p className="border-t border-line px-5 py-3 text-xs text-muted">Se muestran los primeros 100 servicios del portafolio. Usa la búsqueda para encontrar otros.</p>
      )}
    </>
  );
}

function GestionEspecialidades() {
  const { can } = useAuth();
  const [eliminadas, setEliminadas] = useState(false);
  const { data = [], isLoading } = useEspecialidades({ solo_eliminados: eliminadas || undefined });
  const { actualizarEspecialidad, eliminarEspecialidad, restaurarEspecialidad } = useServiciosMutations();
  const [modal, setModal] = useState<{ open: boolean; especialidad: Especialidad | null }>({ open: false, especialidad: null });
  const [eliminar, setEliminar] = useState<Especialidad | null>(null);

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line p-4">
        {can(PERMISOS.especialidades.restaurar) ? (
          <FilterTabs
            aria-label="Estado"
            value={eliminadas ? 'eliminadas' : 'vigentes'}
            onChange={(v) => setEliminadas(v === 'eliminadas')}
            tabs={[
              { value: 'vigentes', label: 'Vigentes' },
              { value: 'eliminadas', label: 'Eliminadas' },
            ]}
          />
        ) : (
          <span />
        )}
        {can(PERMISOS.especialidades.crear) && (
          <Button icon={Plus} size="sm" onClick={() => setModal({ open: true, especialidad: null })}>
            Nueva especialidad
          </Button>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="m-5 h-64" />
      ) : (
        <ul className="grid divide-y divide-line md:grid-cols-2 md:divide-y-0">
          {data.map((e) => (
            <li key={e.id} className={cn('flex items-center gap-3 border-line px-5 py-3 md:border-b md:odd:border-r', !e.activo && 'opacity-60')}>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{e.nombre}</p>
                <p className="tabular text-xs text-muted">{e.cups_count ?? 0} CUPS asignados</p>
              </div>
              {eliminadas ? (
                can(PERMISOS.especialidades.restaurar) && (
                  <Button size="sm" variant="secondary" icon={RotateCcw} onClick={() => restaurarEspecialidad.mutate(e.id)}>
                    Restaurar
                  </Button>
                )
              ) : (
                <>
                  {can(PERMISOS.especialidades.editar) && (
                    <>
                      <Switch
                        checked={e.activo}
                        onChange={(activo) => actualizarEspecialidad.mutate({ id: e.id, payload: { activo } })}
                        aria-label={`${e.activo ? 'Desactivar' : 'Activar'} ${e.nombre}`}
                      />
                      <Button size="sm" variant="ghost" iconOnly icon={Pencil} aria-label={`Editar ${e.nombre}`} onClick={() => setModal({ open: true, especialidad: e })} />
                    </>
                  )}
                  {can(PERMISOS.especialidades.eliminar) && (
                    <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Eliminar ${e.nombre}`} onClick={() => setEliminar(e)} />
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}
      {!isLoading && data.length === 0 && <EmptyState title={eliminadas ? 'No hay especialidades eliminadas' : 'No hay especialidades'} />}

      <EspecialidadModal open={modal.open} especialidad={modal.especialidad} onClose={() => setModal({ open: false, especialidad: null })} />
      <ConfirmDialog
        open={!!eliminar}
        title="Eliminar especialidad"
        message={eliminar ? `¿Eliminar ${eliminar.nombre}? Sus ${eliminar.cups_count ?? 0} CUPS asignados dejarán de tener esta especialidad. Podrás restaurarla después.` : ''}
        confirmLabel="Eliminar"
        isLoading={eliminarEspecialidad.isPending}
        onConfirm={async () => {
          if (eliminar) await eliminarEspecialidad.mutateAsync(eliminar.id).catch(() => undefined);
          setEliminar(null);
        }}
        onClose={() => setEliminar(null)}
      />
    </>
  );
}

export function EspecialidadesPage() {
  const { buscar, extras, update } = useListParams(['pestana'] as const);
  const pestana: Pestana = extras.pestana === 'especialidades' ? 'especialidades' : 'servicios';

  return (
    <>
      <PageHeader
        title="CUPS y especialidades"
        description="Qué especialidad atiende cada servicio del portafolio. Kizuna usa esta relación para saber con qué especialistas buscar cupo al programar a un paciente."
      />
      <Card className="animate-enter overflow-visible">
        <div className="border-b border-line p-4">
          <FilterTabs
            aria-label="Sección"
            value={pestana}
            onChange={(v) => update({ pestana: v === 'servicios' ? '' : v })}
            tabs={[
              { value: 'servicios', label: 'Servicios y especialidades' },
              { value: 'especialidades', label: 'Especialidades' },
            ]}
          />
        </div>
        {pestana === 'servicios' ? <ServiciosEspecialidades buscar={buscar} onBuscar={(v) => update({ buscar: v })} /> : <GestionEspecialidades />}
      </Card>
      <p className="mt-3 flex items-center gap-2 px-1 text-xs text-muted">
        <Badge tone="mist">Tip</Badge> Un servicio puede tener varias especialidades: Kizuna buscará cupo en cualquiera de ellas.
      </p>
    </>
  );
}
