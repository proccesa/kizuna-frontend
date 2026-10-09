import { Badge } from '@/components/ui';
import { ESTADOS_ORDEN, type Orden } from '../types';

export function EstadoOrdenBadge({ orden }: { orden: Pick<Orden, 'estado' | 'aval_vencido'> }) {
  const valor = orden.aval_vencido ? 'AVAL_VENCIDO' : orden.estado;
  const e = ESTADOS_ORDEN.find((x) => x.value === valor);
  return (
    <Badge tone={e?.tono ?? 'neutral'} dot>
      {e?.label ?? valor}
    </Badge>
  );
}
