import { ArrowDown, Bot, Check } from 'lucide-react';

const CADENA = [
  { etiqueta: 'Contrato', valor: 'Nueva EPS · PGP' },
  { etiqueta: 'Población', valor: 'Hipertensión · 2.140 pacientes' },
  { etiqueta: 'CUPS', valor: '890302 · Control especializado' },
  { etiqueta: 'Especialista', valor: 'Medicina interna · Sede Norte' },
];

/**
 * Ilustración del producto: cómo la configuración de la IPS termina en una cita.
 * Datos de ejemplo, puramente decorativos.
 */
export function SchedulingPreview() {
  return (
    <div className="flex w-full max-w-sm flex-col" aria-hidden>
      <ul className="space-y-1.5">
        {CADENA.map((paso, i) => (
          <li
            key={paso.etiqueta}
            className="animate-enter flex items-center gap-3 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-sm"
            style={{ animationDelay: `${150 + i * 140}ms` }}
          >
            <span className="w-20 shrink-0 text-xs font-semibold text-muted">{paso.etiqueta}</span>
            <span className="truncate font-medium text-ink">{paso.valor}</span>
          </li>
        ))}
      </ul>

      <div className="animate-enter flex justify-center py-2 text-mint-ink [animation-delay:750ms]">
        <ArrowDown className="size-5" />
      </div>

      <div className="animate-enter rounded-[1.4rem] rounded-bl-md bg-petrol p-5 text-white [animation-delay:900ms]">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-lime">
            <Bot className="size-3.5" /> Programada por Kizuna
          </span>
          <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs">
            <Check className="size-3" strokeWidth={3} /> Confirmada
          </span>
        </div>
        <p className="mt-3 font-display text-2xl font-bold">María F. Ríos</p>
        <p className="text-sm text-white/70">Control de hipertensión</p>
        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-white/10 pt-3 text-sm">
          <div>
            <p className="text-xs text-white/50">Cuándo</p>
            <p className="font-semibold">Jue 9 oct · 8:20 a. m.</p>
          </div>
          <div>
            <p className="text-xs text-white/50">Con</p>
            <p className="font-semibold">Dr. Andrés Ruiz</p>
          </div>
        </div>
      </div>
    </div>
  );
}
