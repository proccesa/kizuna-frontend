/** Descarga un CSV separado por punto y coma (lo que Excel en español abre en columnas). */
export function descargarCsv(nombre: string, filas: string[][]) {
  const csv = filas.map((fila) => fila.map((v) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(';')).join('\r\n');
  const url = URL.createObjectURL(new Blob(['﻿', csv], { type: 'text/csv;charset=utf-8' }));
  const a = Object.assign(document.createElement('a'), { href: url, download: nombre });
  a.click();
  URL.revokeObjectURL(url);
}
