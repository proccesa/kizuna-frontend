import { z } from 'zod';
import { emptyToNull } from '@/lib/forms';
import { calcularDigitoVerificacion } from '@/lib/nit';
import type { Contrato, ContratoPayload, Entidad, EntidadPayload, Poblacion, PoblacionPayload, TipoEntidad } from './types';

const textoOpcional = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.');

// ---------------------------------------------------------------- Entidad

export const entidadSchema = z
  .object({
    nit: z.string().trim().regex(/^\d{6,15}$/, 'Entre 6 y 15 dígitos, sin puntos ni dígito de verificación.'),
    digito_verificacion: z.string().trim().regex(/^\d$/, 'Un solo dígito.'),
    razon_social: z.string().trim().min(1, 'La razón social es obligatoria.').max(200, 'Máximo 200 caracteres.'),
    sigla: textoOpcional(30),
    codigo_minsalud: z.string().trim().refine((v) => !v || /^[A-Za-z0-9]{3,10}$/.test(v), 'Entre 3 y 10 letras o números, p. ej. EPS037.'),
    tipo: z.enum(['EPS', 'MEDICINA_PREPAGADA', 'ARL', 'ASEGURADORA', 'ENTIDAD_TERRITORIAL', 'REGIMEN_ESPECIAL', 'OTRO'], 'Selecciona el tipo.'),
    regimen_ids: z.array(z.number()),
    telefono: textoOpcional(30),
    correo: z.string().trim().refine((v) => !v || z.email().safeParse(v).success, 'El correo no tiene un formato válido.'),
    activo: z.boolean(),
  })
  .superRefine((v, ctx) => {
    const dv = calcularDigitoVerificacion(v.nit);
    if (dv !== null && v.digito_verificacion !== '' && String(dv) !== v.digito_verificacion) {
      ctx.addIssue({ code: 'custom', path: ['digito_verificacion'], message: 'No corresponde al NIT.' });
    }
  });

export type EntidadFormValues = z.infer<typeof entidadSchema>;

export function entidadToForm(e: Entidad | null): EntidadFormValues {
  return {
    nit: e?.nit ?? '',
    digito_verificacion: e?.digito_verificacion ?? '',
    razon_social: e?.razon_social ?? '',
    sigla: e?.sigla ?? '',
    codigo_minsalud: e?.codigo_minsalud ?? '',
    tipo: (e?.tipo ?? 'EPS') as TipoEntidad,
    regimen_ids: e?.regimenes.map((r) => r.id) ?? [],
    telefono: e?.telefono ?? '',
    correo: e?.correo ?? '',
    activo: e?.activo ?? true,
  };
}

export function formToEntidadPayload(v: EntidadFormValues): EntidadPayload {
  return {
    nit: v.nit,
    digito_verificacion: v.digito_verificacion,
    razon_social: v.razon_social.trim(),
    sigla: emptyToNull(v.sigla),
    codigo_minsalud: emptyToNull(v.codigo_minsalud)?.toUpperCase() ?? null,
    tipo: v.tipo,
    regimen_ids: v.regimen_ids,
    telefono: emptyToNull(v.telefono),
    correo: emptyToNull(v.correo),
    activo: v.activo,
  };
}

// ---------------------------------------------------------------- Contrato

export const contratoSchema = z
  .object({
    entidad_id: z.string().min(1, 'Selecciona la entidad.'),
    numero: z.string().trim().min(1, 'El número del contrato es obligatorio.').max(50, 'Máximo 50 caracteres.'),
    modalidad_contratacion_id: z.string().min(1, 'Selecciona la modalidad.'),
    regimen_id: z.string().min(1, 'Selecciona el régimen.'),
    fecha_inicio: fecha,
    fecha_fin: fecha,
    valor: z.string().refine((v) => /^\d{0,16}$/.test(v.replace(/\./g, '')), 'Solo números, sin decimales.'),
    objeto: textoOpcional(500),
    sede_ids: z.array(z.number()),
    activo: z.boolean(),
  })
  .refine((v) => v.fecha_fin >= v.fecha_inicio, { path: ['fecha_fin'], message: 'No puede ser anterior al inicio.' });

export type ContratoFormValues = z.infer<typeof contratoSchema>;

const miles = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
/** "4850000000" → "4.850.000.000" mientras se escribe. */
export const formatearValor = (v: string) => {
  const digitos = v.replace(/\D/g, '');
  return digitos ? miles.format(Number(digitos)) : '';
};

export function contratoToForm(c: Contrato | null, entidadId?: number): ContratoFormValues {
  const anio = new Date().getFullYear();
  return {
    entidad_id: c ? String(c.entidad_id) : entidadId ? String(entidadId) : '',
    numero: c?.numero ?? '',
    modalidad_contratacion_id: c ? String(c.modalidad_contratacion_id) : '',
    regimen_id: c ? String(c.regimen_id) : '',
    fecha_inicio: c?.fecha_inicio ?? `${anio}-01-01`,
    fecha_fin: c?.fecha_fin ?? `${anio}-12-31`,
    valor: c ? formatearValor(String(Math.round(c.valor))) : '',
    objeto: c?.objeto ?? '',
    sede_ids: c?.sedes?.map((s) => s.id) ?? [],
    activo: c?.activo ?? true,
  };
}

export function formToContratoPayload(v: ContratoFormValues): ContratoPayload {
  return {
    entidad_id: Number(v.entidad_id),
    numero: v.numero.trim(),
    modalidad_contratacion_id: Number(v.modalidad_contratacion_id),
    regimen_id: Number(v.regimen_id),
    fecha_inicio: v.fecha_inicio,
    fecha_fin: v.fecha_fin,
    valor: Number(v.valor.replace(/\D/g, '') || 0),
    objeto: emptyToNull(v.objeto),
    sede_ids: v.sede_ids,
    activo: v.activo,
  };
}

// ---------------------------------------------------------------- Población

export const poblacionSchema = z.object({
  contrato_id: z.string().min(1, 'Selecciona el contrato.'),
  nombre: z.string().trim().min(1, 'El nombre es obligatorio.').max(150, 'Máximo 150 caracteres.'),
  descripcion: textoOpcional(500),
  activo: z.boolean(),
});

export type PoblacionFormValues = z.infer<typeof poblacionSchema>;

export function poblacionToForm(p: Poblacion | null, contratoId?: number): PoblacionFormValues {
  return {
    contrato_id: p ? String(p.contrato_id) : contratoId ? String(contratoId) : '',
    nombre: p?.nombre ?? '',
    descripcion: p?.descripcion ?? '',
    activo: p?.activo ?? true,
  };
}

export function formToPoblacionPayload(v: PoblacionFormValues): PoblacionPayload {
  return { contrato_id: Number(v.contrato_id), nombre: v.nombre.trim(), descripcion: emptyToNull(v.descripcion), activo: v.activo };
}
