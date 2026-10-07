import { z } from 'zod';
import { emptyToNull } from '@/lib/forms';
import type { Operador, OperadorPayload } from './types';

/** Campos de operador (reutilizados en el formulario de usuarios). */
export const operadorFieldsSchema = z.object({
  tipo_documento_id: z.string().min(1, 'Selecciona el tipo de documento.'),
  documento: z
    .string()
    .trim()
    .min(1, 'El número de documento es obligatorio.')
    .max(30, 'Máximo 30 caracteres.')
    .regex(/^[A-Za-z0-9-]+$/, 'Solo letras, números y guiones.'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(100, 'Máximo 100 caracteres.'),
  apellido: z.string().trim().min(1, 'El apellido es obligatorio.').max(100, 'Máximo 100 caracteres.'),
  telefono: z.string().trim().max(30, 'Máximo 30 caracteres.'),
  direccion: z.string().trim().max(255, 'Máximo 255 caracteres.'),
});

export type OperadorFieldsValues = z.infer<typeof operadorFieldsSchema>;

export const emptyOperadorFields: OperadorFieldsValues = {
  tipo_documento_id: '',
  documento: '',
  nombre: '',
  apellido: '',
  telefono: '',
  direccion: '',
};

export function operadorToFields(operador?: Operador | null): OperadorFieldsValues {
  if (!operador) return emptyOperadorFields;
  return {
    tipo_documento_id: String(operador.tipo_documento_id),
    documento: operador.documento,
    nombre: operador.nombre,
    apellido: operador.apellido,
    telefono: operador.telefono ?? '',
    direccion: operador.direccion ?? '',
  };
}

export function fieldsToOperadorPayload(values: OperadorFieldsValues): OperadorPayload {
  return {
    tipo_documento_id: Number(values.tipo_documento_id),
    documento: values.documento.trim(),
    nombre: values.nombre.trim(),
    apellido: values.apellido.trim(),
    telefono: emptyToNull(values.telefono),
    direccion: emptyToNull(values.direccion),
  };
}
