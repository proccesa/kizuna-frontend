/** Nombres de permisos definidos en el backend (PermisoSeeder). */
export const PERMISOS = {
  usuarios: {
    listar: 'usuarios.listar',
    crear: 'usuarios.crear',
    ver: 'usuarios.ver',
    editar: 'usuarios.editar',
    eliminar: 'usuarios.eliminar',
    restaurar: 'usuarios.restaurar',
  },
  operadores: {
    listar: 'operadores.listar',
    crear: 'operadores.crear',
    ver: 'operadores.ver',
    editar: 'operadores.editar',
    eliminar: 'operadores.eliminar',
    restaurar: 'operadores.restaurar',
  },
  roles: {
    listar: 'roles.listar',
  },
  permisos: {
    listar: 'permisos.listar',
  },
  catalogos: {
    listar: 'catalogos.listar',
  },
  prestadores: {
    listar: 'prestadores.listar',
    crear: 'prestadores.crear',
    ver: 'prestadores.ver',
    editar: 'prestadores.editar',
    eliminar: 'prestadores.eliminar',
    restaurar: 'prestadores.restaurar',
  },
  especialidades: {
    listar: 'especialidades.listar',
    crear: 'especialidades.crear',
    ver: 'especialidades.ver',
    editar: 'especialidades.editar',
    eliminar: 'especialidades.eliminar',
    restaurar: 'especialidades.restaurar',
  },
  portafolio: {
    listar: 'portafolio.listar',
    crear: 'portafolio.crear',
    editar: 'portafolio.editar',
    eliminar: 'portafolio.eliminar',
  },
  sedes: {
    listar: 'sedes.listar',
    crear: 'sedes.crear',
    ver: 'sedes.ver',
    editar: 'sedes.editar',
    eliminar: 'sedes.eliminar',
    restaurar: 'sedes.restaurar',
  },
  tiposDocumento: {
    listar: 'tipos_documento.listar',
  },
} as const;
