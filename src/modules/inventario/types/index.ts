import type { ResultadoCargue } from '@/components/CargueArchivoModal';
import type { ListParams } from '@/lib/api/types';

export type TipoItem = 'EQUIPO' | 'INSTRUMENTAL' | 'INSUMO';
export type EstadoUnidad = 'OPERATIVO' | 'MANTENIMIENTO' | 'FUERA_SERVICIO' | 'BAJA';
export type TipoSala = 'QUIROFANO' | 'SALA_PROCEDIMIENTOS' | 'SALA_PARTOS' | 'OTRA';

export const TIPOS_SALA: { value: TipoSala; label: string }[] = [
  { value: 'QUIROFANO', label: 'Quirófano' },
  { value: 'SALA_PROCEDIMIENTOS', label: 'Sala de procedimientos' },
  { value: 'SALA_PARTOS', label: 'Sala de partos' },
  { value: 'OTRA', label: 'Otra' },
];

export const ESTADOS_UNIDAD: { value: EstadoUnidad; label: string; tono: 'success' | 'warning' | 'danger' | 'neutral' }[] = [
  { value: 'OPERATIVO', label: 'Operativo', tono: 'success' },
  { value: 'MANTENIMIENTO', label: 'En mantenimiento', tono: 'warning' },
  { value: 'FUERA_SERVICIO', label: 'Fuera de servicio', tono: 'danger' },
  { value: 'BAJA', label: 'De baja', tono: 'neutral' },
];

export const TIPO_ITEM: Record<TipoItem, { singular: string; plural: string }> = {
  EQUIPO: { singular: 'Equipo biomédico', plural: 'Equipos biomédicos' },
  INSTRUMENTAL: { singular: 'Instrumental', plural: 'Instrumental' },
  INSUMO: { singular: 'Insumo', plural: 'Insumos' },
};

export interface Item {
  id: number;
  tipo: TipoItem;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  unidad_medida: string | null;
  clasificacion_riesgo: 'I' | 'IIA' | 'IIB' | 'III' | null;
  requiere_calibracion: boolean;
  periodicidad_mantenimiento_meses: number | null;
  periodicidad_calibracion_meses: number | null;
  minutos_esterilizacion: number | null;
  stock_minimo: number | null;
  activo: boolean;
  unidades_count?: number;
  operativas_count?: number;
  existencias_total?: number | null;
}

export type ItemPayload = Omit<Item, 'id' | 'unidades_count' | 'operativas_count' | 'existencias_total'>;

export interface AlertaUnidad {
  tipo: 'proximo_mantenimiento' | 'calibracion_vence';
  nivel: 'bloqueo' | 'aviso';
  mensaje: string;
}

export interface Mantenimiento {
  id: number;
  unidad_id: number;
  tipo: 'PREVENTIVO' | 'CORRECTIVO' | 'CALIBRACION';
  inicio: string;
  fin: string;
  estado: 'PROGRAMADO' | 'TERMINADO' | 'CANCELADO';
  responsable: string | null;
  observaciones: string | null;
}

export interface Unidad {
  id: number;
  item_id: number;
  sede_id: number;
  sala_id: number | null;
  codigo: string;
  serie: string | null;
  marca: string | null;
  modelo: string | null;
  registro_invima: string | null;
  estado: EstadoUnidad;
  ultimo_mantenimiento: string | null;
  proximo_mantenimiento: string | null;
  calibracion_vence: string | null;
  observaciones: string | null;
  alertas: AlertaUnidad[];
  item: Pick<Item, 'id' | 'tipo' | 'codigo' | 'nombre' | 'requiere_calibracion' | 'minutos_esterilizacion'> & Partial<Item>;
  sede: { id: number; nombre: string };
  sala: { id: number; codigo: string; nombre: string } | null;
  mantenimientos?: Mantenimiento[];
}

export type UnidadPayload = Partial<Omit<Unidad, 'id' | 'alertas' | 'item' | 'sede' | 'sala' | 'mantenimientos'>>;

export interface Lote {
  id: number;
  lote: string;
  vence: string | null;
  cantidad: number;
}

export interface InsumoExistencias extends Item {
  total: number;
  bajo_minimo: boolean;
  por_vencer: boolean;
  con_vencidos: boolean;
  sedes: { sede: { id: number; nombre: string }; total: number; vencidos: number; lotes: Lote[] }[];
}

export interface Movimiento {
  id: number;
  tipo: 'ENTRADA' | 'SALIDA' | 'AJUSTE' | 'CONSUMO' | 'SINCRONIZACION';
  cantidad: number;
  saldo: number;
  motivo: string | null;
  origen: string;
  created_at: string;
  existencia?: { id: number; lote: string } | null;
  usuario?: { id: number; name: string } | null;
}

export interface Sala {
  id: number;
  sede_id: number;
  codigo: string;
  nombre: string;
  tipo: TipoSala;
  observaciones: string | null;
  activo: boolean;
  equipos_count: number;
  sede?: { id: number; nombre: string };
}

export interface Requerimiento {
  id: number;
  cups_id: number;
  sede_id: number | null;
  item_id: number;
  cantidad: number;
  notas: string | null;
  item: Pick<Item, 'id' | 'tipo' | 'codigo' | 'nombre' | 'unidad_medida'>;
}

export interface DetalleRequerimientos {
  cups: { id: number; codigo: string; nombre: string };
  base: Requerimiento[];
  sedes: {
    sede: { id: number; nombre: string };
    tipo_sala: TipoSala | null;
    duracion_minutos: number;
    ajustes: Requerimiento[];
    efectivos: Requerimiento[];
  }[];
}

export interface CupsRequerimientos {
  id: number;
  codigo: string;
  nombre: string;
  requerimientos_count: number;
  sedes_ajustadas_count: number;
}

export interface RecursoVerificado {
  item: Pick<Item, 'id' | 'tipo' | 'codigo' | 'nombre' | 'unidad_medida'>;
  requerido: number;
  disponible: number;
  ok: boolean;
  asignables: { id: number; codigo: string }[];
  motivos: string[];
  avisos: string[];
}

export interface Verificacion {
  viable: boolean;
  sala: { id: number; codigo: string; nombre: string } | null;
  tipo_sala: TipoSala | null;
  recursos: RecursoVerificado[];
  sin_requerimientos: boolean;
  motivos: string[];
  /** No impiden programar (p. ej. mantenimiento preventivo vencido). */
  avisos: string[];
  inicio: string;
  fin: string;
}

export interface ResumenInventario {
  equipos: {
    total: number;
    operativos: number;
    fuera_servicio: number;
    mantenimiento_vencido: number;
    mantenimiento_proximo: number;
    calibracion_vencida: number;
    calibracion_proxima: number;
  };
  instrumental: { total: number; operativas: number };
  insumos: { total: number; bajo_minimo: number; por_vencer: number; vencidos: number };
  cups: { en_portafolio: number; sin_requerimientos: number };
}

export interface ItemsFiltros extends ListParams {
  tipo?: TipoItem;
}

export interface UnidadesFiltros extends ListParams {
  tipo?: TipoItem;
  item_id?: number;
  sede_id?: number;
  sala_id?: number;
  estado?: EstadoUnidad;
  alerta?: 'mantenimiento' | 'calibracion' | 'vencidos';
}

export interface ExistenciasFiltros extends ListParams {
  sede_id?: number;
  bajo_minimo?: boolean;
  por_vencer?: boolean;
}

export interface ResultadoCargueInventario extends ResultadoCargue {
  creados: number;
  actualizados: number;
}
