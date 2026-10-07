import { Ban, CalendarCheck, CircleCheck, Clock, CircleX, type LucideIcon } from 'lucide-react';

export type EstadoCita = 'confirmada' | 'programada' | 'pendiente' | 'bloqueada' | 'cancelada';

/**
 * Lenguaje de estados de Kizuna. Se usa igual en agenda, tablas y alertas:
 * el color siempre va acompañado de ícono y texto.
 */
export const ESTADOS_CITA: Record<EstadoCita, { label: string; icon: LucideIcon; className: string; descripcion: string }> = {
  confirmada: { label: 'Confirmada', icon: CircleCheck, className: 'bg-success-soft text-success', descripcion: 'El paciente confirmó la cita' },
  programada: { label: 'Programada', icon: CalendarCheck, className: 'bg-mist text-mist-ink', descripcion: 'Cita asignada, pendiente de confirmar' },
  pendiente: { label: 'Pendiente', icon: Clock, className: 'bg-warning-soft text-warning', descripcion: 'Paciente por programar' },
  bloqueada: { label: 'Bloqueada', icon: Ban, className: 'bg-danger-soft text-danger', descripcion: 'No se puede programar hasta resolver la configuración' },
  cancelada: { label: 'Cancelada', icon: CircleX, className: 'bg-sand text-muted', descripcion: 'Cita cancelada' },
};
