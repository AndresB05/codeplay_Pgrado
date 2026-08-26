# CodePlay — Contexto y especificaciones

> **Fuente de verdad del estado del proyecto.** Este archivo se mantiene
> sincronizado entre sesiones de Claude Code y OpenSpec.
> Última verificación contra el código: **26 de agosto de 2026**.

---

## 0. Cómo usar este documento

### 0.1 Relación con los demás documentos

| Documento | Qué contiene | Cuándo leerlo |
| --- | --- | --- |
| [`CLAUDE.md`](../CLAUDE.md) | Punteros y reglas mínimas. Claude Code lo carga solo al empezar cada sesión | Automático — mantenerlo delgado |
| **`docs/CONTEXT.md`** (este) | Qué está aplicado, qué falta, con qué prioridad y bajo qué convenciones | Siempre, al empezar una sesión |
| [`docs/ESTADO-DEL-PROYECTO.md`](ESTADO-DEL-PROYECTO.md) | **Guía de estilos completa** (paleta, tipografía, componentes, espaciado) y los flujos de usuario en detalle | Al tocar UI o al implementar un flujo de salones |
| [`README.md`](../README.md) | Puesta en marcha, comandos y convenciones de integración de Unity | Al configurar el entorno |
| [`supabase/README.md`](../supabase/README.md) | Detalle migración por migración del esquema SQL | Al tocar la base de datos |
| [`openspec/config.yaml`](../openspec/config.yaml) | Versión resumida de §1 que OpenSpec inyecta a la IA al crear artefactos | Al cambiar stack, convenciones o prioridades — **hay que actualizarlo a la vez que este documento** |

`ESTADO-DEL-PROYECTO.md` **no se elimina ni se reemplaza**: sigue siendo la
referencia larga de diseño visual y de flujos. Este documento es la capa de
especificaciones y prioridades. Cuando ambos se contradigan, **manda este**, que
es el verificado más recientemente — las discrepancias detectadas están anotadas
en §5.

### 0.2 Mapeo a OpenSpec

OpenSpec **ya está inicializado**, versión **1.10.0**, esquema `spec-driven`
(artefactos: proposal → specs → design → tasks).

`openspec init` no crea ningún `project.md` ni `AGENTS.md`. Lo que dejó es:

| Ruta | Qué es |
| --- | --- |
| `openspec/config.yaml` | Configuración y **contexto del proyecto**, que OpenSpec inyecta a la IA al crear artefactos |
| `.claude/commands/opsx/` | Comandos `/opsx:propose`, `apply`, `archive`, `explore`, `sync`, `update` |
| `.claude/skills/openspec-*/` | Las skills que ejecutan esos comandos |

#### Cómo se reparte este documento

| Sección | Destino en OpenSpec | Estado |
| --- | --- | --- |
| §1 Contexto general | Clave `context:` de `openspec/config.yaml` (versión resumida) | ✅ **Integrado** |
| §1.4 Convenciones | Claves `rules:` y `operations:` de `config.yaml` | ✅ **Integrado** |
| §2 Especificaciones aplicadas | `openspec/specs/<capability>/spec.md` — 7 capacidades, 40 requisitos | ✅ **Sembrado** |
| §3 Especificaciones por aplicar | `openspec/changes/<id>/` vía `/opsx:propose` | ⛔ Pendiente |

A partir de aquí, **`openspec/specs/` es la verdad sobre el comportamiento** y §2
queda como su lectura en prosa. Si ambos se contradicen, manda el spec.

Los identificadores de capacidad de §2 (`sistema-visual`, `auth-sesion`,
`salones-tutor`, …) y los de §3 (`backend-supabase-real`, `auth-real`, …) están
elegidos para usarse tal cual como `<capability-path>` en OpenSpec.

#### Formato que exige la versión 1.10.0

Los **specs principales** (`openspec/specs/<capability>/spec.md`) nunca llevan
encabezados de operación; todos sus requisitos van bajo un único `## Requirements`:

```markdown
# <capability> Specification

## Purpose
Para qué existe esta capacidad.

## Requirements

### Requirement: Nombre del requisito
El sistema SHALL hacer algo concreto.

#### Scenario: Caso básico
- **WHEN** ocurre una condición
- **THEN** el sistema responde así
```

Los **deltas** (dentro de `openspec/changes/<id>/specs/<capability>/spec.md`) sí
usan `## ADDED Requirements`, `## MODIFIED Requirements`, `## REMOVED Requirements`
y `## RENAMED Requirements`. Un cambio sin deltas (refactor puro, tooling, docs)
necesita `skip_specs: true` en su `.openspec.yaml` o `openspec validate` lo rechaza.

**Convención de idioma acordada:** los identificadores de OpenSpec van en inglés
—`### Requirement:`, `#### Scenario:`, y las palabras clave SHALL, WHEN, THEN—
porque son parte del formato que la herramienta valida. El texto de requisitos y
escenarios va en español, como el resto de la documentación. Esta regla está
escrita en `config.yaml` bajo `rules.specs`.

#### Comprobaciones útiles

```bash
npx openspec doctor
```

| Comando | Para qué |
| --- | --- |
| `npx openspec doctor` | Verifica la raíz y que `config.yaml` parsea |
| `npx openspec list --specs` | Lista las capacidades registradas |
| `npx openspec validate --specs` | Valida los specs principales |
| `npx openspec view` | Panel interactivo de specs y cambios |

### 0.3 Reglas de mantenimiento

1. Al terminar un cambio, actualiza este documento según lo que el cambio sea:
   - **Afecta a una capacidad del producto** → **mueve la entrada de §3 a §2**
     con la ruta real de los archivos.
   - **Herramienta, documentación o limpieza** → **no toca §2 ni §3**. Esas dos
     secciones son el mapa de las prioridades P1-P6 y un cambio de herramienta
     no sale de ahí; meterlo inventa una capacidad que no existe. Propaga lo
     que corresponda a §1 (stack, estructura o convenciones) y aplica la regla
     4. La infraestructura de tests de Vitest es el ejemplo: vive en §1.2, §1.3
     y §5, y en ningún punto de §2.
2. No des nada por hecho: si algo no se ha verificado ejecutando el código,
   márcalo como no verificado en vez de suponerlo.
3. Actualiza la fecha de «Última verificación» sólo cuando se hayan vuelto a
   correr `npm run build` y `npm run lint`.
