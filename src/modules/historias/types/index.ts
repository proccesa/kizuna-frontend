import type { Alerta, PacienteResumen } from '@/modules/cirugia/types';
import type { ListParams } from '@/lib/api/types';

export type TipoCampo = 'texto' | 'texto_largo' | 'numero' | 'booleano' | 'seleccion' | 'seleccion_multiple' | 'fecha' | 'lista' | 'calculado';

export interface CampoPlantilla {
  id: string;
  tipo: TipoCampo;
  etiqueta: string;
  requerido?: boolean;
  ayuda?: string;
  unidad?: string;
  min?: number;
  max?: number;
  decimales?: number;
  opciones?: { valor: string; etiqueta: string }[];
  visible_si?: { campo: string; igual?: unknown; en?: unknown[] };
  /** Ruta en `resultado` de un valor sugerido por Kizuna (p. ej. `asa_sugerido.clase`). */
  sugerencia?: string;
  /** Ruta en `resultado` de un campo calculado. */
  fuente?: string;
  valor_inicial?: unknown;
  /** Subcampos de una lista. */
  campos?: CampoPlantilla[];
}

export interface SeccionPlantilla {
  id: string;
  titulo: string;
  campos: CampoPlantilla[];
}

export interface EsquemaPlantilla {
  secciones: SeccionPlantilla[];
}

export interface Plantilla {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  especialidad: { id: number; nombre: string } | null;
  version_vigente: { id: number; version: number; publicada_en: string; esquema: EsquemaPlantilla } | null;
  versiones_count: number;
}

export type Respuestas = Record<string, unknown>;

export interface ResultadoPreanestesia {
  imc?: { valor: number; categoria: string } | null;
  rcri?: { puntos: number; factores: string[]; riesgo: string };
  stop_bang?: { puntos: number; riesgo: 'BAJO' | 'INTERMEDIO' | 'ALTO' } | null;
  apfel?: { puntos: number; riesgo: string };
  via_aerea?: { dificil_predicha: boolean; predictores: string[] };
  asa_sugerido?: { clase: number | null; razones: string[] };
  medicamentos?: { dias_suspension: number; hallazgos: { medicamento: string; grupo: string; dias: number; nota: string }[] };
  alertas: Alerta[];
  concepto?: string | null;
  asa?: number | null;
  vigencia_dias?: number;
}

export type EstadoHistoria = 'BORRADOR' | 'FINALIZADA' | 'ANULADA';

export interface Historia {
  id: number;
  paciente_id: number;
  estado: EstadoHistoria;
  origen: 'KIZUNA' | 'EXTERNO';
  sistema_origen: string | null;
  profesional_externo: string | null;
  respuestas: Respuestas | null;
  resultado: ResultadoPreanestesia | null;
  finalizada_en: string | null;
  motivo_anulacion: string | null;
  anulada_en: string | null;
  created_at: string;
  updated_at: string;
  paciente: PacienteResumen;
  version: { id: number; plantilla_id: number; version: number; esquema?: EsquemaPlantilla; plantilla: { id: number; codigo: string; nombre: string; especialidad?: { id: number; nombre: string } | null } };
  especialista: { id: number; nombre_completo: string } | null;
  orden: {
    id: number;
    estado: string;
    aval_hasta: string | null;
    cups?: { id: number; codigo: string; nombre: string };
    especialidad?: { id: number; nombre: string } | null;
    contrato?: { id: number; numero: string; entidad?: { razon_social: string; sigla: string | null } } | null;
  } | null;
  cita: { id: number; fecha: string; hora_inicio: string; hora_fin: string; estado: string; sede?: { id: number; nombre: string } } | null;
  finalizada_por?: { id: number; name: string } | null;
  eventos?: { id: number; accion: string; detalle: string | null; created_at: string; usuario?: { id: number; name: string } | null }[];
  contexto?: { paciente: { sexo: string | null; edad: number | null } };
}

export interface HistoriasFiltros extends ListParams {
  estado?: EstadoHistoria;
  plantilla?: string;
  origen?: string;
}
