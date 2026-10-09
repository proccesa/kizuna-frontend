# Kizuna — Frontend

**Kizuna** es la plataforma para que las IPS programen a sus pacientes de forma automatizada, un producto de Proccesa.

| Estado | Módulos |
| :--- | :--- |
| Conectados a la API | Inventario (biomédicos, central de insumos e instrumental, salas, requerimientos por CUPS y verificación de disponibilidad), pre-anestesia (órdenes quirúrgicas, agenda, historias clínicas por plantilla, integraciones), autenticación, usuarios, operadores, roles y permisos, catálogos (DIVIPOLA, CUPS, regímenes, modalidades de contratación, tipos de documento), prestadores y sedes, entidades, contratos (PGP, evento, cápita) con sus sedes y CUPS pactados, poblaciones con cargue de pacientes, portafolio CUPS, CUPS y especialidades, especialistas con sus agendas, novedades y cargue masivo |
| Diseño con datos de ejemplo (`src/demo/datos.ts`) | Programación automática (motor) |

Las pantallas de diseño muestran un aviso visible. Para conectarlas, crea `services/` y `hooks/` en cada módulo (como en `usuarios`) y reemplaza las importaciones de `@/demo/datos`.
Consume la API REST de `kizuna-backend` (Laravel + Sanctum).

- **Stack:** React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router 7 · TanStack Query · React Hook Form + Zod · Axios · Sonner · Lucide · Fontsource (Bricolage Grotesque y Figtree)
- **Marca:** ver [docs/MANUAL_DE_MARCA.md](docs/MANUAL_DE_MARCA.md)

## Puesta en marcha

```bash
cp .env.example .env      # ajusta VITE_API_URL si el backend no corre en :8000
npm install
npm run dev
```

El backend debe estar corriendo (`php artisan serve`) y con datos base (`php artisan migrate --seed`).

Para una demostración, `php artisan kizuna:demo` (en el backend) borra los datos operativos y carga una IPS ficticia completa: sedes, contratos, especialistas, inventario y órdenes en todos los estados del flujo. Imprime las cuentas de prueba y un token de integración. No corre en producción. El guion del video está en [docs/GUION-DEMO.md](../kizuna-backend/docs/GUION-DEMO.md).

| Script | Descripción |
| :--- | :--- |
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Verificación de tipos + build de producción |
| `npm run lint` | ESLint |
| `npm run preview` | Sirve el build |

## Variables de entorno

| Variable | Ejemplo | Descripción |
| :--- | :--- | :--- |
| `VITE_API_URL` | `http://localhost:8000/api/v1` | URL base de la API, con el prefijo `/api/v1` |
| `VITE_APP_NAME` | `Kizuna` | Nombre de la aplicación |

## Arquitectura

```
src/
├── app/                 # Composición: providers (App.tsx) y rutas (router.tsx, carga diferida por página)
├── config/              # Variables de entorno tipadas
├── lib/
│   ├── api/             # Cliente Axios, tipos del contrato, errores normalizados, QueryClient
│   ├── forms.ts         # Mapeo de errores 422 del backend a campos del formulario
│   └── ...              # cn, format, storage, toast
├── hooks/               # Hooks transversales (useListParams: filtros en la URL)
├── components/
│   ├── ui/              # Sistema de componentes (Button, Input, Modal, DataTable…)
│   ├── layout/          # AppLayout, Sidebar, Topbar, navegación
│   └── brand/           # Logo y Bubble (globo de diálogo)
├── modules/             # Un módulo por dominio del backend
│   ├── auth/            # Sesión, AuthProvider, guards de ruta, permisos
│   ├── programacion/    # Agenda automática y cola de pacientes por programar
│   ├── red/             # Prestadores y sedes (conectado a la API)
│   ├── cirugia/         # Órdenes quirúrgicas, cita de pre-anestesia automática y reglas
│   ├── historias/       # Historias clínicas: renderizador de plantillas y asistente clínico
│   ├── inventario/      # Biomédicos, central, salas, requerimientos por CUPS y verificador
│   ├── integraciones/   # Sistemas externos y sus tokens
│   ├── contratacion/    # Entidades, contratos y poblaciones
│   ├── servicios/       # Portafolio CUPS y relación CUPS ↔ especialidades
│   ├── talento/         # Especialistas, agendas semanales, novedades y cargue masivo
│   ├── usuarios/        # types · services · hooks · schema · components · pages
│   ├── operadores/
│   ├── roles/
│   ├── catalogos/       # DIVIPOLA, regímenes, modalidades, tipos de documento y selector de ubicación
│   ├── dashboard/
│   └── perfil/
└── styles/index.css     # Tokens de diseño (@theme)
```

Cada módulo sigue la misma estructura:

| Carpeta | Responsabilidad |
| :--- | :--- |
| `types/` | Tipos del dominio, espejo de los modelos del backend |
| `services/` | Llamadas REST (una función por endpoint), sin estado |
| `hooks/` | Queries y mutaciones de TanStack Query (caché, invalidación, toasts) |
| `schema.ts` | Validación Zod de formularios y conversión formulario ↔ payload |
| `components/` | Componentes propios del módulo (modales de formulario) |
| `pages/` | Pantallas enrutadas |

