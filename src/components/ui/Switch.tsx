import { cn } from '@/lib/cn';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  id?: string;
  /** Etiqueta accesible cuando no se muestra `label`. */
  'aria-label'?: string;
}

export function Switch({ checked, onChange, label, description, disabled, id, ...aria }: SwitchProps) {
  const control = (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={aria['aria-label'] ?? label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-petrol' : 'bg-line-strong',
      )}
    >
      <span className={cn('inline-block size-5 rounded-full bg-white shadow-sm transition-transform', checked ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  );

  if (!label) return control;

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        {description && <p className="mt-0.5 text-[0.8rem] leading-relaxed text-muted">{description}</p>}
      </div>
      {control}
    </div>
  );
}
