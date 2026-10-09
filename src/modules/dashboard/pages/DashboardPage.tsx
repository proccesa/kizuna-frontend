import { Link } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  ArrowRight,
  Ban,
  BriefcaseMedical,
  Building2,
  CalendarCheck2,
  Boxes,
  ClipboardList,
  FileText,
  Landmark,
  Stethoscope,
  UsersRound,
} from 'lucide-react';
import { Badge, Card } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatDate, formatNumber } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { useContratos, useEntidades, usePoblaciones, useResumenContratos, useResumenPoblaciones } from '@/modules/contratacion/hooks/useContratacion';
import { PERMISOS } from '@/modules/auth/permisos';
import { usePrestadores, useSedes } from '@/modules/red/hooks/useRed';
import { usePortafolio } from '@/modules/servicios/hooks/useServicios';
import { useResumenTalento } from '@/modules/talento/hooks/useTalento';
import { useResumenInventario } from '@/modules/inventario/hooks/useInventario';
import { useResumenProgramacion } from '@/modules/programacion/hooks/useProgramacion';
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
  const verEntidades = can(PERMISOS.entidades.listar);
  const verContratos = can(PERMISOS.contratos.listar);
  const verPoblaciones = can(PERMISOS.poblaciones.listar);
  const entidades = useEntidades({ por_pagina: 1, activo: true }, verEntidades);
  const resumenContratos = useResumenContratos(verContratos);
  const contratosPorVencer = useContratos({ estado: 'POR_VENCER', por_pagina: 5 }, verContratos);
  const resumenPoblaciones = useResumenPoblaciones(verPoblaciones);
  const poblacionesSinCargue = usePoblaciones({ sin_cargue_mes: true, activo: true, por_pagina: 5 }, verPoblaciones);
  const totalEntidades = entidades.data?.paginacion.total;
  const rc = resumenContratos.data;
  const rp = resumenPoblaciones.data;

  const pasosContratacion: Paso[] = [
    {
      to: '/entidades',
      icon: Landmark,
      titulo: 'Entidades',
      dato: !verEntidades ? 'Requiere permiso para ver entidades' : totalEntidades === undefined ? 'Cargando…' : `${totalEntidades} ${totalEntidades === 1 ? 'entidad activa' : 'entidades activas'}`,
      alerta: verEntidades && totalEntidades === 0 ? 'Sin entidades' : undefined,
      severidad: 'bloqueo',
    },
    {
      to: '/contratos',
      icon: FileText,
      titulo: 'Contratos',
      dato: !verContratos ? 'Requiere permiso para ver contratos' : !rc ? 'Cargando…' : `${rc.en_ejecucion} en ejecución · PGP, evento y cápita`,
      alerta: !rc ? undefined : rc.en_ejecucion === 0 ? 'Sin contratos vigentes' : rc.por_vencer ? `${rc.por_vencer} por vencer` : undefined,
      severidad: rc && rc.en_ejecucion === 0 ? 'bloqueo' : 'aviso',
    },
    {
      to: '/poblaciones',
      icon: UsersRound,
      titulo: 'Poblaciones',
      dato: !verPoblaciones ? 'Requiere permiso para ver poblaciones' : !rp ? 'Cargando…' : `${formatNumber(rp.pacientes)} pacientes en ${rp.poblaciones} ${rp.poblaciones === 1 ? 'población' : 'poblaciones'}`,
      alerta: !rp ? undefined : rp.poblaciones === 0 ? 'Sin poblaciones' : rp.sin_cargue_mes ? `${rp.sin_cargue_mes} sin cargue del mes` : undefined,
      severidad: 'bloqueo',
    },
  ];

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

  const verTalento = can(PERMISOS.especialistas.listar);
  const talento = useResumenTalento(verTalento);
  const pasoTalento: Paso = {
    to: '/especialistas',
    icon: BriefcaseMedical,
    titulo: 'Especialistas',
    dato: !verTalento
      ? 'Requiere permiso para ver especialistas'
      : !talento.data
        ? 'Cargando…'
        : `${talento.data.activos} profesionales activos · ${formatNumber(talento.data.horas_semana)} h de agenda por semana`,
    alerta: !talento.data ? undefined : talento.data.activos === 0 ? 'Sin especialistas' : talento.data.sin_agenda > 0 ? `${talento.data.sin_agenda} sin agenda` : undefined,
    severidad: 'bloqueo',
  };

  const { data: prog } = useResumenProgramacion(can(PERMISOS.programacion.listar));
  const verInventario = can(PERMISOS.inventario.listar);
  const inventario = useResumenInventario(verInventario);
  const ri = inventario.data;
  const pasoInventario: Paso = {
    to: ri?.cups.sin_requerimientos ? '/requerimientos?pendientes=1' : '/biomedicos',
    icon: Boxes,
    titulo: 'Inventario',
    dato: !verInventario
      ? 'Requiere permiso para ver el inventario'
      : !ri
        ? 'Cargando…'
        : `${ri.equipos.operativos} equipos operativos · ${ri.instrumental.operativas} cajas · ${ri.insumos.total} insumos`,
    alerta: !ri
      ? undefined
      : ri.cups.sin_requerimientos
        ? `${ri.cups.sin_requerimientos} CUPS sin requerimientos`
        : ri.equipos.calibracion_vencida
          ? `${ri.equipos.calibracion_vencida} equipos con calibración vencida`
          : ri.equipos.mantenimiento_vencido
            ? `${ri.equipos.mantenimiento_vencido} con mantenimiento vencido`
          : ri.insumos.bajo_minimo
            ? `${ri.insumos.bajo_minimo} insumos bajo el mínimo`
            : undefined,
    severidad: ri?.cups.sin_requerimientos ? 'bloqueo' : 'aviso',
  };

  // Orden de configuración: red → contratación → servicios → talento humano → inventario.
  const RUTA = [pasoRed, ...pasosContratacion, ...pasosServicios, pasoTalento, pasoInventario];
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
      </header>

      {/* Resultado de la programación */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="animate-enter p-5 xl:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-muted">Cirugías en los próximos 7 días</p>
              <p className="tabular mt-1 font-display text-[2.6rem] leading-none font-bold text-ink">{prog ? formatNumber(prog.programadas_7_dias) : '—'}</p>
            </div>
            <span className="flex size-11 items-center justify-center rounded-2xl rounded-bl-md bg-success-soft text-success">
              <CalendarCheck2 className="size-5" aria-hidden />
            </span>
          </div>
          <p className="mt-3 text-sm text-muted">
            {prog ? `${prog.programadas_hoy} hoy · ${prog.realizadas_mes} realizadas este mes` : 'Cargando…'}
            {rp ? ` · ${formatNumber(rp.pacientes)} pacientes en las poblaciones de tus contratos` : ''}.
          </p>
        </Card>
        <Link to="/programacion?vista=cola" className="group">
          <Card className="h-full p-5 transition-colors group-hover:border-line-strong">
            <p className="text-sm font-semibold text-muted">Aptos por programar</p>
            <p className="tabular mt-1 font-display text-[2.6rem] leading-none font-bold text-ink">{prog ? formatNumber(prog.por_programar) : '—'}</p>
            <p className={cn('mt-2 text-sm', prog?.aval_por_vencer ? 'font-semibold text-warning' : 'text-muted')}>
              {prog?.aval_por_vencer ? `${prog.aval_por_vencer} con el aval por vencer` : 'Con aval de pre-anestesia vigente'}
            </p>
          </Card>
        </Link>
        <Link to="/programacion" className="group">
          <Card className="h-full bg-petrol p-5 text-white transition-colors group-hover:bg-petrol-hover">
            <p className="text-sm font-semibold text-white/70">{prog?.propuesta_pendiente ? 'Propuesta lista' : 'Programación'}</p>
            <p className="mt-1 font-display text-2xl leading-tight font-bold">{prog?.propuesta_pendiente ? 'Revisar y aprobar' : 'Generar propuesta'}</p>
            <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80">
              Ir a programación <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
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
              {poblacionesSinCargue.data?.datos.map((p) => (
                <li key={`p${p.id}`}>
                  <Link to={`/poblaciones?ver=${p.id}`} className="flex gap-3 px-6 py-3.5 transition-colors hover:bg-cream">
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
              {!poblacionesSinCargue.data?.datos.length && !totalSinEsp && !contratosPorVencer.data?.datos.length && (
                <li className="px-6 py-4 text-sm text-muted">Nada pendiente por ahora.</li>
              )}
              {contratosPorVencer.data?.datos.map((c) => (
                <li key={c.id}>
                  <Link to={`/contratos?ver=${c.id}`} className="flex gap-3 px-6 py-3.5 transition-colors hover:bg-cream">
                    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
                    <span className="text-sm">
                      <span className="block font-semibold text-ink">Contrato {c.numero} por vencer</span>
                      <span className="text-muted">
                        {c.entidad.sigla || c.entidad.razon_social} · {c.modalidad.nombre} · vence el {formatDate(c.fecha_fin)}.
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
