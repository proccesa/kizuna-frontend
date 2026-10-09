import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Ban, Check, Plus, Trash2, UsersRound } from 'lucide-react';
import { Badge, Button, ConfirmDialog, Drawer, EmptyState, FilterTabs, Pagination, SearchInput, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatCOP, formatDate, formatNumber } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useContrato, useContratoCups, useContratacionMutations } from '../hooks/useContratacion';
import { formatearValor } from '../schema';
import type { Contrato, ContratoCups } from '../types';
import { AgregarCupsContratoModal } from './AgregarCupsContratoModal';
import { ContratoForm } from './ContratoForm';
import { BarraCumplimiento, ResumenCumplimiento } from './Cumplimiento';
import { EstadoContratoBadge } from './EstadoContratoBadge';
import { ModalidadBadge } from './ModalidadBadge';
import { PoblacionModal } from './PoblacionModal';

type Pestana = 'cups' | 'poblaciones' | 'datos';

interface ContratoDrawerProps {
  /** Id del contrato, `'nuevo'` para crear o `null` si está cerrado. */
  abierto: number | 'nuevo' | null;
  /** Entidad preseleccionada al crear. */
  entidadId?: number;
  onAbrir: (id: number) => void;
  onClose: () => void;
}

export function ContratoDrawer({ abierto, entidadId, onAbrir, onClose }: ContratoDrawerProps) {
  const creando = abierto === 'nuevo';
  const id = typeof abierto === 'number' ? abierto : null;
  const { data: contrato, isLoading } = useContrato(id);
  const [pestana, setPestana] = useState<Pestana>('cups');

  return (
    <Drawer open={abierto !== null} onClose={onClose} width="lg" hideTitle={!creando} title={creando ? 'Nuevo contrato' : contrato ? `Contrato ${contrato.numero}` : 'Contrato'}>
      {creando ? (
        <ContratoForm
          contrato={null}
          entidadId={entidadId}
          onCancelar={onClose}
          onGuardado={(c) => {
            setPestana('cups');
            onAbrir(c.id);
          }}
        />
      ) : isLoading || !contrato ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <Detalle contrato={contrato} pestana={pestana} onPestana={setPestana} />
      )}
    </Drawer>
  );
}

function Detalle({ contrato, pestana, onPestana }: { contrato: Contrato; pestana: Pestana; onPestana: (p: Pestana) => void }) {
  const { can } = useAuth();
  const eliminado = !!contrato.deleted_at;
  const sinPortafolio = contrato.cups_sin_portafolio_count ?? 0;

  return (
    <>
      <header className="px-6 pt-6 pb-4">
        <div className="pr-10">
          <p className="text-sm font-semibold text-muted">{contrato.entidad.razon_social}</p>
          <h2 className="tabular font-display text-2xl leading-tight font-bold text-ink">{contrato.numero}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <ModalidadBadge modalidad={contrato.modalidad.codigo} />
            <EstadoContratoBadge estado={contrato.estado} />
            <Badge tone="mist">{contrato.regimen.nombre}</Badge>
            {eliminado && <Badge tone="danger">Eliminado</Badge>}
          </div>
          <p className="tabular mt-2 text-sm text-body">
            {formatDate(contrato.fecha_inicio)} – {formatDate(contrato.fecha_fin)}
            {contrato.valor > 0 && <> · {formatCOP(contrato.valor)}</>}
          </p>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Cifra titulo="CUPS pactados" valor={contrato.cups_count} />
          <Cifra titulo="Sin portafolio" valor={sinPortafolio} tono={sinPortafolio ? 'danger' : undefined} />
          <Cifra titulo="Sedes" valor={contrato.sedes_count} tono={contrato.sedes_count ? undefined : 'danger'} />
          <Cifra titulo="Pacientes" valor={contrato.pacientes_count} />
        </dl>
        {contrato.cumplimiento && <ResumenCumplimiento cumplimiento={contrato.cumplimiento} />}
        {contrato.sedes_count === 0 && (
          <p className="mt-3 flex items-center gap-1.5 text-sm font-medium text-danger">
            <Ban className="size-4 shrink-0" aria-hidden /> Sin sedes: Kizuna no sabe dónde programar a estos pacientes. Agrégalas en Datos.
          </p>
        )}

        <FilterTabs
          aria-label="Secciones del contrato"
          className="mt-5"
          value={pestana}
          onChange={onPestana}
          tabs={[
            { value: 'cups', label: 'CUPS', count: contrato.cups_count },
            { value: 'poblaciones', label: 'Poblaciones', count: contrato.poblaciones_count },
            ...(can(PERMISOS.contratos.editar) && !eliminado ? [{ value: 'datos' as const, label: 'Datos' }] : []),
          ]}
        />
      </header>
      <div className="border-t border-line">
        {pestana === 'cups' && <PestanaCups contrato={contrato} puedeEditar={can(PERMISOS.contratos.editar) && !eliminado} />}
        {pestana === 'poblaciones' && <PestanaPoblaciones contrato={contrato} puedeCrear={can(PERMISOS.poblaciones.crear) && !eliminado} />}
        {pestana === 'datos' && <ContratoForm contrato={contrato} onGuardado={() => onPestana('cups')} onCancelar={() => onPestana('cups')} />}
      </div>
    </>
  );
}

