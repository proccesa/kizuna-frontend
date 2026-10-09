import { useState } from 'react';
import { CalendarClock, Check, Pencil, Wrench, X } from 'lucide-react';
import { Badge, Button, Drawer, Field, Input, Modal, Select, Skeleton, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime } from '@/lib/format';
import { notify } from '@/lib/toast';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useSedes } from '@/modules/red/hooks/useRed';
import { hoyISO } from '@/modules/talento/schema';
import { useInventarioMutations, useItems, useSalas, useUnidad } from '../hooks/useInventario';
import { ESTADOS_UNIDAD, type Mantenimiento, type TipoItem, type Unidad, type UnidadPayload } from '../types';

interface UnidadDrawerProps {
  /** Id de la unidad, 'nuevo' para registrar o null si está cerrado. */
  abierto: number | 'nuevo' | null;
  tipo: TipoItem;
  onClose: () => void;
}

/** Equipo biomédico o caja de instrumental: datos, estado y mantenimientos. */
export function UnidadDrawer({ abierto, tipo, onClose }: UnidadDrawerProps) {
  const id = typeof abierto === 'number' ? abierto : null;
  const { data: unidad, isLoading } = useUnidad(id);
  const [editando, setEditando] = useState(false);
  const nombre = tipo === 'EQUIPO' ? 'equipo' : 'caja';

  return (
    <Drawer
      open={abierto !== null}
      onClose={() => {
        setEditando(false);
        onClose();
      }}
      width="lg"
      title={abierto === 'nuevo' ? `Registrar ${nombre}` : (unidad?.codigo ?? nombre)}
      hideTitle={abierto !== 'nuevo' && !editando}
    >
      {abierto === 'nuevo' ? (
        <Formulario unidad={null} tipo={tipo} onListo={onClose} />
      ) : isLoading || !unidad ? (
        <div className="space-y-4 p-6">
          <Skeleton className="h-24" />
          <Skeleton className="h-64" />
        </div>
      ) : editando ? (
        <Formulario unidad={unidad} tipo={tipo} onListo={() => setEditando(false)} />
      ) : (
        <Detalle unidad={unidad} onEditar={() => setEditando(true)} />
      )}
    </Drawer>
  );
}

