import type { ReactNode } from 'react';
import { FilterTabs, SearchInput } from '@/components/ui';
import type { EstadoFiltro } from '@/hooks/useListParams';

interface ListToolbarProps {
  buscar: string;
  onBuscar: (value: string) => void;
  placeholder: string;
  estado: EstadoFiltro;
  onEstado: (value: EstadoFiltro) => void;
  counts: Partial<Record<EstadoFiltro, number>>;
  /** Oculta "Eliminados" si el usuario no puede restaurar. */
  mostrarEliminados?: boolean;
  children?: ReactNode;
}

export function ListToolbar({ buscar, onBuscar, placeholder, estado, onEstado, counts, mostrarEliminados = true, children }: ListToolbarProps) {
  const tabs = [
    { value: 'todos' as const, label: 'Todos', count: counts.todos },
    { value: 'activos' as const, label: 'Activos', count: counts.activos },
    { value: 'inactivos' as const, label: 'Inactivos', count: counts.inactivos },
    ...(mostrarEliminados ? [{ value: 'eliminados' as const, label: 'Eliminados', count: counts.eliminados }] : []),
  ];

  return (
    <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
      <FilterTabs aria-label="Filtrar por estado" value={estado} onChange={onEstado} tabs={tabs} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {children}
        <SearchInput value={buscar} onChange={onBuscar} placeholder={placeholder} className="sm:w-72" />
      </div>
    </div>
  );
}
