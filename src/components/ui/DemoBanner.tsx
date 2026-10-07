import { FlaskConical } from 'lucide-react';

/** Aviso para pantallas de diseño que aún usan datos de ejemplo (src/demo). */
export function DemoBanner() {
  return (
    <div className="mb-6 flex items-start gap-3 rounded-xl border border-lime/50 bg-lime-soft px-4 py-3 text-sm text-lime-ink">
      <FlaskConical className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p>
        <span className="font-semibold">Vista de diseño con datos de ejemplo.</span> Este módulo aún no está conectado al backend.
      </p>
    </div>
  );
}
