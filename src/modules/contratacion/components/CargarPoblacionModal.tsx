import { useState } from 'react';
import { Download } from 'lucide-react';
import { CargueArchivoModal } from '@/components/CargueArchivoModal';
import { Button } from '@/components/ui';
import { cn } from '@/lib/cn';
import { descargarCsv } from '@/lib/csv';
import { useContratacionMutations } from '../hooks/useContratacion';
import type { ModoCargue, Poblacion } from '../types';

const COLUMNAS = [
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
  'direccion',
  'municipio',
  'cohortes',
];

const MODOS: { value: ModoCargue; titulo: string; texto: string }[] = [
  { value: 'REEMPLAZAR', titulo: 'Cargue del mes', texto: 'El archivo es la población completa. Quien no venga queda retirado.' },
  { value: 'AGREGAR', titulo: 'Agregar pacientes', texto: 'Suma o actualiza pacientes sin retirar a nadie.' },
];

interface CargarPoblacionModalProps {
  open: boolean;
  poblacion: Poblacion;
  onClose: () => void;
}

export function CargarPoblacionModal({ open, poblacion, onClose }: CargarPoblacionModalProps) {
  const { cargarPoblacion } = useContratacionMutations();
  const [modo, setModo] = useState<ModoCargue>('REEMPLAZAR');

  const plantilla = () =>
    descargarCsv('plantilla-poblacion.csv', [
      COLUMNAS,
      ['CC', '31987120', 'María', 'Fernanda', 'Ríos', 'Gómez', '1968-04-12', 'F', '3001112233', '', 'Calle 5 # 10-20', '76001', 'Hipertensión|Diabetes'],
      ['TI', '1107889012', 'Kevin', '', 'Mosquera', '', '2012-05-20', 'M', '', '', '', '76364', ''],
    ]);

  return (
    <CargueArchivoModal
      open={open}
      onClose={() => {
        setModo('REEMPLAZAR');
        onClose();
      }}
      titulo="Cargar pacientes"
      descripcion={`${poblacion.nombre} · primero revisamos el archivo y luego decides si cargarlo.`}
      formato="CSV separado por comas o punto y coma, hasta 100.000 filas y 30 MB. En Excel: Guardar como → CSV UTF-8."
      procesar={async (archivo, simular) => (await cargarPoblacion.mutateAsync({ id: poblacion.id, archivo, simular, modo })).datos}
      cifras={(r, final) => [
        { label: final ? 'Agregados' : 'Nuevos', valor: r.nuevos },
        { label: 'Actualizados', valor: r.actualizados },
        { label: 'Retirados', valor: r.retirados, tono: r.retirados ? 'warning' : undefined },
      ]}
      validos={(r) => r.nuevos + r.actualizados}
      sustantivo={['paciente', 'pacientes']}
      mensajeFinal="Cargue terminado. Kizuna ya puede programar a los pacientes nuevos."
      opciones={
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Tipo de cargue">
          {MODOS.map((m) => (
            <button
              key={m.value}
              type="button"
              role="radio"
              aria-checked={modo === m.value}
              onClick={() => setModo(m.value)}
              className={cn(
                'cursor-pointer rounded-2xl border p-4 text-left transition-colors',
                modo === m.value ? 'border-petrol bg-mist ring-1 ring-petrol' : 'border-line-strong hover:bg-cream',
              )}
            >
              <span className="block text-sm font-bold text-ink">{m.titulo}</span>
              <span className="mt-0.5 block text-xs leading-relaxed text-muted">{m.texto}</span>
            </button>
          ))}
        </div>
      }
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
              Obligatorias: <b className="text-body">tipo_documento</b>, <b className="text-body">numero_documento</b>, <b className="text-body">primer_nombre</b>,{' '}
              <b className="text-body">primer_apellido</b>, <b className="text-body">fecha_nacimiento</b> (AAAA-MM-DD o DD/MM/AAAA) y <b className="text-body">sexo</b> (F, M o I).
            </li>
            <li>
              <b className="text-body">municipio</b>: código DIVIPOLA de 5 dígitos (76001 = Cali).
            </li>
            <li>
              <b className="text-body">cohortes</b>: programas o grupos de riesgo separados por «|». Ej.: Hipertensión|Diabetes.
            </li>
            <li>En el cargue del mes, las filas con errores no retiran al paciente si ya estaba en la población.</li>
          </ul>
        </div>
      }
    />
  );
}
