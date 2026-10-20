## Context

El tutor y el niño comparten hoy las clases globales `.card`, `.btn`, `.chip` y
`.field`, la regla que pone Fredoka a todo `h1`–`h4`, y una decena de
componentes de `components/dashboard/shared/`. Varios de esos componentes ya
tienen dos trajes por prop —`variant: 'card' | 'map'` en `StatCard`,
`StudentRosterTable` y `ClassroomPodium`, `shape: 'tile' | 'seal'` en
`GroupBadge`—, así que el patrón de vestir un componente según quién lo monta ya
existe en el repo. El fondo del tutor ya es liso (`bg-lavender` en
`TeacherDashboard.tsx`).

Las maquetas de la dirección están fuera del repo, en el scratchpad de la sesión:
`mock-detalle.png` (detalle del salón) y `mock-ficha.png` (panel con la ficha de
un explorador), ambas a 1280 px.

## Goals / Non-Goals

**Goals:**

- Que el tutor se lea como una herramienta de trabajo: jerarquía clara, más
  filas por pantalla y cifras alineadas.
- Que siga siendo CodePlay: la lavanda, el morado, Fredoka en los títulos, el
  leopardo arriba y la insignia de cada salón.
- Que el aislamiento con el niño sea estructural —clases y variantes nuevas— y
  no dependa de que nadie se acuerde de no tocar algo.
- Aplicarlo en tandas revisables, con el sistema común primero.

**Non-Goals:**

- El móvil (paso 25). El escritorio estrecho con la barra plegada sí entra.
- Rehacer la navegación, el contenido o los textos. Sólo se cambia texto cuando
  la forma nueva lo exige (p. ej. una etiqueta en mayúsculas pasa a minúscula).
- Modo oscuro.

## Decisions

### 1. Dirección: CodePlay en voz de adulto

La misma marca, sin el registro de juguete. Se queda lo que identifica a
CodePlay —la lavanda de fondo, el morado de la marca, Fredoka en los títulos, el
leopardo en la barra superior y la insignia ilustrada de cada salón— y se va lo
que la hace infantil: contornos de 3 px en tinta, sombras sólidas de pegatina,
botones con relieve y chips saturados. Densidad y lectura vienen de una segunda
letra para el cuerpo, bordes de 1 px, radios moderados y tablas compactas.

El salón se reconoce por su color como una **pestaña de carpeta**: una banda de
6 px en el borde de su tarjeta y de su cabecera, y de 4 px junto a su nombre en
la barra lateral. Donde hay sitio —la tarjeta del listado y la cabecera del
detalle— la acompaña su insignia ilustrada a 40–48 px. En la barra lateral, sólo
la pestaña. El degradado del tema no aparece en ningún sitio del tutor.

Decisiones del usuario, transmitidas por QA: se quitan de la barra lateral el
avatar grande y la ficha del tutor, que quedan en la barra superior con el avatar
real; la insignia se mantiene sólo donde hay sitio.

### 2. Tokens `tutor-*`

| Token | Hex | Uso |
| --- | --- | --- |
| `tutor-canvas` | `#F4EEFF` | Fondo de página: es `lavender`, el que el tutor ya tiene |
| `tutor-surface` | `#FFFFFF` | Tarjetas, tablas, barras |
| `tutor-sunken` | `#FAF7FF` | Cabecera de tabla, fila al pasar |
| `tutor-rule` | `#E3D9F7` | Reglas y bordes de superficie: es `line` |
| `tutor-rule-strong` | `#CFC6E6` | Borde de botón secundario y separadores fuertes |
| `tutor-control` | `#8F8AA1` | Borde de campo |
| `tutor-ink` | `#1E1A2B` | Texto principal |
| `tutor-ink-soft` | `#565068` | Texto secundario |
| `tutor-ink-faint` | `#6E6982` | Terciario y vacíos |
| `tutor-accent` | `#5620B0` | Acción principal, selección, foco: es `grape-dark` |
| `tutor-accent-hover` | `#47199A` | Acción principal al pasar |
| `tutor-accent-soft` | `#F0E6FF` | Fondo de lo seleccionado: es `grape-soft` |
| `tutor-ok` / `-soft` | `#1D7352` / `#E3F2EB` | Superado, en línea, aceptar |
| `tutor-warn` / `-soft` | `#8A5A00` / `#FBF0D9` | En espera, sin superar |
| `tutor-danger` / `-soft` | `#B02C2C` / `#FBE8E8` | Quitar, eliminar, error |
| `tutor-info` / `-soft` | `#285F9F` / `#E5EDF7` | Avisos neutros, mundo en curso |

Los cuatro que repiten un valor del niño (`canvas`, `rule`, `accent`,
`accent-soft`) llevan nombre propio igualmente: el tutor los referencia por
su papel, y si algún día se separan basta con cambiar el valor aquí. Como manda
el repo, cada token vive en `:root` de `main.css` y en `tailwind.config.js`
bajo `tutor`.

**Contrastes medidos** (WCAG 2.1):

