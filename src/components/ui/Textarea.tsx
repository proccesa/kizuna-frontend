import type { ComponentProps } from 'react';
import { cn } from '@/lib/cn';
import { controlClass } from './Field';

export interface TextareaProps extends ComponentProps<'textarea'> {
  invalid?: boolean;
}

export function Textarea({ invalid, className, ...props }: TextareaProps) {
  return <textarea aria-invalid={invalid || undefined} className={cn(controlClass, 'min-h-24 resize-y py-2.5', className)} {...props} />;
}
