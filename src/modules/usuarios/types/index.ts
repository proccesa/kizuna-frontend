import type { ListParams } from '@/lib/api/types';
import type { Operador, OperadorPayload } from '@/modules/operadores/types';
import type { Rol } from '@/modules/roles/types';

export interface Usuario {
  id: number;
  name: string;
  email: string;
  activo: boolean;
  email_verified_at: string | null;
  operador: Operador | null;
  roles: Rol[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UsuarioPayload {
  name: string;
  email: string;
  /** Obligatoria al crear; opcional al editar (vacía = no cambia). */
  password?: string;
  activo?: boolean;
  roles?: string[];
  operador?: OperadorPayload | null;
}

export interface UsuariosFiltros extends ListParams {
  rol?: string;
}