4. Si cambias §1 —stack, estructura, convenciones o prioridades—, **replica el
   cambio en `openspec/config.yaml`**. Es el único punto de duplicación
   deliberada del proyecto: aquí vive la versión larga para personas, allí la
   resumida que consume OpenSpec. Comprueba con `npx openspec doctor` que el
   YAML sigue parseando.

---

## 1. Contexto general del proyecto

### 1.1 Qué es

CodePlay es una plataforma web para enseñar pensamiento computacional a niños.
Es un **proyecto de grado**. Consta de tres piezas: un front-end en React, un
backend en Supabase y un juego de Unity que se embeberá como build de WebGL.

**Punto de partida imprescindible:** hoy la aplicación funciona **sin backend
conectado**. No hay login real. Todo el estado de salones vive en `localStorage`.
Las pantallas son reales y navegables; los datos, no.

### 1.2 Stack

Entorno de referencia: **Node.js 22.17.1**, **npm 10.9.2** (`engines` exige `>=18.18`).

| Capa | Herramienta | Versión |
| --- | --- | --- |
| Interfaz | `react` / `react-dom` | 18.3.1 |
| Enrutado | `react-router-dom` | 6.30.6 |
| Tipado | `typescript` | 5.9.3 (modo estricto) |
| Build | `vite` + `@vitejs/plugin-react` | 5.4.21 / 4.7.0 |
| Estilos | `tailwindcss` + `postcss` + `autoprefixer` | 3.4.19 |
| Backend | `@supabase/supabase-js` | 2.112.3 |
| Validación | `zod` | 3.25.76 |
| Calidad | `eslint` 8.57.1 (config heredada) + `prettier` 3.9.6 | — |
| Tests | `vitest` + `jsdom` + `@testing-library/react` | 3.2.7 / 30.0.1 / 16.3.2 |
| CI | GitHub Actions (`ubuntu-latest`) | Node fijado a 22.17.1 |

Monorepo con **npm workspaces**, un solo `node_modules` compartido en la raíz.
Sin Turborepo ni Nx: se descartaron por sobredimensionados para dos apps.

`lint`, `test:run` y `build` se ejecutan además en CI en cada push a `main` y
en cada pull request contra `main`. El workflow fija Node 22.17.1 en vez de
heredar la del runner, e instala con `npm ci` para que el `package-lock.json`
mande. Al build se le pasan los valores de relleno de `apps/web/.env.example`:
`.env` no está en el repositorio y sin esas variables el bundle se genera con
`undefined` y revienta al abrirlo.

### 1.3 Estructura de carpetas

```
codeplayPGrado/
├── apps/
│   ├── web/                  Front-end (@codeplay/web)
│   └── game/                 Proyecto de Unity — NO EXISTE TODAVÍA
├── packages/                 Código compartido — vacío (.gitkeep)
├── supabase/
│   ├── migrations/           9 migraciones SQL
│   └── seed.sql              Mundos y niveles iniciales
├── docs/                     CONTEXT.md (este) + ESTADO-DEL-PROYECTO.md
├── .github/workflows/ci.yml  CI: lint, tests y build en push y pull request
├── .claude/launch.json       Config del preview: npm run dev, puerto 5173
├── package.json              Raíz del monorepo (workspaces + scripts proxy)
├── .eslintrc.cjs             ESLint compartido
├── .prettierrc               Prettier compartido
└── .gitattributes            Fin de línea + reglas de Unity (LFS comentado)
```

#### Dentro de `apps/web/src`

| Carpeta | Contenido |
| --- | --- |
| `components/dashboard/teacher/` | Panel del tutor (11 archivos) y `classroomsData.ts` (semilla + funciones puras) |
| `components/dashboard/student/` | Módulos del alumno: salón, buscador, mundos, niveles, trofeos, ajustes |
| `components/dashboard/shared/` | Componentes de ambos roles (`ConfirmDialog`, `StatCard`, `StudentRosterTable`, `GroupBadge`) y `groupThemes.ts` |
| `components/decor/` | `JungleDecor.tsx`: SVG decorativos del tema selva |
| `components/home/` | Navbar, secciones de la landing y `shared.tsx` (contenedores y huecos de mascota) |
| `components/auth/`, `components/ui/` | Formularios de acceso y primitivas antiguas |
| `context/` | `AuthProvider` (Supabase), `ClassroomsProvider` (store local), helpers de rol y de invitado |
| `hooks/` | `useAuth`, `useClassrooms`, `useActiveRole` + hooks de datos (`useWorlds`, `useProgress`, `useAchievements`, `useLeaderboard`, `useProfile`) |
| `services/` | 7 servicios de Supabase, todos con la forma `{ data, error }` |
| `types/` | `classroom.types.ts` es el modelo vivo; `database.types.ts` se **genera** con la CLI (§4.1) |
| `router/` | `AppRouter` + guardas `PrivateRoute` / `PublicRoute` |
| `pages/` | Un componente por pantalla de nivel superior |
| `constants/`, `config/`, `lib/`, `errors/` | Rutas, entorno validado con zod, cliente de Supabase, tipos de error |
| `test/` | Infraestructura de tests: `setup.ts` y `renderClassrooms.tsx` |

### 1.4 Convenciones a respetar

**Idioma.** Código en inglés (identificadores, tipos, nombres de archivo).
Comentarios, documentación y **toda la interfaz** en español.

**Comentarios.** Se explica *por qué*, nunca *qué*. Los tipos de dominio llevan
JSDoc por campo (ver `types/classroom.types.ts`). No añadir comentarios
redundantes: el código de este repo es deliberadamente parco en ellos.

**Componentes.** Función flecha exportada como constante nombrada
(`export const Foo = () => {}`), sin `export default`. Props tipadas con
`interface` o `type` declarado justo encima del componente.

**Servicios.** Todo servicio devuelve `{ data, error }` con `AppError`
(`errors/AppError.ts`, construido con `createAppError.ts`). Nunca lanzan.

**Estilos.** Tailwind con los **nombres de color del tema**, nunca hex sueltos.
Los tokens viven duplicados a propósito en `src/main.css` (variables CSS) y en
`tailwind.config.js` (nombres de Tailwind). Las clases de componente (`.btn`,
`.card`, `.chip`, `.field`) están en `main.css` bajo `@layer components`.
El detalle completo de paleta y tipografía está en `ESTADO-DEL-PROYECTO.md` §2.

**Ilustraciones.** Los SVG decorativos van en `components/decor/`, con
`aria-hidden="true"`, `focusable="false"` y sin capturar el puntero. Contorno de
tinta `#2A1B45` de unos 3 px, relleno saturado y esquinas redondeadas.