| Par | Ratio |
| --- | --- |
| `ink` / `ink-soft` / `ink-faint` sobre blanco | 16,96 / 7,66 / 5,24 |
| `ink` / `ink-soft` / `ink-faint` sobre `canvas` | 14,96 / 6,75 / 4,62 |
| Blanco sobre `accent`, y `accent` sobre blanco | 9,42 |
| Blanco sobre `accent-hover` | 11,21 |
| `accent` sobre `accent-soft` / sobre `canvas` | 7,84 / 8,31 |
| `ink-soft` sobre `accent-soft` | 6,37 |
| `ok`, `warn`, `danger`, `info` sobre su `-soft` | 5,01 / 5,24 / 5,49 / 5,51 |
| `control` sobre blanco / sobre `canvas` | 3,32 / 2,93 |

Dos reglas salen de la tabla:

- **`ink-faint` nunca sobre `accent-soft`** (4,36): en un elemento activo o
  seleccionado el texto va en `ink-soft` o en el acento.
- **Los campos van siempre sobre superficie blanca**: su borde da 3,32 sobre
  blanco y 2,93 sobre la lavanda, que no llega al 3:1.

El color de la pestaña y del fondo de la insignia sale de `theme.color` y
`theme.colorSoft` de `groupThemes.ts`, por `style`, igual que hoy el degradado:
es dato del tema, no un hex suelto.

### 3. Tipografía en dos voces

- **Fredoka 600**, la voz de la marca, en los títulos: título de página,
  cabeceras de sección y el nombre del salón o del explorador (`h1`–`h3`). Es la
  regla global que ya existe, y no se toca.
- **Atkinson Hyperlegible Next** (400, 500, 600, 700) en todo lo demás: cuerpo,
  tablas, controles, etiquetas y cifras. Está diseñada para la legibilidad
  —distingue 0/O, 1/l/I— y tiene cifras tabulares. **Medido:** con
  `tabular-nums` «111» y «000» miden lo mismo (75,8 px a 40 px), y sin él la
  fuente es proporcional, así que hay que declararlo.

`.tutor-scope` fija la familia, el peso y el tamaño del cuerpo y activa
`tabular-nums`. **Se aplica por pantalla mientras dura la migración**: cada
pantalla se lo pone en su raíz en la tanda que la migra, y al cerrar la tanda 4
(tarea 6.0), con todas migradas, sube al contenedor de `TeacherDashboard` y se quitan los sueltos.
Ponerlo en el contenedor desde la tanda 1 hacía que las pantallas aún sin migrar
heredaran la letra nueva a medias, y ningún commit puede dejar el tutor así. No necesita ganarle a ninguna regla de
encabezado: Fredoka en `h1`–`h3` es justo lo que se quiere. `h4` no lo usa
ninguna pantalla del tutor, así que tampoco hace falta regla para él.

La fuente se carga añadiéndola al `@import` de Google Fonts que ya está en
`main.css`. El navegador sólo descarga los archivos de una fuente cuando algo la
usa, así que el niño no paga la descarga. Se expone como `font-tutor` en
Tailwind.

Escala (cuerpo 15/1,5): título de página Fredoka 26, sección Fredoka 19, nombre
en cabecera Fredoka 20–24; cuerpo 15/400–500, tabla 14,5, rótulo de dato
13,5/500, etiqueta 12,5/600. **Sin mayúsculas sostenidas** en rótulos: las
cabeceras de dato pasan a minúscula inicial.

### 4. Piezas en `@layer components`, con prefijo `tutor-`

`tutor-card`, `tutor-btn` (+ `-primary`, `-secondary`, `-danger`, `-ghost`,
`-ghost-danger`, `-sm`), `tutor-badge` (+ `-ok`, `-warn`, `-danger`, `-info`,
`-mute`; píldora fina con punto de color delante y la palabra siempre),
`tutor-field`, `tutor-seg` (selector segmentado para alcance y orden),
`tutor-table`, `tutor-section-head` y `tutor-stats` (la franja de cifras).

Radios: **12 px** en tarjetas y superficies, **8 px** en controles y botones,
**completo** en etiquetas. Bordes de 1 px. Sin sombras sólidas ni contornos en
tinta; sólo lo que flota (menú de exportar, diálogo) lleva una sombra difusa y
leve. Foco visible: contorno de 2 px en `tutor-accent` con 2 px de separación.

Se descartó redefinir `.card`/`.btn` dentro de `.tutor-scope`: obligaría a pelear
especificidad con cada variante (`.btn-grape`, `.btn-sm`, `:active`) y cualquier
componente compartido montado dentro heredaría a medias. Clases nuevas, y cada
componente elige las suyas.

### 5. Componentes compartidos: una variante `tutor` más

