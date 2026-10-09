import { useState } from 'react';
import { AlertTriangle, Baby, Check, ChevronDown, Stethoscope, Syringe, X } from 'lucide-react';
import { Badge, Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import type { Cirugia } from '../types';

interface CirugiaCardProps {
  cirugia: Cirugia;
  onQuitar?: () => void;
  onRealizar?: () => void;
  onCancelar?: () => void;
}

/** Una cirugía en el programa: hora, paciente, procedimiento, equipo humano y por qué va en ese lugar. */
export function CirugiaCard({ cirugia: c, onQuitar, onRealizar, onCancelar }: CirugiaCardProps) {
  const [abierta, setAbierta] = useState(false);
  const avisos = c.avisos ?? [];
  const factores = c.prioridad?.factores ?? [];

  return (
    <div className={cn('rounded-2xl rounded-bl-md border bg-surface p-3.5 text-sm', c.estado === 'REALIZADA' ? 'border-success/30 bg-success-soft/40' : 'border-line')}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="tabular font-display text-base font-bold whitespace-nowrap text-ink">
            {c.hora_inicio}–{c.hora_fin}
          </p>
          <p className="truncate font-semibold text-ink">{c.paciente.nombre_completo}</p>
          <p className="tabular truncate text-xs text-muted">
            {c.paciente.tipo_documento?.codigo} {c.paciente.numero_documento} · {c.paciente.edad} años
            {c.orden.contrato?.entidad && ` · ${c.orden.contrato.entidad.sigla || c.orden.contrato.entidad.razon_social}`}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {c.orden.prioridad === 'PRIORITARIA' && <Badge tone="warning">Prioritaria</Badge>}
          {c.prioridad?.temprano && (
            <Badge tone="lime">
              <Baby className="size-3" aria-hidden /> {c.prioridad.temprano}
            </Badge>
          )}
          {c.estado === 'REALIZADA' && <Badge tone="success">Realizada</Badge>}
        </div>
      </div>
      <p className="mt-2 text-xs text-body">
        <span className="tabular font-display font-bold text-ink">{c.cups.codigo}</span> · {c.cups.nombre.toLowerCase()}
      </p>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
        <span className="flex items-center gap-1">
          <Stethoscope className="size-3.5" aria-hidden /> {c.cirujano.nombre_completo}
        </span>
        {c.anestesiologo && (
          <span className="flex items-center gap-1">
            <Syringe className="size-3.5" aria-hidden /> {c.anestesiologo.nombre_completo}
          </span>
        )}
      </div>
      {avisos.length > 0 && (
        <ul className="mt-2 space-y-1">
          {avisos.map((a) => (
            <li key={a} className="flex gap-1.5 text-xs font-medium text-warning">
              <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden /> {a}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex items-center justify-between gap-2">
        <button type="button" onClick={() => setAbierta((v) => !v)} aria-expanded={abierta} className="flex cursor-pointer items-center gap-1 text-xs font-semibold text-petrol hover:underline">
          Prioridad {formatNumber(c.puntaje)} <ChevronDown className={cn('size-3.5 transition-transform', abierta && 'rotate-180')} aria-hidden />
        </button>
        <span className="flex gap-1">
          {onQuitar && <Button size="sm" variant="ghost" iconOnly icon={X} aria-label={`Quitar a ${c.paciente.nombre_completo} de la propuesta`} onClick={onQuitar} />}
          {onCancelar && <Button size="sm" variant="ghost" iconOnly icon={X} aria-label={`Cancelar cirugía de ${c.paciente.nombre_completo}`} onClick={onCancelar} />}
          {onRealizar && (
            <Button size="sm" variant="secondary" icon={Check} onClick={onRealizar}>
              Realizada
            </Button>
          )}
        </span>
      </div>
      {abierta && (
        <ul className="mt-2 space-y-0.5 rounded-xl bg-cream px-3 py-2 text-xs text-body">
          {factores.length === 0 && <li>Sin factores adicionales.</li>}
          {factores.map((f) => (
            <li key={f.etiqueta} className="flex justify-between gap-2">
              <span>{f.etiqueta}</span>
              <span className="tabular font-semibold">+{formatNumber(f.puntos)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
