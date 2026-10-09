import { Badge } from '@/components/ui';

const MODALIDADES = {
  PGP: { label: 'PGP', tono: 'petrol' },
  EVENTO: { label: 'Evento', tono: 'lime' },
  CAPITA: { label: 'Cápita', tono: 'mist' },
} as const;

/** Modalidad de contratación: PGP (pago global prospectivo), evento o cápita. Acepta el código o el nombre. */
export function ModalidadBadge({ modalidad }: { modalidad: string }) {
  const clave = modalidad.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase() as keyof typeof MODALIDADES;
  const m = MODALIDADES[clave];
  return <Badge tone={m?.tono ?? 'neutral'}>{m?.label ?? modalidad}</Badge>;
}
