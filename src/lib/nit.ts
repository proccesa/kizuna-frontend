const PESOS = [3, 7, 13, 17, 19, 23, 29, 37, 41, 43, 47, 53, 59, 67, 71];

/** Dígito de verificación de un NIT (algoritmo de la DIAN, módulo 11). */
export function calcularDigitoVerificacion(nit: string): number | null {
  if (!/^\d{6,15}$/.test(nit)) return null;
  const suma = [...nit].reverse().reduce((acc, digito, i) => acc + Number(digito) * PESOS[i]!, 0);
  const residuo = suma % 11;
  return residuo > 1 ? 11 - residuo : residuo;
}

/** 900481226 → "900.481.226" */
export function formatearNit(nit: string): string {
  return nit.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