**Huecos de mascota.** Los espacios reservados para la ilustración definitiva
(un leopardo) se marcan con contorno discontinuo y **se dejan vacíos a
propósito**: `.mascot-slot` en CSS, o `ImagePlaceholder` de
`components/home/shared.tsx`. No rellenarlos con imágenes genéricas.

**Origen de las imágenes.** Las ilustraciones definitivas —mascota, escenarios,
portadas de mundo— serán **generadas por IA con Higgsfield, a través de su MCP
conectado a Claude**. Decisión tomada, ejecución **aplazada a propósito**: el
foco actual son las funcionalidades, no el apartado gráfico. Ver §3 → P6.
Esto no cambia nada de lo anterior: los adornos SVG de `components/decor/` se
siguen escribiendo a mano (son geometría, no ilustración) y los huecos siguen
vacíos hasta que haya imágenes reales.

**Store de salones.** Ningún componente lee `localStorage` directamente. Todo
pasa por `useClassrooms()`. Esa frontera es intencional: es lo único que hay que
reescribir para conectar Supabase (§4.3).

**Comandos** (desde la raíz):

```bash
npm run dev
```

| Comando | Qué hace | Estado |
| --- | --- | --- |
| `npm run dev` | Vite en el puerto 5173 | ✅ |
| `npm run build` | `tsc && vite build` | ✅ verificado 25-ago-2026 |
| `npm run lint` | ESLint, 0 warnings permitidos | ✅ verificado 25-ago-2026 |
| `npm run test` | Vitest en modo watch | ✅ |
| `npm run test:run` | Vitest, una pasada | ✅ verificado 25-ago-2026 |
| `npm run preview` | Sirve el build de producción | ✅ |
| `npm run format` | Prettier sobre `src` | ✅ |

Para un workspace concreto: `npm run <script> -w @codeplay/web`.
Para instalar sólo en el front: `npm install <paquete> -w @codeplay/web`.

**Variables de entorno.** `apps/web/.env` (plantilla en `.env.example`):
`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`. `config/env.ts` las valida con
zod **y lanza en tiempo de importación si faltan o son inválidas**, así que la
app no arranca sin ellas. Hoy el `.env` local contiene valores de relleno: la
app carga, pero ninguna consulta a Supabase resuelve.

---

## 2. Especificaciones aplicadas

Estado de cada requisito:

| Símbolo | Significado |
| --- | --- |
| ✅ | Implementado y operativo. Al conectar el backend seguirá funcionando igual |
| 🟡 | La interfaz existe y responde, pero no produce el efecto real |

### 2.1 `sistema-visual` — Sistema de diseño y tema selva

**Propósito.** Dar a toda la plataforma un aspecto tangible e infantil,
inspirado en CodeCombat, CodeMonkey y Scratch, sobre un bioma de selva tropical.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Paleta, tipografías y clases de componente como tokens | ✅ | `src/main.css` + `tailwind.config.js` |
| Botones con relieve inferior sólido (`.btn` + variante de color) | ✅ | `main.css` |
| Tarjetas de pegatina (`.card`, `.card-flat`) | ✅ | `main.css` |
| Etiquetas de estado (`.chip` + variante) | ✅ | `main.css` |
| Campos de formulario (`.field`, `.field-label`) | ✅ | `main.css` |
| **Capa de selva:** colores `jungle` y `papaya`, `.btn-leaf`, `.btn-papaya`, `.chip-leaf`, `.chip-papaya` | ✅ | `main.css` + `tailwind.config.js` |
| **Superficies de selva:** `.jungle-surface` (luz entre hojas) y `.jungle-band` (franja de tierra) | ✅ | `main.css` |
| **Adornos SVG:** `MonsteraLeaf`, `PalmFrond`, `TropicalFlower`, `Toucan`, `VineDivider`, `Canopy`, `LeafCorner` | ✅ | `components/decor/JungleDecor.tsx` |
| Huecos reservados para la mascota (`.mascot-slot`, `ImagePlaceholder`) | ✅ | `main.css`, `components/home/shared.tsx` |
| Identidad visual automática por salón: 6 temas por hash del id | ✅ | `components/dashboard/shared/groupThemes.ts` + `GroupBadge.tsx` |

**Decisiones de diseño**

- Los neutros llevan **tinte violeta deliberado**: el gris apagado haría la
  interfaz menos infantil.
- Las sombras **nunca se difuminan**: siempre desplazamiento vertical sólido
  (`0 8px 0`). Eso es lo que produce el relieve.
- El fondo del `body` no es plano: dos capas superpuestas, el resplandor verde
  del dosel cayendo desde arriba más los lunares de `line`.
- El tema de cada salón se calcula por hash del id y **no se guarda en base de
  datos**: el mismo salón obtiene siempre el mismo tema, sin columna extra.
- Los nombres de color antiguos (`primary`, `secondary`, `tertiary`, `neutral`)
  se conservan en `tailwind.config.js` **a propósito**, para no romper pantallas
  que aún no se han migrado.
- El tucán de `JungleDecor` es **provisional**: ocupa el sitio hasta que exista
  la mascota definitiva (un leopardo), que ya se nombra en el copy del registro
  y que se generará con IA (P6).

**Alcance del tema selva.** Aplicado en: landing completa (héroe, mundos,
tutores, cómo se aprende, pie), login, registro, panel del alumno, panel del
tutor y ambas barras laterales. Ninguna pantalla en uso quedó fuera.

### 2.2 `auth-sesion` — Acceso, sesión y roles

**Propósito.** Distinguir a los dos tipos de usuario —niño (`child`) y tutor
(`tutor`)— y llevar a cada uno a su panel. El rol `tutor` cubre tanto a padres
como a profesores; en la interfaz se etiqueta «Tutor» y el nombre del profesor
se muestra por salón.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Enrutado con guardas por rol | ✅ | `router/AppRouter.tsx`, `PrivateRoute.tsx`, `PublicRoute.tsx` |
| Quien entra en un panel ajeno es devuelto al suyo | ✅ | `PrivateRoute.tsx` + `getHomeRouteForRole()` |
| Rol efectivo unificado (perfil real o invitado) | ✅ | `hooks/useActiveRole.ts` |
| Sesión de invitado, **sólo en desarrollo** (`import.meta.env.DEV`) | ✅ | `context/guest.helpers.ts` |
| Acceso «Sin login» que **autentica de verdad** con cuentas de prueba | ✅ | `guest.helpers.ts` (`getDevCredentials`) + `components/home/Navbar.tsx` |
| Salir cierra también la sesión de Supabase, por los cuatro caminos | ✅ | Las dos barras laterales y las dos pantallas de Ajustes |
| Formularios de login y registro con validación zod | 🟡 | `pages/Login/`, `pages/Signup/`, `components/auth/*.schema.ts` |
| Registro por pasos con selección de rol | 🟡 | `components/auth/steps/`, `SignupRoleCard.tsx` |
| Botón de acceso con Google | 🟡 | `components/auth/GoogleAuthButton.tsx` |
| Sincronización sesión ↔ perfil de Supabase | 🟡 | `context/AuthProvider.tsx` |

