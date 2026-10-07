import type { ComponentProps } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { controlClass } from './Field';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends ComponentProps<'select'> {
  options: SelectOption[];
  placeholder?: string;
  invalid?: boolean;
}

export function Select({ options, placeholder, invalid, className, id, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        id={id}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid && id ? `${id}-error` : undefined}
        className={cn(controlClass, 'h-11 cursor-pointer appearance-none pr-10', className)}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
    </div>
  );
}
