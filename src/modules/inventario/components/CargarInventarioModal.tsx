import { Download } from 'lucide-react';
import { CargueArchivoModal } from '@/components/CargueArchivoModal';
import { Button } from '@/components/ui';
import { descargarCsv } from '@/lib/csv';
import { useInventarioMutations } from '../hooks/useInventario';

const PLANTILLAS = {
  unidades: {
    columnas: ['tipo', 'item_codigo', 'item_nombre', 'codigo', 'sede', 'sala', 'serie', 'marca', 'modelo', 'registro_invima', 'estado', 'ultimo_mantenimiento', 'proximo_mantenimiento', 'calibracion_vence'],
    ejemplo: [
      ['EQUIPO', 'EQ-TORRE', 'Torre de laparoscopia', 'BIO-00125', 'Sede Norte', '', 'SN-7781', 'Stryker', '1688', '2019DM-0001234', 'OPERATIVO', '2026-06-10', '2026-12-10', ''],
      ['INSTRUMENTAL', 'IN-LAPA', 'Caja de laparoscopia', 'CJ-LAP-01', 'Sede Norte', '', '', '', '', '', 'OPERATIVO', '', '', ''],
    ],
    ayuda: 'tipo: EQUIPO o INSTRUMENTAL. codigo: placa del equipo o código de la caja (si ya existe, se actualiza). sala: código de la sala si el equipo está fijo; vacío = móvil.',
  },
  existencias: {
    columnas: ['item_codigo', 'item_nombre', 'unidad_medida', 'sede', 'lote', 'vence', 'cantidad'],
    ejemplo: [['IS-TROC10', 'Trocar 10 mm', 'unidad', 'Sede Norte', 'L2309', '2027-08-31', '40']],
    ayuda: 'cantidad: el conteo actual del lote (reemplaza la cantidad anterior y queda el movimiento). Si el insumo no existe, se crea con item_nombre.',
  },
} as const;

interface Props {
  tipo: 'unidades' | 'existencias' | null;
  onClose: () => void;
}

export function CargarInventarioModal({ tipo, onClose }: Props) {
  const { importar } = useInventarioMutations();
  if (!tipo) return null;
  const p = PLANTILLAS[tipo];

  return (
    <CargueArchivoModal
      open
      onClose={onClose}
      titulo={tipo === 'unidades' ? 'Cargar equipos y cajas' : 'Cargar existencias de insumos'}
      formato="CSV separado por comas o punto y coma. Las sedes se indican por nombre. En Excel: Guardar como → CSV UTF-8."
      procesar={async (archivo, simular) => (await importar.mutateAsync({ tipo, archivo, simular })).datos}
      cifras={(r, final) => [
        { label: final ? 'Creados' : 'Nuevos', valor: r.creados },
        { label: 'Actualizados', valor: r.actualizados },
      ]}
      validos={(r) => r.creados + r.actualizados}
      sustantivo={tipo === 'unidades' ? ['unidad', 'unidades'] : ['lote', 'lotes']}
      mensajeFinal="Inventario actualizado."
      ayuda={
        <div className="rounded-2xl bg-cream p-4 text-sm text-body">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-ink">Columnas del archivo</p>
            <Button size="sm" variant="secondary" icon={Download} onClick={() => descargarCsv(`plantilla-${tipo}.csv`, [[...p.columnas], ...p.ejemplo.map((f) => [...f])])}>
              Descargar plantilla
            </Button>
          </div>
          <p className="mt-2 font-mono text-xs leading-relaxed break-words text-muted">{p.columnas.join(' ; ')}</p>
          <p className="mt-3 text-[0.8rem] text-muted">{p.ayuda}</p>
        </div>
      }
    />
  );
}