**Decisiones de diseño**

- `guest.helpers.ts` **centraliza** las claves de `localStorage` de la sesión de
  invitado; ningún componente las toca directamente.
- La sesión de invitado se apaga sola fuera de desarrollo: `isGuestModeAvailable()`
  comprueba `import.meta.env.DEV`. En producción no hay puerta trasera.
- `useActiveRole()` prioriza el perfil autenticado y cae en el rol de invitado.
  Cuando el login real entre, esta función es el único punto que hay que revisar.
- **El botón «Sin login» ya no simula la sesión: inicia sesión de verdad** con la
  cuenta de prueba del rol pulsado, si hay credenciales en `apps/web/.env`. Sin
  ellas cae en la marca local, para que quien clone el repositorio sin
  configurarlas pueda entrar igual. Un fallo de autenticación **no** cae en el
  invitado: entrar con una sesión simulada dejaría la aplicación aparentando
  funcionar mientras `auth.uid()` sigue vacío.
- El rol con el que se navega es **el del perfil que devuelve el servidor**, no
  el del botón pulsado. Si no coinciden, se ve el desajuste en vez de un rebote
  de `PrivateRoute` sin explicación.
- Las cuatro variables `VITE_DEV_*` **no pasan por `config/env.ts`**: ese módulo
  valida al importarse y se ejecuta también en producción, así que declararlas
  allí metería correo y contraseña en el paquete publicado. Se leen tras
  `import.meta.env.DEV` y como accesos de miembro, nunca copiando
  `import.meta.env`. Comprobado con `grep` sobre `dist/`: cero coincidencias.
- **Los 400 y 403 que aparecen en consola al entrar y salir varias veces son de
  autenticación, no del panel.** Un 400 sale al refrescar un token ya revocado o
  en un `signIn` fallido; un 403, al cerrar sesión cuando ya estaba cerrada. Se
  comprobó con sesión válida que las ocho tablas responden 200, así que **no es
  el panel leyendo Supabase**: es una secuela del ciclo de sesión, y aparece
  justo al probar los cuatro caminos de salida uno detrás de otro. No es un
  fallo que el paso 10 herede.

- **Salir tiene que llamar a `signOut()`, no sólo borrar la marca de invitado.**
  Las dos barras laterales sólo hacían lo segundo, lo que bastaba mientras la
  marca era la única sesión; con sesión real dejaban entrar de vuelta al panel
  escribiendo la dirección, porque `isAuthenticated(session)` seguía siendo
  cierto.

#### Rutas

| Ruta | Rol | Pantalla |
| --- | --- | --- |
| `/` | Público | Landing |
| `/login`, `/signup` | Público | Acceso y registro |
| `/dashboard`, `/dashboard/worlds` | Alumno | Mundos |
| `/dashboard/worlds/:worldId` | Alumno | Niveles de un mundo |
| `/dashboard/trophies` | Alumno | Sala de trofeos |
| `/dashboard/classroom` | Alumno | Salón / buscador / espera |
| `/dashboard/settings` | Alumno | Ajustes |
| `/teacher` | Tutor | Redirige a `/teacher/groups` |
| `/teacher/groups` | Tutor | Mis salones |
| `/teacher/groups/:groupId` | Tutor | Detalle del salón |
| `/teacher/panel`, `/teacher/panel/:groupId` | Tutor | Panel de información |
| `/teacher/settings` | Tutor | Ajustes de cuenta |

Cualquier otra ruta redirige a `/`. Todas las rutas del alumno montan el mismo
`Dashboard`, que decide el módulo según la URL; lo mismo hace `TeacherDashboard`
con las del tutor.

### 2.3 `salones-tutor` — Gestión de salones (rol tutor)

**Propósito.** Que el tutor cree salones, admita alumnos y siga su progreso.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Listado de salones con métricas agregadas | ✅ | `teacher/TeacherGroupsModule.tsx` |
| Crear salón (nombre, grado, profesor, cupos 1–60) con validación en cliente | ✅ | `teacher/CreateGroupForm.tsx` |
| ID público único por salón (`CP-XXXX`) | ✅ | `generatePublicId()` en `teacher/classroomsData.ts` |
| Detalle del salón con estadísticas | ✅ | `teacher/TeacherGroupDetailModule.tsx` |
| Tabla de seguimiento (mundo, última actividad, racha) | ✅ | `shared/StudentRosterTable.tsx` |
| Eliminar alumno con confirmación en línea | ✅ | `shared/StudentRosterTable.tsx` |
| Eliminar salón con diálogo y recuento de afectados | ✅ | `shared/ConfirmDialog.tsx` |
| Bandeja «Alumnos en espera» | ✅ | `teacher/PendingRequestsSection.tsx` |
| Aceptar o rechazar solicitud; aceptar se bloquea sin cupos | ✅ | `context/ClassroomsProvider.tsx` |
| Reportes de 5 competencias con semáforo de dominio | ✅ | `getSkillReports()` en `classroomsData.ts` |
| Selector de alcance: todos los salones o uno | ✅ | `teacher/TeacherPanelModule.tsx` |
| Asignación de misiones | 🟡 | Estado local del componente (`assignedMissionIds`); se pierde al recargar |
| Invitar alumnos por correo | 🟡 | `teacher/InviteByEmailPanel.tsx` — registra la invitación, **no envía correo** |
| Recursos educativos | 🟡 | Tarjetas informativas sin destino |
| Ajustes de cuenta | 🟡 | `teacher/TeacherSettingsModule.tsx` — «Cambiar contraseña» no hace nada |

**Decisiones de diseño**

