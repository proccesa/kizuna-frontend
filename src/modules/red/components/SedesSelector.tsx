import { useMemo } from 'react';
import { Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useSedes } from '../hooks/useRed';

interface SedesSelectorProps {
  value: number[];
  onChange: (sedeIds: number[]) => void;
  error?: string;
  className?: string;
}

/** Selección múltiple de sedes activas, agrupadas por prestador. */
export function SedesSelector({ value, onChange, error, className }: SedesSelectorProps) {
  const { data, isLoading } = useSedes({ activo: true, por_pagina: 100 });

  const porPrestador = useMemo(() => {
    const grupos = new Map<string, NonNullable<typeof data>['datos']>();
    for (const sede of data?.datos ?? []) {
      const nombre = sede.prestador?.nombre_comercial || sede.prestador?.razon_social || 'Prestador';
      grupos.set(nombre, [...(grupos.get(nombre) ?? []), sede]);
    }
    return [...grupos.entries()];
  }, [data]);

  return (
    <div className={className}>
      {isLoading ? (
        <Skeleton className="h-24" />
      ) : porPrestador.length === 0 ? (
        <p className="rounded-xl bg-warning-soft p-3 text-sm text-warning">No hay sedes activas. Créalas en Prestadores y sedes.</p>
      ) : (
        <div className="max-h-60 space-y-3 overflow-y-auto">
          {porPrestador.map(([prestador, sedes]) => (
            <div key={prestador}>
              <p className="text-xs font-semibold text-muted">{prestador}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {sedes.map((s) => {
                  const marcada = value.includes(s.id);
                  return (
                    <button
                      key={s.id}
                      type="button"
                      aria-pressed={marcada}
                      onClick={() => onChange(marcada ? value.filter((id) => id !== s.id) : [...value, s.id])}
                      className={cn(
                        'cursor-pointer rounded-xl px-3 py-1.5 text-sm font-medium transition-colors',
                        marcada ? 'bg-petrol text-white' : 'border border-line-strong bg-surface text-body hover:bg-sand',
                      )}
                    >
                      {s.nombre}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-[0.8rem] font-medium text-danger">{error}</p>}
    </div>
  );
}
