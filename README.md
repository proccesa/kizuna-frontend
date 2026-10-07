# Kizuna — Frontend

**Kizuna** es la plataforma para que las IPS programen a sus pacientes de forma automatizada, un producto de Proccesa.

| Estado | Módulos |
| :--- | :--- |
| Conectados a la API | Autenticación, usuarios, operadores, roles y permisos, catálogos (DIVIPOLA, regímenes, modalidades de contratación, tipos de documento), prestadores y sedes |
| Diseño con datos de ejemplo (`src/demo/datos.ts`) | Programación, entidades, contratos (PGP, evento, cápita), poblaciones, portafolio CUPS, CUPS y especialidades, especialistas |

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
│   ├── contratacion/    # Entidades, contratos y poblaciones
│   ├── servicios/       # Portafolio CUPS y relación CUPS ↔ especialidades
│   ├── talento/         # Especialistas y cargue masivo
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