- `classroomsData.ts` reúne los datos de ejemplo **y las funciones puras de
  cálculo** (`getSkillReports`, `buildGroup`, `generatePublicId`…). Al conectar
  el backend, los datos se van y las funciones puras se quedan.
- Semáforo de dominio de habilidades: ≥ 70 % `lime` (dominado), 45–69 % `sun`
  (en camino), < 45 % `coral` (a reforzar).
- `StudentRosterTable` sólo muestra la columna de acciones si recibe
  `onRemoveStudent`. Así la reutiliza la vista del alumno sin poder borrar a nadie.

### 2.4 `salones-alumno` — Ingreso a un salón (rol niño)

**Propósito.** Que el niño encuentre su salón y entre en él con aprobación del tutor.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Buscador global de salones | ✅ | `student/StudentClassroomSearch.tsx` |
| Búsqueda por nombre (coincidencia parcial) | ✅ | `matchesGroupSearch()` |
| Búsqueda por ID exacto: muestra sólo ese salón | ✅ | `matchesGroupSearch()` + `isExactIdSearch()` |
| Solicitar ingreso | ✅ | `requestJoin()` en `ClassroomsProvider.tsx` |
| Pantalla de espera con opción de cancelar | ✅ | `student/StudentClassroomModule.tsx` |
| Ver el salón propio y a los compañeros | ✅ | `student/StudentClassroomModule.tsx` |
| Bloqueo de solicitud si el salón está lleno | ✅ | `student/StudentClassroomSearch.tsx` |

#### Máquina de estados del alumno

| Estado | `membership.status` | `groupId` | Qué ve |
| --- | --- | --- | --- |
| Sin salón | `none` | `null` | Buscador global |
| En espera | `pending` | id del salón | Pantalla de espera |
| En un salón | `member` | id del salón | Su salón y compañeros |

| Desde | Hacia | Disparador | Quién |
| --- | --- | --- | --- |
| Sin salón | En espera | `requestJoin()` | Alumno |
| En espera | Sin salón | `cancelJoinRequest()` | Alumno |
| En espera | Sin salón | `rejectRequest()` | Tutor |
| En espera | En un salón | `acceptRequest()` | Tutor |
| En un salón | Sin salón | `removeStudent()` / `leaveGroup()` | Tutor / Alumno |
| En espera o en un salón | Sin salón | `deleteGroup()` | Tutor |

No existe transición directa de «En un salón» a «En espera» en otro salón: hay
que quedar sin salón primero. **Un alumno pertenece como máximo a un salón.**

Los diagramas y el detalle paso a paso de cada flujo están en
`ESTADO-DEL-PROYECTO.md` §1.4 y §1.5.

### 2.5 `store-salones` — Persistencia local del prototipo

**Propósito.** Sostener el prototipo completo sin backend, de forma que la
solicitud que envía el niño siga ahí al entrar como tutor y al recargar.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Store de salones con API de acciones tipada | ✅ | `context/ClassroomsContext.ts` + `ClassroomsProvider.tsx` |
| Persistencia versionada en `localStorage` | ✅ | Clave `codeplay:classrooms`, `version: 1` |
| Resiembra automática si la versión no cuadra o el estado está corrupto | ✅ | `readPersistedState()` |
| Acceso único desde componentes | ✅ | `hooks/useClassrooms.ts` |

**Decisiones de diseño**

- Las mutaciones se calculan **fuera** de los actualizadores de `setState`:
  React los invoca dos veces en StrictMode y aquí se generan ids y marcas de
  tiempo que no deben salir distintas en cada invocación.
- La identidad del niño de la sesión está fijada en
  `CURRENT_STUDENT_ID = 'guest-child'` mientras no haya login real.
- `ClassroomsProvider` es **el único archivo que cambia de raíz** al conectar el
  backend. Ninguna vista habrá que tocarla. Frontera deliberada.

#### Claves de `localStorage`

| Clave | Contenido |
| --- | --- |
| `codeplay:classrooms` | Salones y pertenencia. Versionado; si la versión no cuadra, se resiembra |
| `dev:skipAuth` | Marca de sesión de invitado. Sólo en desarrollo |
| `dev:guestRole` | Rol de la sesión de invitado: `child` o `tutor` |

Para reiniciar los datos de ejemplo: borrar `codeplay:classrooms`.

### 2.6 `contenido-mundos` — Mundos, niveles y trofeos (rol niño)

**Propósito.** Presentar el contenido educativo por mundos y niveles, y el
progreso conseguido.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Listado de mundos con filtros (dificultad, tema, categoría) | 🟡 | `student/StudentWorldsModule.tsx` |
| Lectura desde Supabase con repliegue a datos locales | 🟡 | `useWorlds()` + `fallbackWorlds` (`student/worlds/worldsData.ts`) |
| Recuento de niveles completados por mundo | 🟡 | `worldsService.getLevelsByWorld()` + `useProgress()` |
| Niveles de un mundo, con bloqueo por progresión | 🟡 | `student/StudentWorldLevelsModule.tsx` |
| Sala de trofeos | 🟡 | `student/StudentTrophiesModule.tsx` + `AchievementList/` |
| Ajustes de cuenta del alumno | 🟡 | `student/StudentSettingsModule.tsx` |

**Decisiones de diseño**

- El patrón es **Supabase primero, repliegue local después**: si `useWorlds()`
  no devuelve nada (hoy, siempre), se pintan los mundos de `worldsData.ts`. Al
  conectar el backend, la pantalla cambia de fuente sin tocar el componente.
- El repliegue local usa el tono de tarjeta (`forest` / `volcano` / `ocean`) como
  identidad visual del mundo, no un color guardado en base de datos.

### 2.7 `backend-supabase` — Esquema de base de datos

**Propósito.** Definir el esquema, las políticas de seguridad y las operaciones
seguras del backend.

**Estado global: aplicado.** El proyecto de Supabase existe, está enlazado con la
CLI y las trece migraciones se ejecutaron contra la base real
(`backend-supabase-real` 25-ago-2026, `tablas-salones` 26-ago-2026). Verificado
por HTTP: ninguna tabla devuelve `PGRST205`, `worlds` y `levels` responden con
los 3 mundos y los 9 niveles de la siembra, y las cuatro tablas de salones
responden 401 a la clave anónima.

**La 0013 salió con un fallo, y conviene que quede en el registro.** Sus
políticas formaban un ciclo: la de inserción de `join_requests` consulta
`profiles` para comprobar el rol, y `profiles_select_own_students` consultaba a
su vez `join_requests`. Insertar una solicitud moría con
`42P17: infinite recursion detected in policy`, es decir que **ningún niño podía
pedir entrar a un salón**. La migración 0014 lo corrige moviendo la condición a
una función `security definer`, que no expande políticas.

