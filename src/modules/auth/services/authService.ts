import { api } from '@/lib/api/client';
import type { ApiResponse } from '@/lib/api/types';
import type { LoginPayload, LoginResponse, UsuarioSesion } from '../types';

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const { data } = await api.post<ApiResponse<LoginResponse>>('/auth/login', payload);
    return data.datos;
  },

  async perfil(): Promise<UsuarioSesion> {
    const { data } = await api.get<ApiResponse<UsuarioSesion>>('/auth/perfil');
    return data.datos;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },
};
