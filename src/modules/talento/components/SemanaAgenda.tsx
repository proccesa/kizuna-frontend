import { cn } from '@/lib/cn';
import { DIAS_SEMANA } from '@/lib/horario';

export interface BloqueSemana {
  id: number | string;
  dias: number[];
  inicio: string;
  fin: string;
  titulo: string;
  detalle?: string;
  /** Clave estable para el color (p. ej. el id de la especialidad). */
  tono?: number;
  atenuado?: boolean;
  onClick?: () => void;
}

const TONOS = [
  'bg-mist text-mist-ink border-petrol/15',
  'bg-lime-soft text-lime-ink border-lime-ink/15',
  'bg-mint-soft text-mint-ink border-mint-ink/15',
  'bg-sand text-body border-line-strong',
  'bg-petrol text-white border-petrol',
];

const ALTO_HORA = 44;
const aMinutos = (hora: string) => {
  const [h, m] = hora.split(':').map(Number);
  return h! * 60 + m!;
};

/** Asigna carriles a los bloques que se superponen en un mismo día. */
function carriles(bloques: BloqueSemana[]) {
  const ordenados = [...bloques].sort((a, b) => aMinutos(a.inicio) - aMinutos(b.inicio));
  const finPorCarril: number[] = [];
  const asignados = ordenados.map((b) => {
    let carril = finPorCarril.findIndex((fin) => fin <= aMinutos(b.inicio));
    if (carril === -1) carril = finPorCarril.length;
    finPorCarril[carril] = aMinutos(b.fin);
    return { bloque: b, carril };
  });
  return { asignados, total: Math.max(1, finPorCarril.length) };
}

interface SemanaAgendaProps {
  bloques: BloqueSemana[];
  /** Días a mostrar; por defecto lunes a sábado, y el domingo si hay franjas. */
  dias?: number[];
  className?: string;
}

/** Vista semanal de franjas de agenda, con las horas en el eje vertical. */
export function SemanaAgenda({ bloques, dias, className }: SemanaAgendaProps) {
  const visibles = dias ?? [1, 2, 3, 4, 5, 6, ...(bloques.some((b) => b.dias.includes(7)) ? [7] : [])];
  const inicio = Math.min(7, ...bloques.map((b) => Math.floor(aMinutos(b.inicio) / 60)));
  const fin = Math.max(18, ...bloques.map((b) => Math.ceil(aMinutos(b.fin) / 60)));
  const horas = Array.from({ length: fin - inicio }, (_, i) => inicio + i);

  return (
    <div className={cn('overflow-x-auto', className)}>
      <div className="grid min-w-[40rem]" style={{ gridTemplateColumns: `3.25rem repeat(${visibles.length}, minmax(0, 1fr))` }}>
        <div />
        {visibles.map((d) => (
          <div key={d} className="pb-2 text-center text-xs font-semibold text-muted">
            {DIAS_SEMANA.find((x) => x.value === d)?.nombre}
          </div>
        ))}

        <div className="relative" style={{ height: horas.length * ALTO_HORA }}>
          {horas.map((h, i) => (
            <span key={h} className="tabular absolute right-2 -translate-y-1/2 text-[0.7rem] text-subtle" style={{ top: i * ALTO_HORA }}>
              {String(h).padStart(2, '0')}:00
            </span>
          ))}
        </div>

        {visibles.map((d) => {
          const { asignados, total } = carriles(bloques.filter((b) => b.dias.includes(d)));
          return (
            <div
              key={d}
              className="relative border-l border-line"
              style={{
                height: horas.length * ALTO_HORA,
                backgroundImage: `repeating-linear-gradient(to bottom, var(--color-line) 0 1px, transparent 1px ${ALTO_HORA}px)`,
              }}
            >
              {asignados.map(({ bloque, carril }) => {
                const top = ((aMinutos(bloque.inicio) - inicio * 60) / 60) * ALTO_HORA;
                const alto = ((aMinutos(bloque.fin) - aMinutos(bloque.inicio)) / 60) * ALTO_HORA;
                const Etiqueta = bloque.onClick ? 'button' : 'div';
                return (
                  <Etiqueta
                    key={`${bloque.id}-${d}`}
                    type={bloque.onClick ? 'button' : undefined}
                    onClick={bloque.onClick}
                    title={`${bloque.titulo} · ${bloque.inicio}–${bloque.fin}${bloque.detalle ? ` · ${bloque.detalle}` : ''}`}
                    className={cn(
                      'absolute flex flex-col justify-start overflow-hidden rounded-xl rounded-bl-none border px-2 py-1.5 text-left text-xs leading-tight',
                      TONOS[(bloque.tono ?? 0) % TONOS.length],
                      bloque.onClick && 'cursor-pointer transition-[filter] hover:brightness-95',
                      bloque.atenuado && 'opacity-50',
                    )}
                    style={{ top: top + 2, height: Math.max(alto - 4, 18), left: `calc(${(carril / total) * 100}% + 3px)`, width: `calc(${100 / total}% - 6px)` }}
                  >
                    <span className="block truncate font-semibold">{bloque.titulo}</span>
                    {alto >= 40 && <span className="tabular block truncate opacity-80">{bloque.inicio}–{bloque.fin}</span>}
                    {alto >= 60 && bloque.detalle && <span className="block truncate opacity-80">{bloque.detalle}</span>}
                  </Etiqueta>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
