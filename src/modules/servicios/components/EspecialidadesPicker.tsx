import { useEffect, useRef, useState } from 'react';
import { Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import type { Especialidad } from '../types';

interface EspecialidadesPickerProps {
  especialidades: Especialidad[];
  seleccionadas: number[];
  onAlternar: (especialidadId: number, asignar: boolean) => void;
  etiqueta: string;
}

/** Selector desplegable de especialidades con búsqueda. Cada clic asigna o quita al instante. */
export function EspecialidadesPicker({ especialidades, seleccionadas, onAlternar, etiqueta }: EspecialidadesPickerProps) {
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const cerrar = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const escape = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', cerrar);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('mousedown', cerrar);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const normalizar = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const visibles = especialidades.filter((e) => e.activo && (!filtro || normalizar(e.nombre).includes(normalizar(filtro))));

  return (
    <div className="relative" ref={ref}>
      <Button size="sm" variant="secondary" icon={Plus} onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={etiqueta}>
        Asignar
      </Button>
      {open && (
        <div className="animate-pop-in absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-line bg-surface p-2 shadow-pop">
          <input
            autoFocus
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            placeholder="Buscar especialidad"
            aria-label="Buscar especialidad"
            className="mb-1 h-9 w-full rounded-lg border border-line-strong px-3 text-sm outline-none focus:border-petrol"
          />
          <ul className="max-h-64 overflow-y-auto">
            {visibles.map((e) => {
              const marcada = seleccionadas.includes(e.id);
              return (
                <li key={e.id}>
                  <button
                    type="button"
                    onClick={() => onAlternar(e.id, !marcada)}
                    aria-pressed={marcada}
                    className={cn('flex w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm', marcada ? 'bg-mist text-mist-ink' : 'text-body hover:bg-sand')}
                  >
                    <span className={cn('flex size-4 shrink-0 items-center justify-center rounded border-2', marcada ? 'border-petrol bg-petrol text-white' : 'border-line-strong')}>
                      {marcada && <Check className="size-3" strokeWidth={3} />}
                    </span>
                    {e.nombre}
                  </button>
                </li>
              );
            })}
            {visibles.length === 0 && <li className="px-3 py-4 text-center text-sm text-muted">Sin coincidencias</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
