import { cn } from '@/lib/cn';
import { formatCOPCompact, formatNumber } from '@/lib/format';
import type { Cumplimiento } from '../types';

const pct = (n: number) => `${formatNumber(Math.round(n))} %`;

/**
 * Barra de avance: realizado (sólido), programado (claro) y una marca con lo esperado a la fecha.
 */
export function BarraCumplimiento({ realizado, comprometido, esperado, atrasado, className }: { realizado: number; comprometido?: number; esperado?: number; atrasado?: boolean; className?: string }) {
  const tope = (n: number) => Math.max(0, Math.min(100, n));
  return (
    <div className={cn('relative h-2 overflow-hidden rounded-full bg-line', className)} role="img" aria-label={`${pct(realizado)} realizado${esperado !== undefined ? `, ${pct(esperado)} esperado a la fecha` : ''}`}>
      {comprometido !== undefined && comprometido > realizado && <div className="absolute inset-y-0 left-0 bg-mint/40" style={{ width: `${tope(comprometido)}%` }} />}
      <div className={cn('absolute inset-y-0 left-0 rounded-full', atrasado ? 'bg-warning' : 'bg-mint')} style={{ width: `${tope(realizado)}%` }} />
      {esperado !== undefined && <div className="absolute inset-y-0 w-0.5 bg-ink/60" style={{ left: `calc(${tope(esperado)}% - 1px)` }} />}
    </div>
  );
}

/** Celda compacta para la lista de contratos. */
export function CumplimientoCelda({ cumplimiento: c }: { cumplimiento?: Cumplimiento | null }) {
  if (!c) return <span className="text-muted">—</span>;
  if (c.porcentaje === null) {
    return <span className="tabular text-sm text-body">{formatNumber(c.realizadas)} realizadas</span>;
  }
  return (
    <div className="w-36">
      <p className="flex items-baseline justify-between gap-2 text-sm">
        <span className={cn('tabular font-semibold', c.atrasado ? 'text-warning' : 'text-ink')}>{pct(c.porcentaje)}</span>
        <span className="tabular text-xs text-muted">esperado {pct(c.avance_tiempo)}</span>
      </p>
      <BarraCumplimiento className="mt-1" realizado={c.porcentaje} comprometido={c.porcentaje_comprometido ?? undefined} esperado={c.avance_tiempo} atrasado={c.atrasado} />
    </div>
  );
}

/** Bloque de cumplimiento en el detalle del contrato. */
export function ResumenCumplimiento({ cumplimiento: c }: { cumplimiento: Cumplimiento }) {
  const titulo =
    c.modalidad === 'PGP' ? 'Cumplimiento del PGP' : c.modalidad === 'EVENTO' ? 'Ejecución del contrato' : 'Cirugías realizadas en la vigencia';

  return (
    <section className="mt-3 rounded-2xl bg-cream px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <p className="text-xs font-semibold text-muted">{titulo}</p>
        {c.porcentaje !== null && (
          <p className="tabular text-xs text-muted">
            {pct(c.avance_tiempo)} de la vigencia transcurrido
          </p>
        )}
      </div>
      {c.porcentaje === null ? (
        <p className="tabular mt-1 font-display text-xl font-bold text-ink">
          {formatNumber(c.realizadas)} <span className="text-sm font-semibold text-muted">realizadas · {formatNumber(c.programadas)} programadas</span>
        </p>
      ) : (
        <>
          <p className="tabular mt-1 font-display text-xl font-bold text-ink">
            <span className={c.atrasado ? 'text-warning' : undefined}>{pct(c.porcentaje)}</span>{' '}
            <span className="text-sm font-semibold text-muted">
              {c.modalidad === 'PGP' && c.meta !== null && `${formatNumber(c.realizadas)} de ${formatNumber(c.meta)} cirugías`}
              {c.modalidad === 'EVENTO' && c.meta !== null && `${formatCOPCompact(c.ejecutado ?? 0)} de ${formatCOPCompact(c.meta)}`}
            </span>
          </p>
          <BarraCumplimiento className="mt-2" realizado={c.porcentaje} comprometido={c.porcentaje_comprometido ?? undefined} esperado={c.avance_tiempo} atrasado={c.atrasado} />
          <p className="mt-2 text-xs text-body">
            {c.programadas > 0 && <>Con las {formatNumber(c.programadas)} programadas llega a {pct(c.porcentaje_comprometido ?? c.porcentaje)}. </>}
            {c.atrasado
              ? c.modalidad === 'PGP'
                ? 'Va atrasado frente al tiempo transcurrido: el motor de programación da prioridad a sus pacientes.'
                : 'Va por debajo de lo esperado para el tiempo transcurrido.'
              : 'Va al ritmo esperado.'}
          </p>
        </>
      )}
    </section>
  );
}
