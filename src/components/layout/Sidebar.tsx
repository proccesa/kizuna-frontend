import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { ChevronDown, LogOut, Search, X } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { Avatar, Kbd } from '@/components/ui';
import { cn } from '@/lib/cn';
import { humanize } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { NAV_ITEMS, SECTION_ICONS } from './navigation';

interface SidebarProps {
  mobileOpen: boolean;
  onClose: () => void;
  onOpenPalette: () => void;
  onLogout: () => void;
}

export function Sidebar({ mobileOpen, onClose, onOpenPalette, onLogout }: SidebarProps) {
  const { can, usuario } = useAuth();
  const location = useLocation();
  const items = NAV_ITEMS.filter((item) => !item.permiso || can(item.permiso));
  const nombre = usuario?.operador?.nombre_completo || usuario?.name;

  // Ítems directos de acceso rápido (General: Inicio, Programación)
  const directItems = items.filter((item) => item.section === 'General');

  // Secciones agrupadas
  const groupedSections = [...new Set(items.filter((item) => item.section !== 'General').map((item) => item.section))];

  // Identificar qué sección tiene la ruta activa
  const activeItem = items.find((item) => item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to));
  const activeSection = activeItem?.section;

  // Estado de sección abierta (acordeón exclusivo: solo una abierta a la vez)
  const [openSection, setOpenSection] = useState<string | null>(
    () => (activeSection && activeSection !== 'General' ? activeSection : null),
  );

  // Auto-expandir la sección activa cuando cambia de ruta
  useEffect(() => {
    if (activeSection && activeSection !== 'General') {
      setOpenSection(activeSection);
    }
  }, [activeSection]);

  const toggleSection = (section: string) => {
    setOpenSection((prev) => (prev === section ? null : section));
  };

  return (
    <>
      {mobileOpen && <div className="animate-fade-in fixed inset-0 z-30 bg-petrol/40 lg:hidden" onClick={onClose} aria-hidden />}

      <aside
        aria-label="Navegación principal"
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-[16.5rem] flex-col border-r border-line bg-cream transition-transform duration-300',
          'lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0',
          mobileOpen ? 'translate-x-0 shadow-pop' : '-translate-x-full',
        )}
      >
        {/* Cabecera / Logo */}
        <div className="flex items-center justify-between px-5 pt-6 pb-5">
          <Link to="/" onClick={onClose} aria-label="Kizuna, inicio">
            <Logo size="sm" />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar menú"
            className="flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted hover:bg-sand lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Buscador Rápido (Paleta de comandos) */}
        <div className="px-4">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPalette();
            }}
            className="flex h-10 w-full cursor-pointer items-center gap-2.5 rounded-xl border border-line-strong bg-surface px-3 text-left text-sm text-muted transition-colors hover:border-muted/40 hover:text-body"
          >
            <Search className="size-4" aria-hidden />
            <span className="flex-1">Buscar</span>
            <Kbd>⌘K</Kbd>
          </button>
        </div>

        {/* Menú de Navegación */}
        <nav className="mt-4 flex-1 space-y-3 overflow-y-auto px-4 pb-4">
          {/* Accesos directos principales */}
          {directItems.length > 0 && (
            <ul className="space-y-0.5">
              {directItems.map(({ to, label, icon: Icon }) => (
                <li key={to}>
                  <NavLink
                    to={to}
                    end={to === '/'}
                    onClick={onClose}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                        isActive ? 'bg-surface text-ink shadow-card ring-1 ring-line' : 'text-body hover:bg-sand hover:text-ink',
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className={cn('size-[1.1rem]', isActive ? 'text-mint-ink' : 'text-muted')} aria-hidden />
                        <span className="flex-1">{label}</span>
                        {isActive && <span className="size-1.5 rounded-full bg-mint" aria-hidden />}
                      </>
                    )}
                  </NavLink>
                </li>
              ))}
            </ul>
          )}

          {/* Separador sutil si hay ítems directos y grupos */}
          {directItems.length > 0 && groupedSections.length > 0 && (
            <div className="mx-2 border-t border-line" aria-hidden />
          )}

          {/* Grupos Colapsables */}
          <div className="space-y-1">
            {groupedSections.map((section) => {
              const sectionItems = items.filter((item) => item.section === section);
              const isOpen = openSection === section;
              const isCurrentSectionActive = activeSection === section;
              const SectionIcon = SECTION_ICONS[section];

              return (
                <div key={section} className="rounded-xl transition-colors">
                  {/* Botón Cabecera de Sección (Nivel Principal) */}
                  <button
                    type="button"
                    onClick={() => toggleSection(section)}
                    aria-expanded={isOpen}
                    className={cn(
                      'flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                      isCurrentSectionActive
                        ? 'font-semibold text-petrol bg-sand/60'
                        : isOpen
                          ? 'bg-sand/30 text-ink font-medium'
                          : 'text-body hover:bg-sand hover:text-ink',
                    )}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      {SectionIcon && (
                        <SectionIcon
                          className={cn('size-[1.1rem] shrink-0', isCurrentSectionActive ? 'text-petrol' : 'text-muted')}
                          aria-hidden
                        />
                      )}
                      <span className="truncate">{section}</span>
                    </span>

                    <span className="flex items-center gap-2">
                      {!isOpen && isCurrentSectionActive && (
                        <span className="size-1.5 rounded-full bg-mint" title="Contiene la página activa" />
                      )}
                      <ChevronDown
                        className={cn(
                          'size-4 text-muted transition-transform duration-200',
                          isOpen ? 'rotate-0' : '-rotate-90',
                        )}
                        aria-hidden
                      />
                    </span>
                  </button>

                  {/* Sub-menú de Ítems (Nivel Secundario / Submódulos) */}
                  {isOpen && (
                    <ul className="mt-1 ml-4 space-y-0.5 border-l border-line-strong/60 pl-2.5">
                      {sectionItems.map(({ to, label, icon: Icon }) => (
                        <li key={to}>
                          <NavLink
                            to={to}
                            onClick={onClose}
                            className={({ isActive }) =>
                              cn(
                                'flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors',
                                isActive
                                  ? 'bg-surface text-ink font-semibold shadow-card ring-1 ring-line'
                                  : 'text-muted hover:bg-sand hover:text-ink',
                              )
                            }
                          >
                            {({ isActive }) => (
                              <>
                                <Icon className={cn('size-3.5 shrink-0', isActive ? 'text-mint-ink' : 'text-muted/80')} aria-hidden />
                                <span className="truncate flex-1">{label}</span>
                                {isActive && <span className="size-1.5 rounded-full bg-mint shrink-0" aria-hidden />}
                              </>
                            )}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>

        </nav>

        {/* Footer de Usuario */}
        <div className="border-t border-line p-3">
          <div className="flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-sand">
            <Link to="/perfil" onClick={onClose} className="flex min-w-0 flex-1 items-center gap-3" title="Mi perfil">
              <Avatar name={nombre} size="sm" />
              <span className="min-w-0">
                <span className="block truncate text-sm leading-tight font-semibold text-ink">{nombre}</span>
                {usuario?.roles[0] && <span className="block truncate text-xs text-muted">{humanize(usuario.roles[0])}</span>}
              </span>
            </Link>
            <button
              type="button"
              onClick={onLogout}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-lg text-muted hover:bg-surface hover:text-danger"
            >
              <LogOut className="size-4" />
            </button>
          </div>
          <p className="mt-2 px-2 text-[0.7rem] text-subtle">Kizuna · un producto de Proccesa</p>
        </div>
      </aside>
    </>
  );
}

