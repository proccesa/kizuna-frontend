import { cn } from '@/lib/cn';

interface ProgressProps {
  value: number;
  tone?: 'petrol' | 'mint' | 'success' | 'lime' | 'warning' | 'danger';
  className?: string;
  label?: string;
}

export function Progress({ value, tone = 'petrol', className, label }: ProgressProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
      className={cn('h-2 overflow-hidden rounded-full bg-sand', className)}
    >
      <div
        className={cn('h-full rounded-full transition-[width] duration-700', { petrol: 'bg-petrol', mint: 'bg-mint', success: 'bg-success', lime: 'bg-lime', warning: 'bg-warning', danger: 'bg-danger' }[tone])}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
