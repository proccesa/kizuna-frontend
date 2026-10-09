import { useState } from 'react';
import { Button, Field, Input, Modal, Select, Switch, Textarea } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { notify } from '@/lib/toast';
import { useInventarioMutations } from '../hooks/useInventario';
import { TIPO_ITEM, type Item, type ItemPayload, type TipoItem } from '../types';

interface ItemModalProps {
  open: boolean;
  tipo: TipoItem;
  /** Ítem a editar; `null` para crear. */
  item: Item | null;
  onClose: () => void;
}

const numero = (v: string) => (v.trim() === '' ? null : Number(v.replace(/\D/g, '')));

/** Tipo de equipo biomédico, de caja de instrumental o insumo. */
export function ItemModal({ open, tipo, item, onClose }: ItemModalProps) {
  return open ? <Contenido tipo={item?.tipo ?? tipo} item={item} onClose={onClose} /> : null;
}

function Contenido({ tipo, item, onClose }: { tipo: TipoItem; item: Item | null; onClose: () => void }) {
  const { guardarItem } = useInventarioMutations();
  const [v, setV] = useState({
    codigo: item?.codigo ?? '',
    nombre: item?.nombre ?? '',
    descripcion: item?.descripcion ?? '',
    unidad_medida: item?.unidad_medida ?? '',
    clasificacion_riesgo: item?.clasificacion_riesgo ?? '',
    requiere_calibracion: item?.requiere_calibracion ?? false,
    periodicidad_mantenimiento_meses: String(item?.periodicidad_mantenimiento_meses ?? (tipo === 'EQUIPO' ? 6 : '')),
    periodicidad_calibracion_meses: String(item?.periodicidad_calibracion_meses ?? ''),
    minutos_esterilizacion: String(item?.minutos_esterilizacion ?? (tipo === 'INSTRUMENTAL' ? 240 : '')),
    stock_minimo: String(item?.stock_minimo ?? ''),
    activo: item?.activo ?? true,
  });
  const [errores, setErrores] = useState<Record<string, string[]>>({});
  const set = (cambios: Partial<typeof v>) => setV((p) => ({ ...p, ...cambios }));
  const err = (c: string) => errores[c]?.[0];

  const guardar = async () => {
    const payload: Partial<ItemPayload> = {
      tipo,
      codigo: v.codigo.trim().toUpperCase(),
      nombre: v.nombre.trim(),
      descripcion: v.descripcion.trim() || null,
      activo: v.activo,
      ...(tipo === 'EQUIPO' && {
        clasificacion_riesgo: (v.clasificacion_riesgo || null) as Item['clasificacion_riesgo'],
        requiere_calibracion: v.requiere_calibracion,
        periodicidad_mantenimiento_meses: numero(v.periodicidad_mantenimiento_meses),
        periodicidad_calibracion_meses: v.requiere_calibracion ? numero(v.periodicidad_calibracion_meses) : null,
      }),
      ...(tipo === 'INSTRUMENTAL' && { minutos_esterilizacion: numero(v.minutos_esterilizacion) }),
      ...(tipo === 'INSUMO' && { unidad_medida: v.unidad_medida.trim() || null, stock_minimo: numero(v.stock_minimo) }),
    };
    try {
      await guardarItem.mutateAsync({ id: item?.id ?? null, payload });
      onClose();
    } catch (e) {
      const api = toApiError(e);
      setErrores(api.fieldErrors);
      if (!Object.keys(api.fieldErrors).length) notify.error(api.message);
    }
  };

  const titulo = { EQUIPO: 'tipo de equipo', INSTRUMENTAL: 'tipo de caja de instrumental', INSUMO: 'insumo' }[tipo];

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!guardarItem.isPending}
      title={item ? `Editar ${titulo}` : `Nuevo ${titulo}`}
      description={TIPO_ITEM[tipo].plural}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={guardarItem.isPending}>
            Cancelar
          </Button>
          <Button onClick={guardar} isLoading={guardarItem.isPending} disabled={!v.codigo.trim() || !v.nombre.trim()}>
            {item ? 'Guardar cambios' : 'Crear'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
        <Field label="Código" htmlFor="it-codigo" error={err('codigo')} required hint="Tu código interno o del ERP.">
          <Input id="it-codigo" className="uppercase" value={v.codigo} onChange={(e) => set({ codigo: e.target.value })} invalid={!!err('codigo')} />
        </Field>
        <Field label="Nombre" htmlFor="it-nombre" error={err('nombre')} required>
          <Input
            id="it-nombre"
            placeholder={{ EQUIPO: 'Torre de laparoscopia', INSTRUMENTAL: 'Caja de laparoscopia', INSUMO: 'Trocar 10 mm' }[tipo]}
            value={v.nombre}
            onChange={(e) => set({ nombre: e.target.value })}
            invalid={!!err('nombre')}
          />
        </Field>
        <Field label="Descripción" htmlFor="it-desc" className="sm:col-span-2">
          <Textarea id="it-desc" rows={2} value={v.descripcion} onChange={(e) => set({ descripcion: e.target.value })} />
        </Field>

        {tipo === 'EQUIPO' && (
          <>
            <Field label="Clasificación de riesgo" htmlFor="it-riesgo">
              <Select
                id="it-riesgo"
                placeholder="Sin clasificar"
                value={v.clasificacion_riesgo}
                onChange={(e) => set({ clasificacion_riesgo: e.target.value })}
                options={['I', 'IIA', 'IIB', 'III'].map((c) => ({ value: c, label: `Clase ${c}` }))}
              />
            </Field>
            <Field label="Mantenimiento preventivo cada" htmlFor="it-mant" hint="Meses. Al terminar uno, Kizuna calcula el siguiente.">
              <Input id="it-mant" inputMode="numeric" value={v.periodicidad_mantenimiento_meses} onChange={(e) => set({ periodicidad_mantenimiento_meses: e.target.value })} />
            </Field>
            <div className="space-y-3 sm:col-span-2">
              <Switch
                checked={v.requiere_calibracion}
                onChange={(requiere_calibracion) => set({ requiere_calibracion })}
                label="Requiere calibración"
                description="Si la calibración está vencida, Kizuna no lo usa para programar."
              />
              {v.requiere_calibracion && (
                <Field label="Calibración cada (meses)" htmlFor="it-cal" className="max-w-56">
                  <Input id="it-cal" inputMode="numeric" value={v.periodicidad_calibracion_meses} onChange={(e) => set({ periodicidad_calibracion_meses: e.target.value })} />
                </Field>
              )}
            </div>
          </>
        )}
        {tipo === 'INSTRUMENTAL' && (
          <Field label="Tiempo de esterilización" htmlFor="it-est" hint="Minutos de reproceso antes de poder usar de nuevo la caja." className="sm:col-span-2 sm:max-w-72">
            <Input id="it-est" inputMode="numeric" value={v.minutos_esterilizacion} onChange={(e) => set({ minutos_esterilizacion: e.target.value })} />
          </Field>
        )}
        {tipo === 'INSUMO' && (
          <>
            <Field label="Unidad de medida" htmlFor="it-um">
              <Input id="it-um" placeholder="unidad, caja, frasco…" value={v.unidad_medida} onChange={(e) => set({ unidad_medida: e.target.value })} />
            </Field>
            <Field label="Stock mínimo por sede" htmlFor="it-min" hint="Por debajo, Kizuna avisa.">
              <Input id="it-min" inputMode="numeric" value={v.stock_minimo} onChange={(e) => set({ stock_minimo: e.target.value })} />
            </Field>
          </>
        )}
        <div className="sm:col-span-2">
          <Switch checked={v.activo} onChange={(activo) => set({ activo })} label="Activo" />
        </div>
      </div>
    </Modal>
  );
}