**Sólo era observable con sesión autenticada.** La verificación de la 0013 llegó
hasta donde llega una clave anónima —las tablas existen, `anon` no lee ninguna— y
por eso el fallo pasó dos revisiones. La lección está en `ROADMAP.md` §1.3: el
análisis de ciclos entre políticas se hace desde cada **escritura**, no sólo
desde las lecturas.

**Qué está verificado con sesión real, a 26-ago-2026.** Con las tres cuentas de
prueba del paso 11 —una `tutor` y dos `child`— y sus tokens, contra el proyecto
real:

| Comprobado | Resultado |
| --- | --- |
| El tutor crea un salón; el niño lo intenta | 201 y `42501`: la política exige rol `tutor` |
| El tutor ve el perfil del solicitante, con su nombre | Sí, por las dos ramas: solicitud pendiente y pertenencia |
| El niño lee `profiles` | Una sola fila, la suya |
| El niño intenta inscribirse solo | `42501`: no hay política de inserción sobre `class_memberships` |
| `accept_join_request` | Crea la pertenencia con `joined_at`; el disparador rellena `resolved_at` con el **mismo instante**, o sea que las dos tablas se escriben en una transacción |
| Siendo miembro, pedir otro salón | `42501`: lo corta el `with check` que consulta `class_memberships` |
| El niño sale de su salón y vuelve a solicitar | Permitido: sin `unique (group_id, student_id)`, se acumulan filas |
| El tutor rechaza; el niño intenta borrar y reescribir su rechazo | 0 filas y 0 filas: el rechazo sobrevive |
| El tutor intenta marcar `accepted` una solicitud **pendiente**, sin la RPC | `42501`: lo corta `with check (status = 'rejected')` |
| Salón de cupo 1 lleno, aceptar a un segundo niño | `23514 Classroom is full`, y la solicitud sigue `pending`: la RPC aborta antes de escribir |
| Borrar un salón | Se lleva por delante sus solicitudes y sus pertenencias |

**Qué sigue sin verificar.** La carrera del `for update`: dos aceptaciones
simultáneas sobre el mismo salón no se reproducen a mano. El cupo está
comprobado **funcionalmente**, no bajo concurrencia.

**Estado de la base de pruebas: limpia.** Los salones de prueba se borraron al
terminar, y con ellos sus solicitudes y pertenencias. Las tres cuentas siguen
existiendo, sin salón ninguna. El paso 10 parte de cero.

| Requisito | Estado | Dónde vive |
| --- | --- | --- |
| Extensión `pgcrypto` y trigger de `updated_at` | ✅ escrito | `migrations/202606030001_base_extensions.sql` |
| Tabla `profiles` | ✅ escrito | `…0002_create_profiles.sql` |
| Tablas `worlds` y `levels` | ✅ escrito | `…0003_create_learning_content.sql` |
| Tablas `user_progress` y `level_attempts` | ✅ escrito | `…0004_create_progress_tracking.sql` |
| Tabla `achievements` | ✅ escrito | `…0005_create_achievements.sql` |
| RPCs `update_my_profile`, `create_level_attempt`, `upsert_my_progress` | ✅ escrito | `…0006_create_rpc_functions.sql` |
| Trigger `on_auth_user_created` que crea el perfil | ✅ escrito | `…0007_create_profile_trigger.sql` |
| Vista `leaderboard_weekly` | ✅ escrito | `…0008_create_weekly_leaderboard_view.sql` |
| RLS, políticas y permisos | ✅ aplicado | `…0009_enable_rls_and_policies.sql` |
| Columna `profiles.role` y disparador que la rellena | ✅ aplicado | `…0010_add_profile_role.sql` |
| Enum `user_role` y retirada del check redundante | ✅ aplicado | `…0011_profile_role_enum.sql` |
| Siembra de mundos y niveles | ✅ aplicado | `…0012_seed_learning_content.sql` |
| Tablas de salones, sus políticas, sus `grant` y `accept_join_request` | ✅ aplicado | `…0013_create_classroom_tables.sql` |
| Arreglo de la recursión entre `profiles` y `join_requests` | ✅ aplicado | `…0014_fix_profiles_policy_recursion.sql` |
| Cliente y 7 servicios tipados contra el esquema real | ✅ | `lib/supabase.ts`, `services/*.ts` |
| `database.types.ts` generado con la CLI | ✅ | `types/database.types.ts` |

**Decisiones de diseño**

- Las escrituras principales quedan encapsuladas en **RPCs** en vez de permitir
  escritura directa desde el cliente, para reducir la manipulación.
- `achievements` es de sólo lectura para el cliente autenticado; otorgarlos
  requerirá lógica segura adicional (Edge Function o SQL controlado). Es el
  **registro de logros concedidos**, no un catálogo: no existe la tabla que
  enumere los posibles, así que la sala de trofeos sólo lista lo conseguido
  (§4.2).
- `role` es un **enum** `user_role`, no un `text` con `check`: sólo el enum llega
  a los tipos generados, y una unión escrita a mano junto a un check de la base
  volvería a abrir la brecha entre tipo y realidad.
- Las escrituras del cliente pasan por RPC también en progreso e intentos, no
  sólo en el perfil: la migración 0009 revoca `insert/update/delete` sobre las
  tres tablas.
- `leaderboard_weekly` es una vista que expone únicamente campos seguros.
- `levels` guarda `starter_code`, `validation_rules` y `programming_language`:
  el esquema se diseñó para un **editor de código en el navegador**, no para un
  juego de Unity. Hay que decidir si se amplía o se reinterpreta (§3.4).
- `supabase/` está en la raíz del repo siguiendo la convención del CLI, para que
  `supabase db push` y `supabase db reset` funcionen sin flags.
- **Los salones escriben por RLS, no por RPC**, al revés que perfil y progreso.
  La excepción es aceptar una solicitud: escribe dos tablas y comprueba a la vez
  el cupo, la propiedad del salón y «un alumno, un salón», así que es la única
  RPC del módulo. Bloquea la fila del salón con `for update` **antes** de contar
  alumnos; sin ese bloqueo, dos aceptaciones simultáneas se pasan del cupo.
