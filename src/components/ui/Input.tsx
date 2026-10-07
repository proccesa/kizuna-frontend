import type { ComponentProps } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { controlClass } from './Field';

export interface InputProps extends ComponentProps<'input'> {
  icon?: LucideIcon;
  invalid?: boolean;
}

export function Input({ icon: Icon, invalid, className, id, ...props }: InputProps) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />}
      <input
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && id ? `${id}-error` : undefined}
        className={cn(controlClass, 'h-11', Icon && 'pl-10', className)}
        {...props}
      />
    </div>
  );
}
