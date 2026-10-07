import { AlertTriangle, FileSpreadsheet, Upload } from 'lucide-react';
import { Badge, Card, DemoBanner, PageHeader, Progress } from '@/components/ui';
import { CONTRATOS, POBLACIONES, entidadDe } from '@/demo/datos';
import { accionDemo } from '@/lib/demo';
import { formatDate, formatNumber } from '@/lib/format';
import { ModalidadBadge } from '../components/ModalidadBadge';

export function PoblacionesPage() {
  return (
    <>
      <PageHeader
        title="Poblaciones"
        description="Los pacientes asociados a cada contrato. Kizuna los cruza con sus servicios esperados para saber a quién programar y cuándo."
      />
      <DemoBanner />

      {/* Cargue de archivo */}
      <button
        type="button"
        onClick={accionDemo('Cargar población')}
        className="animate-enter mb-6 flex w-full cursor-pointer flex-col items-center gap-3 rounded-[var(--radius-card)] border-2 border-dashed border-line-strong bg-surface px-6 py-8 text-center transition-colors hover:border-petrol/40 hover:bg-cream/50 sm:flex-row sm:text-left"
      >
        <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-mist text-mist-ink">
          <Upload className="size-5" aria-hidden />
        </span>
        <span className="flex-1">
          <span className="block font-display text-lg font-bold text-ink">Cargar una población</span>
          <span className="block text-sm text-muted">
            Arrastra un archivo .xlsx o .csv con tipo y número de documento, nombres, fecha de nacimiento, contrato y cohorte de cada paciente.
          </span>
        </span>
        <span className="text-sm font-semibold text-petrol underline-offset-2 hover:underline">Descargar plantilla</span>
      </button>

      <div className="grid gap-5 lg:grid-cols-2">
        {POBLACIONES.map((p) => {
          const contrato = CONTRATOS.find((c) => c.id === p.contratoId)!;
          const entidad = entidadDe(p.contratoId);
          const avance = (p.programados / p.pacientes) * 100;
          return (
            <Card key={p.id} className="animate-enter p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-muted">
                    {entidad?.nombre} · <span className="tabular">{contrato.codigo}</span>
                  </p>
                  <h2 className="mt-0.5 text-lg font-bold">{p.nombre}</h2>
                </div>
                <ModalidadBadge modalidad={contrato.modalidad} />
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <p className="tabular font-display text-4xl leading-none font-bold text-ink">{formatNumber(p.pacientes)}</p>
                  <p className="mt-1 text-sm text-muted">pacientes</p>
                </div>
                <p className="tabular text-right text-sm text-body">
                  <span className="font-semibold text-ink">{formatNumber(p.programados)}</span> con cita
                  <br />
                  <span className="text-muted">{formatNumber(p.pacientes - p.programados)} por programar</span>
                </p>
              </div>
              <Progress value={avance} tone={avance < 30 ? 'warning' : 'success'} className="mt-3" label={`Avance de programación ${p.nombre}`} />

              <div className="mt-5 flex flex-wrap gap-1.5">
                {p.cohortes.map((c) => (
                  <Badge key={c} tone="mist">
                    {c}
                  </Badge>
                ))}
              </div>

              <div className="mt-5 border-t border-line pt-4 text-sm">
                {p.archivo ? (
                  <p className="flex items-center gap-2 text-muted">
                    <FileSpreadsheet className="size-4 text-success" aria-hidden />
                    <span className="truncate text-body">{p.archivo}</span>· {formatDate(p.ultimaCarga)}
                  </p>
                ) : (
                  <p className="flex items-center gap-2 font-medium text-danger">
                    <AlertTriangle className="size-4" aria-hidden />
                    Sin cargue este mes: los pacientes nuevos no se programarán.
                  </p>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
