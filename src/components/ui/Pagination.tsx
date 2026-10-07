import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Paginacion } from '@/lib/api/types';
import { Button } from './Button';

interface PaginationProps {
  paginacion: Paginacion;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

export function Pagination({ paginacion, onPageChange, disabled }: PaginationProps) {
  const { pagina_actual, total_paginas, total, desde, hasta } = paginacion;

  return (
    <nav aria-label="Paginación" className="flex items-center justify-between gap-3 border-t border-line px-5 py-3">
      <p className="tabular text-sm text-muted">
        {total === 0 ? 'Sin resultados' : `${desde}–${hasta} de ${total}`}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" iconOnly icon={ChevronLeft} aria-label="Página anterior" disabled={disabled || pagina_actual <= 1} onClick={() => onPageChange(pagina_actual - 1)} />
        <span className="tabular min-w-14 text-center text-sm font-medium text-body">
          {pagina_actual} de {Math.max(total_paginas, 1)}
        </span>
        <Button variant="ghost" size="sm" iconOnly icon={ChevronRight} aria-label="Página siguiente" disabled={disabled || pagina_actual >= total_paginas} onClick={() => onPageChange(pagina_actual + 1)} />
      </div>
    </nav>
  );
}
