import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  /** Título accesible del panel (se muestra en la cabecera por defecto). */
  title: string;
  /** Oculta visualmente el título (el contenido trae su propia cabecera). */
  hideTitle?: boolean;
  footer?: ReactNode;
  dismissible?: boolean;
  width?: 'md' | 'lg';
  children: ReactNode;
}

/** Panel lateral derecho para ver y editar registros sin perder el contexto del listado. */
export function Drawer({ open, onClose, title, hideTitle = false, footer, dismissible = true, width = 'md', children }: DrawerProps) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef({ onClose, dismissible });

  useEffect(() => {
    closeRef.current = { onClose, dismissible };
  });

  useEffect(() => {
    if (!open) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    panelRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented && closeRef.current.dismissible) closeRef.current.onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = overflow;
      previouslyFocused?.focus();
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="animate-fade-in absolute inset-0 bg-petrol/40" onClick={dismissible ? onClose : undefined} aria-hidden />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn(
          'animate-slide-in relative flex h-full w-full flex-col bg-surface shadow-pop outline-none sm:m-3 sm:h-[calc(100%-1.5rem)] sm:rounded-3xl',
          width === 'md' ? 'sm:max-w-lg' : 'sm:max-w-2xl',
        )}
      >
        <button
          type="button"
          onClick={onClose}
          disabled={!dismissible}
          aria-label="Cerrar panel"
          className="absolute top-4 right-4 z-10 flex size-9 cursor-pointer items-center justify-center rounded-xl text-muted transition-colors hover:bg-sand hover:text-ink disabled:opacity-40"
        >
          <X className="size-5" />
        </button>
        <div id={titleId} className={hideTitle ? 'sr-only' : 'px-6 pt-6 pb-4 font-display text-xl font-bold text-ink'}>
          {title}
        </div>
        <div className="flex-1 overflow-y-auto">{children}</div>
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-line px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
