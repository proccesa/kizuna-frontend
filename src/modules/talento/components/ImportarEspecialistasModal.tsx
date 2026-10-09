import { Download } from 'lucide-react';
import { CargueArchivoModal } from '@/components/CargueArchivoModal';
import { Button } from '@/components/ui';
import { descargarCsv } from '@/lib/csv';
import { useEspecialidades } from '@/modules/servicios/hooks/useServicios';
import { useTalentoMutations } from '../hooks/useTalento';

const COLUMNAS = ['tipo_documento', 'numero_documento', 'nombres', 'apellidos', 'registro_profesional', 'correo', 'telefono', 'especialidades'];

interface ImportarEspecialistasModalProps {
  open: boolean;
  onClose: () => void;
}

export function ImportarEspecialistasModal({ open, onClose }: ImportarEspecialistasModalProps) {
  const { importar } = useTalentoMutations();
  const { data: especialidades = [] } = useEspecialidades({}, open);

  const plantilla = () =>
    descargarCsv('plantilla-especialistas.csv', [
      COLUMNAS,
      ['CC', '1144209770', 'Laura', 'Gómez Ríos', 'RM-76-1234', 'laura.gomez@ips.co', '3001234567', 'Medicina general'],
      ['CC', '94301552', 'Jorge Iván', 'Murillo', '', '', '', `${especialidades[0]?.nombre ?? 'Pediatría'}|${especialidades[1]?.nombre ?? 'Psicología'}`],
    ]);

  return (
    <CargueArchivoModal
      open={open}
      onClose={onClose}
      titulo="Cargue masivo de especialistas"
      descripcion="Sube un CSV con un profesional por fila. Primero lo revisamos y luego decides si cargarlo."
      formato="CSV separado por comas o punto y coma, hasta 2.000 filas. En Excel: Guardar como → CSV UTF-8."
      procesar={async (archivo, simular) => (await importar.mutateAsync({ archivo, simular })).datos}
      cifras={(r, final) => [
        { label: final ? 'Creados' : 'Nuevos', valor: r.creados },
        { label: 'Actualizados', valor: r.actualizados },
      ]}
      validos={(r) => r.creados + r.actualizados}
      sustantivo={['especialista', 'especialistas']}
      mensajeFinal="Carga terminada. Ahora define la agenda de los profesionales nuevos."
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
              <b className="text-body">tipo_documento</b>: CC, CE, PAS, PEP o PPT.
            </li>
            <li>
              <b className="text-body">especialidades</b>: nombres como aparecen en Kizuna, separados por «|». Ej.: Medicina general|Pediatría.
            </li>
            <li>Si el documento ya existe, se actualizan sus datos y sus especialidades quedan como vienen en el archivo (no se quitan las que tenga en agenda vigente).</li>
          </ul>
        </div>
      }
    />
  );
}
