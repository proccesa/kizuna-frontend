import { useState } from 'react';
import { CalendarOff, CalendarPlus, Pencil, Plus, Trash2 } from 'lucide-react';
import { Avatar, Badge, Button, ConfirmDialog, Drawer, EmptyState, FilterTabs, Skeleton, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDate } from '@/lib/format';
import { formatearDias } from '@/lib/horario';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useEspecialista, useTalentoMutations } from '../hooks/useTalento';
import { hoyISO } from '../schema';
import { TIPOS_AUSENCIA, type Agenda, type Ausencia, type Especialista } from '../types';
import { AgendaModal } from './AgendaModal';
import { AusenciaModal } from './AusenciaModal';
import { EspecialistaForm } from './EspecialistaForm';
import { SemanaAgenda } from './SemanaAgenda';

type Pestana = 'agenda' | 'novedades' | 'datos';

interface EspecialistaDrawerProps {
  /** Id del especialista, `'nuevo'` para crear o `null` si está cerrado. */
  abierto: number | 'nuevo' | null;
  onAbrir: (id: number) => void;
  onClose: () => void;
}

export function EspecialistaDrawer({ abierto, onAbrir, onClose }: EspecialistaDrawerProps) {
  const creando = abierto === 'nuevo';
  const id = typeof abierto === 'number' ? abierto : null;
  const { data: especialista, isLoading } = useEspecialista(id);
  const [pestana, setPestana] = useState<Pestana>('agenda');

  return (
    <Drawer
      open={abierto !== null}
      onClose={onClose}
      width="lg"
      hideTitle={!creando}
      title={creando ? 'Nuevo especialista' : (especialista?.nombre_completo ?? 'Especialista')}
    >
      {creando ? (
        <EspecialistaForm
          especialista={null}
          onCancelar={onClose}
          onGuardado={(e) => {
            setPestana('agenda');
            onAbrir(e.id);
          }}
        />
      ) : isLoading || !especialista ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-16" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <Detalle especialista={especialista} pestana={pestana} onPestana={setPestana} />
      )}
    </Drawer>
  );
}

