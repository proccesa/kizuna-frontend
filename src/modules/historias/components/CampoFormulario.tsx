import { Plus, Sparkles, Trash2 } from 'lucide-react';
import { Button, Input, Select, Textarea } from '@/components/ui';
import { cn } from '@/lib/cn';
import { leerRuta } from '../plantilla';
import type { CampoPlantilla, ResultadoPreanestesia } from '../types';

interface CampoFormularioProps {
  campo: CampoPlantilla;
  valor: unknown;
  onChange: (valor: unknown) => void;
  resultado: ResultadoPreanestesia | null;
  errores: Record<string, string[]>;
  soloLectura: boolean;
}

const idDom = (id: string) => `hc-${id}`;

/** Un campo de la plantilla según su tipo. */
export function CampoFormulario({ campo, valor, onChange, resultado, errores, soloLectura }: CampoFormularioProps) {
  const error = errores[campo.id]?.[0];
  const sugerencia = campo.sugerencia ? leerRuta(resultado, campo.sugerencia) : undefined;
  const sugerenciaTexto = sugerencia === undefined || sugerencia === null ? null : String(sugerencia);
  const usarSugerencia = sugerenciaTexto !== null && !soloLectura && String(valor ?? '') !== sugerenciaTexto;

  if (campo.tipo === 'booleano') {
    return (
      <div className="flex items-start justify-between gap-4 py-2" id={idDom(campo.id)}>
        <span className="pt-1.5 text-sm text-ink">
          {campo.etiqueta}
          {campo.requerido && <span className="ml-0.5 text-danger">*</span>}
          {error && <span className="mt-0.5 block text-[0.8rem] font-medium text-danger">{error}</span>}
        </span>
        <span className="flex shrink-0 rounded-xl border border-line-strong p-0.5" role="radiogroup" aria-label={campo.etiqueta}>
          {[
            { v: true, l: 'Sí' },
            { v: false, l: 'No' },
          ].map((o) => (
            <button
              key={o.l}
              type="button"
              role="radio"
              aria-checked={valor === o.v}
              disabled={soloLectura}
              onClick={() => onChange(valor === o.v ? null : o.v)}
              className={cn(
                'h-8 min-w-11 cursor-pointer rounded-lg px-3 text-sm font-semibold transition-colors disabled:cursor-default',
                valor === o.v ? (o.v ? 'bg-petrol text-white' : 'bg-sand text-ink') : 'text-muted hover:text-ink',
              )}
            >
              {o.l}
            </button>
          ))}
        </span>
      </div>
    );
  }

  const etiqueta = (
    <label htmlFor={idDom(campo.id)} className="flex flex-wrap items-baseline gap-x-2 text-sm font-semibold text-ink">
      <span>
        {campo.etiqueta}
        {campo.requerido && <span className="ml-0.5 text-danger">*</span>}
      </span>
      {usarSugerencia && (
        <button
          type="button"
          onClick={() => onChange(campo.tipo === 'numero' ? Number(sugerenciaTexto) : sugerenciaTexto)}
          className="flex cursor-pointer items-center gap-1 rounded-full bg-lime px-2 py-0.5 text-xs font-semibold text-lime-ink hover:brightness-95"
        >
          <Sparkles className="size-3" aria-hidden />
          Sugerido: {campo.opciones?.find((o) => o.valor === sugerenciaTexto)?.etiqueta.split(' · ')[0] ?? sugerenciaTexto}
          {campo.unidad && campo.tipo === 'numero' ? ` ${campo.unidad}` : ''} · Usar
        </button>
      )}
    </label>
  );

  const pie = error ? (
    <p className="text-[0.8rem] font-medium text-danger">{error}</p>
  ) : campo.ayuda ? (
    <p className="text-[0.8rem] text-muted">{campo.ayuda}</p>
  ) : null;

  let control;
  switch (campo.tipo) {
    case 'calculado': {
      const v = campo.fuente ? leerRuta(resultado, campo.fuente) : undefined;
      control = (
        <p className="tabular flex h-11 items-center rounded-xl bg-cream px-3.5 font-display text-lg font-bold text-ink">
          {v === undefined || v === null ? <span className="text-sm font-normal text-subtle">Se calcula solo</span> : `${String(v).replace('.', ',')} ${campo.unidad ?? ''}`}
        </p>
      );
      break;
    }
    case 'numero':
      control = (
        <div className="relative">
          <Input
            id={idDom(campo.id)}
            type="number"
            inputMode="decimal"
            step={campo.decimales ? 1 / 10 ** campo.decimales : 1}
            min={campo.min}
            max={campo.max}
            readOnly={soloLectura}
            value={valor === undefined || valor === null ? '' : String(valor)}
            onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
            invalid={!!error}
            className={cn('tabular', campo.unidad && 'pr-16')}
          />
          {campo.unidad && <span className="pointer-events-none absolute top-1/2 right-3.5 z-10 -translate-y-1/2 text-sm text-muted">{campo.unidad}</span>}
        </div>
      );
      break;
    case 'seleccion':
      control =
        (campo.opciones?.length ?? 0) <= 6 ? (
          <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-labelledby={idDom(campo.id)} id={idDom(campo.id)}>
            {campo.opciones!.map((o) => {
              const activa = valor === o.valor;
              return (
                <button
                  key={o.valor}
                  type="button"
                  role="radio"
                  aria-checked={activa}
                  disabled={soloLectura}
                  onClick={() => onChange(activa ? null : o.valor)}
                  className={cn(
                    'cursor-pointer rounded-xl px-3 py-2 text-left text-sm font-medium transition-colors disabled:cursor-default',
                    activa ? 'bg-petrol text-white' : 'border border-line-strong bg-surface text-body hover:bg-sand',
                    sugerenciaTexto === o.valor && !activa && 'ring-2 ring-lime',
                  )}
                >
                  {o.etiqueta}
                </button>
              );
            })}
          </div>
        ) : (
          <Select
            id={idDom(campo.id)}
            disabled={soloLectura}
            value={String(valor ?? '')}
            onChange={(e) => onChange(e.target.value || null)}
            placeholder="Selecciona"
            options={campo.opciones!.map((o) => ({ value: o.valor, label: o.etiqueta }))}
            invalid={!!error}
          />
        );
      break;
    case 'texto_largo':
      control = <Textarea id={idDom(campo.id)} rows={3} readOnly={soloLectura} value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)} invalid={!!error} />;
      break;
    case 'fecha':
      control = <Input id={idDom(campo.id)} type="date" readOnly={soloLectura} value={String(valor ?? '')} onChange={(e) => onChange(e.target.value || null)} invalid={!!error} />;
      break;
    case 'lista':
      control = <CampoLista campo={campo} valor={Array.isArray(valor) ? (valor as Record<string, unknown>[]) : []} onChange={onChange} errores={errores} soloLectura={soloLectura} />;
      break;
    default:
      control = <Input id={idDom(campo.id)} readOnly={soloLectura} value={String(valor ?? '')} onChange={(e) => onChange(e.target.value)} invalid={!!error} />;
  }

  return (
    <div className={cn('flex flex-col gap-1.5', ancho(campo) && '@xl:col-span-2')}>
      {etiqueta}
      {control}
      {pie}
    </div>
  );
}

