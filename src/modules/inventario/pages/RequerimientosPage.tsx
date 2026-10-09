import { Link } from 'react-router-dom';
import { ListChecks } from 'lucide-react';
import { Badge, Card, EmptyState, FilterTabs, PageHeader, Pagination, SearchInput, Skeleton } from '@/components/ui';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/cn';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { EditorRequerimientos } from '../components/EditorRequerimientos';
import { Verificador } from '../components/Verificador';
import { useCupsRequerimientos, useInventarioMutations, useRequerimientos } from '../hooks/useInventario';
import { TIPOS_SALA } from '../types';

export function RequerimientosPage() {
  const { can } = useAuth();
  const gestionar = can(PERMISOS.inventario.gestionar);
  const { buscar, extras, update, pagina } = useListParams(['cups', 'lista', 'pendientes'] as const);
  const { data, isLoading, isFetching } = useCupsRequerimientos({ buscar: buscar || undefined, sin_requerimientos: extras.pendientes === '1' || undefined, pagina, por_pagina: 30 });
  const cupsId = extras.cups ? Number(extras.cups) : (data?.datos[0]?.id ?? null);
  const { data: detalle, isLoading: cargandoDetalle } = useRequerimientos(cupsId);
  const { guardarRequerimientos } = useInventarioMutations();
  const lista = extras.lista || 'base';
  const sedeSel = detalle?.sedes.find((s) => String(s.sede.id) === lista);

  return (
    <>
      <PageHeader
        title="Requerimientos por CUPS"
        description="Qué equipos biomédicos, cajas de instrumental e insumos necesita cada procedimiento. Se define una lista base y cada sede puede ajustarla."
      />
      <div className="grid items-start gap-5 xl:grid-cols-[20rem_minmax(0,1fr)]">
        <Card className="overflow-hidden xl:sticky xl:top-6">
          <div className="space-y-2 border-b border-line p-3">
            <SearchInput value={buscar} onChange={(v) => update({ buscar: v, cups: '' })} placeholder="CUPS del portafolio" />
            <FilterTabs
              aria-label="Filtro"
              value={extras.pendientes === '1' ? 'pendientes' : 'todos'}
              onChange={(v) => update({ pendientes: v === 'pendientes' ? '1' : '', cups: '' })}
              tabs={[
                { value: 'todos', label: 'Todos' },
                { value: 'pendientes', label: 'Sin definir' },
              ]}
            />
          </div>
          {isLoading ? (
            <Skeleton className="m-3 h-64" />
          ) : !data?.datos.length ? (
            <p className="p-6 text-center text-sm text-muted">
              {buscar || extras.pendientes ? 'Nada coincide.' : 'Agrega CUPS al portafolio de las sedes para definir sus requerimientos.'}
            </p>
          ) : (
            <>
              <ul className={cn('max-h-72 divide-y xl:max-h-[60vh] divide-line overflow-y-auto', isFetching && 'opacity-70')}>
                {data.datos.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => update({ cups: c.id, lista: '' })}
                      className={cn('flex w-full cursor-pointer items-start gap-2 px-4 py-2.5 text-left transition-colors', c.id === cupsId ? 'bg-mist' : 'hover:bg-cream')}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="tabular block font-display font-bold text-ink">{c.codigo}</span>
                        <span className="line-clamp-2 block text-xs text-body">{c.nombre.toLowerCase()}</span>
                      </span>
                      {c.requerimientos_count ? <Badge tone="mist">{c.requerimientos_count}</Badge> : <Badge tone="warning">Sin definir</Badge>}
                    </button>
                  </li>
                ))}
              </ul>
              {data.paginacion.total_paginas > 1 && <Pagination paginacion={data.paginacion} onPageChange={(p) => update({ pagina: p })} disabled={isFetching} />}
            </>
          )}
        </Card>

        <div className="min-w-0 space-y-5">
          {!cupsId ? (
            <Card>
              <EmptyState title="Elige un CUPS" description="Selecciona un procedimiento de la lista para definir lo que necesita." />
            </Card>
          ) : cargandoDetalle || !detalle ? (
            <Skeleton className="h-96" />
          ) : (
            <>
              <Card className="p-5">
                <p className="tabular font-display text-2xl font-bold text-ink">{detalle.cups.codigo}</p>
                <p className="text-sm text-body">{detalle.cups.nombre.toLowerCase()}</p>
                <FilterTabs
                  aria-label="Lista"
                  className="mt-4"
                  value={lista}
                  onChange={(v) => update({ lista: v === 'base' ? '' : v })}
                  tabs={[
                    { value: 'base', label: 'Lista base', count: detalle.base.length },
                    ...detalle.sedes.map((s) => ({ value: String(s.sede.id), label: s.sede.nombre, count: s.ajustes.length || undefined })),
                  ]}
                />
                <div className="mt-4">
                  {lista === 'base' ? (
                    <EditorRequerimientos
                      key={`${detalle.cups.id}-base-${detalle.base.map((r) => `${r.item_id}:${r.cantidad}`).join()}`}
                      inicial={detalle.base}
                      permiteCero={false}
                      soloLectura={!gestionar}
                      guardando={guardarRequerimientos.isPending}
                      onGuardar={(filas) => guardarRequerimientos.mutate({ cupsId: detalle.cups.id, sedeId: null, items: filas })}
                    />
                  ) : sedeSel ? (
                    <div className="space-y-4">
                      <p className="text-sm text-body">
                        Sala requerida en {sedeSel.sede.nombre}:{' '}
                        <b>{sedeSel.tipo_sala ? TIPOS_SALA.find((t) => t.value === sedeSel.tipo_sala)?.label : 'ninguna'}</b> · {sedeSel.duracion_minutos} min.{' '}
                        <Link to={`/portafolio?sede=${sedeSel.sede.id}&buscar=${detalle.cups.codigo}`} className="font-semibold text-petrol hover:underline">
                          Cambiar en el portafolio
                        </Link>
                      </p>
                      <div>
                        <p className="mb-2 text-sm font-semibold text-ink">Ajustes de la sede</p>
                        <EditorRequerimientos
                          key={`${detalle.cups.id}-${sedeSel.sede.id}-${sedeSel.ajustes.map((r) => `${r.item_id}:${r.cantidad}`).join()}`}
                          inicial={sedeSel.ajustes}
                          permiteCero
                          soloLectura={!gestionar}
                          guardando={guardarRequerimientos.isPending}
                          onGuardar={(filas) => guardarRequerimientos.mutate({ cupsId: detalle.cups.id, sedeId: sedeSel.sede.id, items: filas })}
                        />
                      </div>
                      <div>
                        <p className="mb-2 text-sm font-semibold text-ink">Lo que aplica en esta sede</p>
                        <ul className="flex flex-wrap gap-1.5">
                          {sedeSel.efectivos.map((r) => (
                            <li key={r.item_id}>
                              <Badge tone="mist">
                                {r.cantidad} × {r.item.nombre}
                              </Badge>
                            </li>
                          ))}
                          {sedeSel.efectivos.length === 0 && <li className="text-sm text-muted">Nada definido.</li>}
                        </ul>
                      </div>
                    </div>
                  ) : null}
                </div>
              </Card>
              <Verificador key={detalle.cups.id} detalle={detalle} />
            </>
          )}
        </div>
      </div>
      {!gestionar && (
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
          <ListChecks className="size-3.5" aria-hidden /> Solo lectura: tu rol no puede modificar requerimientos.
        </p>
      )}
    </>
  );
}
