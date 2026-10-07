import type { ListParams } from '@/lib/api/types';
import type { Municipio } from '@/modules/catalogos/types';

export type Naturaleza = 'PRIVADA' | 'PUBLICA' | 'MIXTA';

export const NATURALEZAS: { value: Naturaleza; label: string }[] = [
  { value: 'PRIVADA', label: 'Privada' },
  { value: 'PUBLICA', label: 'Pública' },
  { value: 'MIXTA', label: 'Mixta' },
];

export interface Sede {
  id: number;
  prestador_id: number;
  numero_sede: string;
  nombre: string;
  municipio_id: number;
  municipio?: Municipio;
  /** Incluido en el listado general de sedes (GET /sedes). */
  prestador?: { id: number; nit: string; digito_verificacion: string; razon_social: string; nombre_comercial: string | null; activo: boolean };
  direccion: string;
  telefono: string | null;
  correo: string | null;
  consultorios: number;
  /** Días ISO: 1 = lunes … 7 = domingo. */
  dias_atencion: number[];
  hora_apertura: string;
  hora_cierre: string;
  es_principal: boolean;
  activo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Prestador {
  id: number;
  nit: string;
  digito_verificacion: string;
  nit_completo: string;
  razon_social: string;
  nombre_comercial: string | null;
  codigo_habilitacion: string | null;
  naturaleza: Naturaleza;
  telefono: string | null;
  correo: string | null;
  representante_legal: string | null;
  activo: boolean;
  sedes?: Sede[];
  sedes_count?: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PrestadorPayload {
  nit: string;
  digito_verificacion: string;
  razon_social: string;
  nombre_comercial?: string | null;
  codigo_habilitacion?: string | null;
  naturaleza: Naturaleza;
  telefono?: string | null;
  correo?: string | null;
  representante_legal?: string | null;
  activo?: boolean;
}

export interface SedePayload {
  numero_sede: string;
  nombre: string;
  municipio_id: number;
  direccion: string;
  telefono?: string | null;
  correo?: string | null;
  consultorios?: number;
  dias_atencion: number[];
  hora_apertura: string;
  hora_cierre: string;
  es_principal?: boolean;
  activo?: boolean;
}

export interface PrestadoresFiltros extends ListParams {
  naturaleza?: Naturaleza;
}

export interface SedesFiltros extends ListParams {
  prestador_id?: number;
  municipio_id?: number;
}
