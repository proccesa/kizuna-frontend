import { cn } from '@/lib/cn';

export const ISOTIPO_SRC = '/brand/kizuna-isotipo.svg';
const LOGO = { dark: '/brand/kizuna-logo.svg', light: '/brand/kizuna-logo-light.svg' } as const;

const heights = { sm: 'h-7', md: 'h-9', lg: 'h-12' } as const;

interface LogoProps {
  /** `light` para fondos oscuros. */
  tone?: 'dark' | 'light';
  size?: keyof typeof heights;
  /** Solo el isotipo (los dos globos). */
  markOnly?: boolean;
  className?: string;
}

/** Logotipo oficial de Kizuna (ver docs/MANUAL_DE_MARCA.md). */
export function Logo({ tone = 'dark', size = 'md', markOnly = false, className }: LogoProps) {
  return (
    <img
      src={markOnly ? (tone === 'light' ? '/brand/kizuna-isotipo-light.svg' : ISOTIPO_SRC) : LOGO[tone]}
      alt="Kizuna"
      className={cn(heights[size], 'w-auto shrink-0', className)}
    />
  );
}
