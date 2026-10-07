import { AxiosError } from 'axios';
import type { ApiErrorBody } from './types';

/** Error normalizado de la API para toda la aplicación. */
export class ApiError extends Error {
  readonly status: number;
  readonly fieldErrors: Record<string, string[]>;

  constructor(message: string, status: number, fieldErrors: Record<string, string[]> = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }

  get isValidation() {
    return this.status === 422;
  }

  get isUnauthorized() {
    return this.status === 401;
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (error instanceof AxiosError) {
    if (!error.response) {
      const message =
        error.code === 'ECONNABORTED'
          ? 'El servidor tardó demasiado en responder. Intenta de nuevo.'
          : 'No fue posible conectar con el servidor. Verifica tu conexión.';
      return new ApiError(message, 0);
    }

    const body = error.response.data as Partial<ApiErrorBody> | undefined;
    const fieldErrors =
      body?.errores && typeof body.errores === 'object' && !Array.isArray(body.errores) ? body.errores : {};

    return new ApiError(body?.mensaje ?? 'Ocurrió un error inesperado.', error.response.status, fieldErrors);
  }

  return new ApiError('Ocurrió un error inesperado.', 0);
}

/** Mensaje legible para mostrar en un toast. Prioriza el primer error de campo. */
export function getErrorMessage(error: unknown): string {
  const apiError = toApiError(error);
  const firstField = Object.values(apiError.fieldErrors)[0]?.[0];
  return apiError.isValidation && firstField ? firstField : apiError.message;
}
