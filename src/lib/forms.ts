import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { getErrorMessage, toApiError } from '@/lib/api/errors';
import { notify } from '@/lib/toast';

/**
 * Lleva los errores 422 del backend (p. ej. `email`, `operador.documento`) a los
 * campos del formulario. Si no hay errores de campo, muestra un toast.
 */
export function applyServerErrors<T extends FieldValues>(error: unknown, setError: UseFormSetError<T>) {
  const apiError = toApiError(error);
  const entries = Object.entries(apiError.fieldErrors);

  if (!apiError.isValidation || entries.length === 0) {
    notify.error(getErrorMessage(error));
    return;
  }

  entries.forEach(([field, messages], index) => {
    // "roles.0" → "roles"
    const name = field.replace(/\.\d+$/, '') as Path<T>;
    setError(name, { type: 'server', message: messages[0] }, { shouldFocus: index === 0 });
  });
  notify.error(apiError.message);
}

/** Convierte cadenas vacías en null para campos opcionales. */
export const emptyToNull = (value?: string | null) => (value && value.trim() !== '' ? value.trim() : null);
