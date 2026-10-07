import type { ListParams } from '@/lib/api/types';
import type { TipoDocumento } from '@/modules/catalogos/types';

export interface Operador {
  id: number;
  user_id: number | null;
  tipo_documento_id: number;
  documento: string;
  nombre: string;
  apellido: string;
  nombre_completo: string;
  telefono: string | null;
  direccion: string | null;
  activo: boolean;
  tipo_documento?: TipoDocumento;
  usuario?: { id: number; name: string; email: string } | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OperadorPayload {
  tipo_documento_id: number;
  documento: string;
  nombre: string;
  apellido: string;
  telefono?: string | null;
  direccion?: string | null;
  activo?: boolean;
}

export interface OperadoresFiltros extends ListParams {
  tipo_documento_id?: number;
}
