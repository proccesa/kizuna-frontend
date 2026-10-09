import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Check, CheckCircle2, CloudOff, FileLock2, Loader2 } from 'lucide-react';
import { Avatar, Badge, Button, Card, ConfirmDialog, Modal, Skeleton, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime } from '@/lib/format';
import { notify } from '@/lib/toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { CONCEPTOS, ROMANO } from '@/modules/cirugia/types';
import { FormularioPlantilla } from '../components/FormularioPlantilla';
import { PanelAsistente } from '../components/PanelAsistente';
import { useHistoria, useHistoriasMutations } from '../hooks/useHistorias';
import { pendientesPorSeccion } from '../plantilla';
import type { Historia, Respuestas } from '../types';

const SEXO = { F: 'Femenino', M: 'Masculino', I: 'Indeterminado' } as const;

export function HistoriaPage() {
  const id = Number(useParams().id);
  const { data: historia, isLoading, isError } = useHistoria(Number.isFinite(id) ? id : null);

  if (isError) {
    return (
      <Card className="py-14 text-center">
        <p className="text-sm text-muted">No fue posible abrir la historia clínica.</p>
        <Link to="/historias" className="mt-3 inline-block text-sm font-semibold text-petrol hover:underline">
          Volver a historias
        </Link>
      </Card>
    );
  }
  if (isLoading || !historia?.version.esquema) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
          <Skeleton className="h-[32rem]" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  return <Editor key={historia.id} historia={historia} />;
}

type EstadoGuardado = 'guardado' | 'pendiente' | 'guardando' | 'error';

