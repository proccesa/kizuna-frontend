import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Menu, Search } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { CommandPalette } from './CommandPalette';
import { Sidebar } from './Sidebar';

export function AppLayout() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Atajo global ⌘K / Ctrl+K.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex min-h-dvh bg-cream">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onOpenPalette={() => setPaletteOpen(true)} onLogout={handleLogout} />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Barra superior solo en móvil */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-line bg-cream/95 px-4 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} aria-label="Abrir menú" className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-ink hover:bg-sand">
            <Menu className="size-5" />
          </button>
          <Logo size="sm" />
          <button type="button" onClick={() => setPaletteOpen(true)} aria-label="Buscar" className="flex size-10 cursor-pointer items-center justify-center rounded-xl text-ink hover:bg-sand">
            <Search className="size-5" />
          </button>
        </header>

        <main className="mx-auto w-full max-w-[80rem] flex-1 px-4 py-6 sm:px-8 lg:py-10">
          <Outlet />
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
