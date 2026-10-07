import { useState } from 'react';
import { Pencil, Power, RotateCcw, Trash2 } from 'lucide-react';
import { BondDiagram } from '@/components/BondDiagram';
import { DetailHeader } from '@/components/DetailHeader';
import { Button, ConfirmDialog, Drawer, StatusBadge } from '@/components/ui';
import { formatDate, formatDateTime } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useOperador, useOperadorMutations } from '../hooks/useOperadores';
import { OperadorForm } from './OperadorForm';

interface OperadorDrawerProps {
  open: boolean;
  operadorId: number | null;
  creating: boolean;
  onClose: () => void;
  onCreated: (id: number) => void;
}

export function OperadorDrawer({ open, operadorId, creating, onClose, onCreated }: OperadorDrawerProps) {
  return (
    <Drawer open={open} onClose={onClose} title={creating ? 'Nuevo operador' : 'Detalle del operador'} hideTitle>
      {creating ? (
        <>
          <DetailHeader kicker="Nuevo operador" name="Nuevo operador" subtitle="Registra a la persona en la operación" />
          <OperadorForm operador={null} onCancel={onClose} onSaved={(op) => onCreated(op.id)} />
        </>
      ) : (
        operadorId !== null && <DetalleOperador key={operadorId} id={operadorId} onClose={onClose} />
      )}
    </Drawer>
  );
}

function Dato({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value || <span className="text-subtle">—</span>}</dd>
    </div>
  );
}

function DetalleOperador({ id, onClose }: { id: number; onClose: () => void }) {
  const { can } = useAuth();
  const { data: operador, isLoading } = useOperador(id);
  const { eliminar, restaurar, cambiarEstado } = useOperadorMutations();
  const [editando, setEditando] = useState(false);
  const [confirmar, setConfirmar] = useState<'eliminar' | 'restaurar' | null>(null);
  const eliminado = !!operador?.deleted_at;

  const hero = (
    <DetailHeader
      kicker={`Operador #${id}`}
      name={operador?.nombre_completo}
      subtitle={operador && `${operador.tipo_documento?.codigo ?? ''} ${operador.documento}`}
      isLoading={isLoading}
      meta={
        operador && (
          <StatusBadge value={eliminado ? 'deleted' : operador.activo ? 'active' : 'inactive'} />
        )
      }
    />
  );

  if (editando && operador) {
    return (
      <>
        {hero}
        <OperadorForm operador={operador} onCancel={() => setEditando(false)} onSaved={() => setEditando(false)} />
      </>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      {hero}

      {operador && (
        <div className="flex-1 space-y-8 px-6 py-6">
          <section>
            <h3 className="mb-3 text-base font-bold">Datos personales</h3>
            <dl className="grid grid-cols-2 gap-5 rounded-2xl border border-line p-4">
              <Dato label="Nombres" value={operador.nombre} />
              <Dato label="Apellidos" value={operador.apellido} />
              <Dato label="Documento" value={`${operador.tipo_documento?.nombre ?? ''}`} />
              <Dato label="Número" value={operador.documento} />
              <Dato label="Teléfono" value={operador.telefono} />
              <Dato label="Dirección" value={operador.direccion} />
            </dl>
          </section>

          <section>
            <h3 className="mb-3 text-base font-bold">Vínculo</h3>
            <BondDiagram
              linked={!!operador.usuario}
              from={{
                label: 'Operador',
                title: operador.nombre_completo,
                lines: [`registrado ${formatDate(operador.created_at)}`],
              }}
              to={{
                label: 'Cuenta de acceso',
                title: operador.usuario?.name,
                lines: operador.usuario ? [operador.usuario.email] : [],
                emptyText: 'Sin cuenta: esta persona no ingresa a Kizuna. Vincúlala desde Usuarios.',
              }}
            />
          </section>

          <section className="grid grid-cols-2 gap-4 rounded-2xl bg-cream px-4 py-3.5">
            <div>
              <p className="text-xs font-semibold text-muted">Creado</p>
              <p className="tabular mt-1 text-sm text-ink">{formatDateTime(operador.created_at)}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted">{eliminado ? 'Eliminado' : 'Actualizado'}</p>
              <p className="tabular mt-1 text-sm text-ink">{formatDateTime(operador.deleted_at ?? operador.updated_at)}</p>
            </div>
          </section>
        </div>
      )}

      {operador && (
        <div className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-line bg-surface/95 px-6 py-4 backdrop-blur">
          {eliminado ? (
            can(PERMISOS.operadores.restaurar) && (
              <Button icon={RotateCcw} variant="success" onClick={() => setConfirmar('restaurar')}>
                Restaurar operador
              </Button>
            )
          ) : (
            <>
              {can(PERMISOS.operadores.editar) && (
                <>
                  <Button icon={Pencil} onClick={() => setEditando(true)}>
                    Editar
                  </Button>
                  <Button
                    icon={Power}
                    variant="secondary"
                    isLoading={cambiarEstado.isPending}
                    onClick={() => cambiarEstado.mutate({ id: operador.id, activo: !operador.activo })}
                  >
                    {operador.activo ? 'Desactivar' : 'Activar'}
                  </Button>
                </>
              )}
              {can(PERMISOS.operadores.eliminar) && (
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
        title={confirmar === 'eliminar' ? 'Eliminar operador' : 'Restaurar operador'}
        message={
          confirmar === 'eliminar'
            ? `Se eliminará a ${operador?.nombre_completo}. Podrás restaurarlo después desde la pestaña "Eliminados".`
            : `Se restaurará a ${operador?.nombre_completo}.`
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
