import { useState } from 'react';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, ClipboardCheck, History, Upload } from 'lucide-react';
import { Badge, Button, Card, EmptyState, Field, Input, Modal, Pagination, SearchInput, Select, Skeleton, Textarea } from '@/components/ui';
import { useListParams } from '@/hooks/useListParams';
import { toApiError } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatDate, formatDateTime, formatNumber } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useSedes } from '@/modules/red/hooks/useRed';
import { hoyISO } from '@/modules/talento/schema';
import { useExistencias, useInventarioMutations, useMovimientos } from '../hooks/useInventario';
import type { InsumoExistencias } from '../types';
import { CargarInventarioModal } from './CargarInventarioModal';

type TipoMovimiento = 'ENTRADA' | 'SALIDA' | 'AJUSTE';

/** Insumos con su existencia por sede y lote, y sus movimientos. */
export function InsumosVista() {
  const { can } = useAuth();
  const gestionar = can(PERMISOS.inventario.gestionar);
  const { buscar, extras, update, pagina } = useListParams(['sede', 'filtro_insumo'] as const);
  const sedeId = extras.sede ? Number(extras.sede) : undefined;
  const { data, isLoading, isFetching } = useExistencias({
    sede_id: sedeId,
    buscar: buscar || undefined,
    bajo_minimo: extras.filtro_insumo === 'bajo_minimo' || undefined,
    por_vencer: extras.filtro_insumo === 'por_vencer' || undefined,
    pagina,
    por_pagina: 20,
  });
  const { data: sedes } = useSedes({ por_pagina: 100 });
  const [movimiento, setMovimiento] = useState<{ item: InsumoExistencias; tipo: TipoMovimiento } | null>(null);
  const [historial, setHistorial] = useState<InsumoExistencias | null>(null);
  const [cargar, setCargar] = useState(false);
  const hoy = hoyISO();

  return (
    <Card className="animate-enter overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-line p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select aria-label="Sede" value={extras.sede} onChange={(e) => update({ sede: e.target.value })} placeholder="Todas las sedes" options={(sedes?.datos ?? []).map((s) => ({ value: s.id, label: s.nombre }))} className="h-10 sm:w-44" />
          <Select
            aria-label="Filtro"
            value={extras.filtro_insumo}
            onChange={(e) => update({ filtro_insumo: e.target.value })}
            placeholder="Todos los insumos"
            options={[
              { value: 'bajo_minimo', label: 'Bajo el mínimo' },
              { value: 'por_vencer', label: 'Por vencer (60 días)' },
            ]}
            className="h-10 sm:w-48"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <SearchInput value={buscar} onChange={(v) => update({ buscar: v })} placeholder="Insumo o código" className="sm:w-60" />
          {gestionar && (
            <Button variant="secondary" icon={Upload} onClick={() => setCargar(true)}>
              Cargar conteo
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : !data?.datos.length ? (
        <EmptyState title="Sin insumos" description="Crea los insumos en el catálogo o carga el conteo desde el almacén." />
      ) : (
        <>
          <ul className={cn('divide-y divide-line', isFetching && 'opacity-70')}>
            {data.datos.map((i) => (
              <li key={i.id} className="flex flex-col gap-3 px-5 py-4 lg:flex-row lg:items-start">
                <div className="min-w-0 lg:w-64 lg:shrink-0">
                  <p className="font-semibold text-ink">{i.nombre}</p>
                  <p className="tabular text-xs text-muted">
                    {i.codigo}
                    {i.stock_minimo !== null && ` · mínimo ${i.stock_minimo} por sede`}
                  </p>
                  <div className="mt-1.5 flex flex-wrap gap-1">
                    {i.bajo_minimo && <Badge tone="danger">Bajo el mínimo</Badge>}
                    {i.por_vencer && <Badge tone="warning">Lotes por vencer</Badge>}
                    {i.con_vencidos && <Badge tone="danger">Con vencidos</Badge>}
                  </div>
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  {i.sedes.length === 0 ? (
                    <p className="text-sm text-muted">Sin existencias.</p>
                  ) : (
                    i.sedes.map((s) => (
                      <div key={s.sede.id} className="rounded-xl bg-cream px-3 py-2">
                        <p className="flex items-baseline justify-between gap-2 text-sm">
                          <span className="font-semibold text-ink">{s.sede.nombre}</span>
                          <span className={cn('tabular font-display font-bold', i.stock_minimo !== null && s.total < i.stock_minimo ? 'text-danger' : 'text-ink')}>
                            {formatNumber(s.total)} {i.unidad_medida ?? ''}
                          </span>
                        </p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {s.lotes.map((l) => {
                            const vencido = !!l.vence && l.vence < hoy;
                            return (
                              <span key={l.id} className={cn('tabular rounded-md px-1.5 py-0.5 text-xs', vencido ? 'bg-danger-soft text-danger' : 'bg-surface text-body')}>
                                {l.lote || 'Sin lote'} · {formatNumber(l.cantidad)}
                                {l.vence && ` · ${vencido ? 'venció' : 'vence'} ${formatDate(l.vence)}`}
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {gestionar && (
                    <>
                      <Button size="sm" variant="secondary" icon={ArrowDownToLine} onClick={() => setMovimiento({ item: i, tipo: 'ENTRADA' })}>
                        Entrada
                      </Button>
                      <Button size="sm" variant="ghost" iconOnly icon={ArrowUpFromLine} aria-label={`Salida de ${i.nombre}`} onClick={() => setMovimiento({ item: i, tipo: 'SALIDA' })} />
                      <Button size="sm" variant="ghost" iconOnly icon={ClipboardCheck} aria-label={`Ajustar conteo de ${i.nombre}`} onClick={() => setMovimiento({ item: i, tipo: 'AJUSTE' })} />
                    </>
                  )}
                  <Button size="sm" variant="ghost" iconOnly icon={History} aria-label={`Movimientos de ${i.nombre}`} onClick={() => setHistorial(i)} />
                </div>
              </li>
            ))}
          </ul>
          <Pagination paginacion={data.paginacion} onPageChange={(p) => update({ pagina: p })} disabled={isFetching} />
        </>
      )}

      {movimiento && <MovimientoModal item={movimiento.item} tipo={movimiento.tipo} sedeInicial={sedeId} onClose={() => setMovimiento(null)} />}
      {historial && <HistorialModal item={historial} onClose={() => setHistorial(null)} />}
      <CargarInventarioModal tipo={cargar ? 'existencias' : null} onClose={() => setCargar(false)} />
    </Card>
  );
}

const TITULOS: Record<TipoMovimiento, string> = { ENTRADA: 'Registrar entrada', SALIDA: 'Registrar salida', AJUSTE: 'Ajustar conteo del lote' };

function MovimientoModal({ item, tipo, sedeInicial, onClose }: { item: InsumoExistencias; tipo: TipoMovimiento; sedeInicial?: number; onClose: () => void }) {
  const { registrarMovimiento } = useInventarioMutations();
  const { data: sedes } = useSedes({ activo: true, por_pagina: 100 });
  const [v, setV] = useState({ sede_id: sedeInicial ? String(sedeInicial) : '', cantidad: '', lote: '', vence: '', motivo: '' });
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const lotes = item.sedes.find((s) => String(s.sede.id) === v.sede_id)?.lotes ?? [];

  const guardar = async () => {
    try {
      await registrarMovimiento.mutateAsync({
        item_id: item.id,
        sede_id: Number(v.sede_id),
        tipo,
        cantidad: Number(v.cantidad),
        lote: v.lote || null,
        ...(tipo !== 'SALIDA' && v.vence ? { vence: v.vence } : {}),
        motivo: v.motivo || null,
      });
      onClose();
    } catch (e) {
      setErrores(toApiError(e).fieldErrors);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={TITULOS[tipo]}
      description={`${item.nombre}${tipo === 'SALIDA' ? ' · sin lote, sale primero lo que vence antes.' : ''}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} isLoading={registrarMovimiento.isPending} disabled={!v.sede_id || v.cantidad === ''}>
            Registrar
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Sede" htmlFor="mv-sede" error={errores.sede_id?.[0]} required>
          <Select id="mv-sede" placeholder="Selecciona" value={v.sede_id} onChange={(e) => setV({ ...v, sede_id: e.target.value })} options={(sedes?.datos ?? []).map((s) => ({ value: s.id, label: s.nombre }))} />
        </Field>
        <Field label={tipo === 'AJUSTE' ? 'Cantidad contada' : 'Cantidad'} htmlFor="mv-cant" error={errores.cantidad?.[0]} required>
          <Input id="mv-cant" inputMode="numeric" value={v.cantidad} onChange={(e) => setV({ ...v, cantidad: e.target.value.replace(/\D/g, '') })} invalid={!!errores.cantidad} />
        </Field>
        <Field label="Lote" htmlFor="mv-lote" hint={tipo === 'SALIDA' ? 'Opcional.' : undefined}>
          {tipo === 'ENTRADA' ? (
            <Input id="mv-lote" value={v.lote} onChange={(e) => setV({ ...v, lote: e.target.value })} />
          ) : (
            <Select id="mv-lote" placeholder={tipo === 'SALIDA' ? 'El que vence primero' : 'Sin lote'} value={v.lote} onChange={(e) => setV({ ...v, lote: e.target.value })} options={lotes.map((l) => ({ value: l.lote, label: `${l.lote || 'Sin lote'} · ${l.cantidad}` }))} />
          )}
        </Field>
        {tipo === 'ENTRADA' && (
          <Field label="Vence" htmlFor="mv-vence">
            <Input id="mv-vence" type="date" value={v.vence} onChange={(e) => setV({ ...v, vence: e.target.value })} />
          </Field>
        )}
        <Field label="Motivo" htmlFor="mv-motivo" className="sm:col-span-2">
          <Textarea id="mv-motivo" rows={2} value={v.motivo} onChange={(e) => setV({ ...v, motivo: e.target.value })} placeholder={tipo === 'ENTRADA' ? 'Factura o remisión' : tipo === 'AJUSTE' ? 'Conteo físico' : 'Traslado, daño, consumo…'} />
        </Field>
      </div>
    </Modal>
  );
}

function HistorialModal({ item, onClose }: { item: InsumoExistencias; onClose: () => void }) {
  const { data = [], isLoading } = useMovimientos(item.id);
  return (
    <Modal open onClose={onClose} size="lg" title="Movimientos" description={item.nombre}>
      {isLoading ? (
        <Skeleton className="h-40" />
      ) : data.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted">Sin movimientos.</p>
      ) : (
        <ul className="divide-y divide-line">
          {data.map((m) => (
            <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
              <span className={cn('tabular w-16 shrink-0 text-right font-display font-bold', m.cantidad < 0 ? 'text-danger' : 'text-success')}>
                {m.cantidad > 0 ? '+' : ''}
                {formatNumber(m.cantidad)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold text-ink">
                  {{ ENTRADA: 'Entrada', SALIDA: 'Salida', AJUSTE: 'Ajuste', CONSUMO: 'Consumo', SINCRONIZACION: 'Sincronización' }[m.tipo]}
                  {m.existencia?.lote && <span className="font-normal text-muted"> · lote {m.existencia.lote}</span>}
                </span>
                <span className="block text-xs text-muted">
                  {formatDateTime(m.created_at)}
                  {m.usuario && ` · ${m.usuario.name}`}
                  {m.origen !== 'MANUAL' && ` · ${m.origen}`}
                  {m.motivo && ` · ${m.motivo}`}
                </span>
              </span>
              <span className="tabular text-xs text-muted">Saldo {formatNumber(m.saldo)}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted">
        <AlertTriangle className="size-3.5" aria-hidden /> Los movimientos no se editan: para corregir, registra un ajuste.
      </p>
    </Modal>
  );
}
