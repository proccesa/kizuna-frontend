import { cn } from '@/lib/cn';
import { DIAS_SEMANA } from '@/lib/horario';

interface DiasSelectorProps {
  value: number[];
  onChange: (dias: number[]) => void;
  /** Días que se pueden elegir (p. ej. los que atiende la sede). Por defecto, todos. */
  permitidos?: number[];
  'aria-label': string;
}

/** Selector de días de la semana en botones L M X J V S D. */
export function DiasSelector({ value, onChange, permitidos, ...aria }: DiasSelectorProps) {
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label={aria['aria-label']}>
      {DIAS_SEMANA.map((dia) => {
        const activo = value.includes(dia.value);
        const deshabilitado = !!permitidos && !permitidos.includes(dia.value) && !activo;
        return (
          <button
            key={dia.value}
            type="button"
            aria-pressed={activo}
            disabled={deshabilitado}
            title={deshabilitado ? `${dia.nombre}: la sede no atiende` : dia.nombre}
            onClick={() => onChange(activo ? value.filter((d) => d !== dia.value) : [...value, dia.value])}
            className={cn(
              'size-10 cursor-pointer rounded-xl text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-35',
              activo ? 'bg-petrol text-white' : 'border border-line-strong bg-surface text-muted hover:text-ink',
            )}
          >
            {dia.corto}
          </button>
        );
      })}
    </div>
  );
}
