## Why

El panel del tutor no enseña datos de ejemplo: enseña **ceros**. Las cinco barras
de habilidades dicen «0 %, 0 de 0 lo dominan» pase lo que pase, porque
`classrooms.service.ts` rellena `EMPTY_SKILLS` a cero y `hoursSinceLastActivity`
a `null` en cada fila del roster, y `getSkillReports` descarta precisamente a
quien tiene la última actividad en `null`. La columna «Última actividad» dice
«Sin actividad» y «Mundo actual» dice «—» incluso para un niño que acaba de
jugar. Medido hoy, 18 de septiembre de 2026, con la cuenta de pruebas de `.env`:
nueve niveles completados, marca de 100 en los nueve, 900 XP, 28 intentos, el
último a las 01:43 UTC — y en pantalla, «Sin actividad».

Desde el paso 21 hay progreso real escrito en `user_progress` y
`level_attempts`. Este cambio lo trae al panel.

## What Changes

- **BREAKING (para el panel del tutor): se retiran las cinco barras de
  habilidades.** Decisión del usuario del 18-sep-2026, sobre una medición: el
  juego tiene **cuatro bloques** —avanzar, girar a la izquierda, girar a la
  derecha y saltar—, sin bucle, sin condicional y sin función, comprobado en
  `apps/web/src/game/blockTypes.ts`, en `FLYOUT_BLOCKS` de
  `apps/web/src/game/blocks.ts` y en los 28 intentos guardados, donde no aparece
  ningún otro tipo de bloque. De las cinco competencias que el panel pinta, sólo
  «secuencias» tiene hoy con qué entrenarse; las otras cuatro no medirían nada
  aunque el dato llegara. Enseñar un 0 % donde no hay instrumento se lee como un
  problema de aprendizaje, y no lo es.
- **En su sitio va el progreso que el dato sí sostiene**: niveles superados y
  mundos terminados del salón, marca media de eficiencia, cuántos exploradores
  tienen actividad, y por explorador **cuántos intentos le costó cada nivel y
  cuántos pasos tuvo cada intento**.
- **«Mundo actual» y «Última actividad» dejan de estar cableadas** y muestran lo
  que dice la base.
- **El tutor ve el historial completo del niño, también el anterior a su ingreso
  al salón.** Es la decisión que §3.1 del roadmap dejaba abierta, tomada por el
  usuario el 18-sep-2026. `class_memberships.joined_at` no se usa para recortar
  nada.
- **Migración nueva**, porque el tutor hoy no puede leer nada de eso: la política
  `user_progress_select_own` de la `202606030009` es `auth.uid() = user_id`, y
  medido con sesión de tutor `user_progress` y `level_attempts` devuelven **cero
  filas**. Las lecturas se conceden por vista, como ya hizo la `202606030015` con
  `classroom_roster`.

## Capabilities

### New Capabilities

Ninguna. El cambio reescribe requisitos de capacidades que ya existen.

### Modified Capabilities

- `salones-tutor`: se **retira** el requisito «Reportes de habilidades» y entran
  en su lugar dos: qué progreso real ve el tutor de su salón, y que la tabla de
  seguimiento muestre el mundo actual y la última actividad verdaderos.
- `backend-supabase`: entra el requisito de que el progreso de un salón se lea
  **por vista**, con el alcance —tutor del salón o el propio alumno— escrito
  dentro de la vista, y de que el recuento de pasos de un intento lo haga el
  servidor leyendo el programa, no el cliente.

## Impact

**Base de datos.** El proyecto de Supabase ya está enlazado y con las 33
migraciones aplicadas —comprobado con `npx supabase migration list`—. Este cambio
añade la **`supabase/migrations/202606030034_create_classroom_progress_views.sql`**
y por tanto **necesita un `db push`, que lanza el usuario**, porque pide
credenciales por consola. La sesión sólo escribe el SQL y lo enseña. Detrás va
`gen types`, también del usuario, para que
`apps/web/src/types/database.types.ts` conozca las vistas nuevas.

**Código.**

- `apps/web/src/services/classrooms.service.ts` — fuera `EMPTY_SKILLS` y los dos
  valores cableados de `mapRosterRow`; entran las lecturas de las vistas nuevas.
- `apps/web/src/types/classroom.types.ts` — fuera `SkillReport` y
  `ClassroomStudent.skills`; entran los tipos del progreso. `SkillKey` **se
  queda**: lo usa `Mission.skill`, que es del paso 22.
- `apps/web/src/components/dashboard/teacher/classroomsData.ts` — fuera
  `getSkillReports`, `SKILL_DEFINITIONS` y `MASTERY_THRESHOLD`. `getSkillLabel`
  **se queda**, por lo mismo.
- `apps/web/src/components/dashboard/teacher/TeacherPanelModule.tsx` — fuera la
  sección «Reportes de habilidades» y el aviso de «la habilidad más floja»;
  entra el progreso real del salón.
- `apps/web/src/components/dashboard/shared/StudentRosterTable.tsx` — las dos
  columnas cableadas.
- `apps/web/src/components/dashboard/teacher/classroomsData.test.ts` y
  `TeacherPanelModule.test.tsx` — los tests de los reportes retirados se van con
  ellos; entran los del cálculo nuevo.

**Lo que NO entra:** la vista de detalle por alumno navegando mundo a mundo, que
es el paso 31.
