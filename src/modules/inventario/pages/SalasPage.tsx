import { useState } from 'react';
import { DoorOpen, Pencil, Plus, Trash2 } from 'lucide-react';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Select, Skeleton, Switch } from '@/components/ui';
import { toApiError } from '@/lib/api/errors';
import { useAuth } from '@/modules/auth/hooks/useAuth';
import { PERMISOS } from '@/modules/auth/permisos';
import { useSedes } from '@/modules/red/hooks/useRed';
import { useInventarioMutations, useSalas } from '../hooks/useInventario';
import { TIPOS_SALA, type Sala } from '../types';

export function SalasPage() {
  const { can } = useAuth();
  const [sedeId, setSedeId] = useState('');
  const { data: salas = [], isLoading } = useSalas({ sede_id: sedeId ? Number(sedeId) : undefined });
  const { data: sedes } = useSedes({ por_pagina: 100 });
  const { eliminarSala } = useInventarioMutations();
  const [modal, setModal] = useState<{ open: boolean; sala: Sala | null }>({ open: false, sala: null });
  const [borrar, setBorrar] = useState<Sala | null>(null);

  const porSede = salas.reduce<Record<string, Sala[]>>((acc, s) => ({ ...acc, [s.sede?.nombre ?? s.sede_id]: [...(acc[s.sede?.nombre ?? s.sede_id] ?? []), s] }), {});

  return (
    <>
      <PageHeader
        title="Salas y quirófanos"
        description="Las salas donde se realizan los procedimientos. En el portafolio defines qué tipo de sala necesita cada CUPS y Kizuna elige una libre."
        actions={
          can(PERMISOS.sedes.editar) && (
            <Button icon={Plus} onClick={() => setModal({ open: true, sala: null })}>
              Nueva sala
            </Button>
          )
        }
      />
      <div className="mb-4">
        <Select aria-label="Sede" value={sedeId} onChange={(e) => setSedeId(e.target.value)} placeholder="Todas las sedes" options={(sedes?.datos ?? []).map((s) => ({ value: s.id, label: s.nombre }))} className="h-10 sm:w-60" />
      </div>
      {isLoading ? (
        <Skeleton className="h-48" />
      ) : salas.length === 0 ? (
        <Card>
          <EmptyState title="Sin salas" description="Registra los quirófanos y salas de procedimientos de cada sede." />
        </Card>
      ) : (
        <div className="space-y-5">
          {Object.entries(porSede).map(([sede, lista]) => (
            <Card key={sede} className="animate-enter overflow-hidden">
              <p className="border-b border-line bg-cream/60 px-5 py-2.5 text-sm font-semibold text-ink">{sede}</p>
              <ul className="divide-y divide-line">
                {lista.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 px-5 py-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl rounded-bl-sm bg-mist text-mist-ink">
                      <DoorOpen className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">
                        {s.nombre} <span className="tabular font-normal text-muted">· {s.codigo}</span>
                      </p>
                      <p className="text-xs text-muted">
                        {TIPOS_SALA.find((t) => t.value === s.tipo)?.label} · {s.equipos_count} {s.equipos_count === 1 ? 'equipo fijo' : 'equipos fijos'}
                      </p>
                    </div>
                    {!s.activo && <Badge>Inactiva</Badge>}
                    {can(PERMISOS.sedes.editar) && <Button size="sm" variant="ghost" iconOnly icon={Pencil} aria-label={`Editar ${s.nombre}`} onClick={() => setModal({ open: true, sala: s })} />}
                    {can(PERMISOS.sedes.eliminar) && <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Eliminar ${s.nombre}`} onClick={() => setBorrar(s)} />}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      )}
      {modal.open && <SalaModal sala={modal.sala} sedeInicial={sedeId} onClose={() => setModal({ open: false, sala: null })} />}
      <ConfirmDialog
        open={!!borrar}
        title="Eliminar sala"
        message={borrar ? `Se eliminará ${borrar.nombre}. Si tiene equipos fijos, primero muévelos o márcalos como móviles.` : ''}
        confirmLabel="Eliminar"
        isLoading={eliminarSala.isPending}
        onConfirm={async () => {
          if (borrar) await eliminarSala.mutateAsync(borrar.id).catch(() => undefined);
          setBorrar(null);
        }}
        onClose={() => setBorrar(null)}
      />
    </>
  );
}

function SalaModal({ sala, sedeInicial, onClose }: { sala: Sala | null; sedeInicial: string; onClose: () => void }) {
  const { guardarSala } = useInventarioMutations();
  const { data: sedes } = useSedes({ activo: true, por_pagina: 100 });
  const [v, setV] = useState({ sede_id: String(sala?.sede_id ?? sedeInicial), codigo: sala?.codigo ?? '', nombre: sala?.nombre ?? '', tipo: sala?.tipo ?? 'QUIROFANO', activo: sala?.activo ?? true });
  const [errores, setErrores] = useState<Record<string, string[]>>({});

  const guardar = async () => {
    try {
      await guardarSala.mutateAsync({ id: sala?.id ?? null, payload: { ...v, sede_id: Number(v.sede_id), codigo: v.codigo.trim().toUpperCase(), nombre: v.nombre.trim() } });
      onClose();
    } catch (e) {
      setErrores(toApiError(e).fieldErrors);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={sala ? `Editar ${sala.nombre}` : 'Nueva sala'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={guardar} isLoading={guardarSala.isPending} disabled={!v.sede_id || !v.codigo.trim() || !v.nombre.trim()}>
            {sala ? 'Guardar' : 'Crear sala'}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-[8rem_1fr]">
        <Field label="Sede" htmlFor="sa-sede" required className="sm:col-span-2">
          <Select id="sa-sede" placeholder="Selecciona" disabled={!!sala} value={v.sede_id} onChange={(e) => setV({ ...v, sede_id: e.target.value })} options={(sedes?.datos ?? []).map((s) => ({ value: s.id, label: s.nombre }))} />
        </Field>
        <Field label="Código" htmlFor="sa-codigo" error={errores.codigo?.[0]} required>
          <Input id="sa-codigo" placeholder="Q1" className="uppercase" value={v.codigo} onChange={(e) => setV({ ...v, codigo: e.target.value })} invalid={!!errores.codigo} />
        </Field>
        <Field label="Nombre" htmlFor="sa-nombre" required>
          <Input id="sa-nombre" placeholder="Quirófano 1" value={v.nombre} onChange={(e) => setV({ ...v, nombre: e.target.value })} />
        </Field>
        <Field label="Tipo" htmlFor="sa-tipo" className="sm:col-span-2">
          <Select id="sa-tipo" value={v.tipo} onChange={(e) => setV({ ...v, tipo: e.target.value as Sala['tipo'] })} options={TIPOS_SALA} />
        </Field>
        <div className="sm:col-span-2">
          <Switch checked={v.activo} onChange={(activo) => setV({ ...v, activo })} label="Sala activa" description="Las salas inactivas no se asignan a procedimientos." />
        </div>
      </div>
    </Modal>
  );
}