Los que ya tienen `variant` (`StatCard`, `StudentRosterTable`,
`ClassroomPodium`) ganan el valor `'tutor'`; `GroupBadge` gana la forma
`'plain'`: fondo `theme.colorSoft`, radio 10 px, sin contorno ni sombra, con la
misma ilustración. Los que no tienen variante (`ConfirmDialog`,
`StoreErrorNotice`, `RosterFilterBar`/`FilterSelect`, `ChangeNamePanel`,
`ChangePasswordPanel`, `DeleteAccountPanel`, `SidebarToggle`) ganan
`variant?: 'default' | 'tutor'`. El valor por defecto deja el JSX y las clases
**idénticos** a hoy, y el niño no pasa la prop, así que no cambia. El tutor la
pasa siempre.

Se descartó un contexto de React («estoy en el tutor»): es invisible en el punto
de uso y un componente del niño montado por error dentro del tutor cambiaría
solo. La prop es explícita y la busca un `grep`.

`StatCard` en el tutor no es una tarjeta por cifra sino una celda de la franja
`tutor-stats`; la variante pinta la celda y el módulo pone la franja. El podio,
en el tutor, es una lista corta de los tres con más XP, con su puesto en
palabras, sin sellos ni pedestales.

Los iconos son los de `TeacherIcons.tsx`, adaptados a trazo fino y
`currentColor`. Los avatares son los reales: `TUTOR_AVATAR` y los leopardos de
`pickMascotAvatar`.

### 6. Barra superior y barra lateral

Barra superior de 56 px: el `BrandLogo` del leopardo a 34 px con «CodePlay» en
Fredoka, como en el resto de la web, y «Tutor» como rótulo al lado (sustituye el
chip «Panel de Tutor»); los dos enlaces de siempre como pestañas de texto; a la
derecha, `TUTOR_AVATAR` y el nombre, que llevan a Ajustes.

**Tanda 5 (decidido por el usuario tras verlo en su pantalla de 1916 px):** la
barra superior pasa a **`grape-dark` liso con texto blanco** —el aro blanco
del logo, «Tutor» al 80 %, el enlace activo en blanco al 15 % y el hover al 10 %,
sin degradado—, y el **foco visible va en blanco** porque el contorno morado no
se ve sobre el morado. Contrastes medidos: blanco sobre la barra 9,42:1; sobre el
activo, 6,65:1; sobre el hover, 7,51:1; «Tutor» al 80 %, 6,52:1. Y el contenido
de cada pantalla va **centrado en el `<main>`** (`mx-auto`): sin él, en una
pantalla ancha quedaba pegado a la izquierda y al plegar la barra saltaba entero.

Barra lateral de 240 px desplegada y 64 px plegada: elementos de 36 px, el
activo con fondo `tutor-accent-soft` y texto en el acento. Los salones cuelgan de
«Salón de clases» con su pestaña de color, nombre y recuento. Plegada, cada salón
es su pestaña con la inicial del nombre, conservando `aria-label` y `title`, y el
recuento de pendientes queda en una píldora sobre el icono. Sin avatar ni ficha
del tutor.

### 7. Detalles de lectura

- **La tira de pasos** conserva «×» y «?», pero cada partida lleva `title` y
  `aria-label` con la frase entera («No superada · 4 pasos», «Superada · 7
  pasos», «No superada · pasos sin contar»), y la cabecera de la columna, una
  leyenda breve: «× no llegó a la meta».
- **«Eliminar salón»** sale del grupo de acciones: va al extremo de la cabecera,
  tras un separador y como botón fantasma de peligro, para que no se pulse por
  inercia junto a «Sumar alumnos».

### 8. Orden de aplicación

Cuatro tandas, cada una revisable, con lint, tests y build en verde y una pasada
con teclado (foco visible en todo lo interactivo):

1. Sistema común (tokens, fuente, piezas) y el armazón (`TeacherDashboard`,
   barra superior, barra lateral, `SidebarToggle`).
2. «Mis salones», crear salón y el detalle del salón con sus compartidos.
3. Panel de información y ficha del explorador.
4. Ajustes y los tres paneles compartidos de cuenta.

## Risks / Trade-offs

- [Una variante nueva olvida una rama y el niño cambia] → la rama por defecto no
  se reescribe, sólo se añade la del tutor; y cada tanda que toca un compartido
  se comprueba con captura de la pantalla del niño que lo monta.
- [Los tests buscan clases o textos que cambian] → `TeacherPanelModule.test.tsx`
  consulta por rol y texto; si alguna aserción depende de una clase, se cambia la
  consulta a una equivalente, nunca se afloja lo que comprueba.
- [Dos familias tipográficas en una misma pantalla] → son claramente distintas
  en función —redondeada para nombrar, hiperlegible para leer datos— y Fredoka
  queda limitada a títulos; nunca en tablas ni controles.
- [Atkinson Hyperlegible Next tacha el cero] → es un rasgo de legibilidad, no un
  defecto; se acepta.
- [Más tokens en dos archivos] → es la duplicación deliberada del repo; se
  añaden en un bloque comentado en cada uno.

## Migration Plan

Sin datos ni migraciones. Se despliega con el front; revertir es revertir los
commits. Tras tocar `tailwind.config.js` se reinicia el dev.
