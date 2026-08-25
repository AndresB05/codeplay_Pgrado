## 1. Dependencias y configuración del runner

- [x] 1.1 Comprobar la versión de Vite del workspace con `npm ls vite -w @codeplay/web` y anotar la línea de Vitest compatible antes de instalar nada (design, decisión 1). Verificación: la salida confirma Vite 5.4.x.
- [x] 1.2 Instalar en `apps/web/package.json` como `devDependencies`: `vitest` (línea compatible con el paso 1.1), `jsdom`, `@testing-library/react`, `@testing-library/jest-dom` y `@testing-library/user-event`. Verificación: `npm ls vitest jsdom @testing-library/react -w @codeplay/web` resuelve sin `UNMET DEPENDENCY`.
- [x] 1.3 Añadir a `apps/web/package.json` los scripts `"test": "vitest"` y `"test:run": "vitest run"`. Verificación: `npm run test:run -w @codeplay/web` arranca el runner (aún sin tests, salida «No test files found»).
- [x] 1.4 Añadir en `package.json` de la raíz los scripts proxy `"test": "npm run test -w @codeplay/web"` y `"test:run": "npm run test:run -w @codeplay/web"`, junto al resto. Verificación: `npm run test:run` desde la raíz llega al runner.
- [x] 1.5 Modificar `apps/web/vite.config.ts` para importar `defineConfig` de `vitest/config` y añadir el bloque `test` con `environment: 'jsdom'`, `globals: false`, `setupFiles: ['./src/test/setup.ts']` y `css: false`. No tocar `plugins` ni `resolve.alias`. Verificación: `npm run build -w @codeplay/web` sigue pasando, lo que prueba que el cambio de `defineConfig` no rompe el build de producción.
- [x] 1.6 Crear `apps/web/src/test/setup.ts`: importar `@testing-library/jest-dom/vitest` y registrar un `afterEach` que llame a `cleanup()` de Testing Library y a `window.localStorage.clear()`, para que jsdom no filtre estado entre tests (design, Context). Verificación: el archivo existe y `tsc` no protesta al ejecutarse el paso 5.1.

## 2. Helper de montaje del store

- [x] 2.1 Crear `apps/web/src/test/renderClassrooms.tsx` con un objeto que cumpla `AuthContextValue` (funciones vacías, `user`, `session` y `error` a `null`, `loading` en `false`), importando `AuthContext` de `../context/AuthContext` y **nunca** `AuthProvider` (design, decisión 4). Verificación: el archivo no importa, ni directa ni transitivamente, `lib/supabase.ts`; comprobable porque la suite corre sin variables de entorno definidas.
- [x] 2.2 En ese mismo archivo, exportar `renderClassrooms()`, que monta `<StrictMode><AuthContext.Provider><ClassroomsProvider>` alrededor de un componente sonda que expone el valor de `useClassrooms()` a los tests, y devuelve un accesor a ese valor (design, decisiones 5 y 9). Verificación: un test mínimo que llame a `renderClassrooms()` y afirme que `groups` tiene la longitud de la semilla pasa en verde.
- [x] 2.3 Permitir a `renderClassrooms()` aceptar un `user` opcional, para cubrir el nombre del alumno tanto desde `user.fullName` como desde el `FALLBACK_STUDENT_NAME`. Verificación: los dos tests del paso 4.6 pasan usando el mismo helper.

## 3. Tests de `classroomsData.ts` (funciones puras)

Archivo: `apps/web/src/components/dashboard/teacher/classroomsData.test.ts`.

- [x] 3.1 `matchesGroupSearch()`: consulta vacía o de sólo espacios devuelve `true`; coincidencia parcial de nombre sin distinguir mayúsculas; ID público exacto; consulta que no coincide con nada devuelve `false`. Verificación: los cuatro casos pasan.
- [x] 3.2 `isExactIdSearch()`: `true` sólo cuando la consulta iguala el ID público de algún salón, con espacios y mayúsculas normalizados; `false` con consulta vacía y con nombre parcial. Verificación: los tres casos pasan.
- [x] 3.3 `generatePublicId()`: el resultado casa con `/^CP-[A-Z2-9]{4}$/` y no coincide con ningún `publicId` de la lista recibida, incluida una lista no vacía. No mockear `Math.random()` (design, decisión 7). Verificación: los dos asertos pasan en 100 iteraciones dentro del mismo test.
- [x] 3.4 `buildInitials()`: nombre de dos palabras da dos iniciales en mayúscula; nombre de una palabra; nombre con espacios sobrantes. Verificación: los tres casos pasan.
- [x] 3.5 `buildGroup()`: recorta `name`, `gradeLabel` y `teacherName`; arranca con `students`, `pendingRequests` e `invitations` vacíos; conserva `capacity`; y genera un `publicId` que no colisiona con los salones existentes. Verificación: los asertos pasan.
- [x] 3.6 `buildStudentFromRequest()`: traslada `studentId`, nombre, iniciales y tono de avatar de la solicitud, y arranca con las habilidades a cero. Verificación: los asertos pasan.
- [x] 3.7 `getClassGroupStats()`: comprobar el cálculo sobre un salón construido a mano con alumnos conocidos, y el caso borde de salón sin alumnos (no debe dividir entre cero). Verificación: ambos casos pasan.
- [x] 3.8 `formatLastActivity()` y `formatRelativeTime()`: congelar el reloj con `vi.useFakeTimers()` y `vi.setSystemTime()`, restaurarlo en `afterEach`, y cubrir los tramos de la función más el caso de `null` y el de fecha futura (que `formatRelativeTime` acota a cero con `Math.max`). Verificación: los casos pasan y ningún test posterior queda con el reloj falso.
- [x] 3.9 `pickAvatarTone()`: la misma semilla devuelve siempre el mismo tono y el valor pertenece a la lista de tonos. Verificación: los dos asertos pasan.