function Cifra({ titulo, valor, tono }: { titulo: string; valor: number; tono?: 'danger' }) {
  return (
    <div className="rounded-2xl bg-cream px-3 py-2.5">
      <dt className="text-xs font-semibold text-muted">{titulo}</dt>
      <dd className={cn('tabular font-display text-xl font-bold', tono === 'danger' ? 'text-danger' : 'text-ink')}>{formatNumber(valor)}</dd>
    </div>
  );
}

function AvanceCups({ cups: c, modalidad }: { cups: ContratoCups; modalidad: string }) {
  const meta = modalidad === 'PGP' ? c.cantidad : null;
  if (!c.realizadas && !c.programadas && !meta) return null;
  const detalle = [
    meta ? `${formatNumber(c.realizadas)} de ${formatNumber(meta)} realizadas` : `${formatNumber(c.realizadas)} realizadas`,
    c.programadas ? `${formatNumber(c.programadas)} programadas` : null,
    modalidad === 'EVENTO' && c.tarifa && c.realizadas ? formatCOP(c.realizadas * c.tarifa) : null,
  ].filter(Boolean);

  return (
    <div className="mt-2 max-w-xs">
      <p className="tabular text-xs text-muted">{detalle.join(' · ')}</p>
      {meta ? <BarraCumplimiento className="mt-1 h-1.5" realizado={(c.realizadas / meta) * 100} comprometido={((c.realizadas + c.programadas) / meta) * 100} /> : null}
    </div>
  );
}

