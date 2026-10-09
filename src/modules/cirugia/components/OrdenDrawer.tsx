import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, CalendarClock, CalendarPlus, Check, FileText, RefreshCw, XCircle } from 'lucide-react';
import { Avatar, Badge, Button, Drawer, Modal, Skeleton, Textarea } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useCirugiaMutations, useOrden } from '../hooks/useCirugia';
import { CONCEPTOS, ROMANO, type Orden } from '../types';
import { EstadoOrdenBadge } from './EstadoOrdenBadge';
import { ReprogramarModal } from './ReprogramarModal';

const ORIGEN = { API: 'Integración', CSV: 'Cargue de archivo', MANUAL: 'Registro manual' } as const;
const SEXO = { F: 'F', M: 'M', I: 'I' } as const;

interface OrdenDrawerProps {
  id: number | null;
  onClose: () => void;
}

export function OrdenDrawer({ id, onClose }: OrdenDrawerProps) {
  const { data: orden, isLoading } = useOrden(id);
  return (
    <Drawer open={id !== null} onClose={onClose} width="lg" hideTitle title={orden ? `Orden de ${orden.paciente.nombre_completo}` : 'Orden quirúrgica'}>
      {isLoading || !orden ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <Detalle orden={orden} />
      )}
    </Drawer>
  );
}

