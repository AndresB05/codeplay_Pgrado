## Why

El proyecto no tiene ni un solo test. La próxima prioridad del hito, **P3
(`salones-persistentes`)**, consiste en reescribir `ClassroomsProvider` entero
para que sus acciones llamen a Supabase en vez de a `localStorage`
(`docs/CONTEXT.md` §3). Ese archivo es el corazón de la aplicación: concentra la
máquina de estados del alumno, las transiciones que dispara el tutor y la
persistencia. Reescribirlo sin red significa que cualquier regresión —una
transición que deja de disparar, un alumno que queda en dos salones— sólo se
detecta a mano y por casualidad.

La red hay que tenderla **antes** de tocar el archivo, no después: unos tests
escritos sobre la versión de hoy fijan el comportamiento observable que el
refactor debe conservar. Escritos después, sólo confirmarían lo que el refactor
ya hizo.

## What Changes

- Se añade la infraestructura de tests al workspace `@codeplay/web`: **Vitest**
  como runner (comparte la configuración de Vite que ya existe), **jsdom** como
  entorno y **Testing Library** (`@testing-library/react`, `@testing-library/jest-dom`)
  para los tests de componentes y hooks.
- Se añaden los scripts `test` y `test:run` al workspace y sus proxys en la raíz,
  junto al resto de comandos.
- Se escriben los primeros tests sobre las **funciones puras** de
  `classroomsData.ts`: búsqueda de salones, generación de identificadores
  públicos, iniciales, estadísticas de salón y formateo de tiempo relativo.
- Se escriben los primeros tests sobre las **transiciones de `ClassroomsProvider`**:
  la máquina de estados del alumno (`none` → `pending` → `member` y sus vueltas),
  las acciones del tutor sobre solicitudes y alumnos, y el ciclo de persistencia
  y resiembra en `localStorage`.
- No se modifica ningún archivo de producción. Si un test descubre un fallo, se
  documenta y se decide aparte: este cambio congela el comportamiento actual, no
  lo corrige.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna.

**Este cambio no lleva deltas de spec, y es deliberado.** Es infraestructura de
desarrollo: no añade, quita ni altera ninguna capacidad observable del producto.
Un usuario de CodePlay —niño o tutor— no percibe absolutamente ninguna
diferencia. Los specs principales describen lo que el sistema hace; aquí el
sistema no cambia lo que hace, así que ningún spec debe cambiar.

Por eso `.openspec.yaml` declara `skip_specs: true`. Inventar un requisito del
tipo «el sistema SHALL tener tests» sólo para que `openspec validate` pase
metería en `openspec/specs/` una afirmación que no describe comportamiento del
producto, y la plantilla de OpenSpec advierte expresamente contra eso.

Nota relacionada: los tests de `ClassroomsProvider` **verifican** requisitos que
ya están escritos en `openspec/specs/store-salones/spec.md` y
`openspec/specs/salones-alumno/spec.md` (persistencia versionada, resiembra ante
estado corrupto, máquina de estados del alumno). Verificar un requisito
existente no es modificarlo.

## Impact

**Configuración y dependencias**

| Archivo | Cambio |
| --- | --- |
| `apps/web/package.json` | Nuevas `devDependencies` y scripts `test` / `test:run` |
| `package.json` (raíz) | Scripts proxy `test` y `test:run` hacia `@codeplay/web` |
| `apps/web/vite.config.ts` | Bloque `test` (entorno jsdom, setup, `globals: false`) |
| `apps/web/src/test/setup.ts` | **Nuevo.** Matchers de jest-dom y limpieza entre tests |

**Tests nuevos** (ningún archivo de producción se toca)

| Archivo | Cubre |
| --- | --- |
| `apps/web/src/components/dashboard/teacher/classroomsData.test.ts` | **Nuevo.** Funciones puras exportadas del módulo |
| `apps/web/src/context/ClassroomsProvider.test.tsx` | **Nuevo.** Transiciones y persistencia del store |

**Código de producción bajo test, sin modificar**

- `apps/web/src/components/dashboard/teacher/classroomsData.ts` — `matchesGroupSearch()`,
  `isExactIdSearch()`, `generatePublicId()`, `buildInitials()`, `buildGroup()`,
  `buildStudentFromRequest()`, `getClassGroupStats()`, `formatRelativeTime()`,
  `formatLastActivity()`, `pickAvatarTone()`.
- `apps/web/src/context/ClassroomsProvider.tsx` — `requestJoin()`,
  `cancelJoinRequest()`, `acceptRequest()`, `rejectRequest()`, `removeStudent()`,
  `leaveGroup()`, `deleteGroup()`, `createGroup()`, `inviteByEmail()`.
- `apps/web/src/hooks/useClassrooms.ts` — puerta de entrada al contexto en los tests.

**Riesgo a vigilar.** `apps/web/tsconfig.json` incluye todo `src`, así que
`npm run build` (que ejecuta `tsc` antes de Vite) también comprueba los tipos de
los archivos de test. Y `npm run lint` corre con `--max-warnings 0`. Ambos pasan
hoy y no pueden romperse: el diseño lo trata explícitamente.

**Dependencia de Supabase: ninguna.** Este cambio **no** requiere que el proyecto
de Supabase esté creado ni enlazado, y no lo desbloquea. Es la única pieza del
hito que se puede hacer entera hoy mismo, sin el bloqueo de la cuenta descrito en
`docs/CONTEXT.md` §3 (P1). El código bajo test tampoco toca la red:
`ClassroomsProvider` consume `useAuth()`, pero `AuthContext.ts` sólo importa
tipos, así que la cadena nunca llega a `lib/supabase.ts` ni a `config/env.ts`
—que lanzaría al importarse sin variables de entorno válidas.
