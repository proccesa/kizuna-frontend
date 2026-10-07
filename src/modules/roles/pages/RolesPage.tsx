import { Fragment, useMemo } from 'react';
import { Check } from 'lucide-react';
import { Card, EmptyState, PageHeader, Skeleton } from '@/components/ui';
import { cn } from '@/lib/cn';
import { humanize } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useConteoPorRol } from '@/modules/usuarios/hooks/useUsuarios';
import { usePermisos, useRoles } from '../hooks/useRoles';

/** Orden natural de las acciones dentro de cada módulo. */
const ORDEN_ACCIONES = ['listar', 'ver', 'crear', 'editar', 'eliminar', 'restaurar'];
const ORDEN_MODULOS = ['usuarios', 'operadores', 'roles', 'permisos', 'tipos_documento'];
const posicion = (lista: string[], valor: string) => (lista.includes(valor) ? lista.indexOf(valor) : 99);

function Granted({ on, label }: { on: boolean; label: string }) {
  return (
    <span className="flex justify-center">
      {on ? (
        <span className="flex size-6 items-center justify-center rounded-full bg-petrol text-white" title={label}>
          <Check className="size-3.5" strokeWidth={3} aria-hidden />
        </span>
      ) : (
        <span className="size-6 rounded-full border-2 border-dashed border-line-strong" title={label} />
      )}
      <span className="sr-only">{on ? 'Sí' : 'No'}</span>
    </span>
  );
}

export function RolesPage() {
  const { can } = useAuth();
  const { data: roles = [], isLoading } = useRoles();
  const { data: catalogo } = usePermisos(can(PERMISOS.permisos.listar));
  const conteo = useConteoPorRol(
    roles.map((r) => r.name),
    can(PERMISOS.usuarios.listar),
  );

  // Filas de la matriz: catálogo completo si está disponible; si no, la unión de permisos de los roles.
  const modulos = useMemo(() => {
    const nombres = catalogo
      ? Object.values(catalogo).flat().map((p) => p.name)
      : roles.flatMap((r) => r.permissions?.map((p) => p.name) ?? []);

    const agrupado = new Map<string, string[]>();
    for (const nombre of new Set(nombres)) {
      const [modulo, accion = modulo] = nombre.split('.') as [string, string?];
      agrupado.set(modulo, [...(agrupado.get(modulo) ?? []), accion]);
    }
    return [...agrupado.entries()]
      .sort(([a], [b]) => posicion(ORDEN_MODULOS, a) - posicion(ORDEN_MODULOS, b))
      .map(([modulo, acciones]) => ({
        modulo,
        acciones: acciones.sort((a, b) => posicion(ORDEN_ACCIONES, a) - posicion(ORDEN_ACCIONES, b)),
      }));
  }, [catalogo, roles]);

  const totalPermisos = modulos.reduce((sum, m) => sum + m.acciones.length, 0);
  const concedidos = useMemo(
    () => new Map(roles.map((r) => [r.name, new Set(r.permissions?.map((p) => p.name) ?? [])])),
    [roles],
  );

  return (
    <>
      <PageHeader
        title="Roles y permisos"
        description="Qué puede hacer cada rol, módulo por módulo. Los roles se asignan a cada cuenta desde Usuarios."
      />

      {isLoading ? (
        <Skeleton className="h-[28rem] rounded-[var(--radius-card)]" />
      ) : roles.length === 0 ? (
        <Card>
          <EmptyState title="No hay roles configurados" description="Crea roles en el backend para asignarlos a las cuentas." />
        </Card>
      ) : (
        <Card className="animate-enter overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] border-collapse text-sm">
              <caption className="sr-only">Matriz de permisos por rol</caption>
              <thead>
                <tr className="border-b border-line">
                  <th scope="col" className="sticky left-0 z-10 w-56 bg-surface px-5 py-5 text-left align-bottom">
                    <span className="text-xs font-semibold text-muted">Permiso</span>
                  </th>
                  {roles.map((rol) => {
                    const cantidad = concedidos.get(rol.name)?.size ?? 0;
                    const pct = totalPermisos ? Math.round((cantidad / totalPermisos) * 100) : 0;
                    const usuarios = conteo[rol.name];
                    return (
                      <th key={rol.id} scope="col" className="min-w-36 px-4 py-5 text-left align-bottom font-normal">
                        <span className={cn('block font-display text-base font-bold', 'text-ink')}>{humanize(rol.name)}</span>
                        <span className="tabular mt-0.5 block text-xs text-muted">
                          {cantidad}/{totalPermisos} permisos
                          {usuarios !== undefined && ` · ${usuarios} ${usuarios === 1 ? 'cuenta' : 'cuentas'}`}
                        </span>
                        <span className="mt-2.5 block h-1.5 w-full overflow-hidden rounded-full bg-sand" aria-hidden>
                          <span className="block h-full rounded-full bg-petrol" style={{ width: `${pct}%` }} />
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {modulos.map(({ modulo, acciones }) => (
                  <Fragment key={modulo}>
                    <tr className="bg-cream">
                      <th scope="colgroup" colSpan={roles.length + 1} className="sticky left-0 px-5 py-2 text-left">
                        <span className="text-sm font-bold text-ink">{humanize(modulo)}</span>
                      </th>
                    </tr>
                    {acciones.map((accion) => {
                      const permiso = accion === modulo ? modulo : `${modulo}.${accion}`;
                      return (
                        <tr key={permiso} className="group border-b border-line last:border-0">
                          <th scope="row" className="sticky left-0 bg-surface px-5 py-2.5 text-left font-normal">
                            <span className="text-sm font-medium text-ink">{humanize(accion)}</span>
                          </th>
                          {roles.map((rol) => (
                            <td key={rol.id} className="px-4 py-2.5">
                              <Granted on={concedidos.get(rol.name)?.has(permiso) ?? false} label={`${humanize(rol.name)} · ${permiso}`} />
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center gap-5 border-t border-line bg-cream px-5 py-3 text-sm text-muted">
            <span className="flex items-center gap-2">
              <Granted on label="Concedido" /> Concedido
            </span>
            <span className="flex items-center gap-2">
              <Granted on={false} label="No concedido" /> No concedido
            </span>
          </div>
        </Card>
      )}
    </>
  );
}
