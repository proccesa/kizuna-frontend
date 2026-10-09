import { z } from 'zod';
import { emptyToNull } from '@/lib/forms';
import type { OrdenPayload } from './types';

export const ordenSchema = z.object({
  tipo_documento: z.string().min(1, 'Selecciona el tipo.'),
  numero_documento: z.string().trim().regex(/^[A-Za-z0-9]{3,20}$/, 'Entre 3 y 20 letras o números, sin puntos.'),
  primer_nombre: z.string().trim().min(1, 'Obligatorio.').max(60),
  segundo_nombre: z.string().trim().max(60),
  primer_apellido: z.string().trim().min(1, 'Obligatorio.').max(60),
  segundo_apellido: z.string().trim().max(60),
  fecha_nacimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.'),
  sexo: z.enum(['F', 'M', 'I'], 'Selecciona el sexo.'),
  telefono: z.string().trim().max(30),
  cups: z.string().min(1, 'Elige el procedimiento.'),
  contrato_id: z.string(),
  diagnostico_cie10: z.string().trim().refine((v) => !v || /^[A-Za-z]\d{2}[A-Za-z0-9]{0,2}$/.test(v.replace('.', '')), 'Formato CIE-10: K802.'),
  diagnostico: z.string().trim().max(255),
  prioridad: z.enum(['ELECTIVA', 'PRIORITARIA']),
  medico_ordenante: z.string().trim().max(150),
});

export type OrdenFormValues = z.infer<typeof ordenSchema>;

export const ordenVacia = (): OrdenFormValues => ({
  tipo_documento: 'CC',
  numero_documento: '',
  primer_nombre: '',
  segundo_nombre: '',
  primer_apellido: '',
  segundo_apellido: '',
  fecha_nacimiento: '',
  sexo: 'F',
  telefono: '',
  cups: '',
  contrato_id: '',
  diagnostico_cie10: '',
  diagnostico: '',
  prioridad: 'ELECTIVA',
  medico_ordenante: '',
});

export function formToOrdenPayload(v: OrdenFormValues): OrdenPayload {
  return {
    paciente: {
      tipo_documento: v.tipo_documento,
      numero_documento: v.numero_documento,
      primer_nombre: v.primer_nombre,
      segundo_nombre: emptyToNull(v.segundo_nombre),
      primer_apellido: v.primer_apellido,
      segundo_apellido: emptyToNull(v.segundo_apellido),
      fecha_nacimiento: v.fecha_nacimiento,
      sexo: v.sexo,
      telefono: emptyToNull(v.telefono),
    },
    cups: v.cups,
    contrato_id: v.contrato_id ? Number(v.contrato_id) : null,
    diagnostico_cie10: emptyToNull(v.diagnostico_cie10?.replace('.', '').toUpperCase()),
    diagnostico: emptyToNull(v.diagnostico),
    prioridad: v.prioridad,
    medico_ordenante: emptyToNull(v.medico_ordenante),
  };
}
