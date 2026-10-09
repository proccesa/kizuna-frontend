import { Card } from '@/components/ui';
import { esVisible, type ContextoPlantilla } from '../plantilla';
import type { EsquemaPlantilla, Respuestas, ResultadoPreanestesia } from '../types';
import { CampoFormulario } from './CampoFormulario';

interface FormularioPlantillaProps {
  esquema: EsquemaPlantilla;
  respuestas: Respuestas;
  onChange: (campo: string, valor: unknown) => void;
  contexto?: ContextoPlantilla;
  resultado: ResultadoPreanestesia | null;
  errores: Record<string, string[]>;
  soloLectura?: boolean;
}

/**
 * Renderiza cualquier plantilla de historia clínica a partir de su esquema.
 * Los campos con `visible_si` aparecen y desaparecen según las respuestas.
 */
export function FormularioPlantilla({ esquema, respuestas, onChange, contexto, resultado, errores, soloLectura = false }: FormularioPlantillaProps) {
  return (
    <div className="@container space-y-5">
      {esquema.secciones.map((seccion) => {
        const visibles = seccion.campos.filter((c) => esVisible(c, respuestas, contexto));
        const booleanos = visibles.filter((c) => c.tipo === 'booleano');
        const otros = visibles.filter((c) => c.tipo !== 'booleano');
        return (
          <Card key={seccion.id} id={`seccion-${seccion.id}`} className="scroll-mt-24 p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold">{seccion.titulo}</h2>
            {/* Los campos se renderizan en orden, agrupando los sí/no en una lista compacta. */}
            <div className="space-y-5">
              {agrupar(visibles).map((grupo, i) =>
                grupo.tipo === 'booleanos' ? (
                  <div key={i} className="grid overflow-hidden rounded-2xl border border-line px-4 @3xl:grid-cols-2 @3xl:gap-x-8">
                    {/* -mb-px y overflow-hidden ocultan la línea inferior de la última fila. */}
                    {grupo.campos.map((c) => (
                      <div key={c.id} className="-mb-px border-b border-line">
                        <CampoFormulario campo={c} valor={c.id in respuestas ? respuestas[c.id] : c.valor_inicial} onChange={(v) => onChange(c.id, v)} resultado={resultado} errores={errores} soloLectura={soloLectura} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div key={i} className="grid gap-4 @xl:grid-cols-2">
                    {grupo.campos.map((c) => (
                      <CampoFormulario key={c.id} campo={c} valor={c.id in respuestas ? respuestas[c.id] : c.valor_inicial} onChange={(v) => onChange(c.id, v)} resultado={resultado} errores={errores} soloLectura={soloLectura} />
                    ))}
                  </div>
                ),
              )}
              {booleanos.length + otros.length === 0 && <p className="text-sm text-muted">Sin campos aplicables.</p>}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

type Grupo = { tipo: 'booleanos' | 'otros'; campos: EsquemaPlantilla['secciones'][number]['campos'] };

/** Agrupa campos consecutivos del mismo tipo (sí/no u otros) respetando el orden de la plantilla. */
function agrupar(campos: EsquemaPlantilla['secciones'][number]['campos']): Grupo[] {
  const grupos: Grupo[] = [];
  for (const c of campos) {
    const tipo = c.tipo === 'booleano' ? 'booleanos' : 'otros';
    const ultimo = grupos[grupos.length - 1];
    if (ultimo?.tipo === tipo) ultimo.campos.push(c);
    else grupos.push({ tipo, campos: [c] });
  }
  return grupos;
}
