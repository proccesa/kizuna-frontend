import type { LucideIcon } from 'lucide-react';
import {
  BriefcaseMedical,
  Boxes,
  Building2,
  CalendarClock,
  ClipboardList,
  ClipboardPlus,
  DoorOpen,
  Contact,
  FileHeart,
  HeartPulse,
  FileText,
  Home,
  Landmark,
  Library,
  ListChecks,
  Package,
  Plug,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Users,
  UsersRound,
} from 'lucide-react';
import { PERMISOS } from '@/modules/auth/permisos';

export interface NavItem {
  to: string;
  label: string;
  section: string;
  icon: LucideIcon;
  description: string;
  /** Permiso requerido para mostrar el ítem. */
  permiso?: string;
}

/**
 * Primero la operación diaria (pre-anestesia) y luego la configuración, en el orden
 * en que una IPS la completa: red de atención → contratación → servicios → talento humano.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', section: 'General', icon: Home, description: 'Estado de la configuración y la programación' },
  { to: '/programacion', label: 'Programación', section: 'General', icon: CalendarClock, description: 'Programa quirúrgico: propuesta, aprobación y cola', permiso: PERMISOS.programacion.listar },

  { to: '/ordenes', label: 'Órdenes quirúrgicas', section: 'Pre-anestesia', icon: ClipboardPlus, description: 'Órdenes de cirugía y su cita de pre-anestesia', permiso: PERMISOS.ordenes.listar },
  { to: '/preanestesia', label: 'Agenda de pre-anestesia', section: 'Pre-anestesia', icon: Syringe, description: 'Citas del día y valoración', permiso: PERMISOS.citas.listar },
  { to: '/historias', label: 'Historias clínicas', section: 'Pre-anestesia', icon: FileHeart, description: 'Valoraciones diligenciadas y recibidas', permiso: PERMISOS.historias.listar },

  { to: '/prestadores', label: 'Prestadores y sedes', section: 'Red de atención', icon: Building2, description: 'IPS, sedes y consultorios', permiso: PERMISOS.prestadores.listar },

  { to: '/salas', label: 'Salas y quirófanos', section: 'Red de atención', icon: DoorOpen, description: 'Salas de cada sede y sus equipos fijos', permiso: PERMISOS.sedes.listar },

  { to: '/biomedicos', label: 'Biomédicos', section: 'Inventario', icon: HeartPulse, description: 'Equipos, mantenimiento y calibración', permiso: PERMISOS.inventario.listar },
  { to: '/central', label: 'Central', section: 'Inventario', icon: Package, description: 'Insumos e instrumental', permiso: PERMISOS.inventario.listar },
  { to: '/requerimientos', label: 'Requerimientos por CUPS', section: 'Inventario', icon: ListChecks, description: 'Qué necesita cada procedimiento', permiso: PERMISOS.inventario.listar },

  { to: '/entidades', label: 'Entidades', section: 'Contratación', icon: Landmark, description: 'EPS y aseguradoras', permiso: PERMISOS.entidades.listar },
  { to: '/contratos', label: 'Contratos', section: 'Contratación', icon: FileText, description: 'PGP, evento y cápita', permiso: PERMISOS.contratos.listar },
  { to: '/poblaciones', label: 'Poblaciones', section: 'Contratación', icon: UsersRound, description: 'Pacientes asociados a cada contrato', permiso: PERMISOS.poblaciones.listar },

  { to: '/portafolio', label: 'Portafolio CUPS', section: 'Servicios', icon: ClipboardList, description: 'Servicios que ofrece cada sede', permiso: PERMISOS.portafolio.listar },
  { to: '/especialidades', label: 'CUPS y especialidades', section: 'Servicios', icon: Stethoscope, description: 'Qué especialidad atiende cada servicio', permiso: PERMISOS.especialidades.listar },

  { to: '/especialistas', label: 'Especialistas', section: 'Talento humano', icon: BriefcaseMedical, description: 'Profesionales y sus agendas', permiso: PERMISOS.especialistas.listar },
  { to: '/operadores', label: 'Operadores', section: 'Talento humano', icon: Contact, description: 'Personal administrativo', permiso: PERMISOS.operadores.listar },

  { to: '/usuarios', label: 'Usuarios', section: 'Administración', icon: Users, description: 'Cuentas de acceso y sus roles', permiso: PERMISOS.usuarios.listar },
  { to: '/roles', label: 'Roles y permisos', section: 'Administración', icon: ShieldCheck, description: 'Qué puede hacer cada rol', permiso: PERMISOS.roles.listar },
  { to: '/integraciones', label: 'Integraciones', section: 'Administración', icon: Plug, description: 'Sistemas externos y sus tokens', permiso: PERMISOS.integraciones.gestionar },
  { to: '/catalogos', label: 'Catálogos', section: 'Administración', icon: Library, description: 'DIVIPOLA, regímenes y modalidades', permiso: PERMISOS.catalogos.listar },
];

export const SECTION_ICONS: Record<string, LucideIcon> = {
  'Pre-anestesia': Syringe,
  'Inventario': Boxes,
  'Red de atención': Building2,
  'Contratación': FileText,
  'Servicios': ClipboardList,
  'Talento humano': UsersRound,
  'Administración': ShieldCheck,
};

