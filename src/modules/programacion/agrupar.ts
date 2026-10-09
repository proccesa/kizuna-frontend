import type { Cirugia } from './types';

/** Agrupa por día y por sala para mostrar el programa como lo lee el jefe de cirugía. */
export function agruparPorDiaYSala(cirugias: Cirugia[]) {
  const dias = new Map<string, Map<string, Cirugia[]>>();
  for (const c of cirugias) {
    const sala = c.sala ? `${c.sede.nombre} · ${c.sala.nombre}` : `${c.sede.nombre} · sin sala`;
    const dia = dias.get(c.fecha) ?? new Map<string, Cirugia[]>();
    dia.set(sala, [...(dia.get(sala) ?? []), c]);
    dias.set(c.fecha, dia);
  }
  return [...dias.entries()].map(([fecha, salas]) => ({ fecha, salas: [...salas.entries()] }));
}
