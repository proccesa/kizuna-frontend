import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

const tones = {
  petrol: 'bg-petrol text-white',
  mint: 'bg-mint text-petrol',
  lime: 'bg-lime text-petrol',
  mist: 'bg-mist text-mist-ink',
  white: 'bg-surface text-ink border border-line',
} as const;

interface BubbleProps {
  tone?: keyof typeof tones;
  /** Lado de la "cola" del globo. */
  side?: 'left' | 'right';
  className?: string;
  children: ReactNode;
}

/** Globo de diálogo plano: la forma base del lenguaje visual de Kizuna. */
export function Bubble({ tone = 'white', side = 'left', className, children }: BubbleProps) {
  return (
    <div className={cn('rounded-[1.25rem] px-4 py-3 text-sm leading-snug', side === 'left' ? 'rounded-bl-[0.3rem]' : 'rounded-br-[0.3rem]', tones[tone], className)}>
      {children}
    </div>
  );
}
