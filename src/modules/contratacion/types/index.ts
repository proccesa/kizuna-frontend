import type { ResultadoCargue } from '@/components/CargueArchivoModal';
import type { ListParams } from '@/lib/api/types';

export interface CatalogoRef {
  id: number;
  codigo: string;
  nombre: string;
}

export type TipoEntidad = 'EPS' | 'MEDICINA_PREPAGADA' | 'ARL' | 'ASEGURADORA' | 'ENTIDAD_TERRITORIAL' | 'REGIMEN_ESPECIAL' | 'OTRO';

export const TIPOS_ENTIDAD: { value: TipoEntidad; label: string }[] = [
  { value: 'EPS', label: 'EPS' },
  { value: 'MEDICINA_PREPAGADA', label: 'Medicina prepagada' },
  { value: 'ARL', label: 'ARL' },
  { value: 'ASEGURADORA', label: 'Aseguradora (SOAT, pólizas)' },
  { value: 'ENTIDAD_TERRITORIAL', label: 'Entidad territorial' },
  { value: 'REGIMEN_ESPECIAL', label: 'Régimen especial o de excepción' },
  { value: 'OTRO', label: 'Otro' },
];

export interface Entidad {
  id: number;
  nit: string;
  digito_verificacion: string;
  nit_completo: string;
  razon_social: string;
  sigla: string | null;
  codigo_minsalud: string | null;
  tipo: TipoEntidad;
  telefono: string | null;
  correo: string | null;
  activo: boolean;
  regimenes: CatalogoRef[];
  contratos_count: number;
  contratos_en_ejecucion_count: number;
  pacientes_count: number;
  deleted_at: string | null;
}

export interface EntidadPayload {
  nit: string;
  digito_verificacion: string;
  razon_social: string;
  sigla?: string | null;
  codigo_minsalud?: string | null;
  tipo: TipoEntidad;
  regimen_ids: number[];
  telefono?: string | null;
  correo?: string | null;
  activo?: boolean;
}

export type EstadoContrato = 'POR_INICIAR' | 'VIGENTE' | 'POR_VENCER' | 'VENCIDO' | 'SUSPENDIDO';

export const ESTADOS_CONTRATO: { value: EstadoContrato; label: string; tono: 'success' | 'warning' | 'neutral' | 'danger' | 'mist' }[] = [
  { value: 'VIGENTE', label: 'Vigente', tono: 'success' },
  { value: 'POR_VENCER', label: 'Por vencer', tono: 'warning' },
  { value: 'POR_INICIAR', label: 'Por iniciar', tono: 'mist' },
  { value: 'VENCIDO', label: 'Vencido', tono: 'neutral' },
  { value: 'SUSPENDIDO', label: 'Suspendido', tono: 'danger' },
];

export interface SedeContrato {
  id: number;
  nombre: string;
  prestador_id: number;
  activo: boolean;
  prestador?: { id: number; razon_social: string; nombre_comercial: string | null };
}

export interface Contrato {
  id: number;
  entidad_id: number;
  numero: string;
  modalidad_contratacion_id: number;
  regimen_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  valor: number;
  objeto: string | null;
  activo: boolean;
  estado: EstadoContrato;
  entidad: { id: number; nit: string; digito_verificacion: string; razon_social: string; sigla: string | null };
  modalidad: CatalogoRef;
  regimen: CatalogoRef;
  cups_count: number;
  sedes_count: number;
  poblaciones_count: number;
  pacientes_count: number;
  /** Solo en el detalle. */
  sedes?: SedeContrato[];
  poblaciones?: Poblacion[];
  cups_sin_portafolio_count?: number;
  cumplimiento?: Cumplimiento | null;
  deleted_at: string | null;
}

