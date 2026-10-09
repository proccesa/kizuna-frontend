import type { Cups } from '@/modules/catalogos/types';

export interface Especialidad {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  cups_count?: number;
  deleted_at: string | null;
}

export interface EspecialidadPayload {
  nombre: string;
  descripcion?: string | null;
  activo?: boolean;
}

export interface PortafolioItem {
  id: number;
  sede_id: number;
  cups_id: number;
  duracion_minutos: number;
  /** Tipo de sala en que se realiza en esta sede; null = no requiere sala. */
  tipo_sala?: string | null;
  activo: boolean;
  cups: Pick<Cups, 'id' | 'codigo' | 'nombre' | 'seccion' | 'habilitado' | 'es_quirurgico'> & {
    especialidades: { id: number; codigo: string; nombre: string }[];
  };
  sede: {
    id: number;
    prestador_id: number;
    numero_sede: string;
    nombre: string;
    activo: boolean;
    prestador: { id: number; razon_social: string; nombre_comercial: string | null };
  };
}

export interface PortafolioFiltros {
  sede_id?: number;
  prestador_id?: number;
  especialidad_id?: number;
  sin_especialidad?: boolean;
  activo?: boolean;
  buscar?: string;
  pagina?: number;
  por_pagina?: number;
}

export interface AgregarPortafolioPayload {
  sede_ids: number[];
  cups_ids: number[];
  duracion_minutos: number;
}
