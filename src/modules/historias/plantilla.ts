import type { CampoPlantilla, EsquemaPlantilla, Respuestas } from './types';

export interface ContextoPlantilla {
  paciente: { sexo: string | null; edad: number | null };
}

/** Lee una ruta con puntos: `asa_sugerido.clase`. */
export function leerRuta(objeto: unknown, ruta: string): unknown {
  return ruta.split('.').reduce<unknown>((acc, parte) => (acc && typeof acc === 'object' ? (acc as Record<string, unknown>)[parte] : undefined), objeto);
}

/** Misma regla que el backend (EvaluadorPlantilla::visible). */
export function esVisible(campo: CampoPlantilla, respuestas: Respuestas, contexto: ContextoPlantilla | undefined): boolean {
  const condicion = campo.visible_si;
  if (!condicion) return true;
  const valor = condicion.campo.includes('.') ? leerRuta(contexto, condicion.campo) : respuestas[condicion.campo];
  if ('igual' in condicion) return valor === condicion.igual;
  if (condicion.en) return condicion.en.includes(valor);
  return !!valor;
}

const vacio = (v: unknown) => v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0);

/** Campos obligatorios visibles sin diligenciar, por sección. */
export function pendientesPorSeccion(esquema: EsquemaPlantilla, respuestas: Respuestas, contexto?: ContextoPlantilla): Record<string, number> {
  return Object.fromEntries(
    esquema.secciones.map((s) => [
      s.id,
      s.campos.filter((c) => c.tipo !== 'calculado' && c.requerido && esVisible(c, respuestas, contexto) && vacio(respuestas[c.id])).length,
    ]),
  );
}
