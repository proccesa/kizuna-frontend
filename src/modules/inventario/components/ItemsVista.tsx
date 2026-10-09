import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, SearchInput, Skeleton, Table, type TableColumn } from '@/components/ui';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useInventarioMutations, useItems } from '../hooks/useInventario';
import type { Item, TipoItem } from '../types';
import { ItemModal } from './ItemModal';

/** Catálogo de tipos de equipo, de caja o de insumo. */
export function ItemsVista({ tipo }: { tipo: TipoItem }) {
  const { can } = useAuth();
  const gestionar = can(PERMISOS.inventario.gestionar);
  const [buscar, setBuscar] = useState('');
  const { data, isLoading } = useItems({ tipo, buscar: buscar || undefined, por_pagina: 200 });
  const { eliminarItem } = useInventarioMutations();
  const [modal, setModal] = useState<{ open: boolean; item: Item | null }>({ open: false, item: null });
  const [borrar, setBorrar] = useState<Item | null>(null);

  const columns: TableColumn<Item>[] = [
    {
      key: 'nombre',
      header: 'Nombre',
      cell: (i) => (
        <div>
          <p className="font-semibold text-ink">{i.nombre}</p>
          <p className="tabular text-xs text-muted">{i.codigo}</p>
        </div>
      ),
    },
    {
      key: 'detalle',
      header: 'Reglas',
      cell: (i) => (
        <span className="flex flex-wrap gap-1">
          {i.tipo === 'EQUIPO' && (
            <>
              {i.clasificacion_riesgo && <Badge>Clase {i.clasificacion_riesgo}</Badge>}
              {i.periodicidad_mantenimiento_meses && <Badge tone="mist">Mantenimiento cada {i.periodicidad_mantenimiento_meses} meses</Badge>}
              {i.requiere_calibracion && <Badge tone="lime">Calibración{i.periodicidad_calibracion_meses ? ` cada ${i.periodicidad_calibracion_meses} meses` : ''}</Badge>}
            </>
          )}
          {i.tipo === 'INSTRUMENTAL' && i.minutos_esterilizacion !== null && <Badge tone="mist">{i.minutos_esterilizacion} min de esterilización</Badge>}
          {i.tipo === 'INSUMO' && (
            <>
              {i.unidad_medida && <Badge>{i.unidad_medida}</Badge>}
              {i.stock_minimo !== null && <Badge tone="mist">Mínimo {i.stock_minimo} por sede</Badge>}
            </>
          )}
          {!i.activo && <Badge tone="neutral">Inactivo</Badge>}
        </span>
      ),
    },
    {
      key: 'cantidad',
      header: encabezadoCantidad(tipo),
      align: 'right',
      cell: (i) => <span className="tabular font-semibold text-ink">{tipo === 'INSUMO' ? (i.existencias_total ?? 0) : `${i.operativas_count ?? 0} / ${i.unidades_count ?? 0}`}</span>,
    },
    {
      key: 'acciones',
      header: <span className="sr-only">Acciones</span>,
      align: 'right',
      cell: (i) =>
        gestionar && (
          <span className="flex justify-end gap-1">
            <Button size="sm" variant="ghost" iconOnly icon={Pencil} aria-label={`Editar ${i.nombre}`} onClick={() => setModal({ open: true, item: i })} />
            <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Eliminar ${i.nombre}`} onClick={() => setBorrar(i)} />
          </span>
        ),
    },
  ];

  return (
    <Card className="animate-enter overflow-hidden">
      <div className="flex flex-col gap-2 border-b border-line p-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={buscar} onChange={setBuscar} placeholder="Nombre o código" className="sm:w-72" />
        {gestionar && (
          <Button icon={Plus} onClick={() => setModal({ open: true, item: null })}>
            {{ EQUIPO: 'Nuevo tipo de equipo', INSTRUMENTAL: 'Nuevo tipo de caja', INSUMO: 'Nuevo insumo' }[tipo]}
          </Button>
        )}
      </div>
      {isLoading ? (
        <Skeleton className="m-5 h-40" />
      ) : !data?.datos.length ? (
        <EmptyState title="Catálogo vacío" description="Crea los tipos que luego asignarás a los requerimientos de cada CUPS." />
      ) : (
        <Table columns={columns} rows={data.datos} rowKey={(i) => i.id} />
      )}
      <ItemModal open={modal.open} tipo={tipo} item={modal.item} onClose={() => setModal({ open: false, item: null })} />
      <ConfirmDialog
        open={!!borrar}
        title="Eliminar del catálogo"
        message={borrar ? `Se eliminará ${borrar.nombre}. Solo es posible si no tiene inventario ni está en requerimientos de CUPS; si no, desactívalo.` : ''}
        confirmLabel="Eliminar"
        isLoading={eliminarItem.isPending}
        onConfirm={async () => {
          if (borrar) await eliminarItem.mutateAsync(borrar.id).catch(() => undefined);
          setBorrar(null);
        }}
        onClose={() => setBorrar(null)}
      />
    </Card>
  );
}

function encabezadoCantidad(tipo: TipoItem) {
  return tipo === 'INSUMO' ? 'Existencias' : 'Operativas / total';
}