function Editor({ historia }: { historia: Historia }) {
  const { can } = useAuth();
  const { guardar, finalizar, anular } = useHistoriasMutations();
  const esquema = historia.version.esquema!;
  const editable = historia.estado === 'BORRADOR' && historia.origen === 'KIZUNA' && can(PERMISOS.historias.diligenciar);
  const [respuestas, setRespuestas] = useState<Respuestas>(historia.respuestas ?? {});
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const [estado, setEstado] = useState<EstadoGuardado>('guardado');
  const [confirmar, setConfirmar] = useState(false);
  const [anularAbierto, setAnularAbierto] = useState(false);
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined);
  const ultimas = useRef(respuestas);

  const guardarAhora = useCallback(
    async (valores: Respuestas) => {
      setEstado('guardando');
      try {
        await guardar.mutateAsync({ id: historia.id, respuestas: valores });
        setErrores({});
        setEstado(ultimas.current === valores ? 'guardado' : 'pendiente');
      } catch (error) {
        const e = toApiError(error);
        setErrores(e.fieldErrors);
        setEstado('error');
      }
    },
    [guardar, historia.id],
  );

  // Autoguardado un segundo después del último cambio.
  const cambiar = (campo: string, valor: unknown) => {
    const siguiente = { ...ultimas.current, [campo]: valor };
    ultimas.current = siguiente;
    setRespuestas(siguiente);
    setEstado('pendiente');
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => guardarAhora(siguiente), 1000);
  };

  useEffect(() => () => clearTimeout(temporizador.current), []);

  // Avisa si se intenta salir con cambios sin guardar.
  useEffect(() => {
    if (estado !== 'pendiente' && estado !== 'guardando') return;
    const aviso = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', aviso);
    return () => window.removeEventListener('beforeunload', aviso);
  }, [estado]);

  const pendientes = useMemo(() => pendientesPorSeccion(esquema, respuestas, historia.contexto), [esquema, respuestas, historia.contexto]);
  const totalPendientes = Object.values(pendientes).reduce((a, b) => a + b, 0);

  const onFinalizar = async () => {
    clearTimeout(temporizador.current);
    try {
      await finalizar.mutateAsync({ id: historia.id, respuestas: ultimas.current });
      setConfirmar(false);
      setEstado('guardado');
    } catch (error) {
      const e = toApiError(error);
      setErrores(e.fieldErrors);
      setConfirmar(false);
      notify.error(Object.keys(e.fieldErrors).length ? 'Faltan datos obligatorios: revisa los campos marcados.' : e.message);
      const primero = Object.keys(e.fieldErrors)[0]?.split('.')[0];
      if (primero) document.getElementById(`hc-${primero}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const resultado = historia.resultado;
  const concepto = respuestas.concepto as string | undefined;

  return (
    <div className="space-y-5">
      <Link to={historia.cita ? '/preanestesia' : '/historias'} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-ink">
        <ArrowLeft className="size-4" aria-hidden /> {historia.cita ? 'Agenda de pre-anestesia' : 'Historias clínicas'}
      </Link>

      <Encabezado historia={historia} />

      {historia.estado === 'FINALIZADA' && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-success-soft px-4 py-3 text-success">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <FileLock2 className="size-4" aria-hidden />
            Finalizada el {formatDateTime(historia.finalizada_en)}
            {historia.especialista ? ` por ${historia.especialista.nombre_completo}` : historia.finalizada_por && ` por ${historia.finalizada_por.name}`}
            {historia.origen === 'EXTERNO' && ` · recibida de ${historia.sistema_origen} (${historia.profesional_externo})`}. No se puede modificar.
          </p>
          {can(PERMISOS.historias.anular) && (
            <Button size="sm" variant="danger-ghost" icon={Ban} onClick={() => setAnularAbierto(true)}>
              Anular
            </Button>
          )}
        </div>
      )}
      {historia.estado === 'ANULADA' && (
        <div className="rounded-2xl bg-danger-soft px-4 py-3 text-sm font-medium text-danger">
          Anulada el {formatDateTime(historia.anulada_en)}: {historia.motivo_anulacion}
        </div>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_20rem] xl:grid-cols-[11rem_minmax(0,1fr)_22rem]">
        {/* Índice de secciones */}
        <nav aria-label="Secciones" className="sticky top-6 hidden space-y-1 xl:block">
          {esquema.secciones.map((s) => (
            <a
              key={s.id}
              href={`#seccion-${s.id}`}
              className="flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm text-body transition-colors hover:bg-surface hover:text-ink"
            >
              <span className="truncate">{s.titulo}</span>
              {editable &&
                (pendientes[s.id] ? (
                  <span className="tabular rounded-full bg-sand px-1.5 text-xs font-semibold text-muted">{pendientes[s.id]}</span>
                ) : (
                  <Check className="size-3.5 shrink-0 text-success" aria-label="Completa" />
                ))}
            </a>
          ))}
        </nav>

        <div className="min-w-0">
          <FormularioPlantilla
            esquema={esquema}
            respuestas={respuestas}
            onChange={cambiar}
            contexto={historia.contexto}
            resultado={resultado}
            errores={errores}
            soloLectura={!editable}
          />
        </div>

        <aside className="space-y-4 lg:sticky lg:top-6">
          {editable && (
            <div className="rounded-[var(--radius-card)] border border-line bg-surface p-4">
              <p className="flex items-center gap-2 text-sm text-muted" aria-live="polite">
                {estado === 'guardando' && (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden /> Guardando…
                  </>
                )}
                {estado === 'pendiente' && 'Cambios sin guardar'}
                {estado === 'guardado' && (
                  <>
                    <CheckCircle2 className="size-4 text-success" aria-hidden /> Borrador guardado
                  </>
                )}
                {estado === 'error' && (
                  <span className="flex items-center gap-2 text-danger">
                    <CloudOff className="size-4" aria-hidden /> Revisa los campos marcados
                  </span>
                )}
              </p>
              <Button className="mt-3 w-full" onClick={() => setConfirmar(true)} disabled={estado === 'guardando'}>
                Finalizar historia
              </Button>
              {totalPendientes > 0 && (
                <p className="mt-2 text-center text-xs text-muted">
                  {totalPendientes} {totalPendientes === 1 ? 'campo obligatorio pendiente' : 'campos obligatorios pendientes'}
                </p>
              )}
            </div>
          )}
          {historia.version.plantilla.codigo === 'preanestesia' && (
            <PanelAsistente resultado={resultado} respuestas={respuestas} fechaValoracion={historia.finalizada_en} tieneOrden={!!historia.orden} />
          )}
          <Auditoria historia={historia} />
        </aside>
      </div>

      <ConfirmDialog
        open={confirmar}
        tone="primary"
        title="Finalizar historia clínica"
        message={
          totalPendientes > 0
            ? `Aún faltan ${totalPendientes} campos obligatorios. Kizuna te indicará cuáles.`
            : `Concepto: ${concepto ? CONCEPTOS[concepto] : 'sin concepto'}${respuestas.asa ? ` · ASA ${ROMANO[Number(respuestas.asa)]}` : ''}. Una vez finalizada, la historia no se puede modificar${historia.orden ? ' y el concepto se aplica a la orden de cirugía' : ''}.`
        }
        confirmLabel="Finalizar"
        isLoading={finalizar.isPending}
        onConfirm={onFinalizar}
        onClose={() => setConfirmar(false)}
      />
      <AnularModal open={anularAbierto} onClose={() => setAnularAbierto(false)} isLoading={anular.isPending} onAnular={(motivo) => anular.mutateAsync({ id: historia.id, motivo }).then(() => setAnularAbierto(false))} />
    </div>
  );
}

