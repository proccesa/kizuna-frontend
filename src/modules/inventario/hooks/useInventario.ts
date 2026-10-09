import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getErrorMessage } from '@/lib/api/errors';
import type { ListParams } from '@/lib/api/types';
import { notify } from '@/lib/toast';
import { inventarioService } from '../services/inventarioService';
import type { ExistenciasFiltros, ItemPayload, ItemsFiltros, Mantenimiento, Sala, UnidadesFiltros, UnidadPayload } from '../types';

export const inventarioKeys = {
  all: ['inventario'] as const,
  resumen: ['inventario', 'resumen'] as const,
  items: (f: ItemsFiltros) => ['inventario', 'items', f] as const,
  unidades: (f: UnidadesFiltros) => ['inventario', 'unidades', f] as const,
  unidad: (id: number) => ['inventario', 'unidad', id] as const,
  existencias: (f: ExistenciasFiltros) => ['inventario', 'existencias', f] as const,
  movimientos: (id: number, sede?: number) => ['inventario', 'movimientos', id, sede] as const,
  cups: (f: object) => ['inventario', 'cups', f] as const,
  requerimientos: (id: number) => ['inventario', 'requerimientos', id] as const,
  salas: (f: object) => ['inventario', 'salas', f] as const,
};

export const useResumenInventario = (enabled = true) => useQuery({ queryKey: inventarioKeys.resumen, queryFn: inventarioService.resumen, enabled });
export const useItems = (f: ItemsFiltros, enabled = true) =>
  useQuery({ queryKey: inventarioKeys.items(f), queryFn: () => inventarioService.items(f), placeholderData: keepPreviousData, enabled });
export const useUnidades = (f: UnidadesFiltros) => useQuery({ queryKey: inventarioKeys.unidades(f), queryFn: () => inventarioService.unidades(f), placeholderData: keepPreviousData });
export const useUnidad = (id: number | null) => useQuery({ queryKey: inventarioKeys.unidad(id ?? 0), queryFn: () => inventarioService.unidad(id!), enabled: id !== null });
export const useExistencias = (f: ExistenciasFiltros) =>
  useQuery({ queryKey: inventarioKeys.existencias(f), queryFn: () => inventarioService.existencias(f), placeholderData: keepPreviousData });
export const useMovimientos = (id: number | null, sede?: number) =>
  useQuery({ queryKey: inventarioKeys.movimientos(id ?? 0, sede), queryFn: () => inventarioService.movimientos(id!, sede), enabled: id !== null });
export const useCupsRequerimientos = (f: ListParams & { sin_requerimientos?: boolean }) =>
  useQuery({ queryKey: inventarioKeys.cups(f), queryFn: () => inventarioService.cupsRequerimientos(f), placeholderData: keepPreviousData });
export const useRequerimientos = (id: number | null) =>
  useQuery({ queryKey: inventarioKeys.requerimientos(id ?? 0), queryFn: () => inventarioService.requerimientos(id!), enabled: id !== null });
export const useSalas = (f: { sede_id?: number; tipo?: string } = {}, enabled = true) =>
  useQuery({ queryKey: inventarioKeys.salas(f), queryFn: () => inventarioService.salas(f), enabled });

export function useInventarioMutations() {
  const queryClient = useQueryClient();
  const invalidar = () => queryClient.invalidateQueries({ queryKey: inventarioKeys.all });
  const onSuccess = (r: { mensaje: string }) => {
    notify.success(r.mensaje);
    invalidar();
  };
  const onError = (e: unknown) => notify.error(getErrorMessage(e));

  return {
    guardarItem: useMutation({ mutationFn: ({ id, payload }: { id: number | null; payload: Partial<ItemPayload> }) => inventarioService.guardarItem(id, payload), onSuccess }),
    eliminarItem: useMutation({ mutationFn: inventarioService.eliminarItem, onSuccess, onError }),
    guardarUnidad: useMutation({ mutationFn: ({ id, payload }: { id: number | null; payload: UnidadPayload }) => inventarioService.guardarUnidad(id, payload), onSuccess }),
    eliminarUnidad: useMutation({ mutationFn: inventarioService.eliminarUnidad, onSuccess, onError }),
    programarMantenimiento: useMutation({
      mutationFn: ({ unidadId, payload }: { unidadId: number; payload: Pick<Mantenimiento, 'tipo' | 'inicio' | 'fin' | 'responsable' | 'observaciones'> }) =>
        inventarioService.programarMantenimiento(unidadId, payload),
      onSuccess,
    }),
    cerrarMantenimiento: useMutation({ mutationFn: ({ id, estado }: { id: number; estado: 'TERMINADO' | 'CANCELADO' }) => inventarioService.cerrarMantenimiento(id, estado), onSuccess, onError }),
    registrarMovimiento: useMutation({ mutationFn: inventarioService.registrarMovimiento, onSuccess }),
    importar: useMutation({
      mutationFn: ({ tipo, archivo, simular }: { tipo: 'unidades' | 'existencias'; archivo: File; simular: boolean }) => inventarioService.importar(tipo, archivo, simular),
      onSuccess: (r) => {
        if (!r.datos.simulado) onSuccess(r);
      },
    }),
    guardarRequerimientos: useMutation({
      mutationFn: ({ cupsId, sedeId, items }: { cupsId: number; sedeId: number | null; items: { item_id: number; cantidad: number; notas?: string | null }[] }) =>
        inventarioService.guardarRequerimientos(cupsId, sedeId, items),
      onSuccess,
      onError,
    }),
    guardarSala: useMutation({
      mutationFn: ({ id, payload }: { id: number | null; payload: Partial<Pick<Sala, 'sede_id' | 'codigo' | 'nombre' | 'tipo' | 'observaciones' | 'activo'>> }) => inventarioService.guardarSala(id, payload),
      onSuccess,
    }),
    eliminarSala: useMutation({ mutationFn: inventarioService.eliminarSala, onSuccess, onError }),
  };
}
