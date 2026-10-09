import { useState } from 'react';
import { Button, Field, Input, Modal } from '@/components/ui';
import { SelectorCups } from '@/modules/catalogos/components/SelectorCups';
import type { Cups } from '@/modules/catalogos/types';
import { useContratacionMutations } from '../hooks/useContratacion';
import { formatearValor } from '../schema';
import type { Contrato } from '../types';

interface AgregarCupsContratoModalProps {
  open: boolean;
  contrato: Contrato;
  onClose: () => void;
}

export function AgregarCupsContratoModal({ open, contrato, onClose }: AgregarCupsContratoModalProps) {
  return open ? <Contenido contrato={contrato} onClose={onClose} /> : null;
}

function Contenido({ contrato, onClose }: { contrato: Contrato; onClose: () => void }) {
  const { agregarCups } = useContratacionMutations();
  const [seleccion, setSeleccion] = useState<Map<number, Cups>>(new Map());
  const [cantidad, setCantidad] = useState('');
  const [tarifa, setTarifa] = useState('');
  const [error, setError] = useState('');
  const modalidad = contrato.modalidad.codigo;

  const alternar = (c: Cups) =>
    setSeleccion((prev) => {
      const next = new Map(prev);
      if (next.has(c.id)) next.delete(c.id);
      else next.set(c.id, c);
      return next;
    });

  const guardar = async () => {
    if (!seleccion.size) return setError('Selecciona al menos un procedimiento.');
    try {
      await agregarCups.mutateAsync({
        id: contrato.id,
        payload: {
          cups_ids: [...seleccion.keys()],
          cantidad: cantidad ? Number(cantidad.replace(/\D/g, '')) : null,
          tarifa: tarifa ? Number(tarifa.replace(/\D/g, '')) : null,
        },
      });
      onClose();
    } catch {
      /* el error se notifica en la mutación */
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="xl"
      dismissible={!agregarCups.isPending}
      title="Agregar CUPS al contrato"
      description={`${contrato.numero} · ${contrato.entidad.sigla || contrato.entidad.razon_social}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={agregarCups.isPending}>
            Cancelar
          </Button>
          <Button onClick={guardar} isLoading={agregarCups.isPending}>
            Agregar {seleccion.size || ''} CUPS
          </Button>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="min-w-0">
          <p className="mb-2 text-sm font-semibold text-ink">1. Procedimientos pactados</p>
          <SelectorCups seleccion={seleccion} onAlternar={alternar} error={error} />
        </div>
        <div className="space-y-4">
          <p className="text-sm font-semibold text-ink">2. Condiciones (opcional)</p>
          <p className="text-sm text-muted">Se aplican a todos los CUPS seleccionados; luego puedes ajustarlas uno por uno.</p>
          <Field
            label="Cantidad pactada en la vigencia"
            htmlFor="cc-cantidad"
            hint={modalidad === 'PGP' ? 'En PGP, el volumen que Kizuna reparte a lo largo de la vigencia.' : 'Déjala vacía si no hay un tope.'}
          >
            <Input id="cc-cantidad" inputMode="numeric" className="tabular" value={cantidad} onChange={(e) => setCantidad(formatearValor(e.target.value))} />
          </Field>
          <Field label="Tarifa unitaria (COP)" htmlFor="cc-tarifa" hint={modalidad === 'EVENTO' ? 'En evento, el valor que se factura por cada atención.' : undefined}>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 z-10 left-3.5 -translate-y-1/2 text-sm text-muted">$</span>
              <Input id="cc-tarifa" inputMode="numeric" className="tabular pl-7" value={tarifa} onChange={(e) => setTarifa(formatearValor(e.target.value))} />
            </div>
          </Field>
        </div>
      </div>
    </Modal>
  );
}
