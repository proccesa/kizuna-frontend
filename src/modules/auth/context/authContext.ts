import { createContext } from 'react';
import type { LoginPayload, UsuarioSesion } from '../types';

export type AuthStatus = 'loading' | 'authenticated' | 'guest';

export interface AuthContextValue {
  usuario: UsuarioSesion | null;
  status: AuthStatus;
  login: (payload: LoginPayload) => Promise<UsuarioSesion>;
  logout: () => Promise<void>;
  refrescarPerfil: () => Promise<void>;
  /** ¿El usuario tiene el permiso? `super-admin` tiene acceso total. */
  can: (permiso: string) => boolean;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
