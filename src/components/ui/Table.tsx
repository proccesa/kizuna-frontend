import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TableColumn<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  className?: string;
}

/** Tabla simple y legible; se desplaza horizontalmente en pantallas pequeñas. */
export function Table<T>({ columns, rows, rowKey, className }: TableProps<T>) {
  const align = { left: 'text-left', right: 'text-right', center: 'text-center' };
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full min-w-[40rem] text-sm">
        <thead>
          <tr className="border-b border-line bg-cream/60">
            {columns.map((c) => (
              <th key={c.key} scope="col" className={cn('px-5 py-2.5 text-xs font-semibold whitespace-nowrap text-muted', align[c.align ?? 'left'], c.className)}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map((row) => (
            <tr key={rowKey(row)} className="transition-colors hover:bg-cream/60">
              {columns.map((c) => (
                <td key={c.key} className={cn('px-5 py-3.5 align-middle text-body', align[c.align ?? 'left'], c.className)}>
                  {c.cell(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
