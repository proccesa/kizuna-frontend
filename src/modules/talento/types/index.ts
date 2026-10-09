import type { ListParams } from '@/lib/api/types';

export interface EspecialidadResumen {
  id: number;
  codigo: string;
  nombre: string;
}

export interface SedeAgenda {
  id: number;
  nombre: string;
  prestador_id: number;
  /** Incluidos en el detalle del especialista y en GET /agendas. */
  dias_atencion?: number[];
  hora_apertura?: string;
  hora_cierre?: string;
  prestador?: { id: number; razon_social: string; nombre_comercial: string | null };
}

/** Franja semanal: el profesional atiende una especialidad en una sede, ciertos días y horas. */
export interface Agenda {
  id: number;
  especialista_id: number;
  sede_id: number;
  especialidad_id: number;
  /** Días ISO: 1 = lunes … 7 = domingo. */
  dias: number[];
  hora_inicio: string;
  hora_fin: string;
  vigente_desde: string;
  vigente_hasta: string | null;
  consultorio: string | null;
  activo: boolean;
  horas_semana: number;
  sede?: SedeAgenda;
  especialidad?: { id: number; nombre: string };
  especialista?: { id: number; nombres: string; apellidos: string; nombre_completo: string };
}

export type TipoAusencia = 'VACACIONES' | 'INCAPACIDAD' | 'LICENCIA' | 'CAPACITACION' | 'OTRO';

export const TIPOS_AUSENCIA: { value: TipoAusencia; label: string }[] = [
  { value: 'VACACIONES', label: 'Vacaciones' },
  { value: 'INCAPACIDAD', label: 'Incapacidad' },
  { value: 'LICENCIA', label: 'Licencia' },
  { value: 'CAPACITACION', label: 'Capacitación' },
  { value: 'OTRO', label: 'Otro' },
];

export interface Ausencia {
  id: number;
  especialista_id: number;
  tipo: TipoAusencia;
  fecha_inicio: string;
  fecha_fin: string;
  observacion: string | null;
}

export interface Especialista {
  id: number;
  user_id: number | null;
  tipo_documento_id: number;
  tipo_documento?: { id: number; codigo: string; nombre: string };
  numero_documento: string;
  nombres: string;
  apellidos: string;
  nombre_completo: string;
  registro_profesional: string | null;
  correo: string | null;
  telefono: string | null;
  activo: boolean;
  especialidades: EspecialidadResumen[];
  agendas: Agenda[];
  /** Solo en el detalle: novedades desde hace 30 días. */
  ausencias?: Ausencia[];
  /** Horas semanales de las franjas vigentes. */
  horas_semana: number;
  /** Sedes donde tiene agenda vigente. */
  sedes: { id: number; nombre: string }[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EspecialistaPayload {
  tipo_documento_id: number;
  numero_documento: string;
  nombres: string;
  apellidos: string;
  registro_profesional?: string | null;
  correo?: string | null;
  telefono?: string | null;
  especialidad_ids: number[];
  user_id?: number | null;
  activo?: boolean;
}

export interface AgendaPayload {
  sede_id: number;
  especialidad_id: number;
  dias: number[];
  hora_inicio: string;
  hora_fin: string;
  vigente_desde: string;
  vigente_hasta?: string | null;
  consultorio?: string | null;
  activo?: boolean;
}

export interface AusenciaPayload {
  tipo: TipoAusencia;
  fecha_inicio: string;
  fecha_fin: string;
  observacion?: string | null;
}

export interface EspecialistasFiltros extends ListParams {
  especialidad_id?: number;
  sede_id?: number;
  sin_agenda?: boolean;
}

export interface ResumenTalento {
  activos: number;
  horas_semana: number;
  sin_agenda: number;
  ausentes_hoy: number;
}

export interface ResultadoImportacion {
  total: number;
  creados: number;
  actualizados: number;
  simulado: boolean;
  errores: { fila: number; documento: string; mensajes: string[] }[];
}
