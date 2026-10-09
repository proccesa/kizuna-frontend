import type { Orden, PacienteResumen } from '@/modules/cirugia/types';

export interface FactorPrioridad {
  etiqueta: string;
  puntos: number;
}

export interface Cirugia {
  id: number;
  corrida_id: number | null;
  orden_id: number;
  paciente_id: number;
  sede_id: number;
  sala_id: number | null;
  cirujano_id: number;
  anestesiologo_id: number | null;
  fecha: string;
  hora_inicio: string;
  hora_fin: string;
  estado: 'PROPUESTA' | 'APROBADA' | 'REALIZADA' | 'CANCELADA';
  puntaje: number;
  prioridad: { factores: FactorPrioridad[]; temprano: string | null } | null;
  avisos: string[] | null;
  motivo_cancelacion: string | null;
  paciente: PacienteResumen;
  cups: { id: number; codigo: string; nombre: string };
  sede: { id: number; nombre: string };
  sala: { id: number; codigo: string; nombre: string } | null;
  cirujano: { id: number; nombre_completo: string };
  anestesiologo: { id: number; nombre_completo: string } | null;
  orden: { id: number; prioridad: 'ELECTIVA' | 'PRIORITARIA'; asa: number | null; aval_hasta: string | null; referencia_externa: string | null; contrato?: { numero: string; entidad?: { sigla: string | null; razon_social: string } } | null };
}

export interface NoProgramada {
  orden_id: number;
  paciente: string;
  cups: string;
  puntaje: number;
  motivo: string;
  aval_hasta: string | null;
  aval_por_vencer: boolean;
}

export interface Corrida {
  id: number;
  desde: string;
  hasta: string;
  estado: 'PROPUESTA' | 'APROBADA' | 'DESCARTADA';
  resumen: { evaluadas: number; programadas: number; no_programadas: NoProgramada[] } | null;
  created_at: string;
  creada_por?: { id: number; name: string } | null;
  cirugias: Cirugia[];
}

export interface EnCola {
  orden: Orden;
  puntaje: number;
  factores: FactorPrioridad[];
  temprano: string | null;
  dias_aval: number;
  aval_por_vencer: boolean;
}

export interface ResumenProgramacion {
  por_programar: number;
  aval_por_vencer: number;
  programadas_hoy: number;
  programadas_7_dias: number;
  realizadas_mes: number;
  propuesta_pendiente: number | null;
}