/** Campos que ocupan las dos columnas: textos largos, listas y opciones extensas. */
function ancho(campo: CampoPlantilla): boolean {
  if (campo.tipo === 'texto_largo' || campo.tipo === 'lista') return true;
  const opciones = campo.opciones ?? [];
  return opciones.length > 3 || opciones.some((o) => o.etiqueta.length > 24);
}

function CampoLista({
  campo,
  valor,
  onChange,
  errores,
  soloLectura,
}: {
  campo: CampoPlantilla;
  valor: Record<string, unknown>[];
  onChange: (v: unknown) => void;
  errores: Record<string, string[]>;
  soloLectura: boolean;
}) {
  const cambiar = (i: number, sub: string, v: unknown) => onChange(valor.map((fila, j) => (j === i ? { ...fila, [sub]: v } : fila)));

  return (
    <div className="space-y-2" id={idDom(campo.id)}>
      {valor.length === 0 && soloLectura && <p className="text-sm text-muted">Ninguno.</p>}
      {valor.map((fila, i) => (
        <div key={i} className="flex items-start gap-2 rounded-xl bg-cream p-2">
          <div className="grid flex-1 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(9rem,1fr))]">
            {campo.campos!.map((sub) => {
              const error = errores[`${campo.id}.${i}.${sub.id}`]?.[0];
              const comun = { 'aria-label': `${sub.etiqueta} (fila ${i + 1})`, readOnly: soloLectura, invalid: !!error, className: 'h-10 bg-surface' };
              return (
                <div key={sub.id}>
                  {sub.tipo === 'seleccion' ? (
                    <Select
                      {...comun}
                      disabled={soloLectura}
                      value={String(fila[sub.id] ?? '')}
                      onChange={(e) => cambiar(i, sub.id, e.target.value || null)}
                      placeholder={sub.etiqueta}
                      options={sub.opciones!.map((o) => ({ value: o.valor, label: o.etiqueta }))}
                    />
                  ) : (
                    <Input
                      {...comun}
                      type={sub.tipo === 'fecha' ? 'date' : 'text'}
                      placeholder={sub.etiqueta}
                      value={String(fila[sub.id] ?? '')}
                      onChange={(e) => cambiar(i, sub.id, e.target.value)}
                    />
                  )}
                  {error && <p className="mt-1 text-xs font-medium text-danger">{error}</p>}
                </div>
              );
            })}
          </div>
          {!soloLectura && (
            <Button size="sm" variant="danger-ghost" iconOnly icon={Trash2} aria-label={`Quitar fila ${i + 1}`} onClick={() => onChange(valor.filter((_, j) => j !== i))} className="mt-1" />
          )}
        </div>
      ))}
      {!soloLectura && (
        <Button size="sm" variant="secondary" icon={Plus} onClick={() => onChange([...valor, {}])}>
          Agregar
        </Button>
      )}
    </div>
  );
}
