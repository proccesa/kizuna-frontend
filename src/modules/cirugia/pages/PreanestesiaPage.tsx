import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, FileText, Stethoscope, UserX, XCircle } from 'lucide-react';
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, Input, PageHeader, Select, Skeleton } from '@/components/ui';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/cn';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useHistoriasMutations } from '@/modules/historias/hooks/useHistorias';
import { useSedes } from '@/modules/red/hooks/useRed';
import { hoyISO } from '@/modules/talento/schema';
import { useCirugiaMutations, useCitas, useReglasPreanestesia } from '../hooks/useCirugia';
import type { Cita } from '../types';

const fechaLarga = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const moverDia = (fecha: string, dias: number) => {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const ESTADO_CITA = {
  PROGRAMADA: { label: 'Programada', tono: 'mist' },
  ATENDIDA: { label: 'Atendida', tono: 'success' },
  CANCELADA: { label: 'Cancelada', tono: 'neutral' },
  NO_ASISTIO: { label: 'No asistió', tono: 'danger' },
} as const;

/** Citas de pre-anestesia del día: el anestesiólogo atiende desde aquí y abre la historia clínica. */
export function PreanestesiaPage() {
  const { can, usuario } = useAuth();
  const navigate = useNavigate();
  const { extras, update } = useListParams(['fecha', 'sede', 'especialista'] as const);
  // Un anestesiólogo con cuenta vinculada ve primero sus propias citas ("todos" muestra las de todos).
  const mio = usuario?.especialista?.id;
  const filtroEspecialista = extras.especialista === 'todos' ? '' : extras.especialista || (mio ? String(mio) : '');
  const fecha = extras.fecha || hoyISO();
  const { data: reglas } = useReglasPreanestesia();
  const { data, isLoading, isFetching } = useCitas({ fecha, tipo: 'PREANESTESIA', sede_id: extras.sede ? Number(extras.sede) : undefined, por_pagina: 200 });
  const { data: sedes } = useSedes({ por_pagina: 100, activo: true });
  const { abrir } = useHistoriasMutations();
  const { cambiarEstadoCita } = useCirugiaMutations();
  const [accion, setAccion] = useState<{ tipo: 'NO_ASISTIO' | 'CANCELADA'; cita: Cita } | null>(null);

  const citas = (data?.datos ?? []).filter((c) => !filtroEspecialista || c.especialista_id === Number(filtroEspecialista));
  const especialistas = [...new Map((data?.datos ?? []).map((c) => [c.especialista_id, c.especialista])).values()];
  const activas = citas.filter((c) => c.estado !== 'CANCELADA');
  const atendidas = citas.filter((c) => c.estado === 'ATENDIDA').length;

  const atender = async (cita: Cita) => {
    if (cita.historia) return navigate(`/historias/${cita.historia.id}`);
    const r = await abrir.mutateAsync({ cita_id: cita.id });
    navigate(`/historias/${r.datos.id}`);
  };

  return (
    <>
      <PageHeader
        title="Agenda de pre-anestesia"
        description={`Citas de valoración pre-anestésica${reglas?.cups_consulta ? ` (CUPS ${reglas.cups_consulta.codigo})` : ''}. Al finalizar la historia, el concepto define si la cirugía se puede programar.`}
      />

      <Card className="animate-enter mb-5 flex flex-col gap-3 p-4 2xl:flex-row 2xl:items-center 2xl:justify-between">
        <div className="flex items-center gap-2">
          <Button variant="secondary" iconOnly icon={ChevronLeft} aria-label="Día anterior" onClick={() => update({ fecha: moverDia(fecha, -1) })} />
          <Input type="date" aria-label="Fecha" value={fecha} onChange={(e) => update({ fecha: e.target.value })} className="h-10 w-40" />
          <Button variant="secondary" iconOnly icon={ChevronRight} aria-label="Día siguiente" onClick={() => update({ fecha: moverDia(fecha, 1) })} />
          {fecha !== hoyISO() && (
            <Button variant="ghost" size="sm" onClick={() => update({ fecha: '' })}>
              Hoy
            </Button>
          )}
          <p className="ml-2 hidden font-display text-lg font-bold whitespace-nowrap text-ink first-letter:uppercase sm:block">{fechaLarga.format(new Date(`${fecha}T00:00:00`))}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            aria-label="Sede"
            value={extras.sede}
            onChange={(e) => update({ sede: e.target.value })}
            placeholder="Todas las sedes"
            options={(sedes?.datos ?? []).map((s) => ({ value: s.id, label: s.nombre }))}
            className="h-10 sm:w-44"
          />
          <Select
            aria-label="Anestesiólogo"
            value={filtroEspecialista || 'todos'}
            onChange={(e) => update({ especialista: e.target.value === 'todos' ? (mio ? 'todos' : '') : e.target.value })}
            options={[
              { value: 'todos', label: 'Todos los anestesiólogos' },
              ...(mio && !especialistas.some((e) => e?.id === mio) ? [{ value: mio, label: `${usuario?.especialista?.nombre_completo} (yo)` }] : []),
              ...especialistas.filter(Boolean).map((e) => ({ value: e!.id, label: e!.id === mio ? `${e!.nombre_completo} (yo)` : e!.nombre_completo })),
            ]}
            className="h-10 sm:w-56"
          />
        </div>
      </Card>

      <Card className="animate-enter overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3 text-sm text-muted">
          <span className="tabular">
            {activas.length} {activas.length === 1 ? 'cita' : 'citas'} · {atendidas} atendidas
          </span>
        </div>
        {isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : citas.length === 0 ? (
          <EmptyState title="Sin citas este día" description="Las citas se asignan solas cuando llega una orden quirúrgica válida. Revisa otro día o las órdenes sin cita." />
        ) : (
          <ul className={cn('divide-y divide-line', isFetching && 'opacity-70')}>
            {citas.map((c) => {
              const estado = ESTADO_CITA[c.estado];
              const historia = c.historia;
              return (
                <li key={c.id} className={cn('flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center', c.estado === 'CANCELADA' && 'opacity-50')}>
                  <div className="tabular w-20 shrink-0 font-display text-lg font-bold text-ink">
                    {c.hora_inicio}
                    <span className="block text-xs font-normal text-muted">{c.hora_fin}</span>
                  </div>
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <Avatar name={c.paciente?.nombre_completo} size="sm" />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-ink">{c.paciente?.nombre_completo}</p>
                      <p className="tabular truncate text-xs text-muted">
                        {c.paciente?.tipo_documento?.codigo} {c.paciente?.numero_documento} · {c.paciente?.edad} años
                        {c.orden?.cups && ` · ${c.orden.cups.codigo} ${c.orden.cups.nombre.toLowerCase()}`}
                      </p>
                      <p className="truncate text-xs text-muted">
                        {c.especialista?.nombre_completo} · {c.sede?.nombre}
                        {c.consultorio && ` · Cons. ${c.consultorio}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {c.orden?.prioridad === 'PRIORITARIA' && <Badge tone="warning">Prioritaria</Badge>}
                    <Badge tone={estado.tono}>{estado.label}</Badge>
                    {historia?.estado === 'BORRADOR' && <Badge tone="lime">Historia en curso</Badge>}
                    {c.estado !== 'CANCELADA' && c.estado !== 'NO_ASISTIO' && (can(PERMISOS.historias.diligenciar) || historia) && (
                      <Button size="sm" icon={historia ? FileText : Stethoscope} variant={historia?.estado === 'FINALIZADA' ? 'secondary' : 'primary'} onClick={() => atender(c)} isLoading={abrir.isPending && abrir.variables?.cita_id === c.id}>
                        {historia?.estado === 'FINALIZADA' ? 'Ver historia' : historia ? 'Continuar' : 'Atender'}
                      </Button>
                    )}
                    {c.estado === 'PROGRAMADA' && !historia && can(PERMISOS.ordenes.gestionar) && (
                      <>
                        <Button size="sm" variant="ghost" iconOnly icon={UserX} aria-label="Registrar inasistencia" onClick={() => setAccion({ tipo: 'NO_ASISTIO', cita: c })} />
                        <Button size="sm" variant="danger-ghost" iconOnly icon={XCircle} aria-label="Cancelar cita" onClick={() => setAccion({ tipo: 'CANCELADA', cita: c })} />
                      </>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={!!accion}
        tone={accion?.tipo === 'CANCELADA' ? 'danger' : 'primary'}
        title={accion?.tipo === 'CANCELADA' ? 'Cancelar cita' : 'Registrar inasistencia'}
        message={
          accion
            ? `${accion.cita.paciente?.nombre_completo} · ${accion.cita.hora_inicio}. La orden de cirugía vuelve a quedar sin cita para que Kizuna busque otro cupo.`
            : ''
        }
        confirmLabel={accion?.tipo === 'CANCELADA' ? 'Cancelar cita' : 'No asistió'}
        isLoading={cambiarEstadoCita.isPending}
        onConfirm={async () => {
          if (accion) await cambiarEstadoCita.mutateAsync({ id: accion.cita.id, estado: accion.tipo, motivo: accion.tipo === 'CANCELADA' ? 'Cancelada desde la agenda' : undefined }).catch(() => undefined);
          setAccion(null);
        }}
        onClose={() => setAccion(null)}
      />
    </>
  );
}
