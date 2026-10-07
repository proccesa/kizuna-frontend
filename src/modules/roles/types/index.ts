export interface Permiso {
  id: number;
  name: string;
  guard_name: string;
}

export interface Rol {
  id: number;
  name: string;
  guard_name: string;
  permissions?: Permiso[];
}

/** Permisos agrupados por módulo: { usuarios: [...], operadores: [...] } */
export type PermisosAgrupados = Record<string, Permiso[]>;
