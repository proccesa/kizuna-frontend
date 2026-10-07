# Manual de Marca — Kizuna
> *Cada paciente, en su cita.*
> **Versión 3.0** — un producto de Proccesa

---

## 1. Esencia

**Kizuna** es la plataforma con la que las IPS programan a sus pacientes de forma automatizada. La IPS configura su red (prestadores y sedes), su contratación (entidades, contratos PGP, evento o cápita, y las poblaciones de pacientes de cada contrato), sus servicios (portafolio CUPS y la especialidad que atiende cada uno) y su talento humano (especialistas y sus agendas). Con eso, Kizuna asigna a cada paciente la cita que le corresponde: con el especialista, la sede y el momento correctos.

*Kizuna* (絆) significa **vínculo** en japonés: el compromiso entre la IPS y cada paciente que tiene a su cargo.

### Personalidad
- **Cercana, no informal.** Habla como una persona que sabe lo que hace.
- **Seria, no fría.** Es software para operaciones de salud; transmite confianza y precisión.
- **Cálida y comercial.** Colores de papel y tinta, no de pantalla de neón.

### Qué evitamos
Degradados, brillos difuminados, tramas de puntos, fondos azul noche, textos en mayúsculas espaciadas y ilustraciones "tecnológicas". Son los recursos por defecto de demasiados productos y hacen que Kizuna se vea genérico.

---

## 2. Logotipo

### Isotipo «Encuentro»
Dos círculos que coinciden: el **petróleo** es la IPS y la **menta** es el paciente. Donde se superponen aparece la **lima**: la cita, el momento en que ambos se encuentran.

| Archivo (`public/brand/`) | Uso |
| :--- | :--- |
| `kizuna-logo.svg` | Logotipo principal sobre fondos claros |
| `kizuna-logo-light.svg` | Logotipo sobre fondos oscuros (petróleo) |
| `kizuna-isotipo.svg` | Favicon, avatares, sellos pequeños |
| `kizuna-isotipo-light.svg` | Isotipo sobre fondos oscuros |
| `kizuna-app-icon.svg` / `kizuna-app-icon-dark.svg` | Ícono de app (squircle 25%) claro y oscuro |

El wordmark `kizuna` está en **Bricolage Grotesque ExtraBold**, siempre en minúsculas y convertido a contornos: los archivos se ven idénticos en cualquier equipo. En la app se usa el componente `<Logo />` (`src/components/brand/Logo.tsx`).

### Reglas
- **Área libre:** alrededor del logotipo, al menos el radio de un círculo del isotipo.
- **Tamaño mínimo:** isotipo 16 px; logotipo 96 px de ancho.
- **No hacer:** cambiar los colores de los círculos, separarlos o invertir su orden, deformar el isotipo, añadir sombras o contornos, ni usar el logotipo petróleo sobre fondos oscuros.
- **Firma de respaldo:** «Un producto de Proccesa», en texto pequeño y gris. Nunca al lado del logotipo como si fueran una sola marca.

---

## 3. Color

Tokens definidos en `src/styles/index.css` (`@theme`) y disponibles como clases de Tailwind (`bg-petrol`, `text-mint-ink`…).

### Paleta principal: petróleo y menta
| Nombre | HEX | Token | Uso |
| :--- | :--- | :--- | :--- |
| Petróleo | `#0F4C4F` | `petrol` | Color principal: botones, títulos, superficies destacadas, el lado IPS del isotipo |
| Menta | `#5CC8A8` | `mint` | Acento de marca (poco uso): menú activo, botón de entrar, "Ejecutar ahora" |
| Lima | `#E9F7A6` | `lime` | La intersección del isotipo, destacados ("Tú", avisos de diseño) |
| Bruma | `#E1EEEE` | `mist` | Tinte petróleo suave: selección, roles, citas programadas por Kizuna |
| Papel | `#F4F2EC` | `paper` | Login y espacios de marca |
| Blanco cálido | `#F7F6F2` | `cream` | Lienzo de las pantallas de trabajo |

### Apoyo
| Token | HEX | Uso |
| :--- | :--- | :--- |
| `surface` | `#FFFFFF` | Tarjetas, paneles |
| `sand` | `#EEEDE7` | Hover, superficies secundarias |
| `line` / `line-strong` | `#E3E1DA` / `#D1CEC4` | Bordes |
| `ink` / `body` / `muted` / `subtle` | `#13292B` / `#3C4E50` / `#65777A` / `#9AA7A8` | Jerarquía de texto |
| `mint-ink` | `#1D7660` | Menta para texto, íconos y foco (contraste AA) |
| `lime-ink` · `mist-ink` | `#55650F` · `#1E5658` | Texto sobre lima y bruma |
| `success` | `#2A7D3F` | Confirmada, activo |
| `warning` | `#B45309` | Pendiente, por vencer, ocupación alta (avisos) |
| `danger` | `#CF2B2B` | Bloqueada, errores (bloqueos) |

