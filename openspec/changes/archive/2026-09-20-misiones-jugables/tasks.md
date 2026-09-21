## 1. La migración: catálogo y tablas

- [x] 1.1 Crear `supabase/migrations/202606030044_playable_missions.sql` con
      `create table public.mission_catalog` —clave, título, descripción,
      `difficulty_label` con `check`, `awarded_xp`, `sort_order`—, su RLS de
      lectura para `authenticated` y el `revoke` de escritura. Verificar leyendo
      el SQL que copia la forma de `achievement_catalog` de la `0036`.
- [x] 1.2 Sembrar las cuatro misiones del `proposal.md` con `on conflict do
      nothing`, nombrando los mundos con su **nombre nuevo**. Verificar que
      ninguna descripción nombra bucles, condicionales, funciones, estructuras de
      datos, variables ni depuración.
- [x] 1.3 Añadir el `delete` defensivo de asignaciones cuya clave no esté en el
      catálogo y después la clave ajena de `mission_assignments.mission_key`
      contra `mission_catalog`. Verificar que el `delete` va **antes** del
      `alter table`, o la clave ajena falla.
- [x] 1.4 Crear `public.mission_completions` con `unique (user_id, mission_key)`,
      `group_id` **not null**, sin ningún `grant` de escritura, y la política de
      lectura de tres ramas de `design.md`. Verificar que el `grant` concedido es
      **sólo `select`**.

## 2. La migración: la concesión

- [x] 2.1 Escribir `public.award_missions(input_user_id uuid) returns jsonb`,
      `security definer` con `set search_path = public`: busca los salones del
      niño, las misiones asignadas a ellos que todavía no tenga cumplidas,
      evalúa cada condición, inserta con `on conflict do nothing` y suma el XP a
      `profiles.total_xp`. Verificar con `grep` que **no aparece ni un
      `array || `** en el archivo: todas las acumulaciones usan `array_append`.
- [x] 2.2 Escribir las cuatro condiciones: `clear_world_N` con el orden leído por
      `split_part(mission_key, '_', 3)::integer` y exigiendo
      `completion_status = 'completed'` en todos los niveles publicados de ese
      mundo; y `flawless_3` contando niveles publicados con `best_score >= 100`.
      Verificar que las tres de mundo exigen **superar** y no la marca máxima, que
      es lo que las separa del logro `perfect_world_N`.
- [x] 2.3 Escribir `public.assign_mission_to_groups(input_group_ids uuid[],
      input_mission_key text) returns jsonb`, `security definer`: rechaza con
      `42501` si falta sesión o si alguno de los salones no es del tutor, inserta
      las asignaciones con `on conflict do nothing`, y **en un bloque
      `begin … exception` aparte** recorre a los alumnos llamando a
      `award_missions`. Verificar que el motivo del fallo sale en
      `missions_error` y que la asignación sobrevive a ese fallo.
- [x] 2.4 Reescribir `public.submit_level_attempt` **partiendo del texto de la
      `202606030040`**, no de memoria. Añadir la variable de misiones, el tercer
      bloque `begin … exception` después del de logros y antes de leer
      `total_xp`, y las claves `completed_missions` y `missions_error` en el
      `jsonb` devuelto.
- [x] 2.5 Diffear la función nueva contra el texto de la `0040` y comprobar que
      el diff enseña **exactamente** eso: la variable, el bloque y las dos
      claves. Cualquier otra diferencia es un error a corregir antes de seguir.
- [x] 2.6 **PARADA — el SQL se lee entero antes del `db push`** (`ROADMAP.md`
      §1.3, punto 9), con el diff del 2.5 delante. Esta casilla la marca quien lo
      haya leído, no quien lo escribió.
- [x] 2.7 El **usuario** lanza `npx supabase db push`. Verificar en la salida que
      aplica `202606030044` y **ninguna otra**.
- [x] 2.8 El **usuario** lanza `npx supabase gen types`; reconvertir
      `apps/web/src/types/database.types.ts` a **UTF-8 con LF** y verificar con
      `git diff` que sólo aparecen las tablas y funciones nuevas, sin que el
      archivo entero cambie de final de línea.

## 3. Tipos y servicios

- [x] 3.1 En `apps/web/src/types/classroom.types.ts`, rehacer `Mission` —clave,
      título, descripción, dificultad y XP— y retirar `SkillKey` y
      `estimatedMinutes`. Verificar que `npm run build` señala todos los
      consumidores rotos, que son los del punto 4.
- [x] 3.2 En `apps/web/src/components/dashboard/teacher/classroomsData.ts`,
      retirar `missionCatalog`, `SKILL_LABELS` y `getSkillLabel`. Verificar con
      `grep` que no queda ninguna referencia a los tres en `apps/web/src`.
- [x] 3.3 En `apps/web/src/services/missions.service.ts`, añadir la lectura del
      catálogo y la de los cumplimientos, y cambiar `assignMission` para que pase
      por `assign_mission_to_groups`. Verificar que sigue devolviendo
      `{ data, error }` con `AppError` y que **nunca lanza**.