/** Avance del contrato con las cirugías de sus pacientes dentro de la vigencia. */
export interface Cumplimiento {
  modalidad: string | null;
  realizadas: number;
  /** Aprobadas aún sin realizar. */
  programadas: number;
  /** Porcentaje de la vigencia transcurrido. */
  avance_tiempo: number;
  /** PGP: realizadas ÷ cantidad pactada. Evento: valor ejecutado ÷ valor del contrato. Null en cápita. */
  porcentaje: number | null;
  /** Igual que porcentaje, sumando las programadas. */
  porcentaje_comprometido: number | null;
  /** PGP: cantidad pactada. Evento: valor del contrato. */
  meta: number | null;
  /** Evento: realizadas × tarifa. */
  ejecutado: number | null;
  /** Lo comprometido va más de 10 puntos por debajo del tiempo transcurrido. */
  atrasado: boolean;
}

export interface ContratoPayload {
  entidad_id: number;
  numero: string;
  modalidad_contratacion_id: number;
  regimen_id: number;
  fecha_inicio: string;
  fecha_fin: string;
  valor: number;
  objeto?: string | null;
  sede_ids: number[];
  activo?: boolean;
}

export interface ContratoCups {
  id: number;
  codigo: string;
  nombre: string;
  habilitado: boolean;
  cantidad: number | null;
  tarifa: number | null;
  /** Alguna sede del contrato lo tiene en su portafolio. */
  en_portafolio: boolean;
  /** Alguna especialidad lo atiende. */
  con_especialidad: boolean;
  realizadas: number;
  programadas: number;
}

export interface ResumenContratos {
  en_ejecucion: number;
  por_vencer: number;
  vencidos: number;
  por_modalidad: { modalidad: CatalogoRef | null; cantidad: number; valor: number }[];
}

export interface PoblacionCargue {
  id: number;
  archivo: string;
  modo: 'REEMPLAZAR' | 'AGREGAR';
  total: number;
  nuevos: number;
  actualizados: number;
  retirados: number;
  con_errores: number;
  created_at: string;
  usuario?: { id: number; name: string } | null;
}

export interface Poblacion {
  id: number;
  contrato_id: number;
  nombre: string;
  descripcion: string | null;
  ultimo_cargue_en: string | null;
  cargue_al_dia: boolean;
  activo: boolean;
  pacientes_count: number;
  contrato?: Pick<Contrato, 'id' | 'entidad_id' | 'numero' | 'fecha_inicio' | 'fecha_fin' | 'activo'> & {
    entidad?: { id: number; razon_social: string; sigla: string | null };
    modalidad?: CatalogoRef;
    regimen?: CatalogoRef;
  };
  /** Solo en el detalle. */
  cargues?: PoblacionCargue[];
  cohortes?: { nombre: string; pacientes: number }[];
  deleted_at: string | null;
}

export interface PoblacionPayload {
  contrato_id: number;
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface Paciente {
  id: number;
  tipo_documento?: { id: number; codigo: string };
  numero_documento: string;
  nombre_completo: string;
  fecha_nacimiento: string;
  edad: number | null;
  sexo: 'F' | 'M' | 'I';
  telefono: string | null;
  correo: string | null;
  municipio?: { id: number; codigo: string; nombre: string } | null;
  cohortes: string[];
  activo_en_poblacion: boolean;
}

export interface ResumenPoblaciones {
  poblaciones: number;
  pacientes: number;
  sin_cargue_mes: number;
}

export type ModoCargue = 'REEMPLAZAR' | 'AGREGAR';

export interface ResultadoCarguePoblacion extends ResultadoCargue {
  nuevos: number;
  actualizados: number;
  retirados: number;
  con_errores: number;
  modo: ModoCargue;
  pacientes_antes: number;
  pacientes_despues: number;
}

export interface EntidadesFiltros extends ListParams {
  tipo?: TipoEntidad;
  regimen_id?: number;
}

export interface ContratosFiltros extends ListParams {
  entidad_id?: number;
  modalidad_contratacion_id?: number;
  regimen_id?: number;
  /** EN_EJECUCION = vigentes y por vencer. */
  estado?: EstadoContrato | 'EN_EJECUCION';
}

export interface PoblacionesFiltros extends ListParams {
  contrato_id?: number;
  entidad_id?: number;
  sin_cargue_mes?: boolean;
}

export interface PacientesFiltros extends ListParams {
  cohorte?: string;
  incluir_retirados?: boolean;
}
