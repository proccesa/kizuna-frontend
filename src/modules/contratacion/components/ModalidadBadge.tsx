import { Badge } from '@/components/ui';
import type { Modalidad } from '@/demo/datos';

const tonos = { PGP: 'petrol', Evento: 'lime', Cápita: 'mist' } as const;

/** Modalidad de contratación: PGP (pago global prospectivo), evento o cápita. */
export function ModalidadBadge({ modalidad }: { modalidad: Modalidad }) {
  return <Badge tone={tonos[modalidad]}>{modalidad}</Badge>;
}
