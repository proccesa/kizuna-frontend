import { z } from 'zod';
import { emptyToNull } from '@/lib/forms';
import type { Agenda, AgendaPayload, AusenciaPayload, Especialista, EspecialistaPayload, TipoAusencia } from './types';

const textoOpcional = (max: number) => z.string().trim().max(max, `Máximo ${max} caracteres.`);
const fecha = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida.');

/** Fecha local de hoy en formato AAAA-MM-DD. */
export const hoyISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---------------------------------------------------------------- Especialista

export const especialistaSchema = z.object({
  tipo_documento_id: z.string().min(1, 'Selecciona el tipo de documento.'),
  numero_documento: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s.]/g, ''))
    .refine((v) => /^[A-Za-z0-9]{3,20}$/.test(v), 'Entre 3 y 20 letras o números, sin puntos.'),
  nombres: z.string().trim().min(1, 'Los nombres son obligatorios.').max(100, 'Máximo 100 caracteres.'),
  apellidos: z.string().trim().min(1, 'Los apellidos son obligatorios.').max(100, 'Máximo 100 caracteres.'),
  registro_profesional: textoOpcional(30),
  correo: z.string().trim().refine((v) => !v || z.email().safeParse(v).success, 'El correo no tiene un formato válido.'),
  telefono: textoOpcional(30),
  especialidad_ids: z.array(z.number()).min(1, 'Selecciona al menos una especialidad.'),
  user_id: z.string(),
  activo: z.boolean(),
});

export type EspecialistaFormInput = z.input<typeof especialistaSchema>;
export type EspecialistaFormValues = z.output<typeof especialistaSchema>;

export function especialistaToForm(e: Especialista | null, tipoPorDefecto = ''): EspecialistaFormInput {
  return {
    tipo_documento_id: e ? String(e.tipo_documento_id) : tipoPorDefecto,
    numero_documento: e?.numero_documento ?? '',
    nombres: e?.nombres ?? '',
    apellidos: e?.apellidos ?? '',
    registro_profesional: e?.registro_profesional ?? '',
    correo: e?.correo ?? '',
    telefono: e?.telefono ?? '',
    especialidad_ids: e?.especialidades.map((x) => x.id) ?? [],
    user_id: e?.user_id ? String(e.user_id) : '',
    activo: e?.activo ?? true,
  };
}

export function formToEspecialistaPayload(v: EspecialistaFormValues): EspecialistaPayload {
  return {
    tipo_documento_id: Number(v.tipo_documento_id),
    numero_documento: v.numero_documento,
    nombres: v.nombres.trim(),
    apellidos: v.apellidos.trim(),
    registro_profesional: emptyToNull(v.registro_profesional),
    correo: emptyToNull(v.correo),
    telefono: emptyToNull(v.telefono),
    especialidad_ids: v.especialidad_ids,
    user_id: v.user_id ? Number(v.user_id) : null,
    activo: v.activo,
  };
}

// ---------------------------------------------------------------- Franja de agenda

export const agendaSchema = z
  .object({
    sede_id: z.string().min(1, 'Selecciona la sede.'),
    especialidad_id: z.string().min(1, 'Selecciona la especialidad.'),
    dias: z.array(z.number()).min(1, 'Selecciona al menos un día.'),
    hora_inicio: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida.'),
    hora_fin: z.string().regex(/^\d{2}:\d{2}$/, 'Hora inválida.'),
    vigente_desde: fecha,
    vigente_hasta: z.string().refine((v) => !v || /^\d{4}-\d{2}-\d{2}$/.test(v), 'Fecha inválida.'),
    consultorio: textoOpcional(30),
    activo: z.boolean(),
  })
  .refine((v) => v.hora_fin > v.hora_inicio, { path: ['hora_fin'], message: 'Debe ser posterior al inicio.' })
  .refine((v) => !v.vigente_hasta || v.vigente_hasta >= v.vigente_desde, { path: ['vigente_hasta'], message: 'No puede ser anterior al inicio.' });

export type AgendaFormValues = z.infer<typeof agendaSchema>;

export function agendaToForm(a: Agenda | null, especialidadPorDefecto?: number): AgendaFormValues {
  return {
    sede_id: a ? String(a.sede_id) : '',
    especialidad_id: a ? String(a.especialidad_id) : especialidadPorDefecto ? String(especialidadPorDefecto) : '',
    dias: a?.dias ?? [1, 2, 3, 4, 5],
    hora_inicio: a?.hora_inicio ?? '07:00',
    hora_fin: a?.hora_fin ?? '12:00',
    vigente_desde: a?.vigente_desde ?? hoyISO(),
    vigente_hasta: a?.vigente_hasta ?? '',
    consultorio: a?.consultorio ?? '',
    activo: a?.activo ?? true,
  };
}

export function formToAgendaPayload(v: AgendaFormValues): AgendaPayload {
  return {
    sede_id: Number(v.sede_id),
    especialidad_id: Number(v.especialidad_id),
    dias: [...v.dias].sort((a, b) => a - b),
    hora_inicio: v.hora_inicio,
    hora_fin: v.hora_fin,
    vigente_desde: v.vigente_desde,
    vigente_hasta: v.vigente_hasta || null,
    consultorio: emptyToNull(v.consultorio),
    activo: v.activo,
  };
}

// ---------------------------------------------------------------- Novedad

export const ausenciaSchema = z
  .object({
    tipo: z.enum(['VACACIONES', 'INCAPACIDAD', 'LICENCIA', 'CAPACITACION', 'OTRO'], 'Selecciona el tipo de novedad.'),
    fecha_inicio: fecha,
    fecha_fin: fecha,
    observacion: textoOpcional(255),
  })
  .refine((v) => v.fecha_fin >= v.fecha_inicio, { path: ['fecha_fin'], message: 'No puede ser anterior al inicio.' });

export type AusenciaFormValues = z.infer<typeof ausenciaSchema>;

export const ausenciaVacia = (): AusenciaFormValues => ({ tipo: 'VACACIONES' as TipoAusencia, fecha_inicio: hoyISO(), fecha_fin: hoyISO(), observacion: '' });

export function formToAusenciaPayload(v: AusenciaFormValues): AusenciaPayload {
  return { tipo: v.tipo, fecha_inicio: v.fecha_inicio, fecha_fin: v.fecha_fin, observacion: emptyToNull(v.observacion) };
}
