import { useState, type ReactNode } from 'react';
import { Ban, CalendarClock, Plus, RotateCcw, Trash2, Upload } from 'lucide-react';
import { ListToolbar } from '@/components/ListToolbar';
import { Avatar, Badge, Button, Card, ConfirmDialog, EmptyState, FilterTabs, PageHeader, Pagination, Select, Skeleton, StatusBadge } from '@/components/ui';
import { useDrawerParam } from '@/hooks/useDrawerParam';
import { useEstadoCounts } from '@/hooks/useEstadoCounts';
import { useListParams } from '@/hooks/useListParams';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { DIAS_SEMANA } from '@/lib/horario';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useSedes } from '@/modules/red/hooks/useRed';
import { useEspecialidades } from '@/modules/servicios/hooks/useServicios';
import { EspecialistaDrawer } from '../components/EspecialistaDrawer';
import { ImportarEspecialistasModal } from '../components/ImportarEspecialistasModal';
import { SemanaAgenda } from '../components/SemanaAgenda';
import { useAgendas, useEspecialistas, useResumenTalento, useTalentoMutations } from '../hooks/useTalento';
import type { Especialista } from '../types';

export function EspecialistasPage() {
  const { can } = useAuth();
  const params = useListParams(['vista', 'especialidad', 'sede', 'sin_agenda'] as const);
  const drawer = useDrawerParam();
  const { data: resumen } = useResumenTalento();
  const [importar, setImportar] = useState(false);
  const vista = params.extras.vista === 'agenda' ? 'agenda' : 'profesionales';
  const sinAgenda = params.extras.sin_agenda === '1';

  return (
    <>
      <PageHeader
        title="Especialistas"
        description="Los profesionales que atienden, sus especialidades y la agenda semanal en cada sede. Son el cupo con el que Kizuna programa."
        actions={
          <>
            {can(PERMISOS.especialistas.importar) && (
              <Button variant="secondary" icon={Upload} onClick={() => setImportar(true)}>
                Cargar archivo
              </Button>
            )}
            {can(PERMISOS.especialistas.crear) && (
              <Button icon={Plus} onClick={drawer.create}>
                Nuevo especialista
              </Button>
            )}
          </>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Cifra titulo="Profesionales activos" valor={resumen?.activos} />
        <Cifra titulo="Horas de agenda por semana" valor={resumen?.horas_semana} />
        <Cifra
          titulo="Sin agenda"
          valor={resumen?.sin_agenda}
          tono={resumen?.sin_agenda ? 'danger' : undefined}
          icono={resumen?.sin_agenda ? <Ban className="size-4" aria-hidden /> : undefined}
          activo={sinAgenda}
          onClick={resumen?.sin_agenda ? () => params.update({ vista: '', sin_agenda: sinAgenda ? '' : '1' }) : undefined}
        />
        <Cifra titulo="Con novedad hoy" valor={resumen?.ausentes_hoy} tono={resumen?.ausentes_hoy ? 'warning' : undefined} />
      </div>

      <FilterTabs
        aria-label="Vista"
        className="mb-4"
        value={vista}
        onChange={(v) => params.update({ vista: v === 'profesionales' ? '' : v })}
        tabs={[
          { value: 'profesionales', label: 'Profesionales' },
          ...(can(PERMISOS.agendas.listar) ? [{ value: 'agenda' as const, label: 'Agenda por sede' }] : []),
        ]}
      />

      {vista === 'agenda' ? <AgendaPorSede params={params} onAbrir={drawer.open} /> : <Profesionales params={params} sinAgenda={sinAgenda} onAbrir={drawer.open} onNuevo={drawer.create} />}

      <EspecialistaDrawer abierto={drawer.isCreating ? 'nuevo' : drawer.selectedId} onAbrir={drawer.open} onClose={drawer.close} />
      <ImportarEspecialistasModal open={importar} onClose={() => setImportar(false)} />
    </>
  );
}

function Cifra({
  titulo,
  valor,
  tono,
  icono,
  activo,
  onClick,
}: {
  titulo: string;
  valor?: number;
  tono?: 'danger' | 'warning';
  icono?: ReactNode;
  activo?: boolean;
  onClick?: () => void;
}) {
  const Etiqueta = onClick ? 'button' : 'div';
  return (
    <Etiqueta
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      aria-pressed={onClick ? activo : undefined}
      className={cn(
        'animate-enter rounded-[var(--radius-card)] border bg-surface p-4 text-left',
        activo ? 'border-danger ring-1 ring-danger' : 'border-line',
        onClick && 'cursor-pointer transition-colors hover:bg-cream',
      )}
    >
      <p className="flex items-center gap-1.5 text-sm font-semibold text-muted">
        {icono && <span className={tono === 'danger' ? 'text-danger' : 'text-warning'}>{icono}</span>}
        {titulo}
      </p>
      <p className={cn('tabular mt-1 font-display text-3xl font-bold', tono === 'danger' ? 'text-danger' : tono === 'warning' ? 'text-warning' : 'text-ink')}>
        {valor === undefined ? '—' : formatNumber(valor)}
      </p>
      {onClick && <p className="mt-1 text-xs text-muted">{activo ? 'Mostrando solo estos · quitar filtro' : 'No reciben pacientes · ver cuáles'}</p>}
    </Etiqueta>
  );
}

type Params = ReturnType<typeof useListParams<'vista' | 'especialidad' | 'sede' | 'sin_agenda'>>;

const COLUMNAS = 'xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1.2fr)_minmax(0,1fr)_10rem_6rem_4.5rem]';

function Profesionales({ params, sinAgenda, onAbrir, onNuevo }: { params: Params; sinAgenda: boolean; onAbrir: (id: number) => void; onNuevo: () => void }) {
  const { can } = useAuth();
  const { buscar, estado, extras, update, apiParams } = params;
  const especialidadId = extras.especialidad ? Number(extras.especialidad) : undefined;
  const sedeId = extras.sede ? Number(extras.sede) : undefined;
  const base = { buscar: buscar || undefined, especialidad_id: especialidadId, sede_id: sedeId, sin_agenda: sinAgenda || undefined };
  const { data, isLoading, isFetching, isError, refetch } = useEspecialistas({ ...apiParams, ...base, por_pagina: 15 });
  const counts = useEstadoCounts(useEspecialistas, base, can(PERMISOS.especialistas.restaurar));
  const { data: especialidades = [] } = useEspecialidades();
  const { data: sedes } = useSedes({ por_pagina: 100 });
  const { eliminarEspecialista, restaurarEspecialista } = useTalentoMutations();
  const [confirmar, setConfirmar] = useState<{ tipo: 'eliminar' | 'restaurar'; especialista: Especialista } | null>(null);

  const hayFiltros = !!(buscar || especialidadId || sedeId || sinAgenda || estado !== 'todos');
  const lista = data?.datos ?? [];

  return (
    <>
      <Card className="animate-enter overflow-hidden">
        <ListToolbar
          buscar={buscar}
          onBuscar={(v) => update({ buscar: v })}
          placeholder="Nombre, documento o registro"
          estado={estado}
          onEstado={(v) => update({ estado: v })}
          counts={counts}
          mostrarEliminados={can(PERMISOS.especialistas.restaurar)}
        >
          <Select
            aria-label="Especialidad"
            value={extras.especialidad}
            onChange={(e) => update({ especialidad: e.target.value })}
            placeholder="Toda especialidad"
            options={especialidades.map((e) => ({ value: e.id, label: e.nombre }))}
            className="h-10 sm:w-48"
          />
          <Select
            aria-label="Sede"
            value={extras.sede}
            onChange={(e) => update({ sede: e.target.value })}
            placeholder="Todas las sedes"
            options={(sedes?.datos ?? []).map((s) => ({ value: s.id, label: s.nombre }))}
            className="h-10 sm:w-44"
          />
        </ListToolbar>

        {isError ? (
          <div className="flex flex-col items-center gap-3 py-14 text-center">
            <p className="text-sm text-muted">No fue posible cargar los especialistas.</p>
            <Button variant="secondary" size="sm" onClick={() => refetch()}>
              Reintentar
            </Button>
          </div>
        ) : isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : lista.length === 0 ? (
          <EmptyState
            title={hayFiltros ? 'Nada coincide con los filtros' : 'Registra a tu primer especialista'}
            description={
              hayFiltros ? 'Prueba con otra búsqueda, especialidad o sede.' : 'Agrégalos uno a uno o carga un archivo con todo el personal. Después define su agenda en cada sede.'
            }
            action={
              !hayFiltros &&
              can(PERMISOS.especialistas.crear) && (
                <Button icon={Plus} onClick={onNuevo}>
                  Nuevo especialista
                </Button>
              )
            }
          />
        ) : (
          <>
            <div className={cn('hidden gap-6 border-b border-line bg-cream/60 px-5 py-2.5 text-xs font-semibold text-muted xl:grid', COLUMNAS)}>
              <span>Profesional</span>
              <span>Especialidades</span>
              <span>Sedes</span>
              <span>Agenda semanal</span>
              <span>Estado</span>
              <span className="sr-only">Acciones</span>
            </div>
            <ul className={cn('divide-y divide-line', isFetching && 'opacity-70')}>
              {lista.map((e) => (
                <FilaEspecialista
                  key={e.id}
                  especialista={e}
                  onAbrir={() => onAbrir(e.id)}
                  onEliminar={can(PERMISOS.especialistas.eliminar) ? () => setConfirmar({ tipo: 'eliminar', especialista: e }) : undefined}
                  onRestaurar={can(PERMISOS.especialistas.restaurar) ? () => setConfirmar({ tipo: 'restaurar', especialista: e }) : undefined}
                />
              ))}
            </ul>
            {data && <Pagination paginacion={data.paginacion} onPageChange={(p) => update({ pagina: p })} disabled={isFetching} />}
          </>
        )}
      </Card>

      <ConfirmDialog
        open={!!confirmar}
        tone={confirmar?.tipo === 'restaurar' ? 'primary' : 'danger'}
        title={confirmar?.tipo === 'restaurar' ? 'Restaurar especialista' : 'Eliminar especialista'}
        message={
          confirmar?.tipo === 'restaurar'
            ? `Se restaurará a ${confirmar.especialista.nombre_completo} con las franjas de agenda que se eliminaron junto a su registro.`
            : confirmar
              ? `Se eliminará a ${confirmar.especialista.nombre_completo} y sus ${confirmar.especialista.agendas.length} franjas de agenda. Si solo deja de atender un tiempo, mejor regístrale una novedad o desactívalo.`
              : ''
        }
        confirmLabel={confirmar?.tipo === 'restaurar' ? 'Restaurar' : 'Eliminar'}
        isLoading={eliminarEspecialista.isPending || restaurarEspecialista.isPending}
        onConfirm={async () => {
          if (confirmar?.tipo === 'eliminar') await eliminarEspecialista.mutateAsync(confirmar.especialista.id).catch(() => undefined);
          if (confirmar?.tipo === 'restaurar') await restaurarEspecialista.mutateAsync(confirmar.especialista.id).catch(() => undefined);
          setConfirmar(null);
        }}
        onClose={() => setConfirmar(null)}
      />
    </>
  );
}

function FilaEspecialista({ especialista: e, onAbrir, onEliminar, onRestaurar }: { especialista: Especialista; onAbrir: () => void; onEliminar?: () => void; onRestaurar?: () => void }) {
  const eliminado = !!e.deleted_at;
  const diasConAgenda = new Set(e.agendas.flatMap((a) => a.dias));

  return (
    <li
      className={cn(
        'relative grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-x-3 gap-y-2.5 px-5 py-4 transition-colors hover:bg-cream/60 xl:gap-6',
        COLUMNAS,
        (!e.activo || eliminado) && 'opacity-60',
      )}
    >
      <button type="button" onClick={onAbrir} className="order-1 flex min-w-0 cursor-pointer items-center gap-3 text-left after:absolute after:inset-0 xl:order-none">
        <Avatar name={e.nombre_completo} size="sm" />
        <span className="min-w-0">
          <span className="block truncate font-semibold text-ink">{e.nombre_completo}</span>
          <span className="tabular block truncate text-xs text-muted">
            {e.tipo_documento?.codigo} {e.numero_documento}
            {e.registro_profesional && ` · ${e.registro_profesional}`}
          </span>
        </span>
      </button>
      {/* En pantallas medianas estos datos van en una segunda línea; en xl son columnas. */}
      <div className="order-4 col-span-3 flex flex-wrap items-center gap-x-4 gap-y-2 pl-12 xl:contents">
        <span className="flex flex-wrap gap-1">
          {e.especialidades.map((x) => (
            <Badge key={x.id} tone="mist">
              {x.nombre}
            </Badge>
          ))}
        </span>
        <span className="text-sm text-body xl:truncate">{e.sedes.length ? e.sedes.map((s) => s.nombre).join(' · ') : '—'}</span>
        {e.horas_semana > 0 ? (
          <span className="flex items-center gap-2 xl:block">
            <span className="tabular block text-sm font-semibold text-ink">{e.horas_semana.toLocaleString('es-CO')} h</span>
            <span className="flex gap-0.5 xl:mt-1" aria-label={`Atiende ${DIAS_SEMANA.filter((d) => diasConAgenda.has(d.value)).map((d) => d.nombre).join(', ')}`}>
              {DIAS_SEMANA.map((d) => (
                <span
                  key={d.value}
                  className={cn('flex size-5 items-center justify-center rounded text-[0.6rem] font-bold', diasConAgenda.has(d.value) ? 'bg-petrol text-white' : 'bg-sand text-subtle')}
                  aria-hidden
                >
                  {d.corto}
                </span>
              ))}
            </span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5 text-sm font-semibold text-danger">
            <Ban className="size-4" aria-hidden /> Sin agenda
          </span>
        )}
      </div>
      <span className="order-2 xl:order-none">
        <StatusBadge value={eliminado ? 'deleted' : e.activo ? 'active' : 'inactive'} />
      </span>
      <span className="relative z-10 order-3 flex justify-end xl:order-none">
        {eliminado
          ? onRestaurar && <Button size="sm" variant="ghost" iconOnly icon={RotateCcw} aria-label={`Restaurar a ${e.nombre_completo}`} onClick={onRestaurar} />
          : onEliminar && <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Eliminar a ${e.nombre_completo}`} onClick={onEliminar} />}
      </span>
    </li>
  );
}

function AgendaPorSede({ params, onAbrir }: { params: Params; onAbrir: (id: number) => void }) {
  const { extras, update } = params;
  const { data: sedesData, isLoading: cargandoSedes } = useSedes({ por_pagina: 100, activo: true });
  const sedes = sedesData?.datos ?? [];
  const sedeId = extras.sede ? Number(extras.sede) : sedes[0]?.id;
  const especialidadId = extras.especialidad ? Number(extras.especialidad) : undefined;
  const { data: agendas = [], isLoading, isFetching } = useAgendas({ sede_id: sedeId, especialidad_id: especialidadId }, !!sedeId);
  const { data: especialidades = [] } = useEspecialidades();
  const sede = sedes.find((s) => s.id === sedeId);

  const profesionales = new Set(agendas.map((a) => a.especialista_id)).size;
  const horas = agendas.reduce((s, a) => s + a.horas_semana, 0);

  if (!cargandoSedes && sedes.length === 0) {
    return (
      <Card>
        <EmptyState title="No hay sedes activas" description="Registra las sedes en Prestadores y sedes para poder asignarles agenda." />
      </Card>
    );
  }

  return (
    <Card className="animate-enter overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select
            aria-label="Sede"
            value={sedeId ?? ''}
            onChange={(e) => update({ sede: e.target.value })}
            options={sedes.map((s) => ({ value: s.id, label: `${s.nombre} · ${s.prestador?.nombre_comercial || s.prestador?.razon_social}` }))}
            className="h-10 sm:w-72"
          />
          <Select
            aria-label="Especialidad"
            value={extras.especialidad}
            onChange={(e) => update({ especialidad: e.target.value })}
            placeholder="Toda especialidad"
            options={especialidades.map((e) => ({ value: e.id, label: e.nombre }))}
            className="h-10 sm:w-52"
          />
        </div>
        <p className="tabular text-sm text-muted">
          {profesionales} {profesionales === 1 ? 'profesional' : 'profesionales'} · {horas.toLocaleString('es-CO', { maximumFractionDigits: 1 })} h por semana
        </p>
      </div>
      <div className={cn('p-4 sm:p-5', isFetching && 'opacity-70')}>
        {isLoading || cargandoSedes ? (
          <Skeleton className="h-96" />
        ) : agendas.length === 0 ? (
          <EmptyState
            className="py-12"
            title="Esta sede no tiene agenda"
            description="Abre un especialista y agrégale franjas en esta sede para que Kizuna pueda programar pacientes aquí."
          />
        ) : (
          <SemanaAgenda
            dias={sede?.dias_atencion.length ? [...sede.dias_atencion].sort() : undefined}
            bloques={agendas.map((a) => ({
              id: a.id,
              dias: a.dias,
              inicio: a.hora_inicio,
              fin: a.hora_fin,
              titulo: a.especialista ? `${a.especialista.nombres.split(' ')[0]} ${a.especialista.apellidos.split(' ')[0]}` : 'Especialista',
              detalle: [a.especialidad?.nombre, a.consultorio && `Cons. ${a.consultorio}`].filter(Boolean).join(' · '),
              tono: a.especialidad_id,
              onClick: () => onAbrir(a.especialista_id),
            }))}
          />
        )}
        {agendas.length > 0 && (
          <p className="mt-4 flex items-center gap-1.5 text-xs text-muted">
            <CalendarClock className="size-3.5" aria-hidden /> El color indica la especialidad. Haz clic en una franja para ver al profesional.
          </p>
        )}
      </div>
    </Card>
  );
}
