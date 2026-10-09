import { useState } from 'react';
import { AlertTriangle, CalendarCheck2, ChevronLeft, ChevronRight, Sparkles, Trash2 } from 'lucide-react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, FilterTabs, Modal, PageHeader, Skeleton, Textarea } from '@/components/ui';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { Cifra } from '@/modules/inventario/components/Cifra';
import { hoyISO } from '@/modules/talento/schema';
import { agruparPorDiaYSala } from '../agrupar';
import { CirugiaCard } from '../components/CirugiaCard';
import { GenerarModal } from '../components/GenerarModal';
import { useCola, usePrograma, useProgramacionMutations, usePropuesta, useResumenProgramacion } from '../hooks/useProgramacion';
import type { Cirugia, Corrida } from '../types';

const fechaLarga = new Intl.DateTimeFormat('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
const diaLargo = (fecha: string) => {
  const t = fechaLarga.format(new Date(`${fecha}T00:00:00`));
  return t.charAt(0).toUpperCase() + t.slice(1);
};
const sumarDias = (fecha: string, dias: number) => {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

type Motivo = { tipo: 'quitar' | 'cancelar'; cirugia: Cirugia } | null;

export function ProgramacionPage() {
  const { can } = useAuth();
  const { extras, update } = useListParams(['vista', 'semana'] as const);
  const { data: resumen } = useResumenProgramacion();
  const { data: propuesta, isLoading: cargandoPropuesta } = usePropuesta();
  const [generar, setGenerar] = useState(false);
  const vista = extras.vista === 'cola' ? 'cola' : 'programa';

  return (
    <>
      <PageHeader
        title="Programación quirúrgica"
        description="Kizuna propone el programa con los pacientes aptos, por prioridad, verificando cirujano, anestesiólogo, sala, equipos, cajas e insumos. El jefe de cirugía lo aprueba."
        actions={
          can(PERMISOS.programacion.generar) &&
          !propuesta && (
            <Button variant="mint" icon={Sparkles} onClick={() => setGenerar(true)}>
              Generar propuesta
            </Button>
          )
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cifra titulo="Pacientes por programar" valor={resumen?.por_programar} detalle="Aptos con aval vigente" onClick={() => update({ vista: 'cola' })} />
        <Cifra titulo="Avales por vencer" valor={resumen?.aval_por_vencer} tono="warning" detalle="Sin cirugía y a 15 días o menos" onClick={() => update({ vista: 'cola' })} />
        <Cifra titulo="Cirugías hoy" valor={resumen?.programadas_hoy} />
        <Cifra titulo="Próximos 7 días" valor={resumen?.programadas_7_dias} detalle={resumen ? `${resumen.realizadas_mes} realizadas este mes` : undefined} />
      </div>

      {cargandoPropuesta ? <Skeleton className="mb-6 h-40" /> : propuesta && <Propuesta corrida={propuesta} />}

      <FilterTabs
        aria-label="Vista"
        className="mb-4"
        value={vista}
        onChange={(v) => update({ vista: v === 'programa' ? '' : v })}
        tabs={[
          { value: 'programa', label: 'Programa aprobado' },
          { value: 'cola', label: 'Cola de prioridad', count: resumen?.por_programar },
        ]}
      />
      {vista === 'programa' ? <Programa semana={extras.semana || hoyISO()} onSemana={(s) => update({ semana: s === hoyISO() ? '' : s })} /> : <Cola />}

      <GenerarModal open={generar} onClose={() => setGenerar(false)} />
    </>
  );
}

function Propuesta({ corrida }: { corrida: Corrida }) {
  const { can } = useAuth();
  const { aprobar, descartar, rechazar } = useProgramacionMutations();
  const [confirmar, setConfirmar] = useState<'aprobar' | 'descartar' | null>(null);
  const [motivo, setMotivo] = useState<Motivo>(null);
  const grupos = agruparPorDiaYSala(corrida.cirugias);
  const noProgramadas = corrida.resumen?.no_programadas ?? [];

  return (
    <Card className="animate-enter mb-6 overflow-hidden border-petrol/30">
      <div className="flex flex-col gap-3 bg-petrol px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="flex items-center gap-2 font-display text-lg font-bold">
            <Sparkles className="size-5 text-mint" aria-hidden /> Propuesta pendiente de aprobación
          </p>
          <p className="text-sm text-white/75">
            {formatDate(corrida.desde)} – {formatDate(corrida.hasta)} · {corrida.cirugias.length} cirugías propuestas
            {noProgramadas.length > 0 && ` · ${noProgramadas.length} pacientes sin cupo`} · generada {formatDateTime(corrida.created_at)}
            {corrida.creada_por && ` por ${corrida.creada_por.name}`}
          </p>
        </div>
        <div className="flex gap-2">
          {can(PERMISOS.programacion.generar) && (
            <Button variant="ghost" icon={Trash2} className="text-white hover:bg-white/10 hover:text-white" onClick={() => setConfirmar('descartar')}>
              Descartar
            </Button>
          )}
          {can(PERMISOS.programacion.aprobar) && (
            <Button variant="mint" icon={CalendarCheck2} onClick={() => setConfirmar('aprobar')} disabled={!corrida.cirugias.length}>
              Aprobar programa
            </Button>
          )}
        </div>
      </div>

      <div className="space-y-6 p-5">
        {grupos.length === 0 && <p className="text-sm text-muted">Ninguna cirugía quedó en la propuesta.</p>}
        {grupos.map(({ fecha, salas }) => (
          <section key={fecha}>
            <h3 className="mb-3 font-display text-base font-bold text-ink">{diaLargo(fecha)}</h3>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
              {salas.map(([sala, cirugias]) => (
                <div key={sala} className="rounded-2xl bg-cream p-3">
                  <p className="mb-2 px-1 text-xs font-semibold text-muted">
                    {sala}
                    {cirugias[0]?.anestesiologo && ` · Anestesia: ${cirugias[0].anestesiologo.nombre_completo}`}
                  </p>
                  <div className="space-y-2">
                    {cirugias.map((c) => (
                      <CirugiaCard key={c.id} cirugia={c} onQuitar={can(PERMISOS.programacion.generar) ? () => setMotivo({ tipo: 'quitar', cirugia: c }) : undefined} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        {noProgramadas.length > 0 && (
          <section>
            <h3 className="mb-2 flex items-center gap-2 font-display text-base font-bold text-ink">
              <AlertTriangle className="size-4 text-warning" aria-hidden /> No se pudieron programar
            </h3>
            <ul className="divide-y divide-line rounded-2xl border border-line">
              {noProgramadas.map((n) => (
                <li key={n.orden_id} className="flex flex-col gap-1 px-4 py-3 text-sm sm:flex-row sm:items-center sm:gap-4">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold text-ink">{n.paciente}</span>
                    <span className="text-xs text-muted">
                      <span className="tabular">{n.cups}</span> · prioridad {formatNumber(n.puntaje)}
                    </span>
                  </span>
                  <span className="text-sm text-body sm:max-w-md">{n.motivo}</span>
                  {n.aval_por_vencer && <Badge tone="danger">Aval vence {formatDate(n.aval_hasta)}</Badge>}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      <ConfirmDialog
        open={!!confirmar}
        tone={confirmar === 'aprobar' ? 'primary' : 'danger'}
        title={confirmar === 'aprobar' ? 'Aprobar programa quirúrgico' : 'Descartar propuesta'}
        message={
          confirmar === 'aprobar'
            ? `Se programan ${corrida.cirugias.length} cirugías y los recursos quedan reservados. Las órdenes pasan a «Programada».`
            : 'Se liberan todos los recursos reservados y los pacientes vuelven a la cola.'
        }
        confirmLabel={confirmar === 'aprobar' ? 'Aprobar' : 'Descartar'}
        isLoading={aprobar.isPending || descartar.isPending}
        onConfirm={async () => {
          if (confirmar === 'aprobar') await aprobar.mutateAsync(corrida.id).catch(() => undefined);
          if (confirmar === 'descartar') await descartar.mutateAsync(corrida.id).catch(() => undefined);
          setConfirmar(null);
        }}
        onClose={() => setConfirmar(null)}
      />
      <MotivoModal
        motivo={motivo}
        isLoading={rechazar.isPending}
        onClose={() => setMotivo(null)}
        onConfirmar={(texto) => motivo && rechazar.mutateAsync({ id: motivo.cirugia.id, motivo: texto }).then(() => setMotivo(null))}
      />
    </Card>
  );
}

function Programa({ semana, onSemana }: { semana: string; onSemana: (s: string) => void }) {
  const { can } = useAuth();
  const desde = semana;
  const hasta = sumarDias(semana, 6);
  const { data = [], isLoading, isFetching } = usePrograma(desde, hasta);
  const { realizar, cancelar } = useProgramacionMutations();
  const [motivo, setMotivo] = useState<Motivo>(null);
  const [realizarCirugia, setRealizarCirugia] = useState<Cirugia | null>(null);
  const grupos = agruparPorDiaYSala(data);
  const hoy = hoyISO();

  return (
    <Card className="animate-enter overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-line p-4">
        <div className="flex items-center gap-2">
          <Button variant="secondary" iconOnly icon={ChevronLeft} aria-label="Semana anterior" onClick={() => onSemana(sumarDias(semana, -7))} />
          <Button variant="secondary" iconOnly icon={ChevronRight} aria-label="Semana siguiente" onClick={() => onSemana(sumarDias(semana, 7))} />
          <p className="ml-1 font-semibold text-ink">
            {formatDate(desde)} – {formatDate(hasta)}
          </p>
        </div>
        {semana !== hoy && (
          <Button variant="ghost" size="sm" onClick={() => onSemana(hoy)}>
            Hoy
          </Button>
        )}
      </div>
      <div className={cn('space-y-6 p-5', isFetching && 'opacity-70')}>
        {isLoading ? (
          <Skeleton className="h-48" />
        ) : grupos.length === 0 ? (
          <EmptyState title="Sin cirugías esta semana" description="Genera una propuesta y apruébala para que el programa aparezca aquí." />
        ) : (
          grupos.map(({ fecha, salas }) => (
            <section key={fecha}>
              <h3 className={cn('mb-3 font-display text-base font-bold', fecha === hoy ? 'text-mint-ink' : 'text-ink')}>
                {diaLargo(fecha)}
                {fecha === hoy && ' · hoy'}
              </h3>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                {salas.map(([sala, cirugias]) => (
                  <div key={sala} className="rounded-2xl bg-cream p-3">
                    <p className="mb-2 px-1 text-xs font-semibold text-muted">
                      {sala}
                      {cirugias[0]?.anestesiologo && ` · Anestesia: ${cirugias[0].anestesiologo.nombre_completo}`}
                    </p>
                    <div className="space-y-2">
                      {cirugias.map((c) => (
                        <CirugiaCard
                          key={c.id}
                          cirugia={c}
                          onRealizar={c.estado === 'APROBADA' && fecha <= hoy && can(PERMISOS.programacion.realizar) ? () => setRealizarCirugia(c) : undefined}
                          onCancelar={c.estado === 'APROBADA' && can(PERMISOS.programacion.aprobar) ? () => setMotivo({ tipo: 'cancelar', cirugia: c }) : undefined}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>
      <ConfirmDialog
        open={!!realizarCirugia}
        tone="primary"
        title="Registrar cirugía realizada"
        message={realizarCirugia ? `${realizarCirugia.paciente.nombre_completo} · ${realizarCirugia.cups.codigo}. Se descuentan los insumos reservados del inventario de la sede.` : ''}
        confirmLabel="Realizada"
        isLoading={realizar.isPending}
        onConfirm={async () => {
          if (realizarCirugia) await realizar.mutateAsync(realizarCirugia.id).catch(() => undefined);
          setRealizarCirugia(null);
        }}
        onClose={() => setRealizarCirugia(null)}
      />
      <MotivoModal
        motivo={motivo}
        isLoading={cancelar.isPending}
        onClose={() => setMotivo(null)}
        onConfirmar={(texto) => motivo && cancelar.mutateAsync({ id: motivo.cirugia.id, motivo: texto }).then(() => setMotivo(null))}
      />
    </Card>
  );
}

function Cola() {
  const { data = [], isLoading } = useCola();

  return (
    <Card className="animate-enter overflow-hidden">
      {isLoading ? (
        <Skeleton className="m-5 h-48" />
      ) : data.length === 0 ? (
        <EmptyState title="Nadie en espera" description="Todos los pacientes aptos tienen cirugía propuesta o programada." />
      ) : (
        <ol className="divide-y divide-line">
          {data.map((e, i) => (
            <li key={e.orden.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-center">
              <span className="tabular flex size-9 shrink-0 items-center justify-center rounded-xl rounded-bl-sm bg-mist font-display font-bold text-mist-ink">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-ink">{e.orden.paciente.nombre_completo}</p>
                <p className="tabular text-xs text-muted">
                  {e.orden.paciente.tipo_documento?.codigo} {e.orden.paciente.numero_documento} · {e.orden.paciente.edad} años · {e.orden.cups.codigo} {e.orden.cups.nombre.toLowerCase()}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {e.factores.map((f) => (
                    <Badge key={f.etiqueta} tone={f.etiqueta.includes('prioritaria') ? 'warning' : f.etiqueta.startsWith('Aval') ? 'danger' : 'mist'}>
                      {f.etiqueta} · +{formatNumber(f.puntos)}
                    </Badge>
                  ))}
                  {e.temprano && <Badge tone="lime">Primera hora: {e.temprano.toLowerCase()}</Badge>}
                </div>
              </div>
              <div className="text-sm lg:w-56 lg:text-right">
                <p className="tabular font-display text-lg font-bold text-ink">{formatNumber(e.puntaje)}</p>
                <p className={cn('text-xs', e.aval_por_vencer ? 'font-semibold text-danger' : 'text-muted')}>
                  Ventana {formatDate(e.orden.programable_desde)} – {formatDate(e.orden.aval_hasta)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}

function MotivoModal({ motivo, onClose, onConfirmar, isLoading }: { motivo: Motivo; onClose: () => void; onConfirmar: (texto: string) => unknown; isLoading: boolean }) {
  const [texto, setTexto] = useState('');
  if (!motivo) return null;
  const quitar = motivo.tipo === 'quitar';
  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!isLoading}
      title={quitar ? 'Quitar de la propuesta' : 'Cancelar cirugía'}
      description={`${motivo.cirugia.paciente.nombre_completo} · ${diaLargo(motivo.cirugia.fecha)} ${motivo.cirugia.hora_inicio}. Se liberan sus recursos y el paciente vuelve a la cola.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Volver
          </Button>
          <Button variant="danger" disabled={texto.trim().length < 3} isLoading={isLoading} onClick={() => onConfirmar(texto.trim())}>
            {quitar ? 'Quitar' : 'Cancelar cirugía'}
          </Button>
        </>
      }
    >
      <Textarea aria-label="Motivo" rows={3} value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Motivo" />
    </Modal>
  );
}
