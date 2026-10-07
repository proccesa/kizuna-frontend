/**
 * DATOS DE EJEMPLO — solo para el diseño.
 *
 * Los módulos de red de atención, contratación, servicios, talento humano y
 * programación aún no tienen endpoints en el backend. Estas estructuras imitan
 * la forma que tendrían las respuestas de la API para que, al conectarlos, solo
 * haya que reemplazar este archivo por servicios REST (ver src/modules/*\/services).
 * Nombres, códigos y cifras son ilustrativos.
 */

export type Modalidad = 'PGP' | 'Evento' | 'Cápita';
export type Regimen = 'Contributivo' | 'Subsidiado';

export interface Sede {
  id: number;
  nombre: string;
  municipio: string;
  direccion: string;
  consultorios: number;
  horario: string;
}

export interface Prestador {
  id: number;
  nombre: string;
  nit: string;
  codigoHabilitacion: string;
  naturaleza: 'Privada' | 'Pública' | 'Mixta';
  sedes: Sede[];
}

export interface Entidad {
  id: number;
  nombre: string;
  sigla: string;
  nit: string;
  regimenes: Regimen[];
}

export interface Contrato {
  id: number;
  codigo: string;
  entidadId: number;
  modalidad: Modalidad;
  regimen: Regimen;
  inicio: string;
  fin: string;
  valor: number;
  /** Porcentaje ejecutado del valor del contrato. */
  ejecucion: number;
  cups: string[];
  estado: 'Vigente' | 'Por vencer' | 'En negociación';
}

export interface Poblacion {
  id: number;
  contratoId: number;
  nombre: string;
  pacientes: number;
  programados: number;
  ultimaCarga: string | null;
  archivo: string | null;
  cohortes: string[];
}

export interface Especialidad {
  id: number;
  nombre: string;
}

export interface Cups {
  codigo: string;
  descripcion: string;
  /** Nombre corto para tarjetas de agenda. */
  corto: string;
  tipo: 'Consulta' | 'Procedimiento' | 'Apoyo diagnóstico';
  duracion: number;
  especialidades: number[];
}

export interface Especialista {
  id: number;
  nombre: string;
  documento: string;
  registro: string;
  especialidades: number[];
  sedes: number[];
  horasSemana: number;
  /** Ocupación de la agenda de la semana (%). */
  ocupacion: number;
  activo: boolean;
}

export interface Cita {
  id: number;
  paciente: string;
  documento: string;
  cups: string;
  especialistaId: number;
  sedeId: number;
  hora: string;
  contratoId: number;
  origen: 'Automática' | 'Manual';
  estado: 'Programada' | 'Confirmada';
}

export interface Pendiente {
  id: number;
  paciente: string;
  documento: string;
  cups: string;
  motivo: string;
  contratoId: number;
  prioridad: 'Alta' | 'Media' | 'Baja';
  /** Sugerencia del motor de programación (null si no encontró cupo). */
  sugerencia: { especialistaId: number; sedeId: number; dia: string; hora: string } | null;
  bloqueo?: string;
}

// ---------------------------------------------------------------- Red de atención

export const PRESTADORES: Prestador[] = [
  {
    id: 1,
    nombre: 'IPS Salud Vital',
    nit: '900.481.226-3',
    codigoHabilitacion: '760010481201',
    naturaleza: 'Privada',
    sedes: [
      { id: 11, nombre: 'Sede Norte', municipio: 'Cali', direccion: 'Av. 6N # 28-40', consultorios: 14, horario: 'L–V 6:00–19:00 · S 7:00–13:00' },
      { id: 12, nombre: 'Sede Centro', municipio: 'Cali', direccion: 'Cl. 10 # 4-55', consultorios: 9, horario: 'L–V 7:00–18:00' },
      { id: 13, nombre: 'Sede Jamundí', municipio: 'Jamundí', direccion: 'Cra. 10 # 12-30', consultorios: 5, horario: 'L–V 7:00–16:00' },
    ],
  },
  {
    id: 2,
    nombre: 'Unidad Médica Los Andes',
    nit: '901.207.554-1',
    codigoHabilitacion: '765200733101',
    naturaleza: 'Privada',
    sedes: [{ id: 21, nombre: 'Sede Palmira', municipio: 'Palmira', direccion: 'Cl. 31 # 27-14', consultorios: 7, horario: 'L–V 7:00–17:00' }],
  },
];

