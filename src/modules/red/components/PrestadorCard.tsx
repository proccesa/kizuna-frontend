import { Building2, Clock, DoorOpen, MapPin, Pencil, Plus, RotateCcw, Star, Trash2 } from 'lucide-react';
import { Badge, Button, Card, StatusBadge } from '@/components/ui';
import { cn } from '@/lib/cn';
import { formatearDias } from '@/lib/horario';
import { formatearNit } from '@/lib/nit';
import { NATURALEZAS, type Prestador, type Sede } from '../types';

interface PrestadorCardProps {
  prestador: Prestador;
  permisos: { editar: boolean; eliminar: boolean; restaurar: boolean; crearSede: boolean; editarSede: boolean; eliminarSede: boolean };
  onEditar: () => void;
  onEliminar: () => void;
  onRestaurar: () => void;
  onNuevaSede: () => void;
  onEditarSede: (sede: Sede) => void;
  onEliminarSede: (sede: Sede) => void;
}

function SedeTile({ sede, onEditar, onEliminar }: { sede: Sede; onEditar?: () => void; onEliminar?: () => void }) {
  return (
    <div className={cn('group relative rounded-2xl rounded-bl-md border border-line bg-cream/60 p-4', !sede.activo && 'opacity-60')}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="tabular text-xs font-semibold text-muted">Sede {sede.numero_sede}</p>
          <h3 className="truncate text-base font-bold">{sede.nombre}</h3>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {sede.es_principal && (
            <Badge tone="lime">
              <Star className="size-3" aria-hidden /> Principal
            </Badge>
          )}
          {!sede.activo && <StatusBadge value="inactive" />}
        </div>
      </div>

      <ul className="mt-3 space-y-1.5 text-sm text-body">
        <li className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden />
          <span>
            {sede.direccion}
            <span className="block text-xs text-muted">
              {sede.municipio?.nombre}, {sede.municipio?.departamento?.nombre}
            </span>
          </span>
        </li>
        <li className="flex items-center gap-2">
          <Clock className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="tabular">
            {formatearDias(sede.dias_atencion)} · {sede.hora_apertura}–{sede.hora_cierre}
          </span>
        </li>
        <li className="flex items-center gap-2">
          <DoorOpen className="size-4 shrink-0 text-muted" aria-hidden />
          <span className="tabular">{sede.consultorios} consultorios</span>
        </li>
      </ul>

      {(onEditar || onEliminar) && (
        <div className="mt-3 flex gap-1 border-t border-line pt-3 sm:absolute sm:top-3 sm:right-3 sm:mt-0 sm:border-0 sm:bg-cream sm:pt-0 sm:opacity-0 sm:transition-opacity sm:group-focus-within:opacity-100 sm:group-hover:opacity-100">
          {onEditar && <Button size="sm" variant="ghost" iconOnly icon={Pencil} aria-label={`Editar ${sede.nombre}`} onClick={onEditar} />}
          {onEliminar && <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Eliminar ${sede.nombre}`} onClick={onEliminar} />}
        </div>
      )}
    </div>
  );
}

export function PrestadorCard({ prestador, permisos, onEditar, onEliminar, onRestaurar, onNuevaSede, onEditarSede, onEliminarSede }: PrestadorCardProps) {
  const eliminado = !!prestador.deleted_at;
  const naturaleza = NATURALEZAS.find((n) => n.value === prestador.naturaleza)?.label;
  const sedes = prestador.sedes ?? [];

  return (
    <Card className={cn('animate-enter overflow-hidden', eliminado && 'opacity-70')}>
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line px-6 py-5">
        <div className="flex min-w-0 items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl rounded-bl-md bg-mist text-mist-ink">
            <Building2 className="size-6" aria-hidden />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-xl font-bold">{prestador.nombre_comercial || prestador.razon_social}</h2>
            <p className="tabular truncate text-sm text-muted">
              {prestador.nombre_comercial && <>{prestador.razon_social} · </>}
              NIT {formatearNit(prestador.nit)}-{prestador.digito_verificacion}
              {prestador.codigo_habilitacion && <> · REPS {prestador.codigo_habilitacion}</>}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{naturaleza}</Badge>
          <StatusBadge value={eliminado ? 'deleted' : prestador.activo ? 'active' : 'inactive'} />
          {eliminado
            ? permisos.restaurar && (
                <Button size="sm" variant="success" icon={RotateCcw} onClick={onRestaurar}>
                  Restaurar
                </Button>
              )
            : (
                <>
                  {permisos.editar && <Button size="sm" variant="ghost" iconOnly icon={Pencil} aria-label="Editar prestador" onClick={onEditar} />}
                  {permisos.eliminar && <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label="Eliminar prestador" onClick={onEliminar} />}
                </>
              )}
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">
        {sedes.map((sede) => (
          <SedeTile
            key={sede.id}
            sede={sede}
            onEditar={!eliminado && permisos.editarSede ? () => onEditarSede(sede) : undefined}
            onEliminar={!eliminado && permisos.eliminarSede ? () => onEliminarSede(sede) : undefined}
          />
        ))}
        {!eliminado && permisos.crearSede && (
          <button
            type="button"
            onClick={onNuevaSede}
            className="flex min-h-36 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-strong text-sm font-semibold text-muted transition-colors hover:border-petrol/40 hover:text-ink"
          >
            <Plus className="size-5" aria-hidden />
            {sedes.length ? 'Agregar sede' : 'Agrega la primera sede'}
          </button>
        )}
        {sedes.length === 0 && (eliminado || !permisos.crearSede) && <p className="text-sm text-muted">Sin sedes registradas.</p>}
      </div>
    </Card>
  );
}
