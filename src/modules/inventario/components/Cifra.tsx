import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';

interface CifraProps {
  titulo: string;
  valor?: number;
  detalle?: string;
  tono?: 'danger' | 'warning';
  onClick?: () => void;
}

/** Tarjeta de cifra del inventario; con `onClick` aplica un filtro. */
export function Cifra({ titulo, valor, detalle, tono, onClick }: CifraProps) {
  const Etiqueta = onClick ? 'button' : 'div';
  return (
    <Etiqueta
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn('animate-enter rounded-[var(--radius-card)] border border-line bg-surface p-4 text-left', onClick && 'cursor-pointer transition-colors hover:bg-cream')}
    >
      <p className="text-sm font-semibold text-muted">{titulo}</p>
      <p className={cn('tabular mt-1 font-display text-3xl font-bold', tono === 'danger' && valor ? 'text-danger' : tono === 'warning' && valor ? 'text-warning' : 'text-ink')}>
        {valor === undefined ? '—' : formatNumber(valor)}
      </p>
      {detalle && <p className="mt-1 text-xs text-muted">{detalle}</p>}
    </Etiqueta>
  );
}
