import { useState } from 'react';
import { Button, Field, Input, Modal, Select, Skeleton } from '@/components/ui';
import { useEspecialidades } from '@/modules/servicios/hooks/useServicios';
import { useCirugiaMutations, useReglasPreanestesia } from '../hooks/useCirugia';
import { ROMANO, type ReglasPreanestesia } from '../types';

/** Reglas de pre-anestesia de la IPS: qué consulta, qué especialidad y cuánto dura el aval. */
export function ReglasModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: reglas } = useReglasPreanestesia(open);
  if (!open) return null;
  // Se monta con las reglas cargadas: el formulario parte de los valores guardados.
  return reglas ? (
    <Contenido reglas={reglas} onClose={onClose} />
  ) : (
    <Modal open onClose={onClose} title="Reglas de pre-anestesia">
      <Skeleton className="h-64" />
    </Modal>
  );
}

function Contenido({ reglas, onClose }: { reglas: ReglasPreanestesia; onClose: () => void }) {
  const { data: especialidades = [] } = useEspecialidades();
  const { guardarReglas } = useCirugiaMutations();
  const [valores, setValores] = useState<Partial<ReglasPreanestesia> | null>(reglas);

  const v = valores;
  const cambiar = (cambios: Partial<ReglasPreanestesia>) => setValores((prev) => ({ ...prev, ...cambios }));

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      dismissible={!guardarReglas.isPending}
      title="Reglas de pre-anestesia"
      description="Se aplican a las órdenes y valoraciones nuevas."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={guardarReglas.isPending}>
            Cancelar
          </Button>
          <Button
            isLoading={guardarReglas.isPending}
            disabled={!v}
            onClick={() =>
              v &&
              guardarReglas
                .mutateAsync({
                  cups_consulta_codigo: v.cups_consulta_codigo,
                  especialidad_codigo: v.especialidad_codigo,
                  vigencia_dias_por_asa: v.vigencia_dias_por_asa,
                  horizonte_dias: Number(v.horizonte_dias),
                  dias_anticipacion: Number(v.dias_anticipacion),
                  duracion_minutos: Number(v.duracion_minutos),
                })
                .then(onClose)
                .catch(() => undefined)
            }
          >
            Guardar reglas
          </Button>
        </>
      }
    >
      {!v ? (
        <Skeleton className="h-64" />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="CUPS de la consulta" htmlFor="rg-cups" hint={reglas?.cups_consulta?.nombre.toLowerCase() ?? 'Código no encontrado en el catálogo'}>
              <Input
                id="rg-cups"
                className="tabular"
                value={v.cups_consulta_codigo ?? ''}
                onChange={(e) => cambiar({ cups_consulta_codigo: e.target.value.trim() })}
              />
            </Field>
            <Field label="Especialidad que valora" htmlFor="rg-esp">
              <Select
                id="rg-esp"
                value={v.especialidad_codigo ?? ''}
                onChange={(e) => cambiar({ especialidad_codigo: e.target.value })}
                options={especialidades.map((e) => ({ value: e.codigo, label: e.nombre }))}
              />
            </Field>
          </div>

          <div>
            <p className="text-sm font-semibold text-ink">Vigencia del aval según ASA</p>
            <p className="mb-3 text-sm text-muted">Pasado este plazo sin cirugía, el paciente necesita una nueva valoración.</p>
            <div className="grid grid-cols-5 gap-2">
              {['1', '2', '3', '4', '5'].map((asa) => (
                <label key={asa} className="rounded-2xl bg-cream p-3 text-center">
                  <span className="block text-xs font-semibold text-muted">ASA {ROMANO[Number(asa)]}</span>
                  <input
                    aria-label={`Días de vigencia para ASA ${ROMANO[Number(asa)]}`}
                    inputMode="numeric"
                    value={v.vigencia_dias_por_asa?.[asa] ?? ''}
                    onChange={(e) => cambiar({ vigencia_dias_por_asa: { ...v.vigencia_dias_por_asa, [asa]: Number(e.target.value.replace(/\D/g, '')) || 0 } })}
                    className="tabular mt-1 w-full rounded-lg border border-line-strong bg-surface py-1.5 text-center font-display text-lg font-bold text-ink outline-none focus:border-petrol"
                  />
                  <span className="block text-xs text-muted">días</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Buscar cupo hasta" htmlFor="rg-hor" hint="Días hacia adelante.">
              <Input
                id="rg-hor"
                inputMode="numeric"
                value={String(v.horizonte_dias ?? '')}
                onChange={(e) => cambiar({ horizonte_dias: Number(e.target.value.replace(/\D/g, '')) })}
              />
            </Field>
            <Field label="Anticipación mínima" htmlFor="rg-ant" hint="0 = el mismo día.">
              <Input
                id="rg-ant"
                inputMode="numeric"
                value={String(v.dias_anticipacion ?? '')}
                onChange={(e) => cambiar({ dias_anticipacion: Number(e.target.value.replace(/\D/g, '')) })}
              />
            </Field>
            <Field label="Duración de la consulta" htmlFor="rg-dur" hint="Minutos, si la sede no la define.">
              <Input
                id="rg-dur"
                inputMode="numeric"
                value={String(v.duracion_minutos ?? '')}
                onChange={(e) => cambiar({ duracion_minutos: Number(e.target.value.replace(/\D/g, '')) })}
              />
            </Field>
          </div>
        </div>
      )}
    </Modal>
  );
}
