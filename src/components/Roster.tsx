import type { ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import { EmptyState, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';

export interface RosterColumn<T> {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  /** Oculta la columna por debajo de `md`. */
  hideOnMobile?: boolean;
}

interface RosterProps<T> {
  columns: RosterColumn<T>[];
  /** Plantilla de columnas del grid en escritorio (sin contar el chevron). */
  template: string;
  rows: T[];
  rowKey: (row: T) => number | string;
  rowLabel: (row: T) => string;
  onRowClick: (row: T) => void;
  isLoading?: boolean;
  dimmed?: (row: T) => boolean;
  empty: { title: string; description?: string; action?: ReactNode };
}

/** Listado de filas amplias y clicables que abren el panel de detalle. En móvil se apilan. */
export function Roster<T>({ columns, template, rows, rowKey, rowLabel, onRowClick, isLoading, dimmed, empty }: RosterProps<T>) {
  const gridStyle = { gridTemplateColumns: `${template} 1.25rem` };

  if (!isLoading && rows.length === 0) return <EmptyState {...empty} />;

  return (
    <div>
      <div className="hidden gap-6 border-b border-line bg-cream/60 px-5 py-2.5 md:grid" style={gridStyle} aria-hidden>
        {columns.map((column) => (
          <span key={column.key} className="text-xs font-semibold text-muted">
            {column.header}
          </span>
        ))}
      </div>

      <ul className="divide-y divide-line">
        {isLoading
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="flex items-center gap-4 px-5 py-4">
                <Skeleton className="size-9 rounded-[38%]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-44" />
                  <Skeleton className="h-3 w-60" />
                </div>
              </li>
            ))
          : rows.map((row) => (
              <li key={rowKey(row)}>
                <button
                  type="button"
                  onClick={() => onRowClick(row)}
                  aria-label={rowLabel(row)}
                  className={cn(
                    'group flex w-full cursor-pointer flex-col gap-3 px-5 py-3.5 text-left transition-colors hover:bg-cream md:grid md:items-center md:gap-6',
                    dimmed?.(row) && 'opacity-60',
                  )}
                  style={gridStyle}
                >
                  {columns.map((column) => (
                    <span key={column.key} className={cn('min-w-0', column.hideOnMobile && 'hidden md:block')}>
                      {column.cell(row)}
                    </span>
                  ))}
                  <ChevronRight className="hidden size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-ink md:block" aria-hidden />
                </button>
              </li>
            ))}
      </ul>
    </div>
  );
}
