import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Badge, Button, Card, DemoBanner, PageHeader } from '@/components/ui';
import { CONTRATOS, ENTIDADES, POBLACIONES } from '@/demo/datos';
import { accionDemo } from '@/lib/demo';
import { formatNumber } from '@/lib/format';
import { ModalidadBadge } from '../components/ModalidadBadge';

export function EntidadesPage() {
  return (
    <>
      <PageHeader
        title="Entidades"
        description="EPS y aseguradoras con las que tu IPS tiene contratos. Cada paciente llega a Kizuna a través de una de ellas."
        actions={
          <Button icon={Plus} onClick={accionDemo('Crear entidad')}>
            Nueva entidad
          </Button>
        }
      />
      <DemoBanner />

      <div className="grid gap-5 md:grid-cols-2">
        {ENTIDADES.map((entidad) => {
          const contratos = CONTRATOS.filter((c) => c.entidadId === entidad.id);
          const pacientes = POBLACIONES.filter((p) => contratos.some((c) => c.id === p.contratoId)).reduce((sum, p) => sum + p.pacientes, 0);
          return (
            <Card key={entidad.id} className="animate-enter flex flex-col">
              <div className="flex items-start gap-4 px-6 pt-6">
                <span className="flex h-12 min-w-12 items-center justify-center rounded-2xl rounded-bl-md bg-petrol px-2 font-display text-xs font-bold tracking-tight text-white">
                  {entidad.sigla}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold">{entidad.nombre}</h2>
                  <p className="tabular text-sm text-muted">NIT {entidad.nit}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {entidad.regimenes.map((r) => (
                      <Badge key={r} tone="mist">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-px border-y border-line bg-line">
                <div className="bg-surface px-6 py-3">
                  <p className="text-xs font-semibold text-muted">Contratos</p>
                  <p className="tabular font-display text-2xl font-bold text-ink">{contratos.length}</p>
                </div>
                <div className="bg-surface px-6 py-3">
                  <p className="text-xs font-semibold text-muted">Pacientes</p>
                  <p className="tabular font-display text-2xl font-bold text-ink">{formatNumber(pacientes)}</p>
                </div>
              </div>

              <ul className="flex-1 divide-y divide-line">
                {contratos.map((c) => (
                  <li key={c.id}>
                    <Link to="/contratos" className="flex items-center justify-between gap-3 px-6 py-3 text-sm transition-colors hover:bg-cream">
                      <span className="tabular font-semibold text-ink">{c.codigo}</span>
                      <span className="flex items-center gap-2">
                        <span className="text-muted">{c.regimen}</span>
                        <ModalidadBadge modalidad={c.modalidad} />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>
    </>
  );
}