export const SEDES = PRESTADORES.flatMap((p) => p.sedes.map((s) => ({ ...s, prestadorId: p.id })));

// ---------------------------------------------------------------- Contratación

export const ENTIDADES: Entidad[] = [
  { id: 1, nombre: 'Nueva EPS', sigla: 'NEPS', nit: '900.156.264-2', regimenes: ['Contributivo', 'Subsidiado'] },
  { id: 2, nombre: 'EPS Sura', sigla: 'SURA', nit: '800.088.702-2', regimenes: ['Contributivo'] },
  { id: 3, nombre: 'Sanitas EPS', sigla: 'SANITAS', nit: '800.251.440-6', regimenes: ['Contributivo', 'Subsidiado'] },
  { id: 4, nombre: 'Emssanar EPS', sigla: 'EMSSANAR', nit: '901.021.565-8', regimenes: ['Subsidiado'] },
];

export const CONTRATOS: Contrato[] = [
  {
    id: 1, codigo: 'CT-2026-014', entidadId: 1, modalidad: 'PGP', regimen: 'Contributivo',
    inicio: '2026-01-01', fin: '2026-12-31', valor: 4_850_000_000, ejecucion: 71,
    cups: ['890201', '890301', '890202', '890302', '895100'], estado: 'Vigente',
  },
  {
    id: 2, codigo: 'CT-2026-022', entidadId: 2, modalidad: 'Evento', regimen: 'Contributivo',
    inicio: '2026-03-01', fin: '2027-02-28', valor: 1_200_000_000, ejecucion: 38,
    cups: ['890202', '890302', '895100', '881431'], estado: 'Vigente',
  },
  {
    id: 3, codigo: 'CT-2025-087', entidadId: 3, modalidad: 'Cápita', regimen: 'Subsidiado',
    inicio: '2025-11-01', fin: '2026-10-31', valor: 2_310_000_000, ejecucion: 88,
    cups: ['890201', '890301', '890208', '890206'], estado: 'Por vencer',
  },
  {
    id: 4, codigo: 'CT-2026-031', entidadId: 4, modalidad: 'PGP', regimen: 'Subsidiado',
    inicio: '2026-07-01', fin: '2027-06-30', valor: 3_640_000_000, ejecucion: 22,
    cups: ['890201', '890301', '890202', '881431'], estado: 'Vigente',
  },
  {
    id: 5, codigo: 'CT-2027-002', entidadId: 1, modalidad: 'Evento', regimen: 'Subsidiado',
    inicio: '2027-01-01', fin: '2027-12-31', valor: 900_000_000, ejecucion: 0,
    cups: ['890208', '890206'], estado: 'En negociación',
  },
];

export const POBLACIONES: Poblacion[] = [
  { id: 1, contratoId: 1, nombre: 'Afiliados contributivo Cali', pacientes: 12_480, programados: 9_860, ultimaCarga: '2026-10-01', archivo: 'poblacion_neps_oct.xlsx', cohortes: ['Hipertensión', 'Diabetes', 'Riesgo cardiovascular'] },
  { id: 2, contratoId: 2, nombre: 'Programa cardiovascular Sura', pacientes: 3_215, programados: 2_402, ultimaCarga: '2026-09-28', archivo: 'sura_rcv_septiembre.csv', cohortes: ['Riesgo cardiovascular'] },
  { id: 3, contratoId: 3, nombre: 'Capitados Sanitas subsidiado', pacientes: 8_930, programados: 7_515, ultimaCarga: '2026-09-02', archivo: 'sanitas_capita_sep.xlsx', cohortes: ['Salud mental', 'Nutrición', 'Control prenatal'] },
  { id: 4, contratoId: 4, nombre: 'Afiliados Emssanar Jamundí', pacientes: 6_140, programados: 1_220, ultimaCarga: null, archivo: null, cohortes: ['Control prenatal', 'Hipertensión'] },
];

// ---------------------------------------------------------------- Servicios

