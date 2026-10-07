import { useMemo } from 'react';
import { Check } from 'lucide-react';
import { Avatar, Badge, Card, CardBody, CardHeader, PageHeader } from '@/components/ui';
import { formatDate, humanize } from '@/lib/format';
import { useAuth } from '@/modules/auth/hooks/useAuth';

function Dato({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs font-semibold text-muted">{label}</dt>
      <dd className="mt-0.5 truncate text-[0.95rem] text-ink">{value || <span className="text-subtle">—</span>}</dd>
    </div>
  );
}

export function PerfilPage() {
  const { usuario } = useAuth();

  const permisosPorModulo = useMemo(() => {
    const grupos = new Map<string, string[]>();
    for (const permiso of usuario?.permisos ?? []) {
      const [modulo, accion = modulo] = permiso.split('.') as [string, string?];
      grupos.set(modulo, [...(grupos.get(modulo) ?? []), accion]);
    }
    return [...grupos.entries()];
  }, [usuario?.permisos]);

  if (!usuario) return null;
  const { operador } = usuario;
  const nombre = operador?.nombre_completo || usuario.name;

  return (
    <>
      <PageHeader title="Mi perfil" description="Tus datos en Kizuna y lo que puedes hacer con tu cuenta." />

      <div className="grid gap-6 xl:grid-cols-[24rem_1fr]">
        <Card className="animate-enter overflow-hidden">
          <div className="flex flex-col items-center bg-cream px-6 pt-8 pb-6 text-center">
            <Avatar name={nombre} size="xl" />
            <h2 className="mt-4 text-2xl font-bold">{nombre}</h2>
            <p className="text-sm text-muted">{usuario.email}</p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {usuario.roles.map((rol) => (
                <Badge key={rol} tone={rol === 'super-admin' ? 'petrol' : 'mist'}>
                  {humanize(rol)}
                </Badge>
              ))}
            </div>
          </div>
          <dl className="grid grid-cols-2 gap-5 border-t border-line p-6">
            <Dato label="Documento" value={operador ? `${operador.tipo_documento?.codigo ?? ''} ${operador.documento}` : null} />
            <Dato label="Teléfono" value={operador?.telefono} />
            <Dato label="Miembro desde" value={formatDate(usuario.creado_el)} />
            <Dato label="Estado" value={usuario.activo ? 'Activo' : 'Inactivo'} />
          </dl>
          {!operador && <p className="border-t border-line px-6 py-4 text-sm text-muted">Tu cuenta no tiene un operador vinculado. Pídele a un administrador que lo registre.</p>}
        </Card>

        <Card className="animate-enter">
          <CardHeader title="Lo que puedes hacer" description={`${usuario.permisos.length} permisos que vienen de tus roles.`} />
          <CardBody className="divide-y divide-line">
            {permisosPorModulo.map(([modulo, acciones]) => (
              <div key={modulo} className="grid gap-2 py-4 first:pt-1 sm:grid-cols-[10rem_1fr]">
                <p className="font-semibold text-ink">{humanize(modulo)}</p>
                <div className="flex flex-wrap gap-x-5 gap-y-2">
                  {acciones.map((accion) => (
                    <span key={accion} className="flex items-center gap-1.5 text-sm text-body">
                      <Check className="size-4 text-success" aria-hidden />
                      {humanize(accion)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