## Integración con la API

- **Contrato:** todas las respuestas tienen `{ exito, mensaje, datos }`; los listados agregan `paginacion` (`src/lib/api/types.ts`).
- **Autenticación:** `POST /auth/login` devuelve un token de Sanctum que se guarda y se envía como `Authorization: Bearer`. Al recargar, la sesión se restaura con `GET /auth/perfil`. Un `401` cierra la sesión automáticamente.
- **Errores:** el cliente normaliza todo a `ApiError` (`status`, `message`, `fieldErrors`). Los `422` se pintan en el campo correspondiente del formulario (incluidos anidados como `operador.documento`).
- **Permisos:** la navegación, las rutas y las acciones se muestran según `permisos` del perfil (`super-admin` tiene acceso total). Ver `src/modules/auth/permisos.ts`.
- **Filtros:** página, búsqueda y estado viven en la URL (`?buscar=…&estado=activos&pagina=2`).

| Método | Endpoint | Uso en el frontend |
| :--- | :--- | :--- |
| `POST` | `/auth/login` | Login |
| `GET` | `/auth/perfil` | Restaurar sesión, Mi perfil |
| `POST` | `/auth/logout` | Cerrar sesión |
| `GET` | `/tipos-documento` | Selects de documento |
| `GET` | `/catalogos/departamentos`, `/catalogos/departamentos/{id}/municipios` | Catálogos, selector departamento → municipio |
| `GET` | `/catalogos/municipios?buscar=&departamento_id=` | Búsqueda de municipios (sin tildes, por nombre o código DANE) |
| `GET` | `/catalogos/regimenes`, `/catalogos/modalidades-contratacion` | Catálogos |
| `GET` | `/catalogos/cups?buscar=&habilitado=`, `/catalogos/cups/{id}` | Catálogo CUPS oficial (SISPRO), búsqueda por código o palabras |
| `GET` | `/inventario/resumen` · `/inventario/verificar?cups_id=&sede_id=&fecha=&hora=` | Alertas del inventario · ¿hay sala, equipos, cajas e insumos para ese CUPS, sede y horario? |
| `GET/POST/PUT/DELETE` | `/inventario/items` · `/inventario/unidades` | Catálogo (EQUIPO, INSTRUMENTAL, INSUMO) · equipos por placa y cajas |
| `POST/PATCH` | `/inventario/unidades/{id}/mantenimientos` · `/inventario/mantenimientos/{id}` | Programar (bloquea el equipo) · terminar o cancelar (recalcula fechas) |
| `GET/POST` | `/inventario/existencias` · `/inventario/movimientos` · `GET /inventario/items/{id}/movimientos` | Insumos por sede y lote · entrada, salida (primero en vencer) o ajuste |
| `GET/PUT` | `/inventario/requerimientos` · `/inventario/requerimientos/{cupsId}` | CUPS del portafolio · lista base o ajuste por sede (`sede_id`) |
| `POST` | `/inventario/importar/{unidades\|existencias}` | Cargue CSV con revisión previa |
| `GET/POST/PUT/DELETE` | `/salas` | Quirófanos y salas de cada sede |
| `POST` | `/integracion/inventario/unidades` · `/integracion/inventario/existencias` | **Token de integración** (`inventario:escribir`). Sincronizar desde el ERP o software de biomédica |
| `GET/POST` | `/ordenes` (filtros: estado, prioridad, buscar) · `GET /ordenes/{id}` | Órdenes quirúrgicas; al crearla se valida la especialidad y se agenda la pre-anestesia |
| `GET` | `/ordenes/resumen` · `/ordenes/paciente?tipo_documento=&numero_documento=` | Conteo por estado · buscar paciente para el registro manual |
| `POST` | `/ordenes/importar` (`archivo`, `simular`) · `/ordenes/asignar-pendientes` | Cargue CSV de órdenes · reintentar cupo a las pendientes |
| `GET/POST` | `/ordenes/{id}/cupos` · `/ordenes/{id}/reprogramar` · `/revalidar` · `/cancelar` | Cupos libres de anestesiología, mover la cita, revalidar una rechazada, cancelar |
| `GET/PUT` | `/ordenes/reglas` | CUPS de la consulta, especialidad, vigencia del aval por ASA, horizonte, duración |
| `GET` | `/citas?fecha=&tipo=PREANESTESIA` · `PATCH /citas/{id}/estado` | Agenda del día · cancelar o registrar inasistencia (la orden vuelve a buscar cupo) |
| `GET` | `/plantillas-hc` | Plantillas de historia clínica y su versión vigente |
| `GET/POST` | `/historias` · `GET/PUT /historias/{id}` | Abrir (desde una cita) · autoguardar borrador (devuelve escalas y alertas) |
| `POST` | `/historias/{id}/finalizar` · `/historias/{id}/anular` | Finalizar (aplica el concepto a la orden) · anular con motivo |
| `GET/POST/PUT/DELETE` | `/clientes-integracion` · `POST …/{id}/regenerar` | Sistemas externos y sus tokens |
| `POST` | `/integracion/ordenes` · `GET /integracion/ordenes/{referencia}` | **Token de integración.** Recibir órdenes (idempotente por referencia) y consultar su estado |
| `POST` | `/integracion/historias/preanestesia` | **Token de integración.** Concepto pre-anestésico hecho en otro sistema |
| `GET/POST` | `/entidades` · `GET/PUT/DELETE /entidades/{id}` · `PATCH …/restaurar` | Entidades (EPS y pagadores) con regímenes, contratos en ejecución y pacientes |
| `GET/POST` | `/contratos` (filtros: entidad_id, modalidad_contratacion_id, regimen_id, estado) | Contratos · crear con `sede_ids` |
| `GET` | `/contratos/resumen` | En ejecución, por vencer, vencidos y valor por modalidad |
| `GET/PUT/DELETE` | `/contratos/{id}` · `PATCH …/restaurar` | Detalle con sedes, poblaciones y CUPS sin portafolio |
| `GET/POST` | `/contratos/{id}/cups` · `PUT/DELETE /contratos/{id}/cups/{cupsId}` | CUPS pactados (cantidad, tarifa, si están en el portafolio y si tienen especialidad) |
| `GET/POST` | `/poblaciones` · `GET/PUT/DELETE /poblaciones/{id}` · `PATCH …/restaurar` | Poblaciones de cada contrato, con cohortes y últimos cargues |
| `GET` | `/poblaciones/resumen` · `/poblaciones/{id}/pacientes` | Pacientes activos y sin cargue del mes · pacientes (buscar, cohorte, incluir_retirados) |
| `POST` | `/poblaciones/{id}/cargar` (`archivo`, `simular`, `modo`) | Cargue CSV de pacientes: REEMPLAZAR (cargue del mes) o AGREGAR |
| `GET/POST` | `/especialidades` · `GET/PUT/DELETE /especialidades/{id}` · `PATCH …/restaurar` | Especialidades |
| `POST/DELETE` | `/especialidades/{id}/cups/{cupsId}` | Asignar o quitar un CUPS a una especialidad |
| `GET/POST` | `/portafolio` · `PUT/DELETE /portafolio/{id}` | Portafolio CUPS por sede (alta masiva, duración, activo) |
| `GET/POST` | `/especialistas` | Listado (filtros: buscar, estado, especialidad_id, sede_id, sin_agenda) · crear |
| `GET` | `/especialistas/resumen` | Activos, horas de agenda por semana, sin agenda, con novedad hoy |
| `GET/PUT/DELETE` | `/especialistas/{id}` · `PATCH …/restaurar` | Detalle con agendas y novedades · editar · eliminar (con sus franjas) · restaurar |
| `POST` | `/especialistas/importar` (`archivo`, `simular`) | Cargue masivo CSV: primero revisión, luego carga |
| `POST` | `/especialistas/{id}/agendas` · `PUT/DELETE /agendas/{id}` | Franjas semanales (sede, especialidad, días, horas, vigencia) |
| `GET` | `/agendas?sede_id=&especialidad_id=` | Agenda semanal de una sede |
| `POST` | `/especialistas/{id}/ausencias` · `DELETE /ausencias/{id}` | Novedades: vacaciones, incapacidades, licencias |
| `GET/POST` | `/prestadores` | Listado con sedes (filtros: buscar, estado, naturaleza) · crear |
| `GET/PUT/DELETE` | `/prestadores/{id}` | Detalle · editar · eliminar (con sus sedes) |
| `PATCH` | `/prestadores/{id}/restaurar` | Restaurar con las sedes eliminadas junto a él |
| `GET/POST` | `/prestadores/{id}/sedes` | Sedes de un prestador · crear sede |
| `GET` | `/sedes` | Sedes de toda la red (para selectores) |
| `GET/PUT/DELETE` | `/sedes/{id}` · `PATCH /sedes/{id}/restaurar` | Detalle · editar · eliminar · restaurar sede |
| `GET` | `/roles`, `/permisos` | Roles y permisos, asignación de roles |
| `GET/POST` | `/usuarios` | Listado con filtros · crear |
| `PUT/DELETE` | `/usuarios/{id}` | Editar · eliminar (soft delete) |
| `PATCH` | `/usuarios/{id}/restaurar`, `/usuarios/{id}/estado` | Restaurar · activar/desactivar |
| `GET/POST` | `/operadores` | Listado con filtros · crear |
| `PUT/DELETE` | `/operadores/{id}` | Editar (también activar/desactivar) · eliminar |
| `PATCH` | `/operadores/{id}/restaurar` | Restaurar |

## Agregar un módulo nuevo

1. Crea `src/modules/<modulo>/` con `types`, `services`, `hooks` y `pages`.
2. Registra la ruta en `src/app/router.tsx` con `page(() => import(...), 'NombrePage')` y, si aplica, un `ProtectedRoute` con su permiso.
3. Agrega el ítem al menú en `src/components/layout/navigation.ts`.
