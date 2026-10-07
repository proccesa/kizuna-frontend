import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Contact, CornerDownLeft, Search, UserRound, type LucideIcon } from 'lucide-react';
import { Kbd, Spinner } from '@/components/ui';
import { cn } from '@/lib/cn';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useOperadores } from '@/modules/operadores/hooks/useOperadores';
import { useUsuarios } from '@/modules/usuarios/hooks/useUsuarios';
import { NAV_ITEMS } from './navigation';

interface Command {
  id: string;
  group: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  to: string;
}

function useDebounced<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** Paleta de comandos (⌘K): navegación rápida y búsqueda de usuarios y operadores. */
export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return createPortal(<PaletteDialog onClose={onClose} />, document.body);
}

function PaletteDialog({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  const { can } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const buscar = useDebounced(query.trim());
  const shouldSearch = buscar.length >= 2;

  const usuarios = useUsuarios({ buscar, por_pagina: 4 }, shouldSearch && can(PERMISOS.usuarios.listar));
  const operadores = useOperadores({ buscar, por_pagina: 4 }, shouldSearch && can(PERMISOS.operadores.listar));

  useEffect(() => {
    inputRef.current?.focus();
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);

  const commands = useMemo<Command[]>(() => {
    const q = query.trim().toLowerCase();
    const nav = NAV_ITEMS.filter((item) => (!item.permiso || can(item.permiso)) && (!q || item.label.toLowerCase().includes(q)))
      .map((item) => ({ id: `nav-${item.to}`, group: 'Ir a', label: item.label, hint: item.description, icon: item.icon, to: item.to }));

    const users = shouldSearch
      ? (usuarios.data?.datos ?? []).map((u) => ({
          id: `usr-${u.id}`,
          group: 'Usuarios',
          label: u.operador?.nombre_completo || u.name,
          hint: u.email,
          icon: UserRound,
          to: `/usuarios?ver=${u.id}`,
        }))
      : [];

    const ops = shouldSearch
      ? (operadores.data?.datos ?? []).map((o) => ({
          id: `op-${o.id}`,
          group: 'Operadores',
          label: o.nombre_completo,
          hint: `${o.tipo_documento?.codigo ?? ''} ${o.documento}`.trim(),
          icon: Contact,
          to: `/operadores?ver=${o.id}`,
        }))
      : [];

    return [...nav, ...users, ...ops];
  }, [query, can, shouldSearch, usuarios.data, operadores.data]);

  const safeIndex = Math.min(activeIndex, Math.max(commands.length - 1, 0));
  const isSearching = shouldSearch && (usuarios.isFetching || operadores.isFetching);

  const run = (command?: Command) => {
    if (!command) return;
    navigate(command.to);
    onClose();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((safeIndex + 1) % Math.max(commands.length, 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((safeIndex - 1 + commands.length) % Math.max(commands.length, 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      run(commands[safeIndex]);
    } else if (event.key === 'Escape') {
      onClose();
    }
  };

  const groups = [...new Set(commands.map((c) => c.group))];

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]" onKeyDown={onKeyDown}>
      <div className="animate-fade-in absolute inset-0 bg-petrol/40" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Paleta de comandos" className="animate-pop-in relative w-full max-w-xl overflow-hidden rounded-3xl bg-surface shadow-pop">
        <div className="flex items-center gap-3 border-b border-line px-5">
          {isSearching ? <Spinner className="size-4 text-mint-ink" /> : <Search className="size-4 text-muted" aria-hidden />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Busca personas, documentos o secciones…"
            aria-label="Buscar"
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-results"
            aria-activedescendant={commands[safeIndex]?.id}
            className="h-14 flex-1 bg-transparent text-[0.95rem] text-ink outline-none placeholder:text-subtle"
          />
          <Kbd>esc</Kbd>
        </div>

        <ul id="palette-results" role="listbox" className="max-h-[50vh] overflow-y-auto p-2">
          {commands.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-muted">
              {shouldSearch && !isSearching ? `Sin resultados para "${buscar}".` : 'Escribe al menos 2 letras para buscar personas.'}
            </li>
          )}
          {groups.map((group) => (
            <li key={group} role="presentation">
              <p className="px-3 pt-3 pb-1.5 text-xs font-semibold text-muted">{group}</p>
              <ul role="presentation">
                {commands
                  .filter((c) => c.group === group)
                  .map((command) => {
                    const index = commands.indexOf(command);
                    const active = index === safeIndex;
                    const Icon = command.icon;
                    return (
                      <li
                        key={command.id}
                        id={command.id}
                        role="option"
                        aria-selected={active}
                        onMouseMove={() => setActiveIndex(index)}
                        onClick={() => run(command)}
                        className={cn('flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5', active ? 'bg-mist text-ink' : 'text-ink')}
                      >
                        <span className={cn('flex size-8 items-center justify-center rounded-lg', active ? 'bg-surface text-mint-ink' : 'bg-sand text-muted')}>
                          <Icon className="size-4" aria-hidden />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold">{command.label}</span>
                          {command.hint && <span className={'block truncate text-xs text-muted'}>{command.hint}</span>}
                        </span>
                        {active ? <CornerDownLeft className="size-4 text-mist-ink" aria-hidden /> : <ArrowRight className="size-4 text-subtle" aria-hidden />}
                      </li>
                    );
                  })}
              </ul>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4 border-t border-line bg-sand/60 px-5 py-2.5 text-xs text-muted">
          <span className="flex items-center gap-1.5"><Kbd>↑</Kbd><Kbd>↓</Kbd> navegar</span>
          <span className="flex items-center gap-1.5"><Kbd>↵</Kbd> abrir</span>
        </div>
      </div>
    </div>
  );
}
