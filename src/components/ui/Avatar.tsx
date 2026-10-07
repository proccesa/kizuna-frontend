import { cn } from '@/lib/cn';
import { initials } from '@/lib/format';

const sizes = {
  sm: 'size-9 text-xs',
  md: 'size-11 text-sm',
  lg: 'size-16 text-xl',
  xl: 'size-20 text-2xl',
} as const;

/** Combinaciones de la paleta, asignadas de forma estable según el nombre. */
const palettes = ['bg-petrol text-white', 'bg-mint text-petrol', 'bg-lime text-petrol', 'bg-mist text-mist-ink', 'bg-mint-soft text-mint-ink'];

function paletteFor(name?: string | null) {
  if (!name) return palettes[0];
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return palettes[hash % palettes.length];
}

interface AvatarProps {
  name?: string | null;
  size?: keyof typeof sizes;
  className?: string;
}

/** Avatar con forma de globo de diálogo (esquina inferior izquierda recta), como el isotipo. */
export function Avatar({ name, size = 'md', className }: AvatarProps) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-[38%] rounded-bl-md font-display font-bold tracking-tight',
        sizes[size],
        paletteFor(name),
        className,
      )}
      aria-hidden
    >
      {initials(name)}
    </span>
  );
}
