import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  BriefcaseMedical,
  Building2,
  CalendarCheck2,
  ClipboardList,
  FileText,
  Landmark,
  Stethoscope,
  UsersRound,
} from 'lucide-react';
import { Badge, Card, Progress } from '@/components/ui';
import { CONTRATOS, CORRIDA, ENTIDADES, ESPECIALISTAS, POBLACIONES } from '@/demo/datos';
import { cn } from '@/lib/cn';
import { formatDate, formatNumber } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { usePrestadores, useSedes } from '@/modules/red/hooks/useRed';
import { usePortafolio } from '@/modules/servicios/hooks/useServicios';
import { useUsuarios } from '@/modules/usuarios/hooks/useUsuarios';

function saludo() {
  const hora = new Date().getHours();
  if (hora < 12) return 'Buenos días';
  if (hora < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

interface Paso {
  to: string;
  icon: LucideIcon;
  titulo: string;
  dato: string;
  /** Mensaje si el paso necesita atención. */
  alerta?: string;
  /** `bloqueo` impide programar pacientes; `aviso` requiere revisión. */
  severidad?: 'bloqueo' | 'aviso';
}

const poblacionesSinCargue = POBLACIONES.filter((p) => !p.archivo);
const pacientes = POBLACIONES.reduce((s, p) => s + p.pacientes, 0);
const conCita = POBLACIONES.reduce((s, p) => s + p.programados, 0);
const contratosPorVencer = CONTRATOS.filter((c) => c.estado === 'Por vencer');

/** El orden en que Kizuna necesita la información para poder programar. */
/** Pasos con datos de ejemplo; el de prestadores y sedes se arma con datos reales en el componente. */
const RUTA_DEMO: Paso[] = [
  { to: '/entidades', icon: Landmark, titulo: 'Entidades', dato: `${ENTIDADES.length} EPS y aseguradoras` },
  {
    to: '/contratos',
    icon: FileText,
    titulo: 'Contratos',
    dato: `${CONTRATOS.length} contratos · PGP, evento y cápita`,
    alerta: contratosPorVencer.length ? `${contratosPorVencer.length} por vencer` : undefined,
    severidad: 'aviso',
  },
  {
    to: '/poblaciones',
    icon: UsersRound,
    titulo: 'Poblaciones',
    dato: `${formatNumber(pacientes)} pacientes`,
    alerta: poblacionesSinCargue.length ? `${poblacionesSinCargue.length} sin cargue del mes` : undefined,
    severidad: 'bloqueo',
  },
  { to: '/especialistas', icon: BriefcaseMedical, titulo: 'Especialistas', dato: `${ESPECIALISTAS.filter((e) => e.activo).length} profesionales activos` },
];

export function DashboardPage() {
  const { usuario, can } = useAuth();
  const usuarios = useUsuarios({ por_pagina: 1 }, can(PERMISOS.usuarios.listar));
  const verRed = can(PERMISOS.prestadores.listar);
  const prestadores = usePrestadores({ por_pagina: 1, activo: true }, verRed);
  const sedes = useSedes({ por_pagina: 1, activo: true }, verRed && can(PERMISOS.sedes.listar));
  const totalPrestadores = prestadores.data?.paginacion.total;
  const totalSedes = sedes.data?.paginacion.total;

  const pasoRed: Paso = {
    to: '/prestadores',
    icon: Building2,
    titulo: 'Prestadores y sedes',
    dato: !verRed
      ? 'Requiere permiso para ver prestadores'
      : totalPrestadores === undefined
        ? 'Cargando…'
        : `${totalPrestadores} prestadores activos · ${totalSedes ?? 0} sedes activas`,
    alerta: !verRed ? undefined : totalPrestadores === 0 ? 'Sin prestadores' : totalSedes === 0 ? 'Sin sedes activas' : undefined,
    severidad: 'bloqueo',
  };
  const verPortafolio = can(PERMISOS.portafolio.listar);
  const portafolio = usePortafolio({ por_pagina: 1 }, verPortafolio);
  const portafolioSinEsp = usePortafolio({ por_pagina: 1, sin_especialidad: true }, verPortafolio);
  const totalPortafolio = portafolio.data?.paginacion.total;
  const totalSinEsp = portafolioSinEsp.data?.paginacion.total ?? 0;

  const pasosServicios: Paso[] = [
    {
      to: '/portafolio',
      icon: ClipboardList,
      titulo: 'Portafolio CUPS',
      dato: !verPortafolio ? 'Requiere permiso para ver el portafolio' : totalPortafolio === undefined ? 'Cargando…' : `${totalPortafolio} servicios en las sedes`,
      alerta: verPortafolio && totalPortafolio === 0 ? 'Portafolio vacío' : undefined,
      severidad: 'bloqueo',
    },
    {
      to: '/especialidades',
      icon: Stethoscope,
      titulo: 'CUPS y especialidades',
      dato: 'Quién atiende cada servicio',
      alerta: verPortafolio && totalSinEsp > 0 ? `${totalSinEsp} servicios sin especialidad` : undefined,
      severidad: 'bloqueo',
    },
  ];

  // Orden de configuración: red → contratación (ejemplo) → servicios → talento (ejemplo).
  const RUTA = [pasoRed, ...RUTA_DEMO.slice(0, 3), ...pasosServicios, ...RUTA_DEMO.slice(3)];
  const primerNombre = usuario?.operador?.nombre || usuario?.name?.split(' ')[0];
  const alertas = RUTA.filter((p) => p.alerta);
  const bloqueos = alertas.filter((p) => p.severidad === 'bloqueo');
  const listos = RUTA.length - alertas.length;

  return (
    <div className="space-y-6">
      <header className="animate-enter flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-mint-ink">{saludo()}, {primerNombre}</p>
          <h1 className="mt-1 text-[2.2rem] leading-tight font-bold tracking-[-0.02em] sm:text-[2.6rem]">Así va la programación de tus pacientes</h1>
        </div>
        <Badge tone="lime" className="self-start sm:self-auto">
          Módulos clínicos con datos de ejemplo
        </Badge>
      </header>

      {/* Resultado de la programación */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="animate-enter p-5 xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted">Pacientes con cita</p>
              <p className="tabular mt-1 font-display text-[2.6rem] leading-none font-bold text-ink">
                {formatNumber(conCita)}
                <span className="text-lg font-semibold text-muted"> / {formatNumber(pacientes)}</span>
              </p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-2xl rounded-bl-md bg-success-soft text-success">
              <CalendarCheck2 className="size-5" aria-hidden />
            </span>
          </div>
          <Progress value={(conCita / pacientes) * 100} tone="success" className="mt-4" label="Cobertura de programación" />
          <p className="mt-2 text-sm text-muted">
            <span className="tabular">{Math.round((conCita / pacientes) * 100)}%</span> de la población contratada ya tiene cita asignada.
          </p>
        </Card>
        <Card className="animate-enter p-5">
          <p className="text-sm font-semibold text-muted">Programados hoy</p>
          <p className="tabular mt-1 font-display text-[2.6rem] leading-none font-bold text-ink">{CORRIDA.programados}</p>
          <p className="mt-2 text-sm text-muted">De {CORRIDA.evaluados} evaluados a las {CORRIDA.hora}</p>
        </Card>
        <Link to="/programacion" className="group">
          <Card className="h-full bg-petrol p-5 text-white transition-colors group-hover:bg-petrol-hover">
            <p className="text-sm font-semibold text-white/70">Por resolver</p>
            <p className="tabular mt-1 font-display text-[2.6rem] leading-none font-bold">{CORRIDA.pendientes}</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
              Revisar cola <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
            </p>
          </Card>
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        {/* Ruta de configuración */}
        <Card className="animate-enter overflow-hidden">
          <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-2">
            <div>
              <h2 className="text-xl font-bold">Ruta de configuración</h2>
              <p className="mt-0.5 text-sm text-muted">Lo que Kizuna necesita, en orden, para programar a un paciente.</p>
            </div>
            <Badge tone={bloqueos.length ? 'danger' : alertas.length ? 'warning' : 'success'} className="tabular">
              {listos} de {RUTA.length} listos
            </Badge>
          </div>
          <ol className="px-6 pt-2 pb-4">
            {RUTA.map((paso, i) => {
              const Icon = paso.icon;
              const ultimo = i === RUTA.length - 1;
              const bloqueo = paso.alerta && paso.severidad === 'bloqueo';
              const aviso = paso.alerta && paso.severidad === 'aviso';
              return (
                <li key={paso.to} className="relative flex gap-4">
                  {/* Línea que une los pasos */}
                  {!ultimo && <span className={cn('absolute top-11 bottom-0 left-[1.15rem] w-0.5', bloqueo ? 'bg-danger/30' : 'bg-line-strong')} aria-hidden />}
                  <span
                    className={cn(
                      'relative z-10 mt-2 flex size-9 shrink-0 items-center justify-center rounded-xl rounded-bl-sm',
                      bloqueo ? 'bg-danger text-white' : aviso ? 'bg-warning text-white' : 'bg-petrol text-white',
                    )}
                  >
                    <Icon className="size-[1.1rem]" aria-hidden />
                  </span>
                  <Link to={paso.to} className="group -mx-2 mb-1 flex flex-1 items-center justify-between gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-cream">
                    <span>
                      <span className="block font-semibold text-ink">{paso.titulo}</span>
                      <span className="block text-sm text-muted">{paso.dato}</span>
                    </span>
                    {paso.alerta ? (
                      <Badge tone={bloqueo ? 'danger' : 'warning'}>{paso.alerta}</Badge>
                    ) : (
                      <ArrowRight className="size-4 text-subtle transition-transform group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden />
                    )}
                  </Link>
                </li>
              );
            })}
            <li className="flex gap-4">
              <span className="relative z-10 mt-2 flex size-9 shrink-0 items-center justify-center rounded-xl rounded-bl-sm bg-lime text-petrol">
                <CalendarCheck2 className="size-[1.1rem]" aria-hidden />
              </span>
              <Link to="/programacion" className="group -mx-2 flex flex-1 items-center justify-between rounded-xl px-2 py-2.5 transition-colors hover:bg-cream">
                <span>
                  <span className="block font-display text-lg font-bold text-ink">Programación automática</span>
                  <span className="block text-sm text-muted">Pacientes en su cita, con el especialista y la sede correctos.</span>
                </span>
                <ArrowRight className="size-4 text-subtle group-hover:text-ink" aria-hidden />
              </Link>
            </li>
          </ol>
        </Card>

        <div className="space-y-6">
          {/* Alertas */}
          <Card className="animate-enter">
            <div className="px-6 pt-6">
              <h2 className="text-lg font-bold">Necesita tu atención</h2>
              <p className="text-sm text-muted">
                <span className="font-semibold text-danger">Bloqueos</span> impiden programar pacientes;{' '}
                <span className="font-semibold text-warning">avisos</span> requieren revisión.
              </p>
            </div>
            <ul className="mt-3 divide-y divide-line">
              {poblacionesSinCargue.map((p) => (
                <li key={`p${p.id}`}>
                  <Link to="/poblaciones" className="flex gap-3 px-6 py-3.5 transition-colors hover:bg-cream">
                    <Ban className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                    <span className="text-sm">
                      <span className="block font-semibold text-ink">Población sin cargar</span>
                      <span className="text-muted">{p.nombre} no tiene archivo de este mes.</span>
                    </span>
                  </Link>
                </li>
              ))}
              {totalSinEsp > 0 && (
                <li>
                  <Link to="/especialidades" className="flex gap-3 px-6 py-3.5 transition-colors hover:bg-cream">
                    <Ban className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                    <span className="text-sm">
                      <span className="block font-semibold text-ink">
                        {totalSinEsp} {totalSinEsp === 1 ? 'servicio' : 'servicios'} del portafolio sin especialidad
                      </span>
                      <span className="text-muted">Asígnales quién los atiende para poder programarlos.</span>
                    </span>
                  </Link>
                </li>
              )}
              {contratosPorVencer.map((c) => (
                <li key={c.codigo}>
                  <Link to="/contratos" className="flex gap-3 px-6 py-3.5 transition-colors hover:bg-cream">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                    <span className="text-sm">
                      <span className="block font-semibold text-ink">Contrato {c.codigo} por vencer</span>
                      <span className="text-muted">
                        {ENTIDADES.find((e) => e.id === c.entidadId)?.nombre} · {c.modalidad} · vence el {formatDate(c.fin)}.
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          {/* Equipo (datos reales) */}
          {can(PERMISOS.usuarios.listar) && (
            <Link to="/usuarios" className="group block">
              <Card className="animate-enter flex items-center justify-between p-5 transition-colors group-hover:border-line-strong">
                <div>
                  <p className="text-sm font-semibold text-muted">Cuentas del equipo</p>
                  <p className="tabular font-display text-3xl font-bold text-ink">{usuarios.data?.paginacion.total ?? '—'}</p>
                </div>
                <ArrowRight className="size-4 text-subtle group-hover:text-ink" aria-hidden />
              </Card>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
