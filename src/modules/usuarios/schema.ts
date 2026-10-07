import { z } from 'zod';
import {
  emptyOperadorFields,
  fieldsToOperadorPayload,
  operadorFieldsSchema,
  operadorToFields,
} from '@/modules/operadores/schema';
import type { Usuario, UsuarioPayload } from './types';

const operadorDraft = z.object({
  tipo_documento_id: z.string(),
  documento: z.string(),
  nombre: z.string(),
  apellido: z.string(),
  telefono: z.string(),
  direccion: z.string(),
});

/** Al crear, la contraseña es obligatoria; al editar, vacía significa "no cambiar". */
export const usuarioSchema = z
  .object({
    esEdicion: z.boolean(),
    name: z.string().trim().min(1, 'El nombre de usuario es obligatorio.').max(255, 'Máximo 255 caracteres.'),
    email: z.string().trim().min(1, 'El correo electrónico es obligatorio.').pipe(z.email('El formato del correo no es válido.')),
    password: z.string(),
    activo: z.boolean(),
    roles: z.array(z.string()),
    conOperador: z.boolean(),
    operador: operadorDraft,
  })
  .superRefine((values, ctx) => {
    const password = values.password;
    if (!values.esEdicion && !password) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'La contraseña es obligatoria.' });
    } else if (password && password.length < 8) {
      ctx.addIssue({ code: 'custom', path: ['password'], message: 'La contraseña debe tener al menos 8 caracteres.' });
    }

    // Los datos del operador solo se validan si se van a enviar.
    if (values.conOperador) {
      const result = operadorFieldsSchema.safeParse(values.operador);
      if (!result.success) {
        result.error.issues.forEach((issue) =>
          ctx.addIssue({ code: 'custom', path: ['operador', ...issue.path], message: issue.message }),
        );
      }
    }
  });

export type UsuarioFormValues = z.infer<typeof usuarioSchema>;

export function usuarioToForm(usuario: Usuario | null): UsuarioFormValues {
  return {
    esEdicion: !!usuario,
    name: usuario?.name ?? '',
    email: usuario?.email ?? '',
    password: '',
    activo: usuario?.activo ?? true,
    roles: usuario?.roles.map((rol) => rol.name) ?? [],
    conOperador: !!usuario?.operador,
    operador: usuario?.operador ? operadorToFields(usuario.operador) : emptyOperadorFields,
  };
}

export function formToPayload(values: UsuarioFormValues): UsuarioPayload {
  const payload: UsuarioPayload = {
    name: values.name.trim(),
    email: values.email.trim().toLowerCase(),
    activo: values.activo,
    roles: values.roles,
  };
  if (values.password) payload.password = values.password;
  if (values.conOperador) payload.operador = fieldsToOperadorPayload(values.operador);
  return payload;
}
