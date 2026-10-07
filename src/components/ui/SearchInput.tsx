import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { controlClass } from './Field';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Espera antes de notificar el cambio (ms). */
  debounce?: number;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = 'Buscar…', debounce = 350, className }: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const [lastValue, setLastValue] = useState(value);

  // Sincroniza el borrador si el valor cambia desde afuera (p. ej. al navegar).
  if (value !== lastValue) {
    setLastValue(value);
    setDraft(value);
  }

  useEffect(() => {
    if (draft === value) return;
    const timer = setTimeout(() => onChange(draft), debounce);
    return () => clearTimeout(timer);
  }, [draft, value, onChange, debounce]);

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-subtle" aria-hidden />
      <input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={cn(controlClass, 'h-10 pr-9 pl-10 [&::-webkit-search-cancel-button]:hidden')}
      />
      {draft && (
        <button
          type="button"
          onClick={() => {
            setDraft('');
            onChange('');
          }}
          aria-label="Limpiar búsqueda"
          className="absolute top-1/2 right-2.5 flex size-6 -translate-y-1/2 cursor-pointer items-center justify-center rounded-md text-subtle hover:bg-sand hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
