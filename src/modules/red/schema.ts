import { z } from 'zod';
import { emptyToNull } from '@/lib/forms';
import { calcularDigitoVerificacion } from '@/lib/nit';
import type { Prestador, PrestadorPayload, Sede, SedePayload } from './types';

const textoOpcional = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const correoOpcional = z.string().trim().refine((v) => !v || z.email().safeParse(v).success, 'El correo no tiene un formato válido.');

// ---------------------------------------------------------------- Prestador

export const prestadorSchema = z
  .object({
    nit: z.string().trim().regex(/^\d{6,15}$/, 'Entre 6 y 15 dígitos, sin puntos ni dígito de verificación.'),
    digito_verificacion: z.string().trim().regex(/^\d$/, 'Un solo dígito.'),
    razon_social: z.string().trim().min(1, 'La razón social es obligatoria.').max(200, 'Máximo 200 caracteres.'),
    nombre_comercial: textoOpcional(200),
    codigo_habilitacion: z.string().trim().refine((v) => !v || /^\d{10,12}$/.test(v), 'Entre 10 y 12 dígitos.'),
    naturaleza: z.enum(['PRIVADA', 'PUBLICA', 'MIXTA'], 'Selecciona la naturaleza jurídica.'),
    telefono: textoOpcional(30),
    correo: correoOpcional,
    representante_legal: textoOpcional(150),
    activo: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const dv = calcularDigitoVerificacion(v.nit);
    if (dv !== null && v.digito_verificacion !== '' && String(dv) !== v.digito_verificacion) {
      ctx.addIssue({ code: 'custom', path: ['digito_verificacion'], message: 'No corresponde al NIT.' });
    }
  });

export type PrestadorFormValues = z.infer<typeof prestadorSchema>;

export function prestadorToForm(p: Prestador | null): PrestadorFormValues {
  return {
    nit: p?.nit ?? '',
    digito_verificacion: p?.digito_verificacion ?? '',
    razon_social: p?.razon_social ?? '',
    nombre_comercial: p?.nombre_comercial ?? '',
    codigo_habilitacion: p?.codigo_habilitacion ?? '',
    naturaleza: p?.naturaleza ?? 'PRIVADA',
    telefono: p?.telefono ?? '',
    correo: p?.correo ?? '',
    representante_legal: p?.representante_legal ?? '',
    activo: p?.activo ?? true,
  };
}

export function formToPrestadorPayload(v: PrestadorFormValues): PrestadorPayload {
  return {
    nit: v.nit.trim(),
    digito_verificacion: v.digito_verificacion.trim(),
    razon_social: v.razon_social.trim(),
    nombre_comercial: emptyToNull(v.nombre_comercial),
    codigo_habilitacion: emptyToNull(v.codigo_habilitacion),
    naturaleza: v.naturaleza,
    telefono: emptyToNull(v.telefono),
    correo: emptyToNull(v.correo),
    representante_legal: emptyToNull(v.representante_legal),
    activo: v.activo,
  };
}

// ---------------------------------------------------------------- Sede

export const sedeSchema = z
  .object({
    numero_sede: z.string().trim().regex(/^\d{2}$/, 'Dos dígitos: 01, 02…'),
    nombre: z.string().trim().min(1, 'El nombre de la sede es obligatorio.').max(150, 'Máximo 150 caracteres.'),
    departamento_id: z.number().nullable(),
    municipio_id: z.number().nullable().refine((v): boolean => v !== null, 'Selecciona el municipio.'),
    direccion: z.string().trim().min(1, 'La dirección es obligatoria.').max(255, 'Máximo 255 caracteres.'),
    telefono: textoOpcional(30),
    correo: correoOpcional,
    consultorios: z.string().trim().refine((v) => /^\d{0,3}$/.test(v), 'Número entre 0 y 999.'),
    dias_atencion: z.array(z.number()).min(1, 'Selecciona al menos un día.'),
    hora_apertura: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida.'),
    hora_cierre: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida.'),
    es_principal: z.boolean(),
    activo: z.boolean(),
  })
  .refine((v) => v.hora_cierre > v.hora_apertura, { path: ['hora_cierre'], message: 'Debe ser posterior a la apertura.' });

export type SedeFormValues = z.infer<typeof sedeSchema>;

export function sedeToForm(s: Sede | null, siguienteNumero = '01'): SedeFormValues {
  return {
    numero_sede: s?.numero_sede ?? siguienteNumero,
    nombre: s?.nombre ?? '',
    departamento_id: s?.municipio?.departamento?.id ?? s?.municipio?.departamento_id ?? null,
    municipio_id: s?.municipio_id ?? null,
    direccion: s?.direccion ?? '',
    telefono: s?.telefono ?? '',
    correo: s?.correo ?? '',
    consultorios: String(s?.consultorios ?? ''),
    dias_atencion: s?.dias_atencion ?? [1, 2, 3, 4, 5],
    hora_apertura: s?.hora_apertura ?? '07:00',
    hora_cierre: s?.hora_cierre ?? '18:00',
    es_principal: s?.es_principal ?? false,
    activo: s?.activo ?? true,
  };
}

export function formToSedePayload(v: SedeFormValues): SedePayload {
  return {
    numero_sede: v.numero_sede.trim(),
    nombre: v.nombre.trim(),
    municipio_id: v.municipio_id!,
    direccion: v.direccion.trim(),
    telefono: emptyToNull(v.telefono),
    correo: emptyToNull(v.correo),
    consultorios: v.consultorios ? Number(v.consultorios) : 0,
    dias_atencion: [...v.dias_atencion].sort((a, b) => a - b),
    hora_apertura: v.hora_apertura,
    hora_cierre: v.hora_cierre,
    es_principal: v.es_principal,
    activo: v.activo,
  };
}
