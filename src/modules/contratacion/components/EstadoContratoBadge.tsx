import { Badge } from '@/components/ui';
import { ESTADOS_CONTRATO, type EstadoContrato } from '../types';

export function EstadoContratoBadge({ estado }: { estado: EstadoContrato }) {
  const e = ESTADOS_CONTRATO.find((x) => x.value === estado);
  return (
    <Badge tone={e?.tono ?? 'neutral'} dot>
      {e?.label ?? estado}
    </Badge>
  );
}