## 4. Tests de `ClassroomsProvider.tsx` (transiciones)

Archivo: `apps/web/src/context/ClassroomsProvider.test.tsx`. Todo se lee y se actúa
a través de `useClassrooms()`, nunca del estado interno (design, decisión 5).

- [x] 4.1 Estado inicial: sin nada en `localStorage`, `membership` es `{ status: 'none', groupId: null }`, `currentGroup` es `null` y `groups` trae la semilla de `buildSeedGroups()`. Verificación: los tres asertos pasan.
- [x] 4.2 `requestJoin()`: el estado pasa a `pending` con el `groupId` pedido, y la solicitud aparece en `pendingRequests` del salón con el `studentId` del alumno de la sesión. Verificación: ambos asertos pasan.
- [x] 4.3 `cancelJoinRequest()`: el estado vuelve a `none` y la solicitud desaparece de la bandeja del tutor. Verificación: ambos asertos pasan.
- [x] 4.4 `acceptRequest()` y `rejectRequest()`: aceptar pasa el estado a `member`, mete al alumno en `students` y quita la solicitud; rechazar devuelve el estado a `none` y quita la solicitud sin añadir alumno. Verificación: los dos flujos pasan.
- [x] 4.5 `removeStudent()`, `leaveGroup()` y `deleteGroup()`: los tres devuelven el estado del alumno a `none`; `deleteGroup()` además saca el salón de `groups` y deja `currentGroup` en `null`, también cuando el alumno sólo estaba en espera. Verificación: los tres casos pasan.
- [x] 4.6 `createGroup()` e `inviteByEmail()`: crear añade el salón a `groups` y devuelve el creado; invitar añade la invitación con el correo normalizado a minúsculas y en estado `pending`. Verificación: ambos asertos pasan.
- [x] 4.7 Identidad bajo StrictMode: crear un salón y enviar una solicitud produce **un** elemento nuevo, no dos, y con un solo id y una sola marca de tiempo. Cubre el requisito «Mutaciones estables bajo StrictMode» de `openspec/specs/store-salones/spec.md`. Verificación: la longitud crece exactamente en uno en ambos casos.
- [x] 4.8 Documentar el comportamiento actual de `requestJoin()` sin pertenencia previa comprobada: un test que llame a `requestJoin()` estando ya en estado `member` y afirme lo que hoy ocurre —el `membership` se sobrescribe—, con un comentario que apunte a `docs/CONTEXT.md` §3 P3 tarea 5. **No corregir el provider** (design, Non-Goals). Verificación: el test pasa describiendo el comportamiento de hoy, no el deseado.

## 5. Tests de persistencia (grupo acotado, mortal en P3)

Van en un `describe` propio dentro de `ClassroomsProvider.test.tsx`, encabezado
por un comentario que avise de que P3 los sustituye o los borra (design, decisión 6).

- [x] 5.1 Persistencia versionada: tras una mutación, `localStorage['codeplay:classrooms']` contiene `version: 1`, los salones y la pertenencia. Verificación: el JSON leído tiene las tres claves.
- [x] 5.2 Restauración: sembrar el almacenamiento **antes** de montar (el estado inicial sólo se lee una vez) y comprobar que el provider arranca con esos salones y esa pertenencia. Verificación: `groups` y `membership` salen del estado sembrado, no de la semilla.
- [x] 5.3 Resiembra por versión distinta: con `version: 99` guardada, el provider descarta el estado y arranca con la semilla. Verificación: `groups` iguala `buildSeedGroups()`.
- [x] 5.4 Resiembra por contenido corrupto: con un JSON inválido y con un JSON válido sin lista `groups`, el provider arranca con la semilla y no lanza. Verificación: ambos casos pasan sin excepción.

## 6. Documentación de la herramienta

- [x] 6.1 Añadir `test` / `test:run` a la lista de comandos de `CLAUDE.md` y de `docs/CONTEXT.md` §1.2, y registrar Vitest y Testing Library en la tabla de stack. Verificación: `grep -n "vitest" CLAUDE.md docs/CONTEXT.md` devuelve resultados.
- [x] 6.2 Replicar el mismo cambio de stack y comandos en el bloque `context` de `openspec/config.yaml`, que es el punto de duplicación deliberada del proyecto. Verificación: `npx openspec doctor` no reporta errores de parseo del YAML.

## 7. Verificación final

- [x] 7.1 Ejecutar `npm run test:run` desde la raíz. Verificación: toda la suite pasa en verde y el número de tests coincide con los grupos 3, 4 y 5.
- [x] 7.2 Ejecutar `npm run lint`. Verificación: sale con 0 errores y 0 warnings, porque corre con `--max-warnings 0` y hoy pasa limpio.
- [x] 7.3 Ejecutar `npm run build`. Verificación: `tsc` typechequea también los archivos de test —van dentro de `src`— y el build termina sin errores, igual que antes del cambio.
