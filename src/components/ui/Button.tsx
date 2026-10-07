import type { ComponentProps, ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Spinner } from './Spinner';

const variants = {
  /** Acción principal: ciruela sólido. Una por vista. */
  primary: 'bg-petrol text-white hover:bg-petrol-hover',
  /** Momentos de marca (login, crear algo nuevo). */
  mint: 'bg-mint text-petrol hover:bg-mint-hover',
  secondary: 'border border-line-strong bg-surface text-ink hover:bg-sand',
  ghost: 'text-body hover:bg-sand hover:text-ink',
  danger: 'bg-danger text-white hover:bg-danger-hover',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
  success: 'bg-success text-white hover:brightness-110',
} as const;

const sizes = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-[0.8rem]',
  md: 'h-10 gap-2 rounded-xl px-4 text-sm',
  lg: 'h-12 gap-2 rounded-xl px-5 text-[0.95rem]',
} as const;

const iconSizes = { sm: 'size-8 rounded-lg', md: 'size-10 rounded-xl', lg: 'size-12 rounded-xl' } as const;

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  icon?: LucideIcon;
  iconRight?: LucideIcon;
  /** Botón cuadrado solo con ícono. Requiere `aria-label`. */
  iconOnly?: boolean;
  isLoading?: boolean;
  children?: ReactNode;
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconRight: IconRight,
  iconOnly = false,
  isLoading = false,
  disabled,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={cn(
        'inline-flex shrink-0 cursor-pointer items-center justify-center font-semibold whitespace-nowrap transition-colors duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50',
        variants[variant],
        iconOnly ? cn(iconSizes[size], 'p-0') : sizes[size],
        className,
      )}
      {...props}
    >
      {isLoading ? <Spinner /> : Icon && <Icon className="size-4" aria-hidden />}
      {!iconOnly && children}
      {!iconOnly && IconRight && !isLoading && <IconRight className="size-4" aria-hidden />}
    </button>
  );
}
