# CodePlay — Contexto y especificaciones

> **Fuente de verdad del estado del proyecto.** Este archivo se mantiene
> sincronizado entre sesiones de Claude Code y OpenSpec.
> Última verificación contra el código: **25 de agosto de 2026**.

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

Monorepo con **npm workspaces**, un solo `node_modules` compartido en la raíz.
Sin Turborepo ni Nx: se descartaron por sobredimensionados para dos apps.

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
| `types/` | `classroom.types.ts` es el modelo vivo; `database.types.ts` está **desincronizado** (§4.1) |
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
reescribir para conectar Supabase (§4.4).

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

**Estado global: escrito, nunca aplicado.** No hay proyecto de Supabase enlazado.
Ninguna migración se ha ejecutado contra una base real.

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
| RLS, políticas y permisos | ✅ escrito | `…0009_enable_rls_and_policies.sql` |
| Seed de mundos y niveles | ✅ escrito | `seed.sql` |
| Cliente y 7 servicios tipados | ✅ | `lib/supabase.ts`, `services/*.ts` |

**Decisiones de diseño**

- Las escrituras principales quedan encapsuladas en **RPCs** en vez de permitir
  escritura directa desde el cliente, para reducir la manipulación.
- `achievements` es de sólo lectura para el cliente autenticado; otorgarlos
  requerirá lógica segura adicional (Edge Function o SQL controlado).
- `leaderboard_weekly` es una vista que expone únicamente campos seguros.
- `levels` guarda `starter_code`, `validation_rules` y `programming_language`:
  el esquema se diseñó para un **editor de código en el navegador**, no para un
  juego de Unity. Hay que decidir si se amplía o se reinterpreta (§3.4).
- `supabase/` está en la raíz del repo siguiendo la convención del CLI, para que
  `supabase db push` y `supabase db reset` funcionen sin flags.

---

## 3. Especificaciones por aplicar

**Objetivo del siguiente hito:** tener funcionalidades completas de punta a punta
— base de datos real en Supabase, roles funcionales de verdad, y el apartado
donde se implementarán los niveles del juego. El juego de Unity sigue en
desarrollo: aquí sólo entra el lado web de la integración.

El **apartado gráfico queda fuera de este hito a propósito** (P6): la
herramienta ya está elegida, pero las ilustraciones no se abordan hasta que las
funcionalidades estén completas.

### P1 — `backend-supabase-real`: levantar la base de datos y aplicar el esquema

**Descripción.** Crear el proyecto de Supabase, enlazarlo con el CLI, corregir el
esquema (§4.1 y §4.2) y aplicar migraciones y seed.

**Tareas**

1. Crear el proyecto en Supabase y enlazarlo (`supabase link`). Poner
   `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` reales en `apps/web/.env`.
2. Añadir migración con la columna `profiles.role` (`'child' | 'tutor'`, por
   defecto `'child'`) y actualizar el trigger `handle_new_user_profile()` para
   que tome el rol de los metadatos del registro.
3. Añadir migración con las tablas de salones y sus políticas RLS.
4. `supabase db reset` en local y `supabase db push` al remoto.
5. Regenerar los tipos:
   `supabase gen types typescript --local > apps/web/src/types/database.types.ts`.
6. Ajustar `types/user.types.ts` y todo lo que consuma `user.xp`,
   `user.streakDays` y `user.email` a los nombres reales de columna.

**Tablas de salones que faltan**

| Tabla | Para qué |
| --- | --- |
| `class_groups` | Salón: tutor, nombre, grado, profesor, id público, cupos |
| `class_memberships` | Relación alumno ↔ salón |
| `join_requests` | Solicitudes pendientes con su estado |
| `invitations` | Invitaciones por correo con token y caducidad |

**Dependencias.** Ninguna. Es el bloqueo de todo lo demás.

**Bloqueo conocido.** La creación de la cuenta y del proyecto en supabase.com la
tiene que hacer una persona: implica registrarse e introducir credenciales.

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

**Dependencias.** P1 — hace falta la columna `role`.

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

**Dependencias.** P1, por las tablas `levels`, `user_progress` y `level_attempts`.
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

### 4.1 `database.types.ts` no describe la base de datos real

`types/database.types.ts` está escrito a mano y declara para `profiles` campos
que **no existen** en las migraciones:

| `database.types.ts` declara | La tabla `profiles` tiene realmente |
| --- | --- |
| `role`, `email`, `avatar_url`, `streak_days`, `xp` | `username`, `full_name`, `avatar_key`, `country_code`, `total_xp`, `current_streak`, `max_streak` |

Consecuencias: **no hay columna `role`**, así que el backend no puede distinguir
tutor de alumno; y todo lo que dependa de `user.xp`, `user.streakDays` o
`user.email` fallará en cuanto Supabase responda de verdad. `types/user.types.ts`
deriva sus tipos de este archivo, así que el error se propaga a toda la app.

Ese archivo debe **regenerarse, no editarse a mano**:

```bash
supabase gen types typescript --local > apps/web/src/types/database.types.ts
```

### 4.2 Faltan las tablas de salones

Nada en `supabase/migrations/` corresponde a `ClassGroup`, `JoinRequest`,
`EmailInvitation` ni `StudentMembership`. Todo el módulo de salones —la parte más
desarrollada de la aplicación— no tiene esquema.

**4.1 y 4.2 se solapan: conviene resolverlos en una sola tanda (P1).**

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

Comprobado el **25 de agosto de 2026** ejecutando los comandos:

| Comprobación | Resultado |
| --- | --- |
| `npm run build` | ✅ Pasa. 157 módulos, 8,4 s. Sólo avisa del tamaño del chunk |
| `npm run lint` | ✅ Pasa. Cero errores y cero warnings |
| `npm run test:run` | ✅ Pasa. 54 tests en 2 archivos |

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
