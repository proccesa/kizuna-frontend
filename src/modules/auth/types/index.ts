import type { Operador } from '@/modules/operadores/types';

export interface UsuarioSesion {
  id: number;
  name: string;
  email: string;
  activo: boolean;
  operador: Operador | null;
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
