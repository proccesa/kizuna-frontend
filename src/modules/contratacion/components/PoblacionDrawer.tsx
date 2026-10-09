import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, FileSpreadsheet, Pencil, Upload } from 'lucide-react';
import { Badge, Button, Drawer, EmptyState, FilterTabs, Pagination, SearchInput, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { usePacientes, usePoblacion } from '../hooks/useContratacion';
import type { Poblacion } from '../types';
import { CargarPoblacionModal } from './CargarPoblacionModal';
import { ModalidadBadge } from './ModalidadBadge';
import { PoblacionModal } from './PoblacionModal';

type Pestana = 'pacientes' | 'cargues';

interface PoblacionDrawerProps {
  id: number | null;
  onClose: () => void;
}

export function PoblacionDrawer({ id, onClose }: PoblacionDrawerProps) {
  const { data: poblacion, isLoading } = usePoblacion(id);

  return (
    <Drawer open={id !== null} onClose={onClose} width="lg" hideTitle title={poblacion?.nombre ?? 'Población'}>
      {isLoading || !poblacion ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-72" />
        </div>
      ) : (
        <Detalle key={poblacion.id} poblacion={poblacion} />
      )}
    </Drawer>
  );
}

function Detalle({ poblacion }: { poblacion: Poblacion }) {
  const { can } = useAuth();
  const [pestana, setPestana] = useState<Pestana>('pacientes');
  const [cohorte, setCohorte] = useState<string | null>(null);
  const [cargar, setCargar] = useState(false);
  const [editar, setEditar] = useState(false);
  const eliminada = !!poblacion.deleted_at;
  const contrato = poblacion.contrato;

  return (
    <>
      <header className="px-6 pt-6 pb-4">
        <div className="pr-10">
          {contrato && (
            <Link to={`/contratos?ver=${contrato.id}`} className="text-sm font-semibold text-muted hover:underline">
              {contrato.entidad?.sigla || contrato.entidad?.razon_social} · <span className="tabular">{contrato.numero}</span>
            </Link>
          )}
          <h2 className="font-display text-2xl leading-tight font-bold text-ink">{poblacion.nombre}</h2>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {contrato?.modalidad && <ModalidadBadge modalidad={contrato.modalidad.codigo} />}
            {contrato?.regimen && <Badge tone="mist">{contrato.regimen.nombre}</Badge>}
            {!poblacion.activo && <Badge>Inactiva</Badge>}
            {eliminada && <Badge tone="danger">Eliminada</Badge>}
          </div>
          {poblacion.descripcion && <p className="mt-2 text-sm text-body">{poblacion.descripcion}</p>}
        </div>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="tabular font-display text-4xl leading-none font-bold text-ink">{formatNumber(poblacion.pacientes_count)}</p>
            <p className="mt-1 text-sm text-muted">pacientes activos</p>
          </div>
          {!eliminada && (
            <div className="flex gap-2">
              {can(PERMISOS.poblaciones.editar) && (
                <Button size="sm" variant="secondary" icon={Pencil} onClick={() => setEditar(true)}>
                  Editar
                </Button>
              )}
              {can(PERMISOS.poblaciones.cargar) && (
                <Button size="sm" icon={Upload} onClick={() => setCargar(true)}>
                  Cargar archivo
                </Button>
              )}
            </div>
          )}
        </div>

        <div className={cn('mt-4 flex items-center gap-2 rounded-2xl px-4 py-3 text-sm', poblacion.cargue_al_dia ? 'bg-cream text-body' : 'bg-danger-soft font-medium text-danger')}>
          {poblacion.cargue_al_dia ? (
            <>
              <FileSpreadsheet className="size-4 shrink-0 text-success" aria-hidden />
              Último cargue: {formatDateTime(poblacion.ultimo_cargue_en)}
              {poblacion.cargues?.[0] && <span className="truncate text-muted">· {poblacion.cargues[0].archivo}</span>}
            </>
          ) : (
            <>
              <AlertTriangle className="size-4 shrink-0" aria-hidden />
              {poblacion.ultimo_cargue_en ? `Sin cargue este mes (el último fue el ${formatDate(poblacion.ultimo_cargue_en)})` : 'Sin cargues todavía'}: los pacientes nuevos no se programarán.
            </>
          )}
        </div>

        {(poblacion.cohortes?.length ?? 0) > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold text-muted">Cohortes</p>
            <div className="flex flex-wrap gap-1.5">
              {poblacion.cohortes!.map((c) => {
                const activa = cohorte === c.nombre;
                return (
                  <button
                    key={c.nombre}
                    type="button"
                    aria-pressed={activa}
                    onClick={() => {
                      setCohorte(activa ? null : c.nombre);
                      setPestana('pacientes');
                    }}
                    className={cn(
                      'flex cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors',
                      activa ? 'bg-petrol text-white' : 'bg-mist text-mist-ink hover:brightness-95',
                    )}
                  >
                    {c.nombre} <span className="tabular opacity-75">{formatNumber(c.pacientes)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <FilterTabs
          aria-label="Secciones de la población"
          className="mt-5"
          value={pestana}
          onChange={setPestana}
          tabs={[
            { value: 'pacientes', label: 'Pacientes' },
            { value: 'cargues', label: 'Cargues', count: poblacion.cargues?.length },
          ]}
        />
      </header>
      <div className="border-t border-line">
        {pestana === 'pacientes' ? <Pacientes poblacion={poblacion} cohorte={cohorte} onQuitarCohorte={() => setCohorte(null)} /> : <Cargues poblacion={poblacion} />}
      </div>

      <CargarPoblacionModal open={cargar} poblacion={poblacion} onClose={() => setCargar(false)} />
      <PoblacionModal open={editar} poblacion={poblacion} onClose={() => setEditar(false)} />
    </>
  );
}

const SEXO = { F: 'Femenino', M: 'Masculino', I: 'Indeterminado' } as const;

function Pacientes({ poblacion, cohorte, onQuitarCohorte }: { poblacion: Poblacion; cohorte: string | null; onQuitarCohorte: () => void }) {
  const [buscar, setBuscar] = useState('');
  const [pagina, setPagina] = useState(1);
  const [retirados, setRetirados] = useState(false);
  const filtros = { buscar: buscar || undefined, cohorte: cohorte ?? undefined, incluir_retirados: retirados || undefined, pagina, por_pagina: 20 };
  const { data, isLoading, isFetching } = usePacientes(poblacion.id, filtros);
  const pacientes = data?.datos ?? [];

  return (
    <div className="p-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput
          value={buscar}
          onChange={(v) => {
            setBuscar(v);
            setPagina(1);
          }}
          placeholder="Documento o nombre"
          className="sm:w-64"
        />
        <div className="flex flex-wrap items-center gap-2">
          {cohorte && (
            <button type="button" onClick={onQuitarCohorte} className="cursor-pointer rounded-full bg-petrol px-3 py-1 text-xs font-semibold text-white">
              {cohorte} ✕
            </button>
          )}
          <label className="flex cursor-pointer items-center gap-2 text-sm text-body">
            <input
              type="checkbox"
              checked={retirados}
              onChange={(e) => {
                setRetirados(e.target.checked);
                setPagina(1);
              }}
              className="size-4 accent-petrol"
            />
            Incluir retirados
          </label>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-64" />
      ) : pacientes.length === 0 ? (
        <EmptyState
          className="py-10"
          title={buscar || cohorte ? 'Nada coincide' : 'Sin pacientes'}
          description={buscar || cohorte ? 'Prueba con otra búsqueda o cohorte.' : 'Carga el archivo de pacientes que envía la entidad.'}
        />
      ) : (
        <>
          <ul className={cn('divide-y divide-line rounded-2xl border border-line', isFetching && 'opacity-70')}>
            {pacientes.map((p) => (
              <li key={p.id} className={cn('flex flex-col gap-1.5 px-4 py-3 sm:flex-row sm:items-center sm:gap-4', !p.activo_en_poblacion && 'opacity-60')}>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-ink">{p.nombre_completo}</p>
                  <p className="tabular text-xs text-muted">
                    {p.tipo_documento?.codigo} {p.numero_documento} · {p.edad} años · {SEXO[p.sexo]}
                    {p.municipio && ` · ${p.municipio.nombre}`}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {p.cohortes.map((c) => (
                    <Badge key={c} tone="mist">
                      {c}
                    </Badge>
                  ))}
                  {!p.activo_en_poblacion && <Badge>Retirado</Badge>}
                </div>
              </li>
            ))}
          </ul>
          {data && <Pagination paginacion={data.paginacion} onPageChange={setPagina} disabled={isFetching} />}
        </>
      )}
    </div>
  );
}

function Cargues({ poblacion }: { poblacion: Poblacion }) {
  const cargues = poblacion.cargues ?? [];
  if (!cargues.length) return <p className="m-6 rounded-2xl bg-cream px-4 py-8 text-center text-sm text-muted">Todavía no hay cargues.</p>;

  return (
    <ul className="m-6 divide-y divide-line rounded-2xl border border-line">
      {cargues.map((c) => (
        <li key={c.id} className="px-4 py-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="flex min-w-0 items-center gap-2 font-semibold text-ink">
              <FileSpreadsheet className="size-4 shrink-0 text-muted" aria-hidden />
              <span className="truncate">{c.archivo}</span>
            </p>
            <Badge tone={c.modo === 'REEMPLAZAR' ? 'petrol' : 'mist'}>{c.modo === 'REEMPLAZAR' ? 'Cargue del mes' : 'Agregar'}</Badge>
          </div>
          <p className="tabular mt-1 text-xs text-muted">
            {formatDateTime(c.created_at)}
            {c.usuario && ` · ${c.usuario.name}`} · {formatNumber(c.total)} filas: {formatNumber(c.nuevos)} nuevos, {formatNumber(c.actualizados)} actualizados,{' '}
            {formatNumber(c.retirados)} retirados
            {c.con_errores > 0 && <span className="font-semibold text-danger">, {formatNumber(c.con_errores)} con errores</span>}
          </p>
        </li>
      ))}
    </ul>
  );
}
