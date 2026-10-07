import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, Bot, CalendarCheck2, Check, Play, UserRound } from 'lucide-react';
import { Avatar, Badge, Button, Card, DemoBanner, ESTADOS_CITA, PageHeader, StatusPill, type EstadoCita } from '@/components/ui';
import {
  CITAS,
  CORRIDA,
  PENDIENTES,
  contratoDe,
  cupsDe,
  entidadDe,
  especialidadDe,
  especialistaDe,
  sedeDe,
  type Cita,
  type Pendiente,
} from '@/demo/datos';
import { cn } from '@/lib/cn';
import { accionDemo } from '@/lib/demo';
import { notify } from '@/lib/toast';
import { ModalidadBadge } from '@/modules/contratacion/components/ModalidadBadge';

const DIAS = ['Lun 6', 'Mar 7', 'Mié 8', 'Jue 9', 'Vie 10'];

function CitaCard({ cita }: { cita: Cita }) {
  const cups = cupsDe(cita.cups);
  const contrato = contratoDe(cita.contratoId);
  return (
    <div className="rounded-2xl rounded-bl-md border border-line bg-surface p-3 text-sm shadow-card">
      <div className="flex items-center justify-between gap-2">
        <span className="tabular font-display text-base font-bold text-ink">{cita.hora}</span>
        <StatusPill estado={cita.estado === 'Confirmada' ? 'confirmada' : 'programada'} compact />
      </div>
      <p className="mt-1 font-semibold text-ink">{cita.paciente}</p>
      <p className="text-xs text-muted">
        {cups?.corto} · <span className="tabular">{cita.cups}</span>
      </p>
      <div className="mt-2 flex items-center gap-1.5 text-xs">
        <span className="font-semibold text-body">{entidadDe(cita.contratoId)?.sigla}</span>
        {contrato && <ModalidadBadge modalidad={contrato.modalidad} />}
        {cita.origen === 'Automática' && (
          <span className="ml-auto flex items-center gap-1 text-mist-ink" title="Programada automáticamente por Kizuna">
            <Bot className="size-3.5" aria-hidden />
            <span className="sr-only">Programada por Kizuna</span>
          </span>
        )}
      </div>
    </div>
  );
}

function PendienteCard({ pendiente, onAceptar }: { pendiente: Pendiente; onAceptar: () => void }) {
  const sug = pendiente.sugerencia;
  const especialista = sug && especialistaDe(sug.especialistaId);
  return (
    <li className="p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-semibold text-ink">{pendiente.paciente}</p>
          <p className="tabular text-xs text-muted">
            {pendiente.documento} ·{' '}
            <span className={cn('font-semibold', pendiente.prioridad === 'Alta' ? 'text-danger' : 'text-muted')}>
              prioridad {pendiente.prioridad.toLowerCase()}
            </span>
          </p>
        </div>
        <StatusPill estado={sug ? 'pendiente' : 'bloqueada'} />
      </div>
      <p className="mt-2 text-sm text-body">{pendiente.motivo}</p>
      <p className="mt-0.5 text-xs text-muted">
        {cupsDe(pendiente.cups)?.corto} · <span className="tabular">{pendiente.cups}</span> · {entidadDe(pendiente.contratoId)?.nombre}
      </p>

      {sug && especialista ? (
        <div className="mt-3 rounded-xl bg-cream p-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-mist-ink">
            <Bot className="size-3.5" aria-hidden /> Sugerencia de Kizuna
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            {sug.dia} · <span className="tabular">{sug.hora}</span>
          </p>
          <p className="text-xs text-muted">
            {especialista.nombre} · {sedeDe(sug.sedeId)?.nombre}
          </p>
          <div className="mt-3 flex gap-2">
            <Button size="sm" icon={Check} onClick={onAceptar}>
              Programar
            </Button>
            <Button size="sm" variant="secondary" onClick={accionDemo('Elegir otro cupo')}>
              Otro cupo
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-xl border border-danger/20 bg-danger-soft p-3 text-sm text-danger">
          <p className="flex items-start gap-1.5 font-semibold">
            <Ban className="mt-0.5 size-4 shrink-0" aria-hidden /> Sin cupo posible
          </p>
          <p className="mt-0.5 text-xs">{pendiente.bloqueo}</p>
          <Link to="/especialidades" className="mt-2 inline-block text-xs font-semibold underline">
            Resolver en CUPS y especialidades
          </Link>
        </div>
      )}
    </li>
  );
}

