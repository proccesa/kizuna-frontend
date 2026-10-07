import type { ReactNode } from 'react';
import { Link2, Link2Off } from 'lucide-react';
import { cn } from '@/lib/cn';

interface VinculoProps {
  /** ¿Existe el vínculo? */
  linked: boolean;
  children?: ReactNode;
  emptyLabel?: string;
  className?: string;
}

/** Indica con qué está vinculado un registro (cuenta ↔ persona). */
export function Vinculo({ linked, children, emptyLabel = 'Sin vincular', className }: VinculoProps) {
  return linked ? (
    <span className={cn('inline-flex min-w-0 items-center gap-1.5 rounded-lg bg-lime-soft px-2 py-1 text-[0.8rem] text-lime-ink', className)}>
      <Link2 className="size-3.5 shrink-0" aria-hidden />
      <span className="truncate font-medium">{children}</span>
    </span>
  ) : (
    <span className={cn('inline-flex items-center gap-1.5 text-[0.8rem] text-subtle', className)}>
      <Link2Off className="size-3.5" aria-hidden />
      {emptyLabel}
    </span>
  );
}
