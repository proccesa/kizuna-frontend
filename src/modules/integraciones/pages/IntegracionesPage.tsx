import { useState } from 'react';
import { Copy, KeyRound, Plug, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { Badge, Button, Card, Checkbox, ConfirmDialog, EmptyState, Field, Input, Modal, PageHeader, Skeleton, Switch } from '@/components/ui';
import { env } from '@/config/env';
import { applyServerErrors } from '@/lib/forms';
import { formatDateTime } from '@/lib/format';
import { notify } from '@/lib/toast';
import { useClientesIntegracion, useIntegracionesMutations } from '../hooks/useIntegraciones';
import type { ClienteIntegracion, PermisoIntegracion } from '../services/integracionesService';

const PERMISOS: { value: PermisoIntegracion; label: string; descripcion: string }[] = [
  { value: 'ordenes:escribir', label: 'Enviar órdenes', descripcion: 'POST /integracion/ordenes' },
  { value: 'ordenes:leer', label: 'Consultar órdenes', descripcion: 'GET /integracion/ordenes/{referencia}' },
  { value: 'historias:escribir', label: 'Enviar conceptos de pre-anestesia', descripcion: 'POST /integracion/historias/preanestesia' },
  { value: 'inventario:escribir', label: 'Sincronizar inventario', descripcion: 'POST /integracion/inventario/unidades y /existencias' },
];

const copiar = (texto: string) => navigator.clipboard.writeText(texto).then(() => notify.success('Copiado al portapapeles'));

export function IntegracionesPage() {
  const { data: clientes = [], isLoading } = useClientesIntegracion();
  const { actualizar, eliminar, regenerar } = useIntegracionesMutations();
  const [crear, setCrear] = useState(false);
  const [token, setToken] = useState<{ nombre: string; token: string } | null>(null);
  const [borrar, setBorrar] = useState<ClienteIntegracion | null>(null);

  return (
    <>
      <PageHeader
        title="Integraciones"
        description="Sistemas externos (HIS, ERP) que envían órdenes quirúrgicas y conceptos de pre-anestesia a Kizuna. Cada uno usa su propio token, con permisos limitados."
        actions={
          <Button icon={Plus} onClick={() => setCrear(true)}>
            Nuevo sistema
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_28rem]">
        <Card className="animate-enter overflow-hidden">
          {isLoading ? (
            <div className="space-y-2 p-5">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : clientes.length === 0 ? (
            <EmptyState
              title="Sin sistemas conectados"
              description="Registra el sistema que genera las órdenes de cirugía para darle un token de acceso."
              action={
                <Button icon={Plug} onClick={() => setCrear(true)}>
                  Nuevo sistema
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-line">
              {clientes.map((c) => {
                const permisos = c.tokens[0]?.abilities ?? [];
                return (
                  <li key={c.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl rounded-bl-md bg-mist text-mist-ink">
                      <Plug className="size-5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-ink">{c.nombre}</p>
                      <p className="text-xs text-muted">
                        {c.descripcion && `${c.descripcion} · `}
                        {c.ultimo_uso_en ? `Último uso ${formatDateTime(c.ultimo_uso_en)}` : 'Aún no se ha conectado'}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {permisos.map((p) => (
                          <Badge key={p} tone="mist">
                            {PERMISOS.find((x) => x.value === p)?.label ?? p}
                          </Badge>
                        ))}
                        {!c.tokens.length && <Badge tone="danger">Sin token</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={c.activo} onChange={(activo) => actualizar.mutate({ id: c.id, activo })} aria-label={`${c.activo ? 'Desactivar' : 'Activar'} ${c.nombre}`} />
                      <Button
                        size="sm"
                        variant="ghost"
                        iconOnly
                        icon={RefreshCw}
                        aria-label={`Regenerar token de ${c.nombre}`}
                        onClick={() =>
                          regenerar
                            .mutateAsync({ id: c.id, permisos: permisos.length ? permisos : PERMISOS.map((p) => p.value) })
                            .then((r) => setToken({ nombre: c.nombre, token: r.datos.token }))
                            .catch(() => undefined)
                        }
                      />
                      <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Eliminar ${c.nombre}`} onClick={() => setBorrar(c)} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <GuiaApi />
      </div>

      <CrearModal open={crear} onClose={() => setCrear(false)} onCreado={(nombre, t) => setToken({ nombre, token: t })} />
      <Modal
        open={!!token}
        onClose={() => setToken(null)}
        title="Token de acceso"
        description={`Para ${token?.nombre}. Cópialo ahora y guárdalo en el sistema externo: no se volverá a mostrar.`}
        footer={<Button onClick={() => setToken(null)}>Listo, lo guardé</Button>}
      >
        <div className="flex items-center gap-2 rounded-2xl bg-cream p-3">
          <KeyRound className="size-4 shrink-0 text-muted" aria-hidden />
          <code className="min-w-0 flex-1 font-mono text-sm break-all text-ink">{token?.token}</code>
          <Button size="sm" variant="secondary" icon={Copy} onClick={() => token && copiar(token.token)}>
            Copiar
          </Button>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!borrar}
        title="Eliminar sistema"
        message={borrar ? `${borrar.nombre} dejará de poder enviar órdenes. Las órdenes que ya envió se conservan.` : ''}
        confirmLabel="Eliminar"
        isLoading={eliminar.isPending}
        onConfirm={async () => {
          if (borrar) await eliminar.mutateAsync(borrar.id).catch(() => undefined);
          setBorrar(null);
        }}
        onClose={() => setBorrar(null)}
      />
    </>
  );
}

function CrearModal({ open, onClose, onCreado }: { open: boolean; onClose: () => void; onCreado: (nombre: string, token: string) => void }) {
  return open ? <CrearContenido onClose={onClose} onCreado={onCreado} /> : null;
}

function CrearContenido({ onClose, onCreado }: { onClose: () => void; onCreado: (nombre: string, token: string) => void }) {
  const { crear } = useIntegracionesMutations();
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [permisos, setPermisos] = useState<PermisoIntegracion[]>(['ordenes:escribir', 'ordenes:leer', 'historias:escribir']);
  const [error, setError] = useState<string>();

  const guardar = async () => {
    try {
      const r = await crear.mutateAsync({ nombre: nombre.trim(), descripcion: descripcion.trim() || null, permisos });
      onClose();
      onCreado(r.datos.cliente.nombre, r.datos.token);
    } catch (e) {
      applyServerErrors(e, (_campo, err) => setError(err.message));
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      dismissible={!crear.isPending}
      title="Nuevo sistema externo"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={crear.isPending}>
            Cancelar
          </Button>
          <Button onClick={guardar} isLoading={crear.isPending} disabled={!nombre.trim() || !permisos.length}>
            Crear y generar token
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Nombre" htmlFor="ci-nombre" error={error} hint="Se guarda como origen de cada orden. Ej.: HIS Hospital Central." required>
          <Input id="ci-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} invalid={!!error} />
        </Field>
        <Field label="Descripción" htmlFor="ci-desc">
          <Input id="ci-desc" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
        </Field>
        <div className="space-y-2">
          <p className="text-sm font-semibold text-ink">Permisos</p>
          {PERMISOS.map((p) => (
            <Checkbox
              key={p.value}
              id={`ci-${p.value}`}
              label={p.label}
              description={p.descripcion}
              checked={permisos.includes(p.value)}
              onChange={(e) => setPermisos((prev) => (e.target.checked ? [...prev, p.value] : prev.filter((x) => x !== p.value)))}
            />
          ))}
        </div>
      </div>
    </Modal>
  );
}

function GuiaApi() {
  const base = env.apiUrl;
  const ejemploOrden = `curl -X POST ${base}/integracion/ordenes \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" -H "Accept: application/json" \\
  -d '{
    "referencia_externa": "OQ-1001",
    "paciente": {
      "tipo_documento": "CC", "numero_documento": "31987120",
      "primer_nombre": "María", "primer_apellido": "Ríos",
      "fecha_nacimiento": "1968-04-12", "sexo": "F"
    },
    "cups": "512104",
    "diagnostico_cie10": "K802",
    "prioridad": "ELECTIVA"
  }'`;
  const ejemploConcepto = `curl -X POST ${base}/integracion/historias/preanestesia \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" -H "Accept: application/json" \\
  -d '{
    "orden_referencia": "OQ-1001",
    "fecha_valoracion": "2026-10-13",
    "concepto": "APTO",
    "asa": 2,
    "dias_suspension": 5,
    "anestesiologo": { "nombre": "Dra. Paula Mejía", "registro": "RM-1234" }
  }'`;

  const ejemploInventario = `curl -X POST ${base}/integracion/inventario/existencias \\
  -H "Authorization: Bearer <token>" \\
  -H "Content-Type: application/json" -H "Accept: application/json" \\
  -d '{
    "existencias": [
      { "item_codigo": "IS-TROC10", "item_nombre": "Trocar 10 mm",
        "sede": "Sede Norte", "lote": "L2309", "vence": "2027-08-31", "cantidad": 40 }
    ]
  }'`;

  return (
    <Card className="animate-enter min-w-0 p-5">
      <p className="font-display text-base font-bold text-ink">Cómo se conecta el sistema externo</p>
      <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-body">
        <li>Envía cada orden de cirugía con su <b>referencia_externa</b>. Reenviarla no la duplica.</li>
        <li>Kizuna responde con el estado: cita de pre-anestesia asignada, sin cupo o rechazada (sin especialidad).</li>
        <li>Si la valoración se hace en el sistema externo, envía el concepto. Si se hace en Kizuna, no hace falta.</li>
        <li>Consulta el estado cuando quieras con GET /integracion/ordenes/&#123;referencia&#125;.</li>
      </ol>
      {[
        { titulo: 'Enviar una orden', codigo: ejemploOrden },
        { titulo: 'Enviar el concepto de pre-anestesia', codigo: ejemploConcepto },
        { titulo: 'Sincronizar existencias de insumos (ERP)', codigo: ejemploInventario },
      ].map((e) => (
        <div key={e.titulo} className="mt-4">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-sm font-semibold text-ink">{e.titulo}</p>
            <Button size="sm" variant="ghost" icon={Copy} onClick={() => copiar(e.codigo)}>
              Copiar
            </Button>
          </div>
          <pre className="overflow-x-auto rounded-2xl bg-petrol p-4 text-xs leading-relaxed text-white/90">
            <code>{e.codigo}</code>
          </pre>
        </div>
      ))}
      <p className="mt-3 text-xs text-muted">Conceptos válidos: APTO, APTO_CON_RECOMENDACIONES, APLAZADO, NO_APTO. Los errores llegan con estado 422 y el detalle por campo.</p>
    </Card>
  );
}