- [x] 3.4 En `apps/web/src/types/progress.types.ts` y
      `apps/web/src/services/attempts.service.ts`, añadir las misiones cumplidas
      al resultado de la partida, leídas **blandas** como los logros. Verificar
      con un test que una respuesta sin el campo, o con basura dentro, devuelve
      lista vacía y no rompe la partida.
- [x] 3.5 Ampliar `apps/web/src/hooks/useMissionAssignments.ts` para que traiga
      también catálogo y cumplimientos por el mismo camino único de carga.
      Verificar que el camino silencioso sigue sin declarar espera.

## 4. Pantallas

- [x] 4.1 En `apps/web/src/components/dashboard/shared/AssignedMissionsPanel.tsx`,
      pintar el catálogo de la base y sustituir «Todavía no puedes jugarla» por
      el estado real: cumplida, o qué hace falta. Verificar que una misión
      cumplida **sigue viéndose** y no desaparece.
- [x] 4.2 En `apps/web/src/components/dashboard/teacher/TeacherPanelModule.tsx`,
      pintar «Cumplida» o «Pendiente» con el dato real y retirar el aviso de que
      nadie puede cumplirlas. Verificar que con «Todos» elegido el apartado sigue
      sin mostrarse y que un salón sin alumnos lo sigue diciendo.
- [x] 4.3 En `AchievementToast.tsx` y `StudentLevelModule.tsx`, añadir el `kind`
      a la cola para que una misión diga «¡Misión cumplida!» con su icono.
      Verificar con un test que un logro y una misión de la misma partida salen
      **uno detrás de otro** en la misma cola.

## 5. Verificación contra la base real

- [x] 5.1 Con la cuenta de tutor de `.env`, comprobar por REST que
      `mission_catalog` tiene las cuatro filas con su XP, y que un `insert` en
      `mission_assignments` con una clave inventada responde `23503`.
- [x] 5.2 Anotar el `total_xp` de la cuenta de niño de `.env` **antes de nada**.
      Asignar las cuatro misiones a su salón desde el panel del tutor —entrando
      con el botón «Sin login», disparado **por JS** y no por coordenadas— y
      comprobar que las cuatro salen «Cumplida» para esa cuenta **sin que vuelva a
      jugar**: ya tiene los nueve niveles al 100.
- [x] 5.3 Comprobar que su `total_xp` subió **exactamente 1600** y que
      `mission_completions` tiene cuatro filas con el `group_id` de su salón.
- [x] 5.4 Retirar una misión y volver a asignarla; comprobar que sigue
      «Cumplida», que `mission_completions` **no gana una quinta fila** y que el
      `total_xp` **no vuelve a subir**.
- [x] 5.5 Comprobar el negativo con una de las otras dos cuentas de niño del
      salón, que no tiene los nueve niveles: sale «Pendiente» en las misiones
      cuya condición no cumple.
- [x] 5.6 Comprobar con la cuenta del segundo tutor, que no tiene salones, que
      `assign_mission_to_groups` contra el salón ajeno responde **42501**.
- [ ] 5.7 **NO VERIFICADA, y se archiva así por decisión del usuario.** Jugar una
      partida de verdad con una cuenta a la que le falte una misión, y ver el
      aviso «¡Misión cumplida!» disparándose. **Por qué no se pudo:** la única
      cuenta a la que entra el botón «Sin login» —`VITE_DEV_CHILD_*`— ya tiene
      las cuatro cumplidas, y las otras dos del salón no tienen sus credenciales
      en `.env`. Es el mismo hueco que el paso 22 dejó con su propio aviso, y se
      cierra igual: con una partida real de quien tenga esas credenciales.
      **Axoluk está a un solo nivel**: tiene 2 al 100 y «Ni un paso de más» pide
      3. Lo que sí está comprobado es que el bloque de misiones corre dentro de
      una partida real sin error, y que la cola del aviso los encola juntos.

## 6. Cierre

- [x] 6.1 `npm run lint`, `npm run test:run` y `npm run build`: los tres pasan.
      Comparar los tests por los nombres de los `it(` contra `git show HEAD:`,
      no por el total.
- [x] 6.2 Propagar a `docs/CONTEXT.md` §2.8 —que deja de decir que las misiones
      no son funcionales—, a `docs/CONTRATO-DE-INTEGRACION.md` §8 —tachar el
      último cabo abierto— y a `docs/ROADMAP.md`, anotando el **calendario de
      misiones** como cabo suelto para después de la prueba preliminar.
- [x] 6.3 Revisar a mano el `## Purpose` de `openspec/specs/misiones-asignadas/spec.md`:
      hoy dice «y por qué su cumplimiento sale hoy entero en pendiente», que deja
      de ser cierto. Ningún delta lo transporta (`ROADMAP.md` §1.3, punto 6).
- [x] 6.4 Replicar en `openspec/config.yaml` lo que cambie de stack, estructura o
      convenciones, y comprobar con `npx openspec doctor` que sigue parseando.
