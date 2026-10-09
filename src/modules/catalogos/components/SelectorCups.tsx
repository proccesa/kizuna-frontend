import { useState, type ReactNode } from 'react';
import { Check, Search, X } from 'lucide-react';
import { SearchInput, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useBuscarCups } from '../hooks/useCatalogos';
import type { Cups } from '../types';

const POR_PAGINA = 30;

interface SelectorCupsProps {
  seleccion: Map<number, Cups>;
  onAlternar: (cups: Cups) => void;
  error?: string;
  /** Contenido extra junto a cada resultado (p. ej. "ya está en el contrato"). */
  extra?: (cups: Cups) => ReactNode;
}

/** Búsqueda en el catálogo CUPS oficial con selección múltiple. */
export function SelectorCups({ seleccion, onAlternar, error, extra }: SelectorCupsProps) {
  const [buscar, setBuscar] = useState('');
  const busqueda = buscar.trim();
  const resultados = useBuscarCups({ buscar: busqueda, por_pagina: POR_PAGINA }, busqueda.length >= 3);

  return (
    <div className="min-w-0">
      <SearchInput value={buscar} onChange={setBuscar} placeholder="Código o nombre: 890201, consulta pediatría…" />
      {seleccion.size > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {[...seleccion.values()].map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => onAlternar(c)}
              className="flex cursor-pointer items-center gap-1 rounded-full bg-petrol py-0.5 pr-1.5 pl-2.5 text-xs font-semibold text-white"
              title={c.nombre}
            >
              <span className="tabular">{c.codigo}</span>
              <X className="size-3" aria-label={`Quitar ${c.codigo}`} />
            </button>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-[0.8rem] font-medium text-danger">{error}</p>}

      <div className="mt-3 h-80 overflow-y-auto rounded-xl border border-line">
        {busqueda.length < 3 ? (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-sm text-muted">
            <Search className="size-5" aria-hidden />
            Escribe al menos 3 caracteres para buscar entre los procedimientos habilitados.
          </div>
        ) : resultados.isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : resultados.data?.datos.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">Sin coincidencias en el catálogo CUPS.</p>
        ) : (
          <ul className={cn('divide-y divide-line', resultados.isFetching && 'opacity-60')}>
            {resultados.data?.datos.map((c) => {
              const marcado = seleccion.has(c.id);
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onAlternar(c)}
                    aria-pressed={marcado}
                    className={cn('flex w-full cursor-pointer items-start gap-3 px-3 py-2.5 text-left transition-colors', marcado ? 'bg-mist' : 'hover:bg-cream')}
                  >
                    <span
                      className={cn('mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border-2', marcado ? 'border-petrol bg-petrol text-white' : 'border-line-strong')}
                    >
                      {marcado && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="tabular block font-display text-sm font-bold text-ink">{c.codigo}</span>
                      <span className="block text-xs leading-snug text-body">{c.nombre}</span>
                    </span>
                    {extra?.(c)}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {resultados.data && resultados.data.paginacion.total > POR_PAGINA && (
        <p className="mt-1.5 text-xs text-muted">
          Mostrando {POR_PAGINA} de {resultados.data.paginacion.total}. Afina la búsqueda para ver más.
        </p>
      )}
    </div>
  );
}
