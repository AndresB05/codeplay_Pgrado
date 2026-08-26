## 1. Base de datos: las dos vistas de lectura

- [x] 1.1 Escribir `supabase/migrations/202606030015_create_classroom_read_views.sql` con `class_group_directory` (catálogo más `member_count`) y `classroom_roster` (`group_id`, `student_id`, `joined_at`, `full_name`, `avatar_key`, `total_xp` y `current_streak`, y ninguna columna más; filtro dentro: tutor del salón o miembro del salón), ambas con `revoke all ... from public` y `from anon` por separado y `grant select ... to authenticated`. Verificar leyendo el archivo que ninguna de las dos declara `security_invoker = true`, que ninguna política existente se toca y que el `select` del roster no arrastra `email`, `country_code` ni `username`.
- [ ] 1.2 **Parar aquí y avisar:** la otra sesión lee el SQL antes de que se aplique. No continuar sin ese visto bueno. Verificar que el archivo está en el árbol y sin aplicar (`npx supabase migration list` todavía no la muestra en remoto).
- [ ] 1.3 **Bloqueante, lo lanza el usuario:** `npx supabase db push`. Verificar que la CLI reporta aplicada la 0015 y que `npx supabase migration list` la muestra en remoto.
- [ ] 1.4 Regenerar los tipos con `npx supabase gen types typescript --linked > apps/web/src/types/database.types.ts`. Verificar con `grep` que aparecen `class_group_directory` y `classroom_roster` bajo `Views`, y que el archivo no se editó a mano.
- [ ] 1.5 Comprobar las dos vistas con sesión real por HTTP, con las tres cuentas de prueba: el niño sin salón ve el catálogo con recuentos y un roster vacío; el niño inscrito ve a sus compañeros con nombre, avatar, XP y racha; el niño ve `0` filas del roster de un salón ajeno; el tutor ve el roster de sus salones y no el de otro; la clave anónima recibe `401`. Comprobar además que la respuesta del roster no trae correo, país ni nombre de usuario. Anotar el resultado de cada caso en `docs/CONTEXT.md` §2.7 al archivar.
- [x] 1.6 Documentar la 0015 en `supabase/README.md`, migración por migración como las anteriores, incluido el motivo de que sean vistas y no políticas y qué expone el roster.

## 2. Servicio de salones

- [ ] 2.1 Crear `apps/web/src/services/classrooms.service.ts` con la forma `{ data, error }` y `AppError`, sin lanzar nunca. Verificar que `npm run lint` pasa y que ningún método usa `.single()`.
- [ ] 2.2 Añadir el campo `xp` a `ClassroomStudent` en `apps/web/src/types/classroom.types.ts`, con su JSDoc, y mapearlo desde `total_xp` del roster. Verificar que `npm run build` compila y que ningún constructor de `ClassroomStudent` queda sin rellenarlo.
- [ ] 2.3 Implementar la lectura del tutor: sus salones desde `class_group_directory` filtrando por `tutor_id`, su roster, sus solicitudes pendientes con el perfil del solicitante, y sus invitaciones; todo cruzado en JavaScript porque no hay clave ajena hacia `profiles`. Verificar con un test que arma las cuatro respuestas y comprueba el `ClassGroup[]` resultante.
- [ ] 2.4 Implementar la lectura del niño: catálogo completo con recuentos, su pertenencia, su última solicitud —`order('requested_at', desc)`, `limit(1)`, `maybeSingle()`— y el roster de su salón. Verificar con un test que, con una solicitud rechazada y otra pendiente posterior, devuelve `pending` y no falla.
- [ ] 2.5 Implementar las escrituras: crear salón —enviando `tutor_id` y `public_id`, con reintento ante `23505`—, borrar salón, retirar alumno, aceptar por la RPC `accept_join_request`, rechazar por `update ... status='rejected'`, solicitar ingreso y cancelarla —enviando `student_id` explícito—, salir del salón e invitar por correo —enviando `invited_by` explícito—. Verificar con tests que cada escritura envía los campos sin default y que un error de la base vuelve como `AppError` sin lanzar.
- [ ] 2.6 Verificar el reintento del ID público con un test: el primer intento devuelve `23505`, el segundo tiene éxito, y el salón creado es uno solo.

## 3. Contexto y provider

- [ ] 3.1 Actualizar `apps/web/src/context/ClassroomsContext.ts`: `createGroup` devuelve `Promise<ClassGroup | null>`, las demás acciones `Promise<void>`, y se añaden `loading` y `error`. Verificar que `npm run build` compila.
- [ ] 3.2 Reescribir `apps/web/src/context/ClassroomsProvider.tsx` sobre el servicio: carga inicial según el rol del usuario de la sesión, recarga del estado del rol tras cada escritura, y contexto vacío sin sesión. Verificar que no queda ninguna referencia a `localStorage`, a `STORAGE_KEY` ni a `CURRENT_STUDENT_ID` con `grep` sobre el archivo.
- [ ] 3.3 Implementar en `requestJoin()` la guarda de «un alumno, un salón»: no llama al servicio si ya hay pertenencia o solicitud pendiente. Verificar con el test que hoy documenta el comportamiento contrario, invertido a su forma correcta.
- [ ] 3.4 Retirar de `apps/web/src/components/dashboard/teacher/classroomsData.ts` la semilla y las funciones que sólo la servían (`buildSeedGroups`, `buildGroup`, `buildStudentFromRequest`, los datos de ejemplo de solicitudes e invitaciones), conservando búsqueda, formato, estadísticas, `generatePublicId`, `buildInitials` y `pickAvatarTone`. Verificar con `grep` que ningún archivo importa lo retirado.

