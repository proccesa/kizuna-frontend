import { useRef, useState, type ReactNode } from 'react';
import { AlertTriangle, CheckCircle2, FileSpreadsheet, Upload } from 'lucide-react';
import { Button, Modal } from '@/components/ui';
import { getErrorMessage } from '@/lib/api/errors';
import { cn } from '@/lib/cn';
import { formatNumber } from '@/lib/format';
import { notify } from '@/lib/toast';

/** Forma común de las respuestas de cargue masivo del backend. */
export interface ResultadoCargue {
  total: number;
  simulado: boolean;
  errores: { fila: number; documento: string; mensajes: string[] }[];
  /** Total de filas con error (puede ser mayor que `errores.length`, que viene recortado). */
  con_errores?: number;
  advertencia?: string | null;
}

export interface CifraCargue {
  label: string;
  valor: number;
  tono?: 'danger' | 'warning';
}

interface CargueArchivoModalProps<R extends ResultadoCargue> {
  open: boolean;
  onClose: () => void;
  titulo: string;
  descripcion?: string;
  /** Texto bajo la zona de arrastre (formato y límites). */
  formato: string;
  /** Opciones previas a elegir el archivo (p. ej. el modo de cargue). */
  opciones?: ReactNode;
  /** Columnas, reglas y botón de plantilla. */
  ayuda?: ReactNode;
  procesar: (archivo: File, simular: boolean) => Promise<R>;
  cifras: (resultado: R, final: boolean) => CifraCargue[];
  /** Cuántas filas se cargarán; 0 deshabilita el botón. */
  validos: (resultado: R) => number;
  sustantivo: [singular: string, plural: string];
  mensajeFinal: string;
}

/**
 * Flujo de cargue masivo en dos pasos: el archivo se revisa (simulación) y,
 * con el reporte a la vista, se confirma la carga de las filas válidas.
 */
export function CargueArchivoModal<R extends ResultadoCargue>(props: CargueArchivoModalProps<R>) {
  const { open, onClose, titulo, descripcion, formato, opciones, ayuda, procesar, cifras, validos, sustantivo, mensajeFinal } = props;
  const inputRef = useRef<HTMLInputElement>(null);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [revision, setRevision] = useState<R | null>(null);
  const [final, setFinal] = useState<R | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  const reiniciar = () => {
    setArchivo(null);
    setRevision(null);
    setFinal(null);
    if (inputRef.current) inputRef.current.value = '';
  };
  const cerrar = () => {
    reiniciar();
    onClose();
  };

  const ejecutar = async (file: File, simular: boolean) => {
    setProcesando(true);
    try {
      const resultado = await procesar(file, simular);
      if (simular) setRevision(resultado);
      else setFinal(resultado);
    } catch (error) {
      notify.error(getErrorMessage(error));
      if (simular) reiniciar();
    } finally {
      setProcesando(false);
    }
  };

  const revisar = (file: File) => {
    setArchivo(file);
    setRevision(null);
    void ejecutar(file, true);
  };

  const aCargar = revision ? validos(revision) : 0;
  const resultado = final ?? revision;
  const conErrores = resultado ? (resultado.con_errores ?? resultado.errores.length) : 0;

  return (
    <Modal
      open={open}
      onClose={cerrar}
      size="lg"
      dismissible={!procesando}
      title={titulo}
      description={descripcion ?? 'Primero revisamos el archivo y luego decides si cargarlo.'}
      footer={
        final ? (
          <Button onClick={cerrar}>Listo</Button>
        ) : (
          <>
            <Button variant="secondary" onClick={revision ? reiniciar : cerrar} disabled={procesando}>
              {revision ? 'Elegir otro archivo' : 'Cancelar'}
            </Button>
            {revision && (
              <Button icon={Upload} onClick={() => archivo && ejecutar(archivo, false)} isLoading={procesando} disabled={aCargar === 0}>
                {aCargar === 0 ? 'Nada para cargar' : `Cargar ${formatNumber(aCargar)} ${aCargar === 1 ? sustantivo[0] : sustantivo[1]}`}
              </Button>
            )}
          </>
        )
      }
    >
      {!resultado ? (
        <div className="space-y-4">
          {opciones}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setArrastrando(true);
            }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => {
              e.preventDefault();
              setArrastrando(false);
              const file = e.dataTransfer.files[0];
              if (file) revisar(file);
            }}
            disabled={procesando}
            className={cn(
              'flex w-full cursor-pointer flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors',
              arrastrando ? 'border-petrol bg-mist' : 'border-line-strong hover:border-petrol/40 hover:bg-cream',
            )}
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-mist text-mist-ink">
              <FileSpreadsheet className="size-6" aria-hidden />
            </span>
            <span className="font-display text-lg font-bold text-ink">{procesando ? `Revisando ${archivo?.name}…` : 'Arrastra el archivo o haz clic para elegirlo'}</span>
            <span className="text-sm text-muted">{formato}</span>
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".csv,text/csv"
            className="sr-only"
            aria-label="Archivo CSV"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) revisar(file);
            }}
          />
          {ayuda}
        </div>
      ) : (
        <div className="space-y-4">
          {final && (
            <div className="flex items-center gap-3 rounded-2xl bg-success-soft px-4 py-3 text-success">
              <CheckCircle2 className="size-5 shrink-0" aria-hidden />
              <p className="text-sm font-semibold">{mensajeFinal}</p>
            </div>
          )}
          {!final && resultado.advertencia && (
            <div className="flex items-start gap-3 rounded-2xl bg-warning-soft px-4 py-3 text-warning">
              <AlertTriangle className="mt-0.5 size-5 shrink-0" aria-hidden />
              <p className="text-sm font-semibold">{resultado.advertencia}</p>
            </div>
          )}
          <p className="text-sm text-muted">
            {archivo?.name} · {formatNumber(resultado.total)} {resultado.total === 1 ? 'fila' : 'filas'}
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[...cifras(resultado, !!final), { label: 'Con errores', valor: conErrores, tono: conErrores ? ('danger' as const) : undefined }].map((c) => (
              <div key={c.label} className="rounded-2xl border border-line p-4">
                <p className="text-xs font-semibold text-muted">{c.label}</p>
                <p className={cn('tabular mt-1 font-display text-2xl font-bold', c.tono === 'danger' ? 'text-danger' : c.tono === 'warning' ? 'text-warning' : 'text-ink')}>
                  {formatNumber(c.valor)}
                </p>
              </div>
            ))}
          </div>

          {resultado.errores.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-ink">{final ? 'Filas que no se cargaron' : 'Estas filas no se cargarán'}</p>
              <ul className="max-h-64 divide-y divide-line overflow-y-auto rounded-2xl border border-line">
                {resultado.errores.map((e) => (
                  <li key={e.fila} className="flex gap-3 px-4 py-2.5 text-sm">
                    <span className="tabular w-16 shrink-0 font-semibold text-muted">Fila {e.fila}</span>
                    <span className="min-w-0">
                      {e.documento && <span className="tabular block text-xs font-semibold text-ink">{e.documento}</span>}
                      <span className="block text-danger">{e.mensajes.join(' ')}</span>
                    </span>
                  </li>
                ))}
              </ul>
              {conErrores > resultado.errores.length && (
                <p className="mt-2 text-xs text-muted">Se muestran las primeras {formatNumber(resultado.errores.length)} de {formatNumber(conErrores)} filas con errores.</p>
              )}
              {!final && <p className="mt-2 text-xs text-muted">Puedes corregirlas en el archivo y volver a subirlo, o cargar ahora las filas válidas.</p>}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
