import { AlertTriangle, Ban, CalendarCheck2, Info, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { CONCEPTOS, ROMANO } from '@/modules/cirugia/types';
import type { Respuestas, ResultadoPreanestesia } from '../types';

const NIVEL = {
  bloqueo: { icono: Ban, clase: 'bg-danger-soft text-danger' },
  aviso: { icono: AlertTriangle, clase: 'bg-warning-soft text-warning' },
  info: { icono: Info, clase: 'bg-mist text-mist-ink' },
} as const;

const sumarDias = (base: Date, dias: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

interface PanelAsistenteProps {
  resultado: ResultadoPreanestesia | null;
  respuestas: Respuestas;
  /** Fecha de la valoración (finalizada) o null si aún es borrador (se usa hoy). */
  fechaValoracion: string | null;
  tieneOrden: boolean;
}

/** Escalas calculadas, alertas y el efecto del concepto sobre la programación. Todo se recalcula al guardar. */
export function PanelAsistente({ resultado, respuestas, fechaValoracion, tieneOrden }: PanelAsistenteProps) {
  const r = resultado;
  const alertas = r?.alertas ?? [];
  const concepto = respuestas.concepto as string | undefined;
  const apto = concepto === 'APTO' || concepto === 'APTO_CON_RECOMENDACIONES';
  const base = fechaValoracion ? new Date(fechaValoracion) : new Date();
  const diasSuspension = Number(respuestas.dias_suspension ?? r?.medicamentos?.dias_suspension ?? 0);

  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <p className="flex items-center gap-2 font-display text-base font-bold text-ink">
          <Sparkles className="size-4 text-mint-ink" aria-hidden /> Asistente clínico
        </p>
        <p className="mt-0.5 text-xs text-muted">Escalas y alertas calculadas con lo registrado. Son sugerencias: tú decides.</p>

        <dl className="mt-4 grid grid-cols-2 gap-2">
          <Escala titulo="ASA sugerido" valor={r?.asa_sugerido?.clase ? ROMANO[r.asa_sugerido.clase] : '—'} detalle={r?.asa_sugerido?.razones.slice(0, 2).join(' · ')} />
          <Escala titulo="IMC" valor={r?.imc ? String(r.imc.valor).replace('.', ',') : '—'} detalle={r?.imc?.categoria} tono={(r?.imc?.valor ?? 0) >= 40 ? 'aviso' : undefined} />
          <Escala titulo="RCRI (cardiaco)" valor={r?.rcri ? `${r.rcri.puntos} pts` : '—'} detalle={r?.rcri ? `Riesgo ${r.rcri.riesgo}` : undefined} tono={(r?.rcri?.puntos ?? 0) >= 3 ? 'aviso' : undefined} />
          <Escala
            titulo="STOP-Bang (apnea)"
            valor={r?.stop_bang ? `${r.stop_bang.puntos} pts` : '—'}
            detalle={r?.stop_bang ? `Riesgo ${r.stop_bang.riesgo.toLowerCase()}` : 'Faltan preguntas de sueño'}
            tono={r?.stop_bang?.riesgo === 'ALTO' ? 'aviso' : undefined}
          />
          <Escala titulo="Apfel (NVPO)" valor={r?.apfel ? `${r.apfel.puntos} pts` : '—'} detalle={r?.apfel ? `Riesgo ${r.apfel.riesgo}` : undefined} />
          <Escala
            titulo="Vía aérea"
            valor={r?.via_aerea ? (r.via_aerea.dificil_predicha ? 'Difícil predicha' : 'No predicha') : '—'}
            detalle={r?.via_aerea?.predictores.slice(0, 2).join(' · ')}
            tono={r?.via_aerea?.dificil_predicha ? 'aviso' : undefined}
          />
        </dl>
      </div>

      <div className="rounded-[var(--radius-card)] border border-line bg-surface p-5">
        <p className="font-display text-base font-bold text-ink">Alertas {alertas.length > 0 && <span className="tabular text-sm text-muted">· {alertas.length}</span>}</p>
        {alertas.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Sin alertas con lo registrado hasta ahora.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {alertas.map((a, i) => {
              const { icono: Icono, clase } = NIVEL[a.nivel];
              return (
                <li key={i} className={cn('flex gap-2 rounded-xl px-3 py-2 text-[0.8rem] leading-snug', clase)}>
                  <Icono className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                  <span>{a.mensaje}</span>
                </li>
              );
            })}
          </ul>
        )}
        {(r?.medicamentos?.dias_suspension ?? 0) > 0 && (
          <p className="mt-3 text-xs text-muted">Los días de suspensión son orientativos: confírmalos con el protocolo de la IPS.</p>
        )}
      </div>

      {tieneOrden && (
        <div className={cn('rounded-[var(--radius-card)] p-5', apto ? 'bg-petrol text-white' : 'border border-line bg-surface')}>
          <p className={cn('flex items-center gap-2 font-display text-base font-bold', apto ? 'text-white' : 'text-ink')}>
            <CalendarCheck2 className="size-4" aria-hidden /> Al finalizar
          </p>
          {!concepto ? (
            <p className="mt-2 text-sm text-muted">Elige el concepto para ver qué pasa con la orden de cirugía.</p>
          ) : apto ? (
            <div className="mt-2 space-y-1 text-sm text-white/85">
              <p>
                La orden queda <b className="text-white">{CONCEPTOS[concepto]?.toLowerCase()}</b> con aval hasta el{' '}
                <b className="text-white">{formatDate(sumarDias(base, r?.vigencia_dias ?? 180))}</b> ({r?.vigencia_dias ?? '—'} días por ASA {ROMANO[Number(respuestas.asa ?? r?.asa ?? 0)] || '—'}).
              </p>
              <p>
                La cirugía se puede programar desde el <b className="text-white">{formatDate(sumarDias(base, Math.max(1, diasSuspension)))}</b>
                {diasSuspension > 1 && ` (tras ${diasSuspension} días de suspensión de medicamentos)`}.
              </p>
            </div>
          ) : (
            <p className="mt-2 text-sm text-body">
              La orden queda <b>{CONCEPTOS[concepto]?.toLowerCase()}</b> y Kizuna no programa la cirugía.
              {concepto === 'APLAZADO' && ' Podrás agendar una nueva valoración.'}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function Escala({ titulo, valor, detalle, tono }: { titulo: string; valor: string; detalle?: string; tono?: 'aviso' }) {
  return (
    <div className={cn('rounded-xl px-3 py-2.5', tono === 'aviso' ? 'bg-warning-soft' : 'bg-cream')}>
      <dt className="text-[0.7rem] font-semibold text-muted">{titulo}</dt>
      <dd className={cn('tabular font-display text-lg leading-tight font-bold', tono === 'aviso' ? 'text-warning' : 'text-ink')}>{valor}</dd>
      {detalle && <dd className="mt-0.5 text-[0.7rem] leading-snug text-muted">{detalle}</dd>}
    </div>
  );
}
