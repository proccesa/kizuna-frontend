import { useState } from 'react';
import { Link2, Pencil, Power, RotateCcw, Trash2 } from 'lucide-react';
import { BondDiagram } from '@/components/BondDiagram';
import { DetailHeader } from '@/components/DetailHeader';
import { Badge, Button, ConfirmDialog, Drawer, StatusBadge } from '@/components/ui';
import { formatDate, formatDateTime, humanize } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useUsuario, useUsuarioMutations } from '../hooks/useUsuarios';
import { UsuarioForm } from './UsuarioForm';

interface UsuarioDrawerProps {
  open: boolean;
  usuarioId: number | null;
  creating: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}

export function UsuarioDrawer({ open, usuarioId, creating, onClose, onCreated }: UsuarioDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title={creating ? 'Nuevo usuario' : 'Detalle del usuario'} hideTitle>
      {/* `key` reinicia el estado interno al cambiar de registro. */}
      {creating ? (
        <CrearUsuario onClose={onClose} onCreated={onCreated} />
      ) : (
        usuarioId !== null && <DetalleUsuario key={usuarioId} id={usuarioId} onClose={onClose} />
      )}
    </Drawer>
  );
}

function CrearUsuario({ onClose, onCreated }: { onClose: () => void; onCreated: (id: number) => void }) {
  return (
    <>
      <DetailHeader kicker="Nuevo usuario" name="Nueva cuenta" subtitle="Completa los datos para dar acceso a Kizuna" />
      <UsuarioForm usuario={null} onCancel={onClose} onSaved={(u) => onCreated(u.id)} />
    </>
  );
}

function DetalleUsuario({ id, onClose }: { id: number; onClose: () => void }) {
  const { can, usuario: sesion } = useAuth();
  const { data: usuario, isLoading } = useUsuario(id);
  const { eliminar, restaurar, cambiarEstado } = useUsuarioMutations();
  const [modo, setModo] = useState<'ver' | 'editar' | 'vincular'>('ver');
  const [confirmar, setConfirmar] = useState<'eliminar' | 'restaurar' | null>(null);

  const nombre = usuario?.operador?.nombre_completo || usuario?.name;
  const esSesion = usuario?.id === sesion?.id;
  const eliminado = !!usuario?.deleted_at;

  const hero = (
    <DetailHeader
      kicker={`Usuario #${id}`}
      name={nombre}
      subtitle={usuario?.email}
      isLoading={isLoading}
      meta={
        usuario && (
          <>
            <StatusBadge value={eliminado ? 'deleted' : usuario.activo ? 'active' : 'inactive'} />
            {usuario.roles.map((rol) => (
              <Badge key={rol.id} tone={rol.name === 'super-admin' ? 'petrol' : 'mist'}>
                {humanize(rol.name)}
              </Badge>
            ))}
          </>
        )
      }
    />
  );

  if (modo !== 'ver' && usuario) {
    return (
      <>
        {hero}
        <UsuarioForm
          usuario={usuario}
          vincularOperador={modo === 'vincular'}
          onCancel={() => setModo('ver')}
          onSaved={() => setModo('ver')}
        />
      </>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {hero}

      {usuario && (
        <div className="flex-1 space-y-8 px-6 py-6">
          <section>
            <h3 className="mb-3 text-base font-bold">Vínculo</h3>
            <BondDiagram
              linked={!!usuario.operador}
              from={{
                label: 'Cuenta de acceso',
                title: usuario.name,
                lines: [usuario.email, `creada ${formatDate(usuario.created_at)}`],
              }}
              to={{
                label: 'Operador',
                title: usuario.operador?.nombre_completo,
                lines: usuario.operador
                  ? [
                      `${usuario.operador.tipo_documento?.codigo ?? ''} ${usuario.operador.documento}`,
                      usuario.operador.telefono,
                      usuario.operador.direccion,
                    ]
                  : [],
                emptyText: 'Esta cuenta aún no tiene una persona vinculada.',
                action: can(PERMISOS.usuarios.editar) && !eliminado && (
                  <Button size="sm" variant="secondary" icon={Link2} onClick={() => setModo('vincular')}>
                    Vincular operador
                  </Button>
                ),
              }}
            />
          </section>

          <section>
            <h3 className="mb-3 text-base font-bold">Roles asignados</h3>
            {usuario.roles.length === 0 ? (
              <p className="text-sm text-muted">Sin roles: la cuenta no tiene permisos.</p>
            ) : (
              <ul className="divide-y divide-line rounded-2xl border border-line bg-surface">
                {usuario.roles.map((rol) => (
                  <li key={rol.id} className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-semibold text-ink">{humanize(rol.name)}</span>
                    <span className="tabular text-sm text-muted">{rol.permissions?.length ?? 0} permisos</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="grid grid-cols-2 gap-4 rounded-2xl bg-cream px-4 py-3.5">
            <div>
              <p className="text-xs font-semibold text-muted">Creado</p>
              <p className="tabular mt-1 text-sm text-ink">{formatDateTime(usuario.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">{eliminado ? 'Eliminado' : 'Actualizado'}</p>
              <p className="tabular mt-1 text-sm text-ink">{formatDateTime(usuario.deleted_at ?? usuario.updated_at)}</p>
            </div>
          </section>
        </div>
      )}

      {usuario && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur">
          {eliminado ? (
            can(PERMISOS.usuarios.restaurar) && (
              <Button icon={RotateCcw} variant="success" onClick={() => setConfirmar('restaurar')}>
                Restaurar cuenta
              </Button>
            )
          ) : (
            <>
              {can(PERMISOS.usuarios.editar) && (
                <Button icon={Pencil} onClick={() => setModo('editar')}>
                  Editar
                </Button>
              )}
              {can(PERMISOS.usuarios.editar) && !esSesion && (
                <Button
                  icon={Power}
                  variant="secondary"
                  isLoading={cambiarEstado.isPending}
                  onClick={() => cambiarEstado.mutate({ id: usuario.id, activo: !usuario.activo })}
                >
                  {usuario.activo ? 'Desactivar' : 'Activar'}
                </Button>
              )}
              {can(PERMISOS.usuarios.eliminar) && !esSesion && (
                <Button icon={Trash2} variant="danger-ghost" className="ml-auto" onClick={() => setConfirmar('eliminar')}>
                  Eliminar
                </Button>
              )}
            </>
          )}
        </div>
      )}

      <ConfirmDialog
        open={confirmar !== null}
        tone={confirmar === 'eliminar' ? 'danger' : 'primary'}
        title={confirmar === 'eliminar' ? 'Eliminar cuenta' : 'Restaurar cuenta'}
        message={
          confirmar === 'eliminar'
            ? `Se eliminará la cuenta ${usuario?.email}, se cerrarán sus sesiones y también se eliminará su operador. Podrás restaurarla después.`
            : `Se restaurará la cuenta ${usuario?.email} junto con su operador.`
        }
        confirmLabel={confirmar === 'eliminar' ? 'Eliminar' : 'Restaurar'}
        isLoading={eliminar.isPending || restaurar.isPending}
        onClose={() => setConfirmar(null)}
        onConfirm={async () => {
          const mutation = confirmar === 'eliminar' ? eliminar : restaurar;
          try {
            await mutation.mutateAsync(id);
            setConfirmar(null);
            if (confirmar === 'eliminar') onClose();
          } catch {
            setConfirmar(null);
          }
        }}
      />
    </div>
  );
}