- **«Un alumno, un salón» vive en tres sitios**: `unique (student_id)` en
  `class_memberships`, un índice único **parcial** sobre las solicitudes
  pendientes, y el `with check` de la política de inserción, que impide pedir
  entrar a otro salón siendo ya miembro. Ninguno sobra.
- **El historial de solicitudes se acumula en filas.** Una solicitud resuelta es
  inmutable y volver a pedir entrar inserta una fila nueva, así que un mismo par
  `(student_id, group_id)` puede tener varias. No hay `unique (group_id,
  student_id)` a propósito: impedía tanto reintentar tras un rechazo como volver
  a un salón que el niño había dejado.
- **`class_memberships` guarda `joined_at`.** Guardar la fecha no decide qué
  historial ve el tutor de un niño que ya jugaba antes de entrar —eso es del
  paso 17 del roadmap y tiene arista de privacidad—; sólo evita tener que
  inventarla después.
- `profiles` tiene **dos** políticas de lectura: la propia y
  `profiles_select_own_students`, que deja al tutor leer el perfil de los niños
  de sus salones. Sin ella la lista del salón saldría sin nombres.

---

## 3. Especificaciones por aplicar

**Objetivo del siguiente hito:** tener funcionalidades completas de punta a punta
— base de datos real en Supabase, roles funcionales de verdad, y el apartado
donde se implementarán los niveles del juego. El juego de Unity sigue en
desarrollo: aquí sólo entra el lado web de la integración.

El **apartado gráfico queda fuera de este hito a propósito** (P6): la
herramienta ya está elegida, pero las ilustraciones no se abordan hasta que las
funcionalidades estén completas.

### P2 — `auth-real`: login, registro y roles verificados en servidor

**Descripción.** Conectar Supabase Auth de verdad: registro con rol, login,
cierre de sesión y guardas de ruta apoyadas en el perfil real en vez de en la
sesión de invitado.

**Tareas**

1. Conectar los formularios de `pages/Login` y `pages/Signup` a `authService`.
2. Pasar el rol elegido en el registro como metadato de usuario, para que el
   trigger lo escriba en `profiles.role`.
3. Dar de alta Google OAuth en el panel de Supabase y activar `signInWithGoogle()`.
4. Degradar la sesión de invitado a atajo de desarrollo puro: `useActiveRole()`
   y `PrivateRoute` deben funcionar sin ella.
5. Verificar que `PrivateRoute` redirige correctamente con roles reales.

**Dependencias.** Ninguna: la columna `role` ya existe y el disparador la
rellena desde los metadatos del registro.

### P3 — `salones-persistentes`: mover el store de salones a Supabase

**Descripción.** Sustituir el estado en `localStorage` por consultas reales, de
modo que la solicitud de un niño llegue al tutor desde otro dispositivo.

**Tareas**

1. Crear `services/classrooms.service.ts` con la misma forma `{ data, error }`.
2. Reescribir `ClassroomsProvider` para que las acciones de
   `ClassroomsContextValue` llamen al servicio. **La interfaz del contexto no
   cambia**, así que ninguna vista se toca.
3. Sustituir `CURRENT_STUDENT_ID = 'guest-child'` por el id del usuario real.
4. Retirar la semilla de `classroomsData.ts` conservando las funciones puras.
5. Llevar el invariante «un alumno, un salón» al modelo. Añadir la guarda en el
   store al solicitar ingreso y, mejor aún, imponerla en la base de datos:
   `UNIQUE (student_id)` en `class_memberships` y un índice único parcial sobre
   `join_requests` restringido a las solicitudes pendientes. Hoy `requestJoin()`
   sobrescribe `membership` sin comprobar la pertenencia actual: quien sostiene
   el invariante es el enrutado de `StudentClassroomModule`, que sólo monta el
   buscador cuando `membership.status === 'none'`. Al pasar a Supabase la vista
   deja de ser el único camino hasta la escritura, así que esa protección se
   pierde si no se traslada.

**Dependencias.** P1 (tablas de salones) y P2 (identidad del usuario).

### P4 — `integracion-juego`: apartado de implementación de los niveles

**Descripción.** Dejar montado el hueco donde entrará el juego: la pantalla de
nivel con el contenedor del build de WebGL, el paso de parámetros al juego y la
recepción del resultado. **El juego de Unity sigue en desarrollo**; esta tarea
cubre sólo el apartado de integración del lado web.

**Tareas**

1. Crear la ruta y la pantalla de nivel (`/dashboard/worlds/:worldId/:levelId`),
   con el contenedor del juego y el marco visual del tema selva.
2. Definir el contrato de integración: qué recibe el juego al arrancar (id de
   nivel, id de usuario, configuración) y qué devuelve al terminar (éxito,
   estrellas, XP, tiempo).
3. Implementar el puente hacia el juego y la escritura del resultado vía
   `progressService` y `attemptsService`.
4. Mientras no exista el build: mostrar en ese contenedor un hueco reservado
   coherente con el resto de la interfaz, no una pantalla de error.
5. Decidir qué hacer con `levels.starter_code`, `levels.validation_rules` y
   `levels.programming_language`, pensados para un editor de código y no para
   Unity: ampliar el esquema o reinterpretar esos campos.

**Dependencias.** Ninguna: `levels`, `user_progress` y `level_attempts` ya
existen en la base real.
No depende de que el juego esté terminado: el contrato se define primero.

**Bloqueos conocidos.** El proyecto de Unity no existe todavía en `apps/game/`.
Antes de su primer commit hay que activar **Git LFS** (reglas ya preparadas y
comentadas en `.gitattributes`) y `unityyamlmerge`; y en Unity dejar
*Version Control: Visible Meta Files* y *Asset Serialization: Force Text*.
El build de WebGL va a `apps/web/public/game/`, carpeta ignorada por git.

### P5 — Pendientes sin prioridad asignada

| Funcionalidad | Descripción | Dependencias |
| --- | --- | --- |
| Envío real de invitaciones | Elegir servicio de correo (Resend, SendGrid…) y enviar de verdad lo que hoy sólo se registra | P1 + servicio contratado |
| Enlace de invitación canjeable | Generar y canjear tokens; probablemente con Supabase Edge Functions | Envío de correo |
| Persistir la asignación de misiones | Hoy vive en el estado del componente y se pierde al recargar | P1 |
| Editar o archivar un salón | No existe | P1 |
| Exportar reportes | No existe | P1 |
| Progreso, XP y rachas reales | Hoy son datos de ejemplo | P4 |
| Pertenecer a varios salones | El modelo actual admite uno solo; cambiarlo afecta a `StudentMembership` | P3 |
| Recursos educativos con destino | Hoy son tarjetas informativas sin enlace | Contenido |
| CI en GitHub Actions | Verificar lint y build en cada push | Ninguna |
| Abrir los cambios en OpenSpec | Convertir P1–P4 en `openspec/changes/` con `/opsx:propose` | Ninguna |

