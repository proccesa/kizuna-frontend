import { useState } from 'react';
import { Button, Input, Modal, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { useCirugiaMutations, useCupos } from '../hooks/useCirugia';
import type { Cupo, Orden } from '../types';

interface ReprogramarModalProps {
  orden: Orden | null;
  onClose: () => void;
}

/** El operador elige otro cupo de pre-anestesia para la orden. */
export function ReprogramarModal({ orden, onClose }: ReprogramarModalProps) {
  return orden ? <Contenido orden={orden} onClose={onClose} /> : null;
}

function Contenido({ orden, onClose }: { orden: Orden; onClose: () => void }) {
  const [desde, setDesde] = useState('');
  const [elegido, setElegido] = useState<Cupo | null>(null);
  const { data: cupos = [], isLoading } = useCupos(orden.id, desde || undefined);
  const { reprogramar } = useCirugiaMutations();

  const porDia = cupos.reduce<Record<string, Cupo[]>>((acc, c) => ({ ...acc, [c.fecha]: [...(acc[c.fecha] ?? []), c] }), {});

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      dismissible={!reprogramar.isPending}
      title={orden.cita_actual ? 'Reprogramar cita de pre-anestesia' : 'Asignar cita de pre-anestesia'}
      description={`${orden.paciente.nombre_completo} · ${orden.cups.codigo}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={reprogramar.isPending}>
            Cancelar
          </Button>
          <Button
            disabled={!elegido}
            isLoading={reprogramar.isPending}
            onClick={() => elegido && reprogramar.mutateAsync({ id: orden.id, cupo: elegido }).then(onClose).catch(() => undefined)}
          >
            {elegido ? `Asignar ${formatDate(elegido.fecha)} · ${elegido.hora_inicio}` : 'Elige un cupo'}
          </Button>
        </>
      }
    >
      <div className="mb-4 flex items-end gap-3">
        <label className="text-sm font-semibold text-ink">
          Buscar desde
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="mt-1.5 h-10 w-44" />
        </label>
        {orden.cita_actual && (
          <p className="pb-2 text-sm text-muted">
            Actual: {formatDate(orden.cita_actual.fecha)} · {orden.cita_actual.hora_inicio}
          </p>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : cupos.length === 0 ? (
        <p className="rounded-2xl bg-warning-soft px-4 py-6 text-center text-sm text-warning">
          No hay cupos de anestesiología en el horizonte configurado. Abre agenda a un anestesiólogo o amplía el horizonte en las reglas.
        </p>
      ) : (
        <div className="max-h-96 space-y-4 overflow-y-auto">
          {Object.entries(porDia).map(([fecha, lista]) => (
            <div key={fecha}>
              <p className="mb-2 text-sm font-semibold text-ink first-letter:uppercase">{formatDate(fecha)}</p>
              <div className="flex flex-wrap gap-1.5">
                {lista.map((c) => {
                  const activo = elegido === c;
                  return (
                    <button
                      key={`${c.especialista_id}-${c.hora_inicio}-${c.sede_id}`}
                      type="button"
                      aria-pressed={activo}
                      onClick={() => setElegido(c)}
                      className={cn(
                        'cursor-pointer rounded-xl px-3 py-2 text-left text-sm transition-colors',
                        activo ? 'bg-petrol text-white' : 'border border-line-strong bg-surface text-body hover:bg-sand',
                      )}
                    >
                      <span className="tabular block font-semibold">{c.hora_inicio}</span>
                      <span className={cn('block text-xs', activo ? 'text-white/75' : 'text-muted')}>
                        {c.especialista.split(' ')[0]} · {c.sede}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
