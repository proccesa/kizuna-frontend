import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Envoltorio de campo de formulario: etiqueta, ayuda y mensaje de error. */
export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-semibold text-ink">
          {label}
          {required && <span className="ml-0.5 text-danger" aria-hidden>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="text-[0.8rem] font-medium text-danger">
          {error}
        </p>
      ) : (
        hint && <p className="text-[0.8rem] text-muted">{hint}</p>
      )}
    </div>
  );
}

export const controlClass =
  'w-full rounded-xl border border-line-strong bg-surface px-3.5 text-[0.95rem] text-ink transition-[border-color,box-shadow] placeholder:text-subtle hover:border-muted/50 focus:border-petrol focus:shadow-[0_0_0_3px_var(--color-mist)] focus:outline-none disabled:cursor-not-allowed disabled:bg-sand disabled:text-muted aria-[invalid=true]:border-danger aria-[invalid=true]:focus:shadow-[0_0_0_3px_var(--color-danger-soft)]';