export function ProgramacionPage() {
  const [pendientes, setPendientes] = useState(PENDIENTES);
  const [programadosExtra, setProgramadosExtra] = useState(0);
  const [dia, setDia] = useState(DIAS[0]);

  const programados = CORRIDA.programados + programadosExtra;
  const evaluados = CORRIDA.evaluados;
  const tasa = Math.round((programados / evaluados) * 100);

  const especialistasDelDia = [...new Set(CITAS.map((c) => c.especialistaId))].map((id) => especialistaDe(id)!);

  const aceptar = (p: Pendiente) => {
    setPendientes((list) => list.filter((x) => x.id !== p.id));
    setProgramadosExtra((n) => n + 1);
    notify.success(`${p.paciente} quedó programada (ejemplo).`);
  };

  return (
    <>
      <PageHeader
        title="Programación"
        description="Kizuna revisa cada población contra sus contratos, servicios CUPS y agendas disponibles, y programa a los pacientes automáticamente."
        actions={
          <Button variant="mint" icon={Play} onClick={accionDemo('Ejecutar programación')}>
            Ejecutar ahora
          </Button>
        }
      />
      <DemoBanner />

      {/* Resultado de la última corrida */}
      <Card className="animate-enter mb-6 overflow-hidden">
        <div className="grid gap-6 p-6 lg:grid-cols-[1fr_2fr] lg:items-center">
          <div className="flex items-center gap-4">
            <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl rounded-bl-md bg-petrol text-white">
              <CalendarCheck2 className="size-6" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold text-muted">Programación automática</p>
              <p className="font-display text-lg font-bold text-ink">Hoy, {CORRIDA.hora}</p>
            </div>
          </div>
          <div>
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Pacientes evaluados', value: evaluados, tone: 'text-ink' },
                { label: 'Programados', value: programados, tone: 'text-success' },
                { label: 'Por resolver', value: pendientes.length + (CORRIDA.pendientes - PENDIENTES.length), tone: 'text-warning' },
              ].map((s) => (
                <div key={s.label}>
                  <p className={cn('tabular font-display text-3xl leading-none font-bold', s.tone)}>{s.value}</p>
                  <p className="mt-1 text-xs text-muted">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-4 flex h-2.5 overflow-hidden rounded-full bg-lime-soft" aria-label={`${tasa}% programado`}>
              <div className="h-full bg-success transition-[width] duration-700" style={{ width: `${tasa}%` }} />
            </div>
            <p className="tabular mt-1.5 text-xs text-muted">{tasa}% de los pacientes evaluados quedó con cita sin intervención manual.</p>
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem]">
        {/* Agenda */}
        <Card className="animate-enter min-w-0 overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold">Agenda de la semana</h2>
            <div className="flex gap-1" role="tablist" aria-label="Día">
              {DIAS.map((d) => (
                <button
                  key={d}
                  type="button"
                  role="tab"
                  aria-selected={d === dia}
                  onClick={() => setDia(d)}
                  className={cn(
                    'cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold transition-colors',
                    d === dia ? 'bg-petrol text-white' : 'text-body hover:bg-sand',
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="grid min-w-[64rem] grid-cols-5 divide-x divide-line">
              {especialistasDelDia.map((esp) => (
                <div key={esp.id} className="flex flex-col">
                  <div className="flex items-center gap-2.5 border-b border-line bg-cream/60 px-3 py-3">
                    <Avatar name={esp.nombre} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">{esp.nombre.split(' ').slice(0, 2).join(' ')}</p>
                      <p className="truncate text-xs text-muted">{especialidadDe(esp.especialidades[0]!)?.nombre}</p>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col gap-2 p-2.5">
                    {dia === DIAS[0] ? (
                      CITAS.filter((c) => c.especialistaId === esp.id).map((c) => <CitaCard key={c.id} cita={c} />)
                    ) : (
                      <p className="px-1 py-6 text-center text-xs text-muted">Cupos disponibles</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line bg-cream/60 px-5 py-3 text-xs text-muted">
            {(Object.keys(ESTADOS_CITA) as EstadoCita[]).map((estado) => (
              <StatusPill key={estado} estado={estado} />
            ))}
            <span className="flex items-center gap-1.5 text-mist-ink">
              <Bot className="size-3.5" aria-hidden /> Programada por Kizuna
            </span>
          </div>
        </Card>

        {/* Por programar */}
        <Card className="animate-enter self-start overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="text-lg font-bold">Por programar</h2>
            <Badge tone="warning">{pendientes.length}</Badge>
          </div>
          {pendientes.length ? (
            <ul className="divide-y divide-line">
              {pendientes.map((p) => (
                <PendienteCard key={p.id} pendiente={p} onAceptar={() => aceptar(p)} />
              ))}
            </ul>
          ) : (
            <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
              <UserRound className="size-6 text-success" aria-hidden />
              <p className="font-semibold text-ink">Todo programado</p>
              <p className="text-sm text-muted">No quedan pacientes en cola.</p>
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
