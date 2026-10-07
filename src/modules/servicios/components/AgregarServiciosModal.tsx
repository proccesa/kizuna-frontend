import { useMemo, useState } from 'react';
import { Check, Search, X } from 'lucide-react';
import { Badge, Button, Field, Input, Modal, SearchInput, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { applyServerErrors } from '@/lib/forms';
import { useBuscarCups } from '@/modules/catalogos/hooks/useCatalogos';
import type { Cups } from '@/modules/catalogos/types';
import { useSedes } from '@/modules/red/hooks/useRed';
import { useServiciosMutations } from '../hooks/useServicios';

const DURACIONES = [10, 15, 20, 30, 40, 60];

interface AgregarServiciosModalProps {
  open: boolean;
  onClose: () => void;
  /** Sede preseleccionada (si se abre desde un filtro). */
  sedeInicial?: number;
}

export function AgregarServiciosModal({ open, onClose, sedeInicial }: AgregarServiciosModalProps) {
  return open ? <Contenido onClose={onClose} sedeInicial={sedeInicial} /> : null;
}

function Contenido({ onClose, sedeInicial }: { onClose: () => void; sedeInicial?: number }) {
  const [buscar, setBuscar] = useState('');
  const [seleccion, setSeleccion] = useState<Map<number, Cups>>(new Map());
  const [sedeIds, setSedeIds] = useState<number[]>(sedeInicial ? [sedeInicial] : []);
  const [duracion, setDuracion] = useState('20');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const { agregarPortafolio } = useServiciosMutations();

  const busqueda = buscar.trim();
  const resultados = useBuscarCups({ buscar: busqueda, por_pagina: 30 }, busqueda.length >= 3);
  const { data: sedesData, isLoading: cargandoSedes } = useSedes({ activo: true, por_pagina: 100 });

  const sedesPorPrestador = useMemo(() => {
    const grupos = new Map<string, NonNullable<typeof sedesData>['datos']>();
    for (const sede of sedesData?.datos ?? []) {
      const nombre = sede.prestador?.nombre_comercial || sede.prestador?.razon_social || 'Prestador';
      grupos.set(nombre, [...(grupos.get(nombre) ?? []), sede]);
    }
    return [...grupos.entries()];
  }, [sedesData]);

  const alternarCups = (cups: Cups) =>
    setSeleccion((prev) => {
      const next = new Map(prev);
      if (next.has(cups.id)) next.delete(cups.id);
      else next.set(cups.id, cups);
      return next;
    });

  const guardar = async () => {
    const nuevos: Record<string, string> = {};
    if (!seleccion.size) nuevos.cups_ids = 'Selecciona al menos un procedimiento.';
    if (!sedeIds.length) nuevos.sede_ids = 'Selecciona al menos una sede.';
    const minutos = Number(duracion);
    if (!Number.isInteger(minutos) || minutos < 5 || minutos > 480) nuevos.duracion_minutos = 'Entre 5 y 480 minutos.';
    setErrores(nuevos);
    if (Object.keys(nuevos).length) return;

    try {
      await agregarPortafolio.mutateAsync({ sede_ids: sedeIds, cups_ids: [...seleccion.keys()], duracion_minutos: minutos });
      onClose();
    } catch (error) {
      applyServerErrors(error, (campo, e) => setErrores((prev) => ({ ...prev, [String(campo)]: e.message ?? '' })));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      dismissible={!agregarPortafolio.isPending}
      title="Agregar servicios al portafolio"
      description="Busca en el catálogo CUPS oficial y elige en qué sedes se ofrece cada servicio."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={agregarPortafolio.isPending}>
            Cancelar
          </Button>
          <Button onClick={guardar} isLoading={agregarPortafolio.isPending}>
            Agregar {seleccion.size ? `${seleccion.size} × ${sedeIds.length || 0}` : ''}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* CUPS */}
        <div className="min-w-0">
          <p className="mb-2 text-sm font-semibold text-ink">1. Procedimientos</p>
          <SearchInput value={buscar} onChange={setBuscar} placeholder="Código o nombre: 890201, consulta pediatría…" />
          {seleccion.size > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {[...seleccion.values()].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => alternarCups(c)}
                  className="flex cursor-pointer items-center gap-1 rounded-full bg-petrol py-0.5 pr-1.5 pl-2.5 text-xs font-semibold text-white"
                  title={c.nombre}
                >
                  <span className="tabular">{c.codigo}</span>
                  <X className="size-3" aria-label={`Quitar ${c.codigo}`} />
                </button>
              ))}
            </div>
          )}
          {errores.cups_ids && <p className="mt-2 text-[0.8rem] font-medium text-danger">{errores.cups_ids}</p>}

          <div className="mt-3 h-80 overflow-y-auto rounded-xl border border-line">
            {busqueda.length < 3 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted">
                <Search className="size-5" aria-hidden />
                Escribe al menos 3 caracteres para buscar entre los procedimientos habilitados.
              </div>
            ) : resultados.isLoading ? (
              <div className="space-y-2 p-3">
                {Array.from({ length: 5 }, (_, i) => (
                  <Skeleton key={i} className="h-10" />
                ))}
              </div>
            ) : resultados.data?.datos.length === 0 ? (
              <p className="p-6 text-center text-sm text-muted">Sin coincidencias en el catálogo CUPS.</p>
            ) : (
              <ul className={cn('divide-y divide-line', resultados.isFetching && 'opacity-60')}>
                {resultados.data?.datos.map((c) => {
                  const marcado = seleccion.has(c.id);
                  return (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => alternarCups(c)}
                        aria-pressed={marcado}
                        className={cn('flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors', marcado ? 'bg-mist' : 'hover:bg-cream')}
                      >
                        <span
                          className={cn(
                            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2',
                            marcado ? 'border-petrol bg-petrol text-white' : 'border-line-strong',
                          )}
                        >
                          {marcado && <Check className="size-3" strokeWidth={3} />}
                        </span>
                        <span className="min-w-0">
                          <span className="tabular block font-display text-sm font-bold text-ink">{c.codigo}</span>
                          <span className="block text-xs leading-snug text-body">{c.nombre}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {resultados.data && resultados.data.paginacion.total > 30 && (
            <p className="mt-1.5 text-xs text-muted">
              Mostrando 30 de {resultados.data.paginacion.total}. Afina la búsqueda para ver más.
            </p>
          )}
        </div>

        {/* Sedes y duración */}
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">2. Sedes donde se ofrece</p>
            {cargandoSedes ? (
              <Skeleton className="h-32" />
            ) : sedesPorPrestador.length === 0 ? (
              <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">No hay sedes activas. Créalas en Prestadores y sedes.</p>
            ) : (
              <div className="max-h-60 space-y-3 overflow-y-auto">
                {sedesPorPrestador.map(([prestador, sedes]) => (
                  <div key={prestador}>
                    <p className="text-xs font-semibold text-muted">{prestador}</p>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {sedes.map((s) => {
                        const marcada = sedeIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            aria-pressed={marcada}
                            onClick={() => setSedeIds((prev) => (marcada ? prev.filter((id) => id !== s.id) : [...prev, s.id]))}
                            className={cn(
                              'cursor-pointer rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
                              marcada ? 'bg-petrol text-white' : 'border border-line-strong bg-surface text-body hover:bg-sand',
                            )}
                          >
                            {s.nombre}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {errores.sede_ids && <p className="mt-2 text-[0.8rem] font-medium text-danger">{errores.sede_ids}</p>}
          </div>

          <div>
            <p className="mb-2 text-sm font-semibold text-ink">3. Duración de cada atención</p>
            <div className="flex flex-wrap gap-1.5">
              {DURACIONES.map((m) => (
                <button
                  key={m}
                  type="button"
                  aria-pressed={duracion === String(m)}
                  onClick={() => setDuracion(String(m))}
                  className={cn(
                    'tabular cursor-pointer rounded-xl px-3 py-1.5 text-sm font-semibold transition-colors',
                    duracion === String(m) ? 'bg-petrol text-white' : 'border border-line-strong bg-surface text-body hover:bg-sand',
                  )}
                >
                  {m} min
                </button>
              ))}
            </div>
            <Field label="Otra duración (minutos)" htmlFor="duracion-otra" error={errores.duracion_minutos} className="mt-3 max-w-40">
              <Input id="duracion-otra" inputMode="numeric" value={duracion} onChange={(e) => setDuracion(e.target.value)} invalid={!!errores.duracion_minutos} />
            </Field>
            <p className="mt-2 text-xs text-muted">Kizuna usa esta duración para calcular los cupos de la agenda.</p>
          </div>

          {seleccion.size > 0 && sedeIds.length > 0 && (
            <Badge tone="mist">
              Se agregarán {seleccion.size * sedeIds.length} servicios (los que ya existan se omiten)
            </Badge>
          )}
        </div>
      </div>
    </Modal>
  );
}