function Encabezado({ historia }: { historia: Historia }) {
  const p = historia.paciente;
  return (
    <Card className="flex flex-col gap-4 p-5 xl:flex-row xl:items-center xl:justify-between">
      <div className="flex min-w-0 items-center gap-4">
        <Avatar name={p.nombre_completo} size="lg" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-muted">{historia.version.plantilla.nombre}</p>
          <h1 className="font-display text-2xl leading-tight font-bold text-ink">{p.nombre_completo}</h1>
          <p className="tabular text-sm text-muted">
            {p.tipo_documento?.codigo} {p.numero_documento} · {p.edad} años · {SEXO[p.sexo]}
          </p>
        </div>
      </div>
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
        {historia.orden?.cups && (
          <div>
            <p className="text-xs font-semibold text-muted">Cirugía</p>
            <p className="max-w-72 font-semibold text-ink">
              <span className="tabular">{historia.orden.cups.codigo}</span> · {historia.orden.cups.nombre.toLowerCase()}
            </p>
          </div>
        )}
        {historia.cita && (
          <div>
            <p className="text-xs font-semibold text-muted">Cita</p>
            <p className="font-semibold text-ink">
              {formatDate(historia.cita.fecha)} · {historia.cita.hora_inicio} · {historia.cita.sede?.nombre}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold text-muted">Estado</p>
          <Badge tone={historia.estado === 'FINALIZADA' ? 'success' : historia.estado === 'ANULADA' ? 'danger' : 'lime'}>
            {historia.estado === 'BORRADOR' ? 'Borrador' : historia.estado === 'FINALIZADA' ? 'Finalizada' : 'Anulada'}
          </Badge>
        </div>
      </div>
    </Card>
  );
}

const ACCIONES: Record<string, string> = { CREADA: 'Abrió la historia', EDITADA: 'Editó', FINALIZADA: 'Finalizó', ANULADA: 'Anuló', CONSULTADA: 'Consultó', RECIBIDA: 'Recibida' };

function Auditoria({ historia }: { historia: Historia }) {
  const eventos = (historia.eventos ?? []).filter((e) => e.accion !== 'CONSULTADA').slice(0, 6);
  if (!eventos.length) return null;
  return (
    <details className="rounded-[var(--radius-card)] border border-line bg-surface p-4 text-sm">
      <summary className="cursor-pointer font-semibold text-ink">Auditoría</summary>
      <ul className="mt-3 space-y-2">
        {eventos.map((e) => (
          <li key={e.id} className="text-xs text-muted">
            <span className="font-semibold text-body">{ACCIONES[e.accion] ?? e.accion}</span>
            {e.usuario && ` · ${e.usuario.name}`} · {formatDateTime(e.created_at)}
            {e.detalle && <span className="block text-subtle">{e.detalle}</span>}
          </li>
        ))}
      </ul>
    </details>
  );
}

function AnularModal({ open, onClose, onAnular, isLoading }: { open: boolean; onClose: () => void; onAnular: (motivo: string) => Promise<unknown>; isLoading: boolean }) {
  const [motivo, setMotivo] = useState('');
  const valido = motivo.trim().length >= 10;
  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!isLoading}
      title="Anular historia clínica"
      description="La historia no se borra: queda marcada como anulada con tu justificación. Si dio un aval, la orden vuelve a requerir valoración."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button variant="danger" disabled={!valido} isLoading={isLoading} onClick={() => onAnular(motivo.trim()).catch(() => undefined)}>
            Anular
          </Button>
        </>
      }
    >
      <label htmlFor="motivo-anulacion" className="text-sm font-semibold text-ink">
        Motivo <span className="text-danger">*</span>
      </label>
      <Textarea id="motivo-anulacion" rows={3} value={motivo} onChange={(e) => setMotivo(e.target.value)} className={cn('mt-1.5')} placeholder="Ej.: se registró en el paciente equivocado." />
      <p className="mt-1 text-xs text-muted">Mínimo 10 caracteres.</p>
    </Modal>
  );
}
