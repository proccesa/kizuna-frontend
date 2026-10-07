import type { LucideIcon } from 'lucide-react';
import {
  BriefcaseMedical,
  Building2,
  CalendarClock,
  ClipboardList,
  Contact,
  FileText,
  Home,
  Landmark,
  Library,
  ShieldCheck,
  Stethoscope,
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
 * El menú sigue el orden en que una IPS configura Kizuna:
 * red de atención → contratación → servicios → talento humano → programación.
 */
export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Inicio', section: 'General', icon: Home, description: 'Estado de la configuración y la programación' },
  { to: '/programacion', label: 'Programación', section: 'General', icon: CalendarClock, description: 'Agenda automática de pacientes' },

  { to: '/prestadores', label: 'Prestadores y sedes', section: 'Red de atención', icon: Building2, description: 'IPS, sedes y consultorios', permiso: PERMISOS.prestadores.listar },

  { to: '/entidades', label: 'Entidades', section: 'Contratación', icon: Landmark, description: 'EPS y aseguradoras' },
  { to: '/contratos', label: 'Contratos', section: 'Contratación', icon: FileText, description: 'PGP, evento y cápita' },
  { to: '/poblaciones', label: 'Poblaciones', section: 'Contratación', icon: UsersRound, description: 'Pacientes asociados a cada contrato' },

  { to: '/portafolio', label: 'Portafolio CUPS', section: 'Servicios', icon: ClipboardList, description: 'Servicios que ofrece cada sede', permiso: PERMISOS.portafolio.listar },
  { to: '/especialidades', label: 'CUPS y especialidades', section: 'Servicios', icon: Stethoscope, description: 'Qué especialidad atiende cada servicio', permiso: PERMISOS.especialidades.listar },

  { to: '/especialistas', label: 'Especialistas', section: 'Talento humano', icon: BriefcaseMedical, description: 'Profesionales y sus agendas' },
  { to: '/operadores', label: 'Operadores', section: 'Talento humano', icon: Contact, description: 'Personal administrativo', permiso: PERMISOS.operadores.listar },

  { to: '/usuarios', label: 'Usuarios', section: 'Administración', icon: Users, description: 'Cuentas de acceso y sus roles', permiso: PERMISOS.usuarios.listar },
  { to: '/roles', label: 'Roles y permisos', section: 'Administración', icon: ShieldCheck, description: 'Qué puede hacer cada rol', permiso: PERMISOS.roles.listar },
  { to: '/catalogos', label: 'Catálogos', section: 'Administración', icon: Library, description: 'DIVIPOLA, regímenes y modalidades', permiso: PERMISOS.catalogos.listar },
];

export const SECTION_ICONS: Record<string, LucideIcon> = {
  'Red de atención': Building2,
  'Contratación': FileText,
  'Servicios': ClipboardList,
  'Talento humano': UsersRound,
  'Administración': ShieldCheck,
};

