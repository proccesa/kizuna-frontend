import type { Operador } from '@/modules/operadores/types';

export interface UsuarioSesion {
  id: number;
  name: string;
  email: string;
  activo: boolean;
  operador: Operador | null;
  /** Profesional vinculado a la cuenta (firma historias, ve su agenda). */
  especialista?: { id: number; nombre_completo: string; registro_profesional: string | null; especialidades: { id: number; codigo: string; nombre: string }[] } | null;
  roles: string[];
  permisos: string[];
  creado_el: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  dispositivo?: string;
}

export interface LoginResponse {
  token: string;
  tipo_token: 'Bearer';
  usuario: UsuarioSesion;
}
