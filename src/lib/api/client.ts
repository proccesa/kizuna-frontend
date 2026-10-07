import axios from 'axios';
import { env } from '@/config/env';
import { tokenStorage } from '@/lib/storage';
import { toApiError } from './errors';

export const UNAUTHORIZED_EVENT = 'kizuna:unauthorized';

export const api = axios.create({
  baseURL: env.apiUrl,
  timeout: 20_000,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = tokenStorage.get();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = toApiError(error);
    // Token vencido o revocado: el AuthProvider escucha este evento y cierra la sesión.
    if (apiError.isUnauthorized && tokenStorage.get()) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(apiError);
  },
);
