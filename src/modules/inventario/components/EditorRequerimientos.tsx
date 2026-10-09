import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Input, Select } from '@/components/ui';
import { useItems } from '../hooks/useInventario';
import { TIPO_ITEM, type Requerimiento } from '../types';

export interface FilaRequerimiento {
  item_id: number;
  cantidad: number;
  notas: string;
}

interface EditorRequerimientosProps {
  inicial: Requerimiento[];
  /** En el ajuste de una sede se permite cantidad 0 (= no se usa en esa sede). */
  permiteCero: boolean;
  soloLectura: boolean;
  guardando: boolean;
  onGuardar: (filas: FilaRequerimiento[]) => void;
}

const ORDEN = { EQUIPO: 0, INSTRUMENTAL: 1, INSUMO: 2 } as const;

/** Lista editable de ítems y cantidades. Se monta con `key` para reiniciarse al cambiar de CUPS o sede. */
export function EditorRequerimientos({ inicial, permiteCero, soloLectura, guardando, onGuardar }: EditorRequerimientosProps) {
  const { data: items } = useItems({ activo: true, por_pagina: 200 });
  const [filas, setFilas] = useState<FilaRequerimiento[]>(inicial.map((r) => ({ item_id: r.item_id, cantidad: r.cantidad, notas: r.notas ?? '' })));
  const [nuevo, setNuevo] = useState('');
  const catalogo = items?.datos ?? [];
  const usados = new Set(filas.map((f) => f.item_id));
  const cambiado = JSON.stringify(filas) !== JSON.stringify(inicial.map((r) => ({ item_id: r.item_id, cantidad: r.cantidad, notas: r.notas ?? '' })));
  const ordenadas = [...filas].sort((a, b) => {
    const ta = catalogo.find((i) => i.id === a.item_id)?.tipo ?? 'INSUMO';
    const tb = catalogo.find((i) => i.id === b.item_id)?.tipo ?? 'INSUMO';
    return ORDEN[ta] - ORDEN[tb];
  });

  const cambiar = (itemId: number, cambios: Partial<FilaRequerimiento>) => setFilas((p) => p.map((f) => (f.item_id === itemId ? { ...f, ...cambios } : f)));

  return (
    <div>
      {ordenadas.length === 0 ? (
        <p className="rounded-2xl bg-cream px-4 py-6 text-center text-sm text-muted">{permiteCero ? 'Sin ajustes: la sede usa la lista base.' : 'Sin requerimientos definidos.'}</p>
      ) : (
        <ul className="divide-y divide-line rounded-2xl border border-line">
          {ordenadas.map((f) => {
            const item = catalogo.find((i) => i.id === f.item_id);
            return (
              <li key={f.item_id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink">{item?.nombre ?? '…'}</p>
                  <p className="text-xs text-muted">
                    {item && TIPO_ITEM[item.tipo].singular} · <span className="tabular">{item?.codigo}</span>
                  </p>
                </div>
                {f.cantidad === 0 && <Badge tone="neutral">No se usa en esta sede</Badge>}
                <Input
                  aria-label={`Cantidad de ${item?.nombre}`}
                  inputMode="numeric"
                  readOnly={soloLectura}
                  value={String(f.cantidad)}
                  onChange={(e) => cambiar(f.item_id, { cantidad: Number(e.target.value.replace(/\D/g, '') || 0) })}
                  className="tabular h-9 w-20 text-right"
                />
                <span className="w-16 text-xs text-muted">{item?.tipo === 'INSUMO' ? (item.unidad_medida ?? 'unidades') : item?.tipo === 'INSTRUMENTAL' ? 'cajas' : 'equipos'}</span>
                <Input aria-label={`Notas de ${item?.nombre}`} readOnly={soloLectura} placeholder="Notas" value={f.notas} onChange={(e) => cambiar(f.item_id, { notas: e.target.value })} className="h-9 sm:w-44" />
                {!soloLectura && <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Quitar ${item?.nombre}`} onClick={() => setFilas((p) => p.filter((x) => x.item_id !== f.item_id))} />}
              </li>
            );
          })}
        </ul>
      )}
      {!soloLectura && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Select
              aria-label="Agregar ítem"
              value={nuevo}
              onChange={(e) => setNuevo(e.target.value)}
              placeholder="Agregar equipo, caja o insumo…"
              options={[...catalogo]
                .filter((i) => !usados.has(i.id))
                .sort((a, b) => ORDEN[a.tipo] - ORDEN[b.tipo] || a.nombre.localeCompare(b.nombre))
                .map((i) => ({ value: i.id, label: `${TIPO_ITEM[i.tipo].singular} · ${i.nombre}` }))}
              className="h-10 sm:w-80"
            />
            <Button
              variant="secondary"
              icon={Plus}
              disabled={!nuevo}
              onClick={() => {
                setFilas((p) => [...p, { item_id: Number(nuevo), cantidad: 1, notas: '' }]);
                setNuevo('');
              }}
            >
              Agregar
            </Button>
          </div>
          <Button disabled={!cambiado} isLoading={guardando} onClick={() => onGuardar(filas)}>
            Guardar
          </Button>
        </div>
      )}
      {permiteCero && !soloLectura && <p className="mt-2 text-xs text-muted">Cambia la cantidad para esta sede o ponla en 0 si aquí no se usa ese elemento.</p>}
    </div>
  );
}