### Reglas de uso
- **La menta es marca, nunca estado.** El verde de "Confirmada" (`success`) es un verde hoja distinto y siempre va con ícono; si la menta también marcara estados, se confundirían.
- **Bloqueos en rojo, avisos en ámbar.** Un bloqueo impide programar pacientes (CUPS sin especialidad, población sin cargar); un aviso pide revisión (contrato por vencer, agenda casi llena). Ambos van siempre con ícono.
- Un solo botón menta por pantalla, como máximo.
- Sobre la menta va texto **petróleo**, nunca blanco (el blanco no tiene contraste suficiente). Para texto o íconos en menta sobre fondo claro usa `mint-ink`.
- `subtle` es para placeholders e íconos, nunca para texto de lectura.
- Sin degradados: todo color es sólido.

---

## 4. Tipografía

Ambas familias se sirven desde el proyecto (`@fontsource-variable`), sin depender de Google Fonts.

| Uso | Familia | Peso |
| :--- | :--- | :--- |
| Títulos, cifras grandes, wordmark | **Bricolage Grotesque** | Bold 700 / ExtraBold 800 |
| Interfaz y texto | **Figtree** | Regular 400 · Medium 500 · SemiBold 600 |

- Títulos en tipo oración ("Roles y permisos"), nunca en mayúsculas.
- Cifras con `tabular-nums` (clase `tabular`) para que no bailen al cambiar.

---

## 5. Lenguaje visual

### La esquina recta
La forma base de Kizuna es un bloque de esquinas amplias con **una esquina recta**, heredada del isotipo. Aparece en:
- **Avatares** (`Avatar`): esquina inferior izquierda recta.
- **Citas:** las tarjetas de la agenda tienen una esquina recta, como el isotipo.
- **Globos** (`Bubble`): estado 404 y el diagrama del vínculo cuenta ↔ operador.
- **Estados vacíos:** una conversación que todavía no empieza.

### Superficies
- Planas: borde cálido de 1 px y, como máximo, una sombra muy suave.
- Radios: 12 px en controles, 18 px en tarjetas, 24 px en paneles y modales.
- Movimiento corto (150–400 ms) y con sentido: aparecer, deslizar, confirmar.

### Componentes (`src/components/ui`)
`Button` (primary petróleo, mint para momentos de marca, secondary, ghost, danger) · `StatusPill` (estados de cita) · `ModalidadBadge` · `Input`, `Select`, `Textarea`, `Checkbox`, `Switch`, `Field` · `Card` · `Badge` y `StatusBadge` · `Avatar` · `Modal`, `ConfirmDialog`, `Drawer` · `FilterTabs`, `SearchInput`, `Pagination` · `EmptyState`, `Skeleton`, `Spinner`, `Kbd`, `Vinculo`.

---

### Estados de cita
Un único lenguaje de estados (`StatusPill`, `src/components/ui/estados.ts`), igual en agenda, tablas y alertas. El color siempre va con ícono y texto.

| Estado | Color | Significado |
| :--- | :--- | :--- |
| Confirmada | Verde | El paciente confirmó la cita |
| Programada | Bruma (petróleo suave) | Cita asignada, pendiente de confirmar |
| Pendiente | Ámbar | Paciente por programar |
| Bloqueada | Rojo | No se puede programar hasta resolver la configuración |
| Cancelada | Gris | Cita cancelada |

El origen se indica aparte: el ícono de robot en bruma significa "programada por Kizuna".

### Lenguaje del dominio
| Elemento | Representación |
| :--- | :--- |
| Modalidad PGP · Evento · Cápita | Etiqueta petróleo · lima · bruma (`ModalidadBadge`) |
| Cita programada por Kizuna | Ícono de robot en bruma |
| Bloqueo de programación | Rojo con ícono de prohibido |
| Aviso | Ámbar con ícono de alerta |
| Códigos CUPS, NIT, documentos | Cifras tabulares, CUPS en Bricolage |

## 6. Voz

- Tuteo, frases cortas, verbos primero: "Programar", "Cargar población", "Agregar CUPS".
- Términos del sector sin traducir: IPS, EPS, CUPS, PGP, régimen contributivo y subsidiado.
- Los errores dicen qué pasó y cómo seguir.
- Los estados vacíos invitan: "Crea la primera cuenta para que tu equipo empiece a trabajar."
- Sin "por favor", sin "exitosamente", sin signos de exclamación en la interfaz.

---
*Kizuna · un producto de Proccesa © 2026.*
