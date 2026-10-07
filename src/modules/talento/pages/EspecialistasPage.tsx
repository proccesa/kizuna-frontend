import { Download, Upload } from 'lucide-react';
import { Avatar, Badge, Card, DemoBanner, PageHeader, Progress, StatusBadge } from '@/components/ui';
import { ESPECIALISTAS, especialidadDe, sedeDe } from '@/demo/datos';
import { accionDemo } from '@/lib/demo';
import { cn } from '@/lib/cn';

export function EspecialistasPage() {
  const activos = ESPECIALISTAS.filter((e) => e.activo);
  const horas = activos.reduce((s, e) => s + e.horasSemana, 0);

  return (
    <>
      <PageHeader
        title="Especialistas"
        description="Los profesionales que atienden, su especialidad, en qué sedes y cuántas horas de agenda ofrecen. Son el cupo con el que Kizuna programa."
      />
      <DemoBanner />

      <div className="mb-6 grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <button
          type="button"
          onClick={accionDemo('Cargue masivo de especialistas')}
          className="animate-enter flex cursor-pointer items-center gap-4 rounded-[var(--radius-card)] border-2 border-dashed border-line-strong bg-surface px-6 py-5 text-left transition-colors hover:border-petrol/40 hover:bg-cream/50"
        >
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-mist text-mist-ink">
            <Upload className="size-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="block font-display text-lg font-bold text-ink">Cargue masivo de personal</span>
            <span className="block text-sm text-muted">Sube un .xlsx con documento, registro, especialidad, sedes y horario de cada profesional.</span>
          </span>
          <span className="hidden items-center gap-1.5 text-sm font-semibold text-petrol underline-offset-2 hover:underline sm:flex">
            <Download className="size-4" aria-hidden /> Plantilla
          </span>
        </button>
        <Card className="animate-enter grid grid-cols-2 divide-x divide-line">
          <div className="p-5">
            <p className="text-sm font-semibold text-muted">Profesionales activos</p>
            <p className="tabular mt-1 font-display text-3xl font-bold text-ink">{activos.length}</p>
          </div>
          <div className="p-5">
            <p className="text-sm font-semibold text-muted">Horas de agenda por semana</p>
            <p className="tabular mt-1 font-display text-3xl font-bold text-ink">{horas}</p>
          </div>
        </Card>
      </div>

      <Card className="animate-enter overflow-hidden">
        <div className="hidden grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_9rem_6rem] gap-6 border-b border-line bg-cream/60 px-5 py-2.5 text-xs font-semibold text-muted lg:grid">
          <span>Profesional</span>
          <span>Especialidad</span>
          <span>Sedes</span>
          <span>Ocupación semanal</span>
          <span>Estado</span>
        </div>
        <ul className="divide-y divide-line">
          {ESPECIALISTAS.map((e) => (
            <li key={e.id} className={cn('flex flex-col gap-3 px-5 py-4 lg:grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,1.2fr)_9rem_6rem] lg:items-center lg:gap-6', !e.activo && 'opacity-60')}>
              <span className="flex min-w-0 items-center gap-3">
                <Avatar name={e.nombre} size="sm" />
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink">{e.nombre}</span>
                  <span className="tabular block truncate text-xs text-muted">
                    {e.registro} · {e.documento}
                  </span>
                </span>
              </span>
              <span className="flex flex-wrap gap-1">
                {e.especialidades.map((id) => (
                  <Badge key={id} tone="mist">
                    {especialidadDe(id)?.nombre}
                  </Badge>
                ))}
              </span>
              <span className="text-sm text-body">{e.sedes.map((id) => sedeDe(id)?.nombre).join(' · ')}</span>
              <span>
                <span className="tabular mb-1 flex justify-between text-xs text-muted">
                  <span>{e.horasSemana} h</span>
                  <span className={cn(e.ocupacion >= 90 && 'font-semibold text-warning')}>{e.ocupacion}%</span>
                </span>
                <Progress value={e.ocupacion} tone={e.ocupacion >= 90 ? 'warning' : 'petrol'} label={`Ocupación de ${e.nombre}`} />
              </span>
              <StatusBadge value={e.activo ? 'active' : 'inactive'} />
            </li>
          ))}
        </ul>
      </Card>
    </>
  );
}
