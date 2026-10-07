import { Link } from 'react-router-dom';
import { Bubble } from '@/components/brand/Bubble';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-center">
      <Bubble tone="mist" className="text-base">¿Hola? ¿Hay alguien aquí?</Bubble>
      <Bubble tone="mint" side="right" className="self-center text-base">
        Esta página no existe.
      </Bubble>
      <Link to="/" className="mt-6 rounded-xl bg-petrol px-5 py-2.5 text-sm font-semibold text-white hover:bg-petrol-hover">
        Volver al inicio
      </Link>
    </div>
  );
}