### P6 — `assets-graficos`: ilustraciones generadas por IA

**Aplazado a propósito.** La decisión de herramienta ya está tomada, pero el
trabajo gráfico no entra hasta que las funcionalidades (P1–P4) estén completas.
Se documenta aquí para que no se pierda entre sesiones ni se improvise otra
solución.

**Decisión.** Las ilustraciones definitivas se generan con **Higgsfield**,
invocado desde Claude a través de su **MCP**. No se dibujan a mano ni se compran
en bancos de imágenes.

**Qué cubre**

| Asset | Dónde va | Hueco actual |
| --- | --- | --- |
| Mascota (un leopardo) | Landing, login, registro, ajustes, mundos | `.mascot-slot` / `ImagePlaceholder`, hoy vacíos |
| Portadas de mundo | `student/StudentWorldsModule.tsx` | Hoy se resuelve con tono de color e icono SVG |
| Escenarios y fondos | Landing y paneles | Hoy son degradados y adornos SVG |

**Qué NO cubre.** Los adornos de `components/decor/JungleDecor.tsx` (hojas,
flores, tucán, liana) **seguirán siendo SVG escritos a mano**: son geometría
ligera, escalan sin pérdida, heredan el contorno de tinta del sistema visual y
pesan una fracción de lo que pesaría un PNG. No hay motivo para reemplazarlos.

**Tareas cuando llegue el momento**

1. Conectar el MCP de Higgsfield a Claude y verificar que responde.
2. Fijar el *prompt base* del estilo —contorno grueso de tinta, relleno saturado,
   paleta de §2.1, bioma de selva— para que todos los assets salgan coherentes
   entre sí y con la interfaz ya construida.
3. Generar primero la mascota: es la que aparece en más pantallas y la que fija
   el estilo del resto.
4. Definir dónde se guardan (`apps/web/public/` o `apps/web/src/assets/`),
   formato y tamaños. Decidir si entran en Git LFS junto con los binarios de
   Unity.
5. Sustituir los huecos por las imágenes, retirando el contorno discontinuo.

**Dependencias.** MCP de Higgsfield conectado (hoy no lo está). Ninguna
dependencia de código: los huecos ya existen y están marcados.

---

## 4. Deuda técnica conocida

### 4.1 `database.types.ts` desincronizado — RESUELTO

Estaba escrito a mano y describía un esquema imaginario. Se regeneró con la CLI
contra la base real al aplicar P1. Sigue vigente la regla: **se regenera, nunca
se edita a mano**.

```bash
npx supabase gen types typescript --linked > apps/web/src/types/database.types.ts
```

### 4.2 No hay catálogo de logros

La tabla `achievements` es el registro de logros **concedidos** a cada niño
(`user_id`, `achievement_key`, `title`, `awarded_xp`, `unlocked_at`, con
`unique (user_id, achievement_key)`). No existe la tabla que enumere los logros
posibles con sus condiciones de desbloqueo, así que la sala de trofeos sólo puede
listar lo conseguido. Diseñarla es el **paso 22** del roadmap.

### 4.3 Frontera del store: mantenerla

`ClassroomsProvider` es el único archivo que cambia de raíz al conectar el
backend. Todos los componentes consumen los datos vía `useClassrooms()`, así que
sustituir el estado local por consultas **no obliga a tocar ninguna vista**. Se
diseñó así a propósito; no romper esa frontera al implementar P3.

### 4.4 ESLint 8 sin soporte

`.eslintrc.cjs` usa la configuración heredada. Migrar a ESLint 9 con
configuración plana es una tarea pendiente sin urgencia.

### 4.5 Bundle de 583 kB

`npm run build` avisa de que el chunk supera los 500 kB. Sin urgencia, pero
cobrará importancia al embeber el juego. Se resuelve con `manualChunks` o
importaciones dinámicas por ruta.

---

## 5. Estado verificado

Comprobado el **26 de agosto de 2026** ejecutando los comandos:

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | ✅ Pasa. 157 módulos, 2,1 s. Sólo avisa del tamaño del chunk |
| `npm run lint` | ✅ Pasa. Cero errores y cero warnings |
| `npm run test:run` | ✅ Pasa. 54 tests en 2 archivos |
| Panel del tutor y del niño con la sesión de invitado | ✅ Navegan sin errores en consola. Los mundos se pintan desde Supabase —«Selva Algorítmica», `0/3 NIVELES`—, no desde el respaldo local |

**Cuidado al comprobar la pantalla de mundos:** `useWorlds()` arranca con la
lista vacía, así que durante la carga se pinta el respaldo de `worldsData.ts`
—«Bosque de Bucles», `4/10 NIVELES`— y sólo después llegan los datos reales. Ver
esos nombres no significa que el backend no responda; significa que se miró
demasiado pronto.

### Correcciones sobre `ESTADO-DEL-PROYECTO.md`

Ese documento se escribió el 18 de agosto de 2026 y dos de sus afirmaciones ya
no se sostienen:

1. **§4.1 «`npm run build` y `npm run lint` fallan» — resuelto.** Los tres
   errores de `StudentWorldsModule.tsx` ya no existen: el archivo se reescribió y
   hoy tipa `worldDifficulty` explícitamente en vez de usar `as any`.
2. **§3.2 «La aplicación arranca aunque estas variables estén vacías» — falso.**
   `config/env.ts` valida con zod y **lanza en tiempo de importación**; sin
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` válidas la app no carga.
3. **§4.5 «Alcance del rediseño» — resuelto.** Las pantallas que allí quedaban
   fuera (landing, login, registro, mundos, trofeos, ajustes) ya llevan el tema
   selva.

Todo lo demás de ese documento sigue vigente, y su guía de estilos (§2) es la
referencia completa de diseño.

### Cómo arrancar en frío

1. `npm install` en la raíz.
2. `cp apps/web/.env.example apps/web/.env` — hacen falta valores que pasen la
   validación de zod, o la app no arranca.
3. `npm run dev`.
4. Entrar con los botones **Sin login** de la barra superior y elegir *Niño* o
   *Profesor*. Es el único acceso mientras el login real no exista.
