/** Días ISO: 1 = lunes … 7 = domingo. */
export const DIAS_SEMANA = [
  { value: 1, corto: 'L', nombre: 'Lunes' },
  { value: 2, corto: 'M', nombre: 'Martes' },
  { value: 3, corto: 'X', nombre: 'Miércoles' },
  { value: 4, corto: 'J', nombre: 'Jueves' },
  { value: 5, corto: 'V', nombre: 'Viernes' },
  { value: 6, corto: 'S', nombre: 'Sábado' },
  { value: 7, corto: 'D', nombre: 'Domingo' },
] as const;

const corto = (dia: number) => DIAS_SEMANA.find((d) => d.value === dia)?.corto ?? '?';

/** [1,2,3,4,5,7] → "L–V, D" (agrupa días consecutivos). */
export function formatearDias(dias: number[]): string {
  const ordenados = [...new Set(dias)].sort((a, b) => a - b);
  const tramos: string[] = [];
  let inicio = ordenados[0];
  for (let i = 0; i < ordenados.length; i++) {
    const actual = ordenados[i]!;
    const siguiente = ordenados[i + 1];
    if (siguiente !== actual + 1) {
      tramos.push(inicio === actual ? corto(actual) : actual - inicio! === 1 ? `${corto(inicio!)}, ${corto(actual)}` : `${corto(inicio!)}–${corto(actual)}`);
      inicio = siguiente;
    }
  }
  return tramos.join(', ');
}
