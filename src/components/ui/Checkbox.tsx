import type { ComponentProps } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';

interface CheckboxProps extends Omit<ComponentProps<'input'>, 'type'> {
  label: string;
  description?: string;
}

/** Casilla en formato tarjeta (selección de roles). */
export function Checkbox({ label, description, className, id, ...props }: CheckboxProps) {
  return (
    <label
      htmlFor={id}
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-xl border border-line-strong bg-surface px-3.5 py-3 transition-colors hover:bg-sand has-checked:border-petrol has-checked:bg-mist has-focus-visible:outline-2 has-focus-visible:outline-mint-ink',
        className,
      )}
    >
      <input id={id} type="checkbox" className="peer sr-only" {...props} />
      <span className="flex size-5 shrink-0 items-center justify-center rounded-md border-2 border-line-strong bg-surface text-transparent transition-colors peer-checked:border-petrol peer-checked:bg-petrol peer-checked:text-white">
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-muted">{description}</span>}
      </span>
    </label>
  );
}