function PestanaCups({ contrato, puedeEditar }: { contrato: Contrato; puedeEditar: boolean }) {
  const [buscar, setBuscar] = useState('');
  const [pagina, setPagina] = useState(1);
  const [soloSinPortafolio, setSoloSinPortafolio] = useState(false);
  const [agregar, setAgregar] = useState(false);
  const [quitar, setQuitar] = useState<ContratoCups | null>(null);
  const { data, isLoading, isFetching } = useContratoCups(contrato.id, { buscar: buscar || undefined, sin_portafolio: soloSinPortafolio || undefined, pagina, por_pagina: 20 });
  const { actualizarCups, quitarCups } = useContratacionMutations();
  const cups = data?.datos ?? [];

  const guardar = (c: ContratoCups, campo: 'cantidad' | 'tarifa', texto: string) => {
    const valor = texto.replace(/\D/g, '') ? Number(texto.replace(/\D/g, '')) : null;
    if (valor === c[campo]) return;
    actualizarCups.mutate({ id: contrato.id, cupsId: c.id, payload: { cantidad: c.cantidad, tarifa: c.tarifa, [campo]: valor } });
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
          <SearchInput
            value={buscar}
            onChange={(v) => {
              setBuscar(v);
              setPagina(1);
            }}
            placeholder="Código o nombre"
            className="sm:w-56"
          />
          {(contrato.cups_sin_portafolio_count ?? 0) > 0 && (
            <button
              type="button"
              aria-pressed={soloSinPortafolio}
              onClick={() => {
                setSoloSinPortafolio((v) => !v);
                setPagina(1);
              }}
              className={cn(
                'flex h-10 cursor-pointer items-center gap-1.5 rounded-xl px-3 text-sm font-semibold transition-colors',
                soloSinPortafolio ? 'bg-danger text-white' : 'bg-danger-soft text-danger hover:brightness-95',
              )}
            >
              <Ban className="size-4" aria-hidden /> {contrato.cups_sin_portafolio_count} sin portafolio
            </button>
          )}
        </div>
        {puedeEditar && (
          <Button size="sm" icon={Plus} onClick={() => setAgregar(true)}>
            Agregar CUPS
          </Button>
        )}
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : cups.length === 0 ? (
        <EmptyState
          className="py-10"
          title={buscar || soloSinPortafolio ? 'Nada coincide' : 'Sin CUPS pactados'}
          description={buscar || soloSinPortafolio ? 'Prueba con otra búsqueda.' : 'Agrega los procedimientos que cubre el contrato: Kizuna solo programa servicios pactados.'}
          action={!buscar && !soloSinPortafolio && puedeEditar && <Button icon={Plus} onClick={() => setAgregar(true)}>Agregar CUPS</Button>}
        />
      ) : (
        <>
          <ul className={cn('divide-y divide-line rounded-2xl border border-line', isFetching && 'opacity-70')}>
            {cups.map((c) => (
              <li key={c.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:gap-3">
                <div className="min-w-0 flex-1">
                  <p className="tabular font-display font-bold text-ink">{c.codigo}</p>
                  <p className="text-xs leading-snug text-body">{c.nombre}</p>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs font-semibold">
                    {c.en_portafolio ? (
                      <span className="flex items-center gap-1 text-success">
                        <Check className="size-3.5" aria-hidden /> En portafolio
                      </span>
                    ) : (
                      <Link to={`/portafolio?buscar=${c.codigo}`} className="flex items-center gap-1 text-danger hover:underline">
                        <Ban className="size-3.5" aria-hidden /> No está en el portafolio de las sedes
                      </Link>
                    )}
                    {!c.con_especialidad && (
                      <Link to={`/especialidades?buscar=${c.codigo}`} className="flex items-center gap-1 text-danger hover:underline">
                        <Ban className="size-3.5" aria-hidden /> Sin especialidad
                      </Link>
                    )}
                  </div>
                  <AvanceCups cups={c} modalidad={contrato.modalidad.codigo} />
                </div>
                <div className="flex items-end gap-2">
                  <label className="text-xs font-semibold text-muted">
                    Cantidad
                    <CampoNumero valor={c.cantidad} disabled={!puedeEditar} onGuardar={(t) => guardar(c, 'cantidad', t)} etiqueta={`Cantidad de ${c.codigo}`} />
                  </label>
                  <label className="text-xs font-semibold text-muted">
                    Tarifa
                    <CampoNumero valor={c.tarifa} prefijo="$" disabled={!puedeEditar} onGuardar={(t) => guardar(c, 'tarifa', t)} etiqueta={`Tarifa de ${c.codigo}`} />
                  </label>
                  {puedeEditar && <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Quitar ${c.codigo} del contrato`} onClick={() => setQuitar(c)} className="mb-0.5" />}
                </div>
              </li>
            ))}
          </ul>
          {data && data.paginacion.total_paginas > 1 && <Pagination paginacion={data.paginacion} onPageChange={setPagina} disabled={isFetching} />}
        </>
      )}

      <AgregarCupsContratoModal open={agregar} contrato={contrato} onClose={() => setAgregar(false)} />
      <ConfirmDialog
        open={!!quitar}
        title="Quitar CUPS del contrato"
        message={quitar ? `Kizuna dejará de programar ${quitar.codigo} para los pacientes de este contrato.` : ''}
        confirmLabel="Quitar"
        isLoading={quitarCups.isPending}
        onConfirm={async () => {
          if (quitar) await quitarCups.mutateAsync({ id: contrato.id, cupsId: quitar.id }).catch(() => undefined);
          setQuitar(null);
        }}
        onClose={() => setQuitar(null)}
      />
    </div>
  );
}

/** Número editable en línea: guarda al salir del campo o con Enter. */
function CampoNumero({ valor, prefijo, disabled, onGuardar, etiqueta }: { valor: number | null; prefijo?: string; disabled: boolean; onGuardar: (texto: string) => void; etiqueta: string }) {
  const inicial = valor !== null ? formatearValor(String(Math.round(valor))) : '';
  const [texto, setTexto] = useState(inicial);
  const [base, setBase] = useState(inicial);
  if (base !== inicial) {
    setBase(inicial);
    setTexto(inicial);
  }

  return (
    <span className="relative mt-1 block">
      {prefijo && <span className="pointer-events-none absolute top-1/2 z-10 left-2.5 -translate-y-1/2 text-xs text-muted">{prefijo}</span>}
      <input
        aria-label={etiqueta}
        inputMode="numeric"
        disabled={disabled}
        value={texto}
        placeholder="—"
        onChange={(e) => setTexto(formatearValor(e.target.value))}
        onBlur={() => texto !== inicial && onGuardar(texto)}
        onKeyDown={(e) => e.key === 'Enter' && (e.target as HTMLInputElement).blur()}
        className={cn(
          'tabular h-9 w-28 rounded-lg border border-line-strong bg-surface px-2.5 text-right text-sm text-ink outline-none focus:border-petrol disabled:border-transparent disabled:bg-transparent',
          prefijo && 'pl-6',
        )}
      />
    </span>
  );
}

function PestanaPoblaciones({ contrato, puedeCrear }: { contrato: Contrato; puedeCrear: boolean }) {
  const [crear, setCrear] = useState(false);
  const poblaciones = contrato.poblaciones ?? [];

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">Los grupos de pacientes de este contrato. Cada uno se actualiza con un cargue de archivo.</p>
        {puedeCrear && (
          <Button size="sm" icon={Plus} onClick={() => setCrear(true)} className="shrink-0">
            Nueva población
          </Button>
        )}
      </div>
      {poblaciones.length === 0 ? (
        <EmptyState
          className="py-10"
          title="Sin poblaciones"
          description="Crea la población del contrato y carga el archivo de pacientes que envía la entidad."
          action={puedeCrear && <Button icon={UsersRound} onClick={() => setCrear(true)}>Nueva población</Button>}
        />
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {poblaciones.map((p) => (
            <li key={p.id}>
              <Link to={`/poblaciones?ver=${p.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-cream">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-ink">{p.nombre}</span>
                  <span className="tabular block text-xs text-muted">{formatNumber(p.pacientes_count)} pacientes</span>
                </span>
                {!p.cargue_al_dia && (
                  <Badge tone="danger">
                    <Ban className="size-3" aria-hidden /> Sin cargue del mes
                  </Badge>
                )}
                <ArrowRight className="size-4 text-subtle" aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      )}
      <PoblacionModal open={crear} poblacion={null} contratoId={contrato.id} onClose={() => setCrear(false)} />
    </div>
  );
}
