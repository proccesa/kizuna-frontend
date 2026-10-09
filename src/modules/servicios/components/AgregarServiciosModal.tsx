import { useState } from 'react';
import { Badge, Button, Field, Input, Modal } from '@/components/ui';
import { cn } from '@/lib/cn';
import { applyServerErrors } from '@/lib/forms';
import { SelectorCups } from '@/modules/catalogos/components/SelectorCups';
import type { Cups } from '@/modules/catalogos/types';
import { SedesSelector } from '@/modules/red/components/SedesSelector';
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
  const [seleccion, setSeleccion] = useState<Map<number, Cups>>(new Map());
  const [sedeIds, setSedeIds] = useState<number[]>(sedeInicial ? [sedeInicial] : []);
  const [duracion, setDuracion] = useState('20');
  const [errores, setErrores] = useState<Record<string, string>>({});
  const { agregarPortafolio } = useServiciosMutations();


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
          <SelectorCups seleccion={seleccion} onAlternar={alternarCups} error={errores.cups_ids} />
        </div>

        {/* Sedes y duración */}
        <div className="space-y-6">
          <div>
            <p className="mb-2 text-sm font-semibold text-ink">2. Sedes donde se ofrece</p>
            <SedesSelector value={sedeIds} onChange={setSedeIds} error={errores.sede_ids} />
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