## 4. Vistas: sólo la espera

- [ ] 4.1 `TeacherGroupsModule.tsx`: `handleCreate` pasa a `async` y navega con el `id` que devuelve `await createGroup(...)`, sin navegar si devuelve `null`. Verificar creando un salón en la aplicación y comprobando que la URL de destino es la del salón recién creado.
- [ ] 4.2 `TeacherGroupDetailModule.tsx`, `TeacherDashboard.tsx` y `StudentClassroomModule.tsx`: no afirmar «ese salón ya no existe», ni mostrar el listado vacío, ni el buscador, mientras `loading` sea cierto. Verificar recargando cada pantalla con la red ralentizada y comprobando que ninguna anuncia un vacío que luego se rellena.
- [ ] 4.3 Comprobar que ninguna otra vista cambió: `git diff --stat` sobre `apps/web/src/components` y `apps/web/src/pages` no debe listar más archivos que esos tres y `classroomsData.ts`.

## 5. Tests

- [ ] 5.1 Reescribir `apps/web/src/test/renderClassrooms.tsx` para montar el provider sobre un servicio falso con estado en memoria, manteniéndolo como el único archivo que conoce las dependencias del provider. Verificar que la suite no importa `lib/supabase.ts` ni `config/env.ts`.
- [ ] 5.2 Reescribir `apps/web/src/context/ClassroomsProvider.test.tsx` conservando los 19 asertos de comportamiento —estado inicial, solicitar, cancelar, aceptar, rechazar, expulsar, salir, borrar salón, crear, invitar, estabilidad bajo StrictMode— con el mismo aserto y distinto andamio. Verificar que ninguno de los 19 cambia lo que afirma.
- [ ] 5.3 Borrar el bloque «Persistencia en localStorage» (5 tests) y añadir en su lugar los de la identidad de la sesión, el estado de carga, el error de servicio y la última solicitud. Verificar que `grep -c localStorage` sobre `src/` fuera de `guest.helpers.ts` da cero.
- [ ] 5.4 Ajustar `apps/web/src/components/dashboard/teacher/classroomsData.test.ts`: retirar los 6 tests de las funciones eliminadas, sustituir en los 2 que la usaban `buildSeedGroups()` por una lista de salones local al test, y rellenar el campo `xp` en los fixtures de `ClassroomStudent`. Verificar que los 24 restantes pasan sin cambiar lo que afirman.
- [ ] 5.5 Contar el resultado y dejarlo escrito en el commit: cuántos asertos de comportamiento hay antes y después, y cuáles se fueron con la capacidad o con la función que probaban.

## 6. Verificación final

- [ ] 6.1 `npm run lint`, `npm run test:run` y `npm run build`: los tres pasan, con cero warnings en lint.
- [ ] 6.2 Recorrer el flujo entero a mano con las tres cuentas de prueba: el tutor crea un salón, el niño lo encuentra por su ID público y solicita entrar, el tutor lo ve en la bandeja con su nombre y lo acepta, el niño ve el salón y a su compañero, el segundo niño ve el recuento de cupos moverse, el tutor expulsa, el niño vuelve a solicitar y el tutor rechaza. Verificar que cada paso se refleja en la otra sesión al recargar.
- [ ] 6.3 Comprobar el caso negativo del cupo: salón de cupo 1 lleno, aceptar a un segundo niño devuelve el error de salón lleno y la solicitud sigue pendiente, sin que la interfaz pinte al alumno dentro.
- [ ] 6.4 Dejar la base de pruebas limpia al terminar —borrar los salones creados— y anotar en `docs/CONTEXT.md` §2.7 el estado en que queda.
- [ ] 6.5 Actualizar `docs/CONTEXT.md` (§2.5 pasa a describir el store contra Supabase, §3 P3 sale de «por aplicar», §5 con la fecha y el recuento de tests), marcar el paso 10 como ✅ en `docs/ROADMAP.md` con el nombre del cambio, retirar de su §3 el cabo suelto de las solicitudes acumuladas, y replicar en `openspec/config.yaml` lo que toque al estado y a las convenciones. Verificar con `npx openspec doctor` que el YAML sigue parseando.
- [ ] 6.6 Recoger en `docs/ROADMAP.md` §3.2 la parte del ranking que este cambio decide: los niños se comparan **dentro de su salón** —XP y racha visibles entre compañeros por `classroom_roster`—, que es la alternativa que ese apartado listaba como amable frente al ranking público de menores. Dejar escrito qué sigue abierto: si además se muestra `leaderboard_weekly` fuera del salón, y dónde se pinta el XP, que es el paso 21. Verificar que §3.2 ya no describe el ranking acotado al salón como una opción sin decidir.
- [ ] 6.7 Anotar en `docs/CONTEXT.md`, donde se recogen las aristas de privacidad, que el paso 14 hereda una decisión más: un compañero ve nombre, avatar, XP y racha de otro menor. Verificar que el paso 14 del `ROADMAP.md` lo menciona.
- [ ] 6.8 Corregir a mano el `## Purpose` de `openspec/specs/store-salones/spec.md`, que hoy dice «sostener el módulo de salones sin backend»: el delta no lo toca y quedaría contradiciendo a sus propios requisitos.
