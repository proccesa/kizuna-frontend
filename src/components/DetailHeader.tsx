import type { ReactNode } from 'react';
import { Avatar, Skeleton } from '@/components/ui';

interface DetailHeaderProps {
  kicker: string;
  name?: string;
  subtitle?: ReactNode;
  meta?: ReactNode;
  isLoading?: boolean;
}

/** Cabecera de los paneles de detalle: avatar, nombre y datos clave sobre papel. */
export function DetailHeader({ kicker, name, subtitle, meta, isLoading }: DetailHeaderProps) {
  return (
    <div className="border-b border-line bg-cream px-6 pt-6 pb-5 sm:rounded-t-3xl">
      <p className="text-xs font-semibold text-muted">{kicker}</p>
      <div className="mt-3 flex items-center gap-4 pr-10">
        {isLoading ? (
          <>
            <Skeleton className="size-16 rounded-[38%]" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-6 w-44" />
              <Skeleton className="h-4 w-56" />
            </div>
          </>
        ) : (
          <>
            <Avatar name={name} size="lg" />
            <div className="min-w-0">
              <h2 className="truncate text-2xl leading-tight font-bold">{name}</h2>
              {subtitle && <div className="mt-0.5 truncate text-sm text-muted">{subtitle}</div>}
            </div>
          </>
        )}
      </div>
      {meta && !isLoading && <div className="mt-4 flex flex-wrap items-center gap-1.5">{meta}</div>}
    </div>
  );
}
