import { Download } from 'lucide-react';
import { CargueArchivoModal } from '@/components/CargueArchivoModal';
import { Button } from '@/components/ui';
import { descargarCsv } from '@/lib/csv';
import { useCirugiaMutations } from '../hooks/useCirugia';

const COLUMNAS = [
  'referencia',
  'tipo_documento',
  'numero_documento',
  'primer_nombre',
  'segundo_nombre',
  'primer_apellido',
  'segundo_apellido',
  'fecha_nacimiento',
  'sexo',
  'telefono',
  'correo',
  'municipio',
  'cups',
  'diagnostico_cie10',
  'diagnostico',
  'prioridad',
  'fecha_orden',
  'medico_ordenante',
  'contrato',
];

export function CargarOrdenesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { importar } = useCirugiaMutations();

  const plantilla = () =>
    descargarCsv('plantilla-ordenes-quirurgicas.csv', [
      COLUMNAS,
      ['OQ-1001', 'CC', '31987120', 'María', 'Fernanda', 'Ríos', '', '1968-04-12', 'F', '3001112233', '', '76001', '512104', 'K802', 'Colelitiasis', 'ELECTIVA', '', 'Dr. Andrés Pardo', ''],
    ]);

  return (
    <CargueArchivoModal
      open={open}
      onClose={onClose}
      titulo="Cargar órdenes quirúrgicas"
      descripcion="Cada orden válida sigue el mismo flujo que una del sistema externo: se valida la especialidad y se agenda la cita de pre-anestesia."
      formato="CSV separado por comas o punto y coma, hasta 5.000 filas. En Excel: Guardar como → CSV UTF-8."
      procesar={async (archivo, simular) => (await importar.mutateAsync({ archivo, simular })).datos}
      cifras={(r, final) =>
        final
          ? [
              { label: 'Con cita asignada', valor: r.citas_asignadas },
              { label: 'Sin cupo aún', valor: r.sin_cupo, tono: r.sin_cupo ? 'warning' : undefined },
              { label: 'Sin especialidad', valor: r.sin_especialidad, tono: r.sin_especialidad ? 'danger' : undefined },
            ]
          : [
              { label: 'Nuevas', valor: r.nuevas },
              { label: 'Ya cargadas', valor: r.duplicadas },
              { label: 'Sin especialidad', valor: r.sin_especialidad, tono: r.sin_especialidad ? 'warning' : undefined },
            ]
      }
      validos={(r) => r.nuevas}
      sustantivo={['orden', 'órdenes']}
      mensajeFinal="Órdenes registradas. Las que no tienen especialidad quedaron rechazadas y las que no encontraron cupo se reintentan cada hora."
      ayuda={
        <div className="rounded-2xl bg-cream p-4 text-sm text-body">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-semibold text-ink">Columnas del archivo</p>
            <Button size="sm" variant="secondary" icon={Download} onClick={plantilla}>
              Descargar plantilla
            </Button>
          </div>
          <p className="mt-2 font-mono text-xs leading-relaxed break-words text-muted">{COLUMNAS.join(' ; ')}</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[0.8rem] text-muted">
            <li>
              Obligatorias: datos del paciente (<b className="text-body">tipo_documento</b>, <b className="text-body">numero_documento</b>, <b className="text-body">primer_nombre</b>,{' '}
              <b className="text-body">primer_apellido</b>, <b className="text-body">fecha_nacimiento</b>, <b className="text-body">sexo</b>) y el <b className="text-body">cups</b> de la cirugía.
            </li>
            <li>
              <b className="text-body">referencia</b>: el número de la orden en tu sistema. Evita cargar dos veces la misma orden.
            </li>
            <li>
              <b className="text-body">contrato</b>: número del contrato (opcional). Si se indica, la cita se busca en sus sedes.
            </li>
          </ul>
        </div>
      }
    />
  );
}