export const ESPECIALIDADES: Especialidad[] = [
  { id: 1, nombre: 'Medicina general' },
  { id: 2, nombre: 'Medicina interna' },
  { id: 3, nombre: 'Cardiología' },
  { id: 4, nombre: 'Ginecología y obstetricia' },
  { id: 5, nombre: 'Pediatría' },
  { id: 6, nombre: 'Psicología' },
  { id: 7, nombre: 'Nutrición y dietética' },
];

export const CUPS: Cups[] = [
  { codigo: '890201', corto: '1.ª vez medicina general', descripcion: 'Consulta de primera vez por medicina general', tipo: 'Consulta', duracion: 20, especialidades: [1] },
  { codigo: '890301', corto: 'Control medicina general', descripcion: 'Consulta de control o de seguimiento por medicina general', tipo: 'Consulta', duracion: 20, especialidades: [1] },
  { codigo: '890202', corto: '1.ª vez especialista', descripcion: 'Consulta de primera vez por medicina especializada', tipo: 'Consulta', duracion: 30, especialidades: [2, 3, 4, 5] },
  { codigo: '890302', corto: 'Control especialista', descripcion: 'Consulta de control o de seguimiento por medicina especializada', tipo: 'Consulta', duracion: 20, especialidades: [2, 3, 4, 5] },
  { codigo: '890208', corto: '1.ª vez psicología', descripcion: 'Consulta de primera vez por psicología', tipo: 'Consulta', duracion: 40, especialidades: [6] },
  { codigo: '890206', corto: '1.ª vez nutrición', descripcion: 'Consulta de primera vez por nutrición y dietética', tipo: 'Consulta', duracion: 30, especialidades: [7] },
  { codigo: '895100', corto: 'Electrocardiograma', descripcion: 'Electrocardiograma de ritmo o de superficie', tipo: 'Apoyo diagnóstico', duracion: 15, especialidades: [3] },
  { codigo: '881431', corto: 'Ecografía obstétrica', descripcion: 'Ecografía obstétrica transabdominal', tipo: 'Apoyo diagnóstico', duracion: 20, especialidades: [] },
];

// ---------------------------------------------------------------- Talento humano

export const ESPECIALISTAS: Especialista[] = [
  { id: 1, nombre: 'Laura Méndez Ocampo', documento: 'CC 1.130.452.881', registro: 'RM 76-10452', especialidades: [1], sedes: [11, 12], horasSemana: 40, ocupacion: 92, activo: true },
  { id: 2, nombre: 'Andrés Ruiz Patiño', documento: 'CC 94.512.330', registro: 'RM 76-08821', especialidades: [2], sedes: [11], horasSemana: 32, ocupacion: 87, activo: true },
  { id: 3, nombre: 'Catalina Ospina Vélez', documento: 'CC 66.981.204', registro: 'RM 76-05510', especialidades: [3], sedes: [11, 21], horasSemana: 24, ocupacion: 96, activo: true },
  { id: 4, nombre: 'Julián Torres Mejía', documento: 'CC 1.144.087.613', registro: 'RM 76-12098', especialidades: [1], sedes: [13], horasSemana: 40, ocupacion: 64, activo: true },
  { id: 5, nombre: 'Paola Andrea Díaz', documento: 'CC 38.873.442', registro: 'RM 76-07631', especialidades: [4], sedes: [12, 13], horasSemana: 30, ocupacion: 78, activo: true },
  { id: 6, nombre: 'Santiago Herrera Lozano', documento: 'CC 1.107.556.219', registro: 'TP 76-3321', especialidades: [6], sedes: [12], horasSemana: 36, ocupacion: 71, activo: true },
  { id: 7, nombre: 'Valentina Rojas Cano', documento: 'CC 1.151.940.008', registro: 'TP 76-4410', especialidades: [7], sedes: [11, 13], horasSemana: 20, ocupacion: 55, activo: true },
  { id: 8, nombre: 'Mauricio Pardo Gil', documento: 'CC 16.794.210', registro: 'RM 76-03312', especialidades: [5], sedes: [21], horasSemana: 16, ocupacion: 0, activo: false },
];

// ---------------------------------------------------------------- Programación

export const CORRIDA = {
  fecha: '2026-10-06',
  hora: '5:30 a. m.',
  evaluados: 214,
  programados: 186,
  pendientes: 28,
};

