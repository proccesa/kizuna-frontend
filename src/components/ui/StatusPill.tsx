import { cn } from '@/lib/cn';
import { ESTADOS_CITA, type EstadoCita } from './estados';

interface StatusPillProps {
  estado: EstadoCita;
  /** Solo el ícono (con etiqueta accesible). */
  compact?: boolean;
  className?: string;
}

export function StatusPill({ estado, compact = false, className }: StatusPillProps) {
  const { label, icon: Icon, className: tone } = ESTADOS_CITA[estado];
  return (
    <span
      className={cn('inline-flex items-center gap-1 rounded-full text-xs font-semibold whitespace-nowrap', compact ? 'size-6 justify-center' : 'px-2 py-0.5', tone, className)}
      title={compact ? label : undefined}
    >
      <Icon className="size-3.5" aria-hidden={!compact} aria-label={compact ? label : undefined} />
      {!compact && label}
    </span>
  );
}
