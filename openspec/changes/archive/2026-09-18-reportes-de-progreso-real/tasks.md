## 1. La migración, y la parada antes del `db push`

- [x] 1.1 Escribir `supabase/migrations/202606030034_create_classroom_progress_views.sql` con las tres vistas de `design.md` —`classroom_student_activity`, `classroom_level_progress` y `classroom_level_attempts`—, cada una con el filtro de alcance escrito dentro (el propio alumno, o el tutor de su salón), sus `revoke all ... from public, anon, authenticated` y su `grant select ... to authenticated`. Verificar que ninguna sentencia toca una tabla, una política o un `grant` de tabla: `grep -E 'alter table|create policy|drop policy|grant .* on (public\.)?(user_progress|level_attempts|profiles|levels|worlds)' ` sobre el archivo no devuelve nada
- [x] 1.2 Comprobar que el SQL no expone `submitted_code` en ninguna de las tres vistas, y que los pasos salen de `count_program_steps(...)` y no de `metadata`
- [x] 1.3 **PARADA.** Enseñar el SQL al usuario y esperar. El `db push` lo lanza él, nunca la sesión. Al lanzarlo, leer su salida: tiene que aplicar la `202606030034` y ninguna otra — si arrastra más, hay migraciones sin aplicar y eso se mira antes de seguir
- [x] 1.4 Verificar las tres vistas contra la base real con las cuentas de `.env`, cada positivo emparejado con su negativo: el tutor obtiene las filas de los alumnos de su salón; el segundo tutor, que no tutela a nadie, obtiene cero; el niño obtiene las suyas y ninguna de un compañero; y con la clave anónima las tres responden `42501`
- [x] 1.5 Pedir al usuario que lance `npx supabase gen types` y comprobar que `apps/web/src/types/database.types.ts` declara las tres vistas

- [x] 1.6 **Va antes que la 1.4, aunque lleve un número mayor: se anotó al descubrirla y no se renumera nada.** Escribir `supabase/migrations/202606030035_grant_step_counting.sql`, que concede el `execute` de `count_program_steps` y `count_block_chain` a `authenticated`; sin ella, pedir la columna `steps` responde `42501` a todo el mundo, medido tras aplicar la 0034. Enseñar el SQL al usuario y esperar su `db push`

## 2. El servicio y los tipos

- [x] 2.1 Retirar de `apps/web/src/types/classroom.types.ts` la interfaz `SkillReport` y el campo `ClassroomStudent.skills`, dejando `SkillKey` en su sitio porque `Mission.skill` lo usa; verificar con `npx tsc --noEmit -p apps/web` que los únicos errores que quedan son los de los consumidores que aún no se han tocado
- [x] 2.2 Añadir a `classroom.types.ts` los tipos del progreso —resumen por alumno, progreso por nivel e intento con sus pasos—, con el número de pasos anulable para el programa que el servidor no sabe leer
- [x] 2.3 En `apps/web/src/services/classrooms.service.ts`, borrar `EMPTY_SKILLS` y rellenar `currentWorld` y `hoursSinceLastActivity` desde `classroom_student_activity`, en las dos ramas del snapshot —tutor y niño—; verificar que `mapRosterRow` ya no escribe ningún valor cableado
- [x] 2.4 Crear el servicio del detalle que lee `classroom_level_progress` y `classroom_level_attempts` para un alumno, devolviendo `{ data, error }` con `AppError` y sin lanzar nunca, como el resto
- [x] 2.5 Crear el hook que lo consume, con su espera y su error declarados igual que los hooks existentes, y verificar que el panel del niño no lo monta

## 3. La pantalla

- [x] 3.1 Retirar de `apps/web/src/components/dashboard/teacher/classroomsData.ts` `getSkillReports`, `SKILL_DEFINITIONS` y `MASTERY_THRESHOLD`, dejando `getSkillLabel`; verificar que `npm run lint -w @codeplay/web` no reporta ningún export sin usar
- [x] 3.2 Retirar de `TeacherPanelModule.tsx` la sección «Reportes de habilidades», el aviso de «la habilidad más floja» y `getMasteryTone`
- [x] 3.3 Escribir en su lugar la sección de progreso del salón: las cuatro cifras del alcance y la lista de exploradores; verificar en pantalla que un alcance sin actividad lo dice con una frase y no pinta ningún porcentaje
- [x] 3.4 Añadir la tabla del explorador elegido —una fila por nivel, con mundo, marca, intentos y la tira de pasos de cada intento con el óptimo al lado—; verificar que un intento sin pasos contados se muestra sin número y no como cero
- [x] 3.5 En `apps/web/src/components/dashboard/shared/StudentRosterTable.tsx`, comprobar que «Mundo actual» y «Última actividad» pintan el dato real y que un alumno sin intentos sigue mostrando el hueco y «Sin actividad»

## 4. Tests

- [x] 4.1 Retirar de `classroomsData.test.ts` los tests de `getSkillReports` y comprobar por el nombre de cada `it(` —no por el total— que no se va ningún otro, decodificando la salida de `git show` como UTF-8
- [x] 4.2 Añadir los tests del cálculo nuevo: las cuatro cifras del alcance con un salón donde sólo uno de tres alumnos tiene progreso, el alcance vacío sin división por cero, y el intento con pasos `null`
- [x] 4.3 Comprobar que los tests nuevos tienen dientes rompiendo el código que prueban, no suponiéndolo

## 5. Verificación de punta a punta

- [x] 5.1 Con la cuenta de tutor de `.env` y el navegador, comprobar que la fila del niño que tiene los nueve niveles deja de decir «Sin actividad» y nombra su mundo
- [x] 5.2 Comprobar que lo que cuenta el panel cuadra con lo que dice la base **para la misma cuenta**, mirando las dos: niveles superados, mundos terminados, marca media, intentos por nivel y pasos de cada intento
- [x] 5.3 Comprobar que el nivel que el niño superó **antes** de entrar al salón cuenta en el informe, que es la decisión del 18-sep-2026
- [x] 5.4 `npm run lint`, `npm run test:run` y `npm run build`, los tres desde la raíz

## 6. Documentación

- [x] 6.1 Mover el paso 17 a hecho en `docs/ROADMAP.md` §2, con lo que decidió el usuario y lo que este paso deja abierto; cerrar en §3.1 la decisión del historial previo al ingreso y dejar anotado lo que hereda el paso 14
- [x] 6.2 Actualizar `docs/CONTEXT.md`: mover la entrada de «por aplicar» a «aplicadas» con las rutas reales, añadir la migración `0034` a §2.7 y anotar en §5 lo verificado contra la base
- [x] 6.3 Anotar en `docs/CONTEXT.md` el hallazgo que motivó retirar las barras —el juego tiene cuatro bloques y ninguno de bucle, condicional o función—, porque condiciona al paso 22 y no está escrito en ningún sitio
- [x] 6.4 Replicar en `openspec/config.yaml` lo que haya cambiado de stack, estructura, convenciones o prioridades, y comprobar con `npx openspec doctor` que sigue parseando