export const CITAS: Cita[] = [
  { id: 1, paciente: 'María Fernanda Ríos', documento: 'CC 31.987.120', cups: '890301', especialistaId: 1, sedeId: 11, hora: '07:00', contratoId: 1, origen: 'Automática', estado: 'Confirmada' },
  { id: 2, paciente: 'Luis Eduardo Cárdenas', documento: 'CC 16.640.881', cups: '890301', especialistaId: 1, sedeId: 11, hora: '07:20', contratoId: 1, origen: 'Automática', estado: 'Programada' },
  { id: 3, paciente: 'Gloria Inés Zapata', documento: 'CC 29.110.457', cups: '890201', especialistaId: 1, sedeId: 11, hora: '08:00', contratoId: 3, origen: 'Manual', estado: 'Confirmada' },
  { id: 4, paciente: 'Héctor Fabio Lenis', documento: 'CC 14.990.302', cups: '890302', especialistaId: 2, sedeId: 11, hora: '07:00', contratoId: 1, origen: 'Automática', estado: 'Confirmada' },
  { id: 5, paciente: 'Rosa Elena Quintero', documento: 'CC 31.205.774', cups: '890202', especialistaId: 2, sedeId: 11, hora: '07:30', contratoId: 2, origen: 'Automática', estado: 'Programada' },
  { id: 6, paciente: 'Jorge Iván Murillo', documento: 'CC 94.301.552', cups: '895100', especialistaId: 3, sedeId: 11, hora: '07:00', contratoId: 2, origen: 'Automática', estado: 'Confirmada' },
  { id: 7, paciente: 'Ana Lucía Bermúdez', documento: 'CC 66.712.093', cups: '890302', especialistaId: 3, sedeId: 11, hora: '07:30', contratoId: 1, origen: 'Automática', estado: 'Programada' },
  { id: 8, paciente: 'Daniela Restrepo', documento: 'CC 1.144.209.770', cups: '881431', especialistaId: 5, sedeId: 12, hora: '08:00', contratoId: 4, origen: 'Manual', estado: 'Programada' },
  { id: 9, paciente: 'Kevin Andrés Mosquera', documento: 'TI 1.107.889.012', cups: '890208', especialistaId: 6, sedeId: 12, hora: '08:00', contratoId: 3, origen: 'Automática', estado: 'Confirmada' },
];

export const PENDIENTES: Pendiente[] = [
  {
    id: 1, paciente: 'Carmen Rosa Valencia', documento: 'CC 31.448.906', cups: '890302', motivo: 'Control HTA trimestral',
    contratoId: 1, prioridad: 'Alta', sugerencia: { especialistaId: 2, sedeId: 11, dia: 'Mié 8 oct', hora: '09:10' },
  },
  {
    id: 2, paciente: 'Óscar Mauricio Guerrero', documento: 'CC 16.274.553', cups: '895100', motivo: 'EKG previo a control cardiológico',
    contratoId: 1, prioridad: 'Media', sugerencia: { especialistaId: 3, sedeId: 21, dia: 'Jue 9 oct', hora: '14:00' },
  },
  {
    id: 3, paciente: 'Yuliana Caicedo', documento: 'CC 1.143.990.214', cups: '881431', motivo: 'Control prenatal semana 20',
    contratoId: 4, prioridad: 'Alta', sugerencia: null, bloqueo: 'El CUPS 881431 no tiene especialidad relacionada.',
  },
  {
    id: 4, paciente: 'Nelson Darío Ibarra', documento: 'CC 6.389.117', cups: '890206', motivo: 'Valoración nutricional diabetes',
    contratoId: 3, prioridad: 'Baja', sugerencia: { especialistaId: 7, sedeId: 13, dia: 'Vie 10 oct', hora: '10:30' },
  },
];

// ---------------------------------------------------------------- Utilidades

export const entidadDe = (contratoId: number) => ENTIDADES.find((e) => e.id === CONTRATOS.find((c) => c.id === contratoId)?.entidadId);
export const contratoDe = (id: number) => CONTRATOS.find((c) => c.id === id);
export const cupsDe = (codigo: string) => CUPS.find((c) => c.codigo === codigo);
export const especialistaDe = (id: number) => ESPECIALISTAS.find((e) => e.id === id);
export const sedeDe = (id: number) => SEDES.find((s) => s.id === id);
export const especialidadDe = (id: number) => ESPECIALIDADES.find((e) => e.id === id);
