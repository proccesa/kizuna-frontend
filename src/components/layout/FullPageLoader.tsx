import { ISOTIPO_SRC } from '@/components/brand/Logo';

export function FullPageLoader() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-cream" role="status" aria-label="Cargando">
      <img src={ISOTIPO_SRC} alt="" className="size-12 animate-bounce" />
    </div>
  );
}
