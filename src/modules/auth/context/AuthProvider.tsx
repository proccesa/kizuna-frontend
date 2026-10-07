import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { UNAUTHORIZED_EVENT } from '@/lib/api/client';
import { tokenStorage } from '@/lib/storage';
import { notify } from '@/lib/toast';
import { authService } from '../services/authService';
import type { LoginPayload, UsuarioSesion } from '../types';
import { AuthContext, type AuthContextValue, type AuthStatus } from './authContext';

const SUPER_ADMIN = 'super-admin';

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() => (tokenStorage.get() ? 'loading' : 'guest'));

  const limpiarSesion = useCallback(() => {
    tokenStorage.clear();
    queryClient.clear();
    setUsuario(null);
    setStatus('guest');
  }, [queryClient]);

  // Restaura la sesión si existe un token guardado.
  useEffect(() => {
    if (!tokenStorage.get()) return;

    let cancelado = false;
    authService
      .perfil()
      .then((perfil) => {
        if (cancelado) return;
        setUsuario(perfil);
        setStatus('authenticated');
      })
      .catch(() => {
        if (!cancelado) limpiarSesion();
      });

    return () => {
      cancelado = true;
    };
  }, [limpiarSesion]);

  // Sesión vencida o revocada en el backend.
  useEffect(() => {
    const onUnauthorized = () => {
      limpiarSesion();
      notify.warning('Tu sesión expiró. Inicia sesión nuevamente.');
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [limpiarSesion]);

  const login = useCallback(async (payload: LoginPayload) => {
    const { token, usuario: perfil } = await authService.login({
      ...payload,
      dispositivo: payload.dispositivo ?? 'kizuna-web',
    });
    tokenStorage.set(token);
    setUsuario(perfil);
    setStatus('authenticated');
    return perfil;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Aunque falle la revocación remota, la sesión local se cierra.
    } finally {
      limpiarSesion();
    }
  }, [limpiarSesion]);

  const refrescarPerfil = useCallback(async () => {
    setUsuario(await authService.perfil());
  }, []);

  const can = useCallback(
    (permiso: string) => !!usuario && (usuario.roles.includes(SUPER_ADMIN) || usuario.permisos.includes(permiso)),
    [usuario],
  );

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, status, login, logout, refrescarPerfil, can }),
    [usuario, status, login, logout, refrescarPerfil, can],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