function Detalle({ especialista, pestana, onPestana }: { especialista: Especialista; pestana: Pestana; onPestana: (p: Pestana) => void }) {
  const { can } = useAuth();
  const puedeGestionar = can(PERMISOS.agendas.gestionar) && !especialista.deleted_at;
  const hoy = hoyISO();
  const ausenteHoy = especialista.ausencias?.find((a) => a.fecha_inicio <= hoy && a.fecha_fin >= hoy);

  return (
    <>
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-start gap-4 pr-10">
          <Avatar name={especialista.nombre_completo} size="lg" />
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight font-bold text-ink">{especialista.nombre_completo}</h2>
            <p className="tabular mt-0.5 text-sm text-muted">
              {especialista.tipo_documento?.codigo} {especialista.numero_documento}
              {especialista.registro_profesional && ` · Registro ${especialista.registro_profesional}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge value={especialista.deleted_at ? 'deleted' : especialista.activo ? 'active' : 'inactive'} />
              {ausenteHoy && <Badge tone="warning">{TIPOS_AUSENCIA.find((t) => t.value === ausenteHoy.tipo)?.label} hasta {formatDate(ausenteHoy.fecha_fin)}</Badge>}
              {especialista.especialidades.map((e) => (
                <Badge key={e.id} tone="mist">
                  {e.nombre}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <FilterTabs
          aria-label="Secciones del especialista"
          className="mt-5"
          value={pestana}
          onChange={onPestana}
          tabs={[
            { value: 'agenda', label: 'Agenda', count: especialista.agendas.length },
            { value: 'novedades', label: 'Novedades', count: especialista.ausencias?.length },
            ...(can(PERMISOS.especialistas.editar) && !especialista.deleted_at ? [{ value: 'datos' as const, label: 'Datos' }] : []),
          ]}
        />
      </header>
      <div className="border-t border-line">
        {pestana === 'agenda' && <PestanaAgenda especialista={especialista} puedeGestionar={puedeGestionar} />}
        {pestana === 'novedades' && <PestanaNovedades especialista={especialista} puedeGestionar={puedeGestionar} />}
        {pestana === 'datos' && <EspecialistaForm especialista={especialista} onGuardado={() => onPestana('agenda')} onCancelar={() => onPestana('agenda')} />}
      </div>
    </>
  );
}

function vigente(a: Agenda, hoy: string) {
  return a.activo && (!a.vigente_hasta || a.vigente_hasta >= hoy);
}

function PestanaAgenda({ especialista, puedeGestionar }: { especialista: Especialista; puedeGestionar: boolean }) {
  const { eliminarAgenda } = useTalentoMutations();
  const [modal, setModal] = useState<{ open: boolean; agenda: Agenda | null }>({ open: false, agenda: null });
  const [eliminar, setEliminar] = useState<Agenda | null>(null);
  const hoy = hoyISO();
  const vigentes = especialista.agendas.filter((a) => vigente(a, hoy));
  const nueva = () => setModal({ open: true, agenda: null });

  return (
    <div className="p-6">
      {especialista.agendas.length === 0 ? (
        <EmptyState
          className="py-10"
          title="Sin agenda"
          description="Kizuna no puede programar pacientes con este profesional hasta que tenga al menos una franja."
          action={puedeGestionar && <Button icon={CalendarPlus} onClick={nueva}>Agregar franja</Button>}
        />
      ) : (
        <>
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-body">
              <span className="tabular font-display text-xl font-bold text-ink">{especialista.horas_semana.toLocaleString('es-CO')} h</span> por semana en{' '}
              {especialista.sedes.length === 1 ? '1 sede' : `${especialista.sedes.length} sedes`}
            </p>
            {puedeGestionar && (
              <Button size="sm" icon={Plus} onClick={nueva}>
                Agregar franja
              </Button>
            )}
          </div>
          <SemanaAgenda
            className="mb-6"
            bloques={vigentes.map((a) => ({
              id: a.id,
              dias: a.dias,
              inicio: a.hora_inicio,
              fin: a.hora_fin,
              titulo: a.sede?.nombre ?? 'Sede',
              detalle: a.especialidad?.nombre,
              tono: a.especialidad_id,
              onClick: puedeGestionar ? () => setModal({ open: true, agenda: a }) : undefined,
            }))}
          />
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {especialista.agendas.map((a) => {
              const esVigente = vigente(a, hoy);
              return (
                <li key={a.id} className={cn('flex items-center gap-3 px-4 py-3', !esVigente && 'opacity-60')}>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">
                      {formatearDias(a.dias)} · <span className="tabular">{a.hora_inicio}–{a.hora_fin}</span>
                    </p>
                    <p className="truncate text-xs text-muted">
                      {a.sede?.nombre} · {a.especialidad?.nombre}
                      {a.consultorio && ` · Consultorio ${a.consultorio}`} · {a.vigente_hasta ? `del ${formatDate(a.vigente_desde)} al ${formatDate(a.vigente_hasta)}` : `desde ${formatDate(a.vigente_desde)}`}
                    </p>
                  </div>
                  {!a.activo ? <Badge>Inactiva</Badge> : !esVigente && <Badge>Terminada</Badge>}
                  {puedeGestionar && (
                    <span className="flex shrink-0 gap-1">
                      <Button size="sm" variant="ghost" iconOnly icon={Pencil} aria-label="Editar franja" onClick={() => setModal({ open: true, agenda: a })} />
                      <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label="Eliminar franja" onClick={() => setEliminar(a)} />
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <AgendaModal open={modal.open} agenda={modal.agenda} especialista={especialista} onClose={() => setModal({ open: false, agenda: null })} />
      <ConfirmDialog
        open={!!eliminar}
        title="Eliminar franja"
        message={eliminar ? `Se eliminará la franja de ${formatearDias(eliminar.dias)} de ${eliminar.hora_inicio} a ${eliminar.hora_fin} en ${eliminar.sede?.nombre}. Si solo cambia por un tiempo, mejor ponle fecha de fin.` : ''}
        confirmLabel="Eliminar"
        isLoading={eliminarAgenda.isPending}
        onConfirm={async () => {
          if (eliminar) await eliminarAgenda.mutateAsync(eliminar.id).catch(() => undefined);
          setEliminar(null);
        }}
        onClose={() => setEliminar(null)}
      />
    </div>
  );
}

function PestanaNovedades({ especialista, puedeGestionar }: { especialista: Especialista; puedeGestionar: boolean }) {
  const { eliminarAusencia } = useTalentoMutations();
  const [modal, setModal] = useState(false);
  const [eliminar, setEliminar] = useState<Ausencia | null>(null);
  const ausencias = especialista.ausencias ?? [];
  const hoy = hoyISO();

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Vacaciones, incapacidades y otros días sin atención. Kizuna no programa citas en estas fechas.</p>
        {puedeGestionar && (
          <Button size="sm" variant="secondary" icon={CalendarOff} onClick={() => setModal(true)} className="shrink-0">
            Registrar
          </Button>
        )}
      </div>
      {ausencias.length === 0 ? (
        <p className="rounded-2xl bg-cream px-4 py-8 text-center text-sm text-muted">Sin novedades recientes ni programadas.</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {ausencias.map((a) => {
            const enCurso = a.fecha_inicio <= hoy && a.fecha_fin >= hoy;
            const pasada = a.fecha_fin < hoy;
            return (
              <li key={a.id} className={cn('flex items-center gap-3 px-4 py-3', pasada && 'opacity-60')}>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{TIPOS_AUSENCIA.find((t) => t.value === a.tipo)?.label}</p>
                  <p className="text-xs text-muted">
                    {a.fecha_inicio === a.fecha_fin ? formatDate(a.fecha_inicio) : `${formatDate(a.fecha_inicio)} – ${formatDate(a.fecha_fin)}`}
                    {a.observacion && ` · ${a.observacion}`}
                  </p>
                </div>
                {enCurso && <Badge tone="warning">En curso</Badge>}
                {pasada && <Badge>Terminada</Badge>}
                {puedeGestionar && <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label="Eliminar novedad" onClick={() => setEliminar(a)} />}
              </li>
            );
          })}
        </ul>
      )}

      <AusenciaModal open={modal} especialista={especialista} onClose={() => setModal(false)} />
      <ConfirmDialog
        open={!!eliminar}
        title="Eliminar novedad"
        message="Kizuna volverá a programar citas con este profesional en esas fechas."
        confirmLabel="Eliminar"
        isLoading={eliminarAusencia.isPending}
        onConfirm={async () => {
          if (eliminar) await eliminarAusencia.mutateAsync(eliminar.id).catch(() => undefined);
          setEliminar(null);
        }}
        onClose={() => setEliminar(null)}
      />
    </div>
  );
}
