import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const tones = {
  neutral: 'bg-sand text-body',
  petrol: 'bg-petrol text-white',
  mist: 'bg-mist text-mist-ink',
  mint: 'bg-mint-soft text-mint-ink',
  lime: 'bg-lime-soft text-lime-ink',
  success: 'bg-success-soft text-success',
  warning: 'bg-warning-soft text-warning',
  danger: 'bg-danger-soft text-danger',
} as const;

interface BadgeProps {
  tone?: keyof typeof tones;
  dot?: boolean;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', dot = false, className, children }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap', tones[tone], className)}>
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}

const status = {
  active: { tone: 'success', label: 'Activo' },
  inactive: { tone: 'neutral', label: 'Inactivo' },
  deleted: { tone: 'danger', label: 'Eliminado' },
} as const;

/** Estado de un registro como etiqueta. */
export function StatusBadge({ value, className }: { value: keyof typeof status; className?: string }) {
  return (
    <Badge tone={status[value].tone} dot className={className}>
      {status[value].label}
    </Badge>
  );
}
