import { useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button, Field, Input, Modal } from '@/components/ui';
import { SedesSelector } from '@/modules/red/components/SedesSelector';
import { hoyISO } from '@/modules/talento/schema';
import { useProgramacionMutations } from '../hooks/useProgramacion';

const sumarDias = (fecha: string, dias: number) => {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export function GenerarModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return open ? <Contenido onClose={onClose} /> : null;
}

function Contenido({ onClose }: { onClose: () => void }) {
  const { generar } = useProgramacionMutations();
  const [desde, setDesde] = useState(hoyISO);
  const [hasta, setHasta] = useState(() => sumarDias(hoyISO(), 14));
  const [sedes, setSedes] = useState<number[]>([]);

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!generar.isPending}
      title="Generar propuesta de programación"
      description="Kizuna ordena a los pacientes aptos por prioridad y busca cirujano, anestesiólogo, sala, equipos, cajas e insumos dentro de la ventana de cada aval."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={generar.isPending}>
            Cancelar
          </Button>
          <Button icon={Sparkles} isLoading={generar.isPending} onClick={() => generar.mutateAsync({ desde, hasta, sede_ids: sedes.length ? sedes : undefined }).then(onClose).catch(() => undefined)}>
            Generar propuesta
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Desde" htmlFor="gp-desde">
            <Input id="gp-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </Field>
          <Field label="Hasta" htmlFor="gp-hasta" hint="Máximo 90 días.">
            <Input id="gp-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </Field>
        </div>
        <div>
          <p className="mb-1 text-sm font-semibold text-ink">Sedes</p>
          <p className="mb-2 text-xs text-muted">Sin selección se usan todas las sedes de cada contrato.</p>
          <SedesSelector value={sedes} onChange={setSedes} />
        </div>
        <p className="rounded-2xl bg-cream px-4 py-3 text-xs text-muted">
          Nada se publica todavía: la propuesta reserva los recursos y queda pendiente hasta que la apruebes o la descartes.
        </p>
      </div>
    </Modal>
  );
}
