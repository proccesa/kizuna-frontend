import type { ResultadoCargue } from '@/components/CargueArchivoModal';
import type { ListParams } from '@/lib/api/types';

export type EstadoOrden = 'RECHAZADA' | 'PENDIENTE_CITA' | 'CITA_ASIGNADA' | 'APTA' | 'NO_APTA' | 'APLAZADA' | 'PROGRAMADA' | 'OPERADA' | 'CANCELADA';
export type FiltroOrden = EstadoOrden | 'AVAL_VENCIDO';

export const ESTADOS_ORDEN: { value: FiltroOrden; label: string; tono: 'success' | 'warning' | 'danger' | 'neutral' | 'mist' | 'petrol' }[] = [
  { value: 'PENDIENTE_CITA', label: 'Sin cita', tono: 'warning' },
  { value: 'CITA_ASIGNADA', label: 'Cita asignada', tono: 'mist' },
  { value: 'APTA', label: 'Apta', tono: 'success' },
  { value: 'PROGRAMADA', label: 'Cirugía programada', tono: 'petrol' },
  { value: 'OPERADA', label: 'Operada', tono: 'success' },
  { value: 'APLAZADA', label: 'Aplazada', tono: 'warning' },
  { value: 'NO_APTA', label: 'No apta', tono: 'danger' },
  { value: 'RECHAZADA', label: 'Rechazada', tono: 'danger' },
  { value: 'AVAL_VENCIDO', label: 'Aval vencido', tono: 'neutral' },
  { value: 'CANCELADA', label: 'Cancelada', tono: 'neutral' },
];

export const CONCEPTOS: Record<string, string> = {
  APTO: 'Apto',
  APTO_CON_RECOMENDACIONES: 'Apto con recomendaciones',
  APLAZADO: 'Aplazado',
  NO_APTO: 'No apto',
};

export const ROMANO = ['', 'I', 'II', 'III', 'IV', 'V', 'VI'];

export interface PacienteResumen {
  id: number;
  tipo_documento_id: number;
  tipo_documento?: { id: number; codigo: string };
  numero_documento: string;
  primer_nombre: string;
  segundo_nombre: string | null;
  primer_apellido: string;
  segundo_apellido: string | null;
  nombre_completo: string;
  fecha_nacimiento: string;
  edad: number | null;
  sexo: 'F' | 'M' | 'I';
  telefono: string | null;
  correo?: string | null;
  direccion?: string | null;
  municipio?: { id: number; codigo: string; nombre: string } | null;
}

export interface Cita {
  id: number;
  paciente_id: number;
  especialista_id: number;
  sede_id: number;
  orden_id: number | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  consultorio: string | null;
  tipo: string;
  estado: 'PROGRAMADA' | 'ATENDIDA' | 'CANCELADA' | 'NO_ASISTIO';
  origen: 'AUTOMATICA' | 'MANUAL';
  motivo_cancelacion: string | null;
  especialista?: { id: number; nombres: string; apellidos: string; nombre_completo: string };
  sede?: { id: number; nombre: string };
  paciente?: PacienteResumen;
  cups?: { id: number; codigo: string; nombre: string };
  orden?: { id: number; prioridad: string; estado: EstadoOrden; cups?: { id: number; codigo: string; nombre: string } } | null;
  historia?: { id: number; estado: 'BORRADOR' | 'FINALIZADA' } | null;
}

export interface Orden {
  id: number;
  paciente_id: number;
  contrato_id: number | null;
  cups_id: number;
  especialidad_id: number | null;
  diagnostico_cie10: string | null;
  diagnostico: string | null;
  prioridad: 'ELECTIVA' | 'PRIORITARIA';
  fecha_orden: string;
  medico_ordenante: string | null;
  observaciones: string | null;
  origen: 'API' | 'CSV' | 'MANUAL';
  sistema_origen: string | null;
  referencia_externa: string | null;
  estado: EstadoOrden;
  motivo_estado: string | null;
  concepto: string | null;
  asa: number | null;
  aval_desde: string | null;
  aval_hasta: string | null;
  aval_vencido: boolean;
  programable_desde: string | null;
  historia_id: number | null;
  created_at: string;
  paciente: PacienteResumen;
  cups: { id: number; codigo: string; nombre: string; es_quirurgico: boolean };
  especialidad: { id: number; codigo: string; nombre: string } | null;
  contrato: { id: number; numero: string; entidad?: { id: number; razon_social: string; sigla: string | null } } | null;
  cita_actual: Cita | null;
  cirujano?: { id: number; nombre_completo: string } | null;
  cirugia?: {
    id: number;
    fecha: string;
    hora_inicio: string;
    hora_fin: string;
    estado: 'PROPUESTA' | 'APROBADA' | 'REALIZADA';
    sala?: { id: number; codigo: string; nombre: string } | null;
    cirujano?: { id: number; nombre_completo: string } | null;
  } | null;
  /** Solo en el detalle. */
  citas?: Cita[];
  historia?: {
    id: number;
    estado: string;
    finalizada_en: string | null;
    origen: 'KIZUNA' | 'EXTERNO';
    profesional_externo: string | null;
    resultado: { alertas?: Alerta[] } | null;
    especialista?: { id: number; nombre_completo: string } | null;
  } | null;
}

export interface Alerta {
  nivel: 'bloqueo' | 'aviso' | 'info';
  mensaje: string;
}

export interface OrdenPayload {
  paciente: {
    tipo_documento: string;
    numero_documento: string;
    primer_nombre: string;
    segundo_nombre?: string | null;
    primer_apellido: string;
    segundo_apellido?: string | null;
    fecha_nacimiento: string;
    sexo: string;
    telefono?: string | null;
    correo?: string | null;
    municipio?: string | null;
  };
  cups: string;
  contrato_id?: number | null;
  diagnostico_cie10?: string | null;
  diagnostico?: string | null;
  prioridad: 'ELECTIVA' | 'PRIORITARIA';
  fecha_orden?: string;
  medico_ordenante?: string | null;
  observaciones?: string | null;
}

export interface Cupo {
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  especialista_id: number;
  especialista: string;
  sede_id: number;
  sede: string;
  agenda_id: number;
  consultorio: string | null;
}

export interface ReglasPreanestesia {
  cups_consulta_codigo: string;
  especialidad_codigo: string;
  vigencia_dias_por_asa: Record<string, number>;
  horizonte_dias: number;
  dias_anticipacion: number;
  duracion_minutos: number;
  cups_consulta: { id: number; codigo: string; nombre: string } | null;
  especialidad: { id: number; codigo: string; nombre: string } | null;
}

export type ResumenOrdenes = Record<FiltroOrden | 'TOTAL', number>;

export interface OrdenesFiltros extends ListParams {
  estado?: FiltroOrden;
  prioridad?: string;
}

export interface CitasFiltros extends ListParams {
  fecha?: string;
  especialista_id?: number;
  sede_id?: number;
  estado?: string;
  tipo?: string;
}

export interface ResultadoCargueOrdenes extends ResultadoCargue {
  nuevas: number;
  duplicadas: number;
  sin_especialidad: number;
  citas_asignadas: number;
  sin_cupo: number;
}
