export interface TipoDocumento {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Departamento {
  id: number;
  codigo: string;
  nombre: string;
  municipios_count?: number;
}

export interface Municipio {
  id: number;
  departamento_id: number;
  codigo: string;
  nombre: string;
  tipo: 'Municipio' | 'Isla' | 'Área no municipalizada';
  latitud: number | null;
  longitud: number | null;
  activo: boolean;
  departamento?: Pick<Departamento, 'id' | 'codigo' | 'nombre'>;
}

/** Catálogos simples con código: regímenes y modalidades de contratación. */
export interface CatalogoSimple {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface MunicipiosFiltros {
  buscar?: string;
  departamento_id?: number;
  pagina?: number;
  por_pagina?: number;
}

/** Procedimiento del catálogo oficial CUPS (MinSalud). */
export interface Cups {
  id: number;
  codigo: string;
  nombre: string;
  seccion: string | null;
  habilitado: boolean;
  uso_codigo: string | null;
  es_quirurgico: boolean;
  sexo: string | null;
  ambito: string | null;
  cobertura: string | null;
  actualizado_minsalud: string | null;
  especialidades?: { id: number; codigo: string; nombre: string }[];
}

export interface CupsFiltros {
  buscar?: string;
  /** '1' (por defecto), '0' o 'todos'. */
  habilitado?: '1' | '0' | 'todos';
  pagina?: number;
  por_pagina?: number;
}