function Detalle({ unidad: u, onEditar }: { unidad: Unidad; onEditar: () => void }) {
  const { can } = useAuth();
  const gestionar = can(PERMISOS.inventario.gestionar);
  const { cerrarMantenimiento } = useInventarioMutations();
  const [programar, setProgramar] = useState(false);
  const estado = ESTADOS_UNIDAD.find((e) => e.value === u.estado);
  const esEquipo = u.item.tipo === 'EQUIPO';

  const dato = (titulo: string, valor: string | null | undefined, tono?: 'bloqueo' | 'aviso') => (
    <div className={cn('rounded-xl px-3 py-2.5', tono === 'bloqueo' ? 'bg-danger-soft' : tono === 'aviso' ? 'bg-warning-soft' : 'bg-cream')}>
      <dt className="text-xs font-semibold text-muted">{titulo}</dt>
      <dd className={cn('text-sm font-semibold', tono === 'bloqueo' ? 'text-danger' : tono === 'aviso' ? 'text-warning' : 'text-ink')}>{valor || '—'}</dd>
    </div>
  );
  const tono = (campo: 'proximo_mantenimiento' | 'calibracion_vence') => u.alertas.find((a) => a.tipo === campo)?.nivel;

  return (
    <>
      <header className="px-6 pt-6 pb-4 pr-16">
        <p className="text-sm font-semibold text-muted">{u.item.nombre}</p>
        <h2 className="tabular font-display text-2xl font-bold text-ink">{u.codigo}</h2>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Badge tone={estado?.tono} dot>
            {estado?.label}
          </Badge>
          <Badge tone="mist">{u.sede.nombre}</Badge>
          {esEquipo && <Badge>{u.sala ? `Fijo en ${u.sala.nombre}` : 'Móvil'}</Badge>}
        </div>
      </header>
      <div className="space-y-5 border-t border-line px-6 py-5">
        <dl className="grid grid-cols-2 gap-2">
          {dato('Marca y modelo', [u.marca, u.modelo].filter(Boolean).join(' · '))}
          {dato('Serie', u.serie)}
          {esEquipo && dato('Registro INVIMA', u.registro_invima)}
          {esEquipo && dato('Último mantenimiento', u.ultimo_mantenimiento && formatDate(u.ultimo_mantenimiento))}
          {esEquipo && dato('Próximo mantenimiento', u.proximo_mantenimiento && formatDate(u.proximo_mantenimiento), tono('proximo_mantenimiento'))}
          {u.item.requiere_calibracion && dato('Calibración vence', u.calibracion_vence ? formatDate(u.calibracion_vence) : 'Sin registrar', tono('calibracion_vence') ?? (u.calibracion_vence ? undefined : 'bloqueo'))}
          {u.item.tipo === 'INSTRUMENTAL' && dato('Esterilización entre usos', u.item.minutos_esterilizacion ? `${u.item.minutos_esterilizacion} min` : null)}
        </dl>
        {u.observaciones && <p className="text-sm text-body">{u.observaciones}</p>}
        {u.alertas.length > 0 && (
          <ul className="space-y-1.5">
            {u.alertas.map((a) => (
              <li key={a.tipo} className={cn('rounded-xl px-3 py-2 text-sm font-medium', a.nivel === 'bloqueo' ? 'bg-danger-soft text-danger' : 'bg-warning-soft text-warning')}>
                {a.mensaje}
                {a.nivel === 'bloqueo' ? ': Kizuna no lo usa para programar.' : a.tipo === 'proximo_mantenimiento' && a.mensaje.includes('vencido') ? ': se sigue usando, con aviso.' : ''}
              </li>
            ))}
          </ul>
        )}
        {gestionar && (
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" icon={Pencil} onClick={onEditar}>
              Editar
            </Button>
            <Button variant="secondary" icon={Wrench} onClick={() => setProgramar(true)}>
              Programar mantenimiento
            </Button>
          </div>
        )}
      </div>

      <div className="border-t border-line px-6 py-5">
        <p className="mb-3 text-sm font-semibold text-ink">Mantenimientos</p>
        {!u.mantenimientos?.length ? (
          <p className="rounded-2xl bg-cream px-4 py-6 text-center text-sm text-muted">Sin mantenimientos registrados.</p>
        ) : (
          <ul className="divide-y divide-line rounded-2xl border border-line">
            {u.mantenimientos.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">
                    {{ PREVENTIVO: 'Preventivo', CORRECTIVO: 'Correctivo', CALIBRACION: 'Calibración' }[m.tipo]}
                    {m.responsable && <span className="font-normal text-muted"> · {m.responsable}</span>}
                  </p>
                  <p className="tabular text-xs text-muted">
                    {formatDateTime(m.inicio)} – {formatDateTime(m.fin)}
                  </p>
                </div>
                {m.estado === 'PROGRAMADO' ? (
                  gestionar ? (
                    <span className="flex gap-1">
                      <Button size="sm" variant="secondary" icon={Check} onClick={() => cerrarMantenimiento.mutate({ id: m.id, estado: 'TERMINADO' })}>
                        Terminar
                      </Button>
                      <Button size="sm" variant="ghost" iconOnly icon={X} aria-label="Cancelar mantenimiento" onClick={() => cerrarMantenimiento.mutate({ id: m.id, estado: 'CANCELADO' })} />
                    </span>
                  ) : (
                    <Badge tone="warning">Programado</Badge>
                  )
                ) : (
                  <Badge tone={m.estado === 'TERMINADO' ? 'success' : 'neutral'}>{m.estado === 'TERMINADO' ? 'Terminado' : 'Cancelado'}</Badge>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
      <MantenimientoModal open={programar} unidad={u} onClose={() => setProgramar(false)} />
    </>
  );
}

function Formulario({ unidad, tipo, onListo }: { unidad: Unidad | null; tipo: TipoItem; onListo: () => void }) {
  const { guardarUnidad } = useInventarioMutations();
  const { data: items } = useItems({ tipo, activo: true, por_pagina: 200 });
  const { data: sedes } = useSedes({ activo: true, por_pagina: 100 });
  const [v, setV] = useState<UnidadPayload>({
    item_id: unidad?.item_id,
    sede_id: unidad?.sede_id,
    sala_id: unidad?.sala_id ?? null,
    codigo: unidad?.codigo ?? '',
    serie: unidad?.serie ?? '',
    marca: unidad?.marca ?? '',
    modelo: unidad?.modelo ?? '',
    registro_invima: unidad?.registro_invima ?? '',
    estado: unidad?.estado ?? 'OPERATIVO',
    ultimo_mantenimiento: unidad?.ultimo_mantenimiento ?? '',
    proximo_mantenimiento: unidad?.proximo_mantenimiento ?? '',
    calibracion_vence: unidad?.calibracion_vence ?? '',
    observaciones: unidad?.observaciones ?? '',
  });
  const { data: salas = [] } = useSalas({ sede_id: v.sede_id ?? undefined }, tipo === 'EQUIPO' && !!v.sede_id);
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const set = (c: UnidadPayload) => setV((p) => ({ ...p, ...c }));
  const err = (c: string) => errores[c]?.[0];
  const item = items?.datos.find((i) => i.id === v.item_id);
  const esEquipo = tipo === 'EQUIPO';

  const guardar = async () => {
    const vacio = (s?: string | null) => (s && s.trim() !== '' ? s.trim() : null);
    try {
      await guardarUnidad.mutateAsync({
        id: unidad?.id ?? null,
        payload: {
          ...v,
          codigo: v.codigo?.trim(),
          serie: vacio(v.serie),
          marca: vacio(v.marca),
          modelo: vacio(v.modelo),
          registro_invima: vacio(v.registro_invima),
          ultimo_mantenimiento: vacio(v.ultimo_mantenimiento),
          proximo_mantenimiento: vacio(v.proximo_mantenimiento),
          calibracion_vence: vacio(v.calibracion_vence),
          observaciones: vacio(v.observaciones),
          sala_id: esEquipo ? v.sala_id : null,
        },
      });
      onListo();
    } catch (e) {
      const api = toApiError(e);
      setErrores(api.fieldErrors);
      if (!Object.keys(api.fieldErrors).length) notify.error(api.message);
    }
  };

  return (
    <div className="flex min-h-full flex-col">
      <div className="grid flex-1 content-start gap-4 px-6 pb-6 sm:grid-cols-2">
        <Field label={esEquipo ? 'Tipo de equipo' : 'Tipo de caja'} htmlFor="un-item" error={err('item_id')} required className="sm:col-span-2">
          <Select
            id="un-item"
            placeholder="Selecciona"
            value={v.item_id ?? ''}
            onChange={(e) => set({ item_id: Number(e.target.value) || undefined })}
            options={(items?.datos ?? []).map((i) => ({ value: i.id, label: `${i.nombre} · ${i.codigo}` }))}
            invalid={!!err('item_id')}
          />
        </Field>
        <Field label={esEquipo ? 'Placa de inventario' : 'Código de la caja'} htmlFor="un-codigo" error={err('codigo')} required>
          <Input id="un-codigo" value={v.codigo ?? ''} onChange={(e) => set({ codigo: e.target.value })} invalid={!!err('codigo')} />
        </Field>
        <Field label="Estado" htmlFor="un-estado">
          <Select id="un-estado" value={v.estado} onChange={(e) => set({ estado: e.target.value as UnidadPayload['estado'] })} options={ESTADOS_UNIDAD} />
        </Field>
        <Field label="Sede" htmlFor="un-sede" error={err('sede_id')} required>
          <Select
            id="un-sede"
            placeholder="Selecciona"
            value={v.sede_id ?? ''}
            onChange={(e) => set({ sede_id: Number(e.target.value) || undefined, sala_id: null })}
            options={(sedes?.datos ?? []).map((s) => ({ value: s.id, label: s.nombre }))}
            invalid={!!err('sede_id')}
          />
        </Field>
        {esEquipo && (
          <Field label="Ubicación" htmlFor="un-sala" error={err('sala_id')} hint="Fijo en una sala o móvil dentro de la sede.">
            <Select
              id="un-sala"
              value={v.sala_id ?? ''}
              onChange={(e) => set({ sala_id: Number(e.target.value) || null })}
              placeholder="Móvil"
              options={salas.map((s) => ({ value: s.id, label: `Fijo en ${s.nombre}` }))}
            />
          </Field>
        )}
        <Field label="Marca" htmlFor="un-marca">
          <Input id="un-marca" value={v.marca ?? ''} onChange={(e) => set({ marca: e.target.value })} />
        </Field>
        <Field label="Modelo" htmlFor="un-modelo">
          <Input id="un-modelo" value={v.modelo ?? ''} onChange={(e) => set({ modelo: e.target.value })} />
        </Field>
        <Field label="Serie" htmlFor="un-serie">
          <Input id="un-serie" value={v.serie ?? ''} onChange={(e) => set({ serie: e.target.value })} />
        </Field>
        {esEquipo && (
          <>
            <Field label="Registro INVIMA" htmlFor="un-invima">
              <Input id="un-invima" value={v.registro_invima ?? ''} onChange={(e) => set({ registro_invima: e.target.value })} />
            </Field>
            <Field label="Último mantenimiento" htmlFor="un-ult">
              <Input id="un-ult" type="date" value={v.ultimo_mantenimiento ?? ''} onChange={(e) => set({ ultimo_mantenimiento: e.target.value })} />
            </Field>
            <Field label="Próximo mantenimiento" htmlFor="un-prox">
              <Input id="un-prox" type="date" value={v.proximo_mantenimiento ?? ''} onChange={(e) => set({ proximo_mantenimiento: e.target.value })} />
            </Field>
            {item?.requiere_calibracion && (
              <Field label="Calibración vence" htmlFor="un-cal" hint="Requerida para este tipo de equipo.">
                <Input id="un-cal" type="date" value={v.calibracion_vence ?? ''} onChange={(e) => set({ calibracion_vence: e.target.value })} />
              </Field>
            )}
          </>
        )}
        <Field label="Observaciones" htmlFor="un-obs" className="sm:col-span-2">
          <Textarea id="un-obs" rows={2} value={v.observaciones ?? ''} onChange={(e) => set({ observaciones: e.target.value })} />
        </Field>
      </div>
      <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur sm:flex-row sm:justify-end">
        <Button variant="secondary" onClick={onListo} disabled={guardarUnidad.isPending}>
          Cancelar
        </Button>
        <Button onClick={guardar} isLoading={guardarUnidad.isPending}>
          {unidad ? 'Guardar cambios' : 'Registrar'}
        </Button>
      </div>
    </div>
  );
}

const sumarDias = (fecha: string, dias: number) => {
  const d = new Date(`${fecha}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function MantenimientoModal({ open, unidad, onClose }: { open: boolean; unidad: Unidad; onClose: () => void }) {
  return open ? <MantenimientoContenido unidad={unidad} onClose={onClose} /> : null;
}

function MantenimientoContenido({ unidad, onClose }: { unidad: Unidad; onClose: () => void }) {
  const { programarMantenimiento } = useInventarioMutations();
  // Por defecto, mañana (fecha local).
  const [v, setV] = useState(() => ({ tipo: 'PREVENTIVO' as Mantenimiento['tipo'], fecha: sumarDias(hoyISO(), 1), desde: '07:00', hasta: '12:00', responsable: '', observaciones: '' }));
  const [error, setError] = useState<string>();

  const guardar = async () => {
    try {
      await programarMantenimiento.mutateAsync({
        unidadId: unidad.id,
        payload: { tipo: v.tipo, inicio: `${v.fecha} ${v.desde}`, fin: `${v.fecha} ${v.hasta}`, responsable: v.responsable || null, observaciones: v.observaciones || null },
      });
      onClose();
    } catch (e) {
      const api = toApiError(e);
      setError(Object.values(api.fieldErrors)[0]?.[0] ?? api.message);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="Programar mantenimiento"
      description={`${unidad.item.nombre} · ${unidad.codigo}. Durante esa franja Kizuna no lo asigna a procedimientos.`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button icon={CalendarClock} onClick={guardar} isLoading={programarMantenimiento.isPending}>
            Programar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tipo" htmlFor="mt-tipo" className="sm:col-span-3">
          <Select
            id="mt-tipo"
            value={v.tipo}
            onChange={(e) => setV({ ...v, tipo: e.target.value as Mantenimiento['tipo'] })}
            options={[
              { value: 'PREVENTIVO', label: 'Preventivo' },
              { value: 'CORRECTIVO', label: 'Correctivo' },
              ...(unidad.item.requiere_calibracion ? [{ value: 'CALIBRACION', label: 'Calibración' }] : []),
            ]}
          />
        </Field>
        <Field label="Fecha" htmlFor="mt-fecha">
          <Input id="mt-fecha" type="date" value={v.fecha} onChange={(e) => setV({ ...v, fecha: e.target.value })} />
        </Field>
        <Field label="Desde" htmlFor="mt-desde">
          <Input id="mt-desde" type="time" value={v.desde} onChange={(e) => setV({ ...v, desde: e.target.value })} />
        </Field>
        <Field label="Hasta" htmlFor="mt-hasta" error={error}>
          <Input id="mt-hasta" type="time" value={v.hasta} onChange={(e) => setV({ ...v, hasta: e.target.value })} invalid={!!error} />
        </Field>
        <Field label="Responsable" htmlFor="mt-resp" className="sm:col-span-3">
          <Input id="mt-resp" placeholder="Ingeniería biomédica o proveedor" value={v.responsable} onChange={(e) => setV({ ...v, responsable: e.target.value })} />
        </Field>
      </div>
    </Modal>
  );
}
