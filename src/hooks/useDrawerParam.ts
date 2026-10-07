import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Registro abierto en el panel lateral, guardado en `?ver=<id>` (o `?ver=nuevo`).
 * Permite enlazar directamente a un registro (p. ej. desde la paleta ⌘K).
 */
export function useDrawerParam() {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get('ver');

  const selectedId = raw && raw !== 'nuevo' && Number.isFinite(Number(raw)) ? Number(raw) : null;
  const isCreating = raw === 'nuevo';

  const set = useCallback(
    (value: number | 'nuevo' | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          if (value === null) next.delete('ver');
          else next.set('ver', String(value));
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  return {
    selectedId,
    isCreating,
    isOpen: selectedId !== null || isCreating,
    open: (id: number) => set(id),
    create: () => set('nuevo'),
    close: () => set(null),
  };
}