function Detalle({ orden }: { orden: Orden }) {
  const { can } = useAuth();
  const { revalidar, cancelar } = useCirugiaMutations();
  const [reprogramar, setReprogramar] = useState(false);
  const [cancelarAbierto, setCancelarAbierto] = useState(false);
  const p = orden.paciente;
  const cita = orden.cita_actual;
  const gestionar = can(PERMISOS.ordenes.gestionar);

  const pasos = [
    { titulo: 'Orden recibida', detalle: `${ORIGEN[orden.origen]}${orden.sistema_origen && orden.origen === 'API' ? ` · ${orden.sistema_origen}` : ''} · ${formatDateTime(orden.created_at)}`, hecho: true },
    {
      titulo: orden.estado === 'RECHAZADA' ? 'Sin especialidad en la IPS' : `Especialidad: ${orden.especialidad?.nombre ?? '—'}`,
      detalle: orden.estado === 'RECHAZADA' ? orden.motivo_estado : 'La IPS atiende este procedimiento.',
      hecho: orden.estado !== 'RECHAZADA',
      error: orden.estado === 'RECHAZADA',
    },
    {
      titulo: cita ? `Cita de pre-anestesia ${cita.estado === 'ATENDIDA' ? 'atendida' : 'asignada'}` : 'Cita de pre-anestesia',
      detalle: cita
        ? `${formatDate(cita.fecha)} · ${cita.hora_inicio} · ${cita.especialista?.nombre_completo} · ${cita.sede?.nombre}${cita.origen === 'MANUAL' ? ' · asignada a mano' : ''}`
        : orden.estado === 'PENDIENTE_CITA'
          ? orden.motivo_estado
          : null,
      hecho: !!cita,
      error: orden.estado === 'PENDIENTE_CITA',
    },
    {
      titulo: orden.concepto ? `Concepto: ${CONCEPTOS[orden.concepto]}${orden.asa ? ` · ASA ${ROMANO[orden.asa]}` : ''}` : 'Valoración pre-anestésica',
      detalle: orden.concepto
        ? orden.estado === 'APTA'
          ? `Aval del ${formatDate(orden.aval_desde)} al ${formatDate(orden.aval_hasta)} · programable desde el ${formatDate(orden.programable_desde)}`
          : orden.motivo_estado
        : null,
      hecho: ['APTA', 'PROGRAMADA', 'OPERADA'].includes(orden.estado),
      error: orden.estado === 'NO_APTA' || orden.estado === 'APLAZADA' || orden.aval_vencido,
    },
    {
      titulo: orden.cirugia
        ? { PROPUESTA: 'Cirugía propuesta (pendiente de aprobación)', APROBADA: 'Cirugía programada', REALIZADA: 'Cirugía realizada' }[orden.cirugia.estado]
        : 'Programación de la cirugía',
      detalle: orden.cirugia
        ? `${formatDate(orden.cirugia.fecha)} · ${orden.cirugia.hora_inicio}–${orden.cirugia.hora_fin}${orden.cirugia.sala ? ` · ${orden.cirugia.sala.nombre}` : ''}${orden.cirugia.cirujano ? ` · ${orden.cirugia.cirujano.nombre_completo}` : ''}`
        : orden.estado === 'APTA'
          ? 'En la cola: entra en la próxima propuesta del motor de programación.'
          : null,
      hecho: orden.cirugia?.estado === 'APROBADA' || orden.cirugia?.estado === 'REALIZADA',
      error: false,
    },
  ];

  return (
    <>
      <header className="px-6 pt-6 pb-4">
        <div className="flex items-start gap-4 pr-10">
          <Avatar name={p.nombre_completo} size="lg" />
          <div className="min-w-0">
            <h2 className="font-display text-2xl leading-tight font-bold text-ink">{p.nombre_completo}</h2>
            <p className="tabular text-sm text-muted">
              {p.tipo_documento?.codigo} {p.numero_documento} · {p.edad} años · {SEXO[p.sexo]}
              {p.telefono && ` · ${p.telefono}`}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <EstadoOrdenBadge orden={orden} />
              {orden.prioridad === 'PRIORITARIA' && <Badge tone="warning">Prioritaria</Badge>}
              {orden.contrato && <Badge tone="mist">{orden.contrato.entidad?.sigla || orden.contrato.entidad?.razon_social} · {orden.contrato.numero}</Badge>}
            </div>
          </div>
        </div>

        <div className="mt-4 rounded-2xl bg-cream p-4">
          <p className="text-xs font-semibold text-muted">Cirugía</p>
          <p className="font-semibold text-ink">
            <span className="tabular font-display">{orden.cups.codigo}</span> · {orden.cups.nombre.toLowerCase()}
          </p>
          <p className="mt-1 text-xs text-muted">
            {[
              orden.diagnostico_cie10 && `CIE-10 ${orden.diagnostico_cie10}`,
              orden.diagnostico,
              orden.medico_ordenante && `Ordenó ${orden.medico_ordenante}`,
              `Orden del ${formatDate(orden.fecha_orden)}`,
              orden.referencia_externa && `Ref. ${orden.referencia_externa}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
      </header>

      <div className="border-t border-line px-6 py-5">
        <ol className="relative space-y-5">
          {pasos.map((paso, i) => (
            <li key={i} className="relative flex gap-3">
              {i < pasos.length - 1 && <span className="absolute top-7 bottom-[-1.25rem] left-[0.8rem] w-0.5 bg-line-strong" aria-hidden />}
              <span
                className={cn(
                  'relative z-10 flex size-7 shrink-0 items-center justify-center rounded-lg rounded-bl-sm',
                  paso.error ? 'bg-danger text-white' : paso.hecho ? 'bg-petrol text-white' : 'border-2 border-dashed border-line-strong bg-surface text-subtle',
                )}
              >
                {paso.error ? <AlertTriangle className="size-3.5" aria-hidden /> : paso.hecho ? <Check className="size-3.5" aria-hidden /> : <span className="text-xs font-bold">{i + 1}</span>}
              </span>
              <div className="min-w-0 pt-0.5">
                <p className="font-semibold text-ink">{paso.titulo}</p>
                {paso.detalle && <p className={cn('text-sm', paso.error ? 'text-danger' : 'text-muted')}>{paso.detalle}</p>}
              </div>
            </li>
          ))}
        </ol>

        {orden.historia?.resultado?.alertas && orden.historia.resultado.alertas.length > 0 && (
          <div className="mt-5 rounded-2xl border border-line p-4">
            <p className="mb-2 text-sm font-semibold text-ink">Alertas de la valoración</p>
            <ul className="space-y-1 text-sm text-body">
              {orden.historia.resultado.alertas.map((a, i) => (
                <li key={i} className="flex gap-2">
                  <span className={cn('mt-1.5 size-1.5 shrink-0 rounded-full', a.nivel === 'bloqueo' ? 'bg-danger' : a.nivel === 'aviso' ? 'bg-warning' : 'bg-mist-ink')} aria-hidden />
                  {a.mensaje}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex flex-wrap gap-2">
          {orden.historia_id && (
            <Link to={`/historias/${orden.historia_id}`} className="inline-flex h-10 items-center gap-2 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-sand">
              <FileText className="size-4" aria-hidden /> Ver historia clínica
            </Link>
          )}
          {gestionar && ['PENDIENTE_CITA', 'CITA_ASIGNADA', 'APLAZADA'].includes(orden.estado) && (
            <Button variant="secondary" icon={cita ? CalendarClock : CalendarPlus} onClick={() => setReprogramar(true)}>
              {cita && orden.estado === 'CITA_ASIGNADA' ? 'Reprogramar cita' : 'Asignar cita'}
            </Button>
          )}
          {gestionar && orden.estado === 'RECHAZADA' && (
            <Button variant="secondary" icon={RefreshCw} onClick={() => revalidar.mutate(orden.id)} isLoading={revalidar.isPending}>
              Revalidar
            </Button>
          )}
          {gestionar && ['RECHAZADA', 'PENDIENTE_CITA', 'CITA_ASIGNADA', 'APLAZADA'].includes(orden.estado) && (
            <Button variant="danger-ghost" icon={XCircle} onClick={() => setCancelarAbierto(true)}>
              Cancelar orden
            </Button>
          )}
        </div>
        {orden.estado === 'RECHAZADA' && (
          <p className="mt-3 text-xs text-muted">
            Para aceptarla, relaciona el CUPS con una especialidad en <Link to={`/especialidades?buscar=${orden.cups.codigo}`} className="font-semibold text-petrol hover:underline">CUPS y especialidades</Link> y verifica que haya especialistas activos; luego revalida.
          </p>
        )}
      </div>

      {(orden.citas?.length ?? 0) > 1 && (
        <div className="border-t border-line px-6 py-5">
          <p className="mb-2 text-sm font-semibold text-ink">Historial de citas</p>
          <ul className="space-y-1 text-sm text-muted">
            {orden.citas!.map((c) => (
              <li key={c.id} className="tabular">
                {formatDate(c.fecha)} · {c.hora_inicio} · {c.especialista?.nombre_completo} — {c.estado.toLowerCase().replace('_', ' ')}
                {c.motivo_cancelacion && ` (${c.motivo_cancelacion})`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ReprogramarModal orden={reprogramar ? orden : null} onClose={() => setReprogramar(false)} />
      <CancelarModal open={cancelarAbierto} onClose={() => setCancelarAbierto(false)} isLoading={cancelar.isPending} onCancelar={(motivo) => cancelar.mutateAsync({ id: orden.id, motivo }).then(() => setCancelarAbierto(false))} />
    </>
  );
}

function CancelarModal({ open, onClose, onCancelar, isLoading }: { open: boolean; onClose: () => void; onCancelar: (m: string) => Promise<unknown>; isLoading: boolean }) {
  const [motivo, setMotivo] = useState('');
  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!isLoading}
      title="Cancelar orden"
      description="Se cancela también la cita de pre-anestesia pendiente."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Volver
          </Button>
          <Button variant="danger" disabled={motivo.trim().length < 3} isLoading={isLoading} onClick={() => onCancelar(motivo.trim()).catch(() => undefined)}>
            Cancelar orden
          </Button>
        </>
      }
    >
      <Textarea aria-label="Motivo" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Motivo de la cancelación" />
    </Modal>
  );
}
