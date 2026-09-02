## 1. Migración

- [x] 1.1 Escribir `supabase/migrations/202606030021_publish_realtime_tables.sql`: añadir `join_requests`, `class_memberships` y `mission_assignments` a `supabase_realtime`, cada `alter publication` guardado por una comprobación contra `pg_publication_tables` dentro de un bloque `do`. **Sin `create publication` y sin tocar qué operaciones emite** (design, decisión 7). Verificar leyendo el archivo: sólo hay `alter publication ... add table`, y volver a ejecutarlo no fallaría.
- [x] 1.2 Añadir la entrada de la 0021 al detalle migración por migración de `supabase/README.md`, diciendo que la publicación ya existía con cero tablas y las cuatro operaciones activas. Verificar que el archivo la lista junto a la 0020.
- [x] 1.3 Añadir el paso 18 a la tabla de `docs/ROADMAP.md` §2.2 —pasos que requieren a una persona—, con «lanzar `npx supabase db push`» como lo que hace el usuario. Verificar que la fila aparece entre las del 15 y el 19.

**AQUÍ PARA EL TRABAJO DE BASE DE DATOS.** El `db push` lo lanza el usuario, y no
lo lanza hasta que la sesión que revisa haya leído el SQL y lo haya dicho
(`docs/ROADMAP.md` §1.3, comprobación 9). **No es una tarea de esta lista y no se
marca aquí**: quien la hace cumplir es quien puede lanzarlo.

## 2. La medida que condiciona la decisión 1

**Va justo después del `db push` y antes de escribir una sola línea de
interfaz.** Que la clave anónima no reciba los borrados está **afirmado en el
spec pero razonado, no medido**, y esa clave viaja en el bundle. Si llegaran,
`postgres_changes` deja de sostenerse y el cambio se va a broadcast desde
disparadores (design, decisión 1): eso hay que saberlo antes de construir encima,
no después.

**Si sale al revés, se corrige el spec y se reabre la decisión.** No se ajusta el
escenario para que encaje con lo medido.

- [x] 2.1 Comprobar que la publicación lista las tres tablas y ninguna más de las nuestras. Verificar contra la base real, no contra el archivo de migración.
- [x] 2.2 Negativo C, adelantado: qué recibe la **clave anónima** suscrita a las tres tablas, con un positivo emparejado y simultáneo en una sesión autenticada. **MEDIDO el 2-sep-2026 y NO salió como decía el spec:** `anon` sí recibe el sobre del evento, pero **vacío** —`insert` con `errors: ["Error 401: Unauthorized"]` y cero columnas; `delete` sin siquiera la clave primaria—. **No hay fuga de datos.** De paso quedó medido que la RLS **sí** filtra los `insert`: el tutor 2, autenticado y ajeno, no recibió ni el sobre. El spec de `backend-supabase` se corrigió con lo medido; la decisión 1 se mantiene, decidida por el usuario, y el riesgo residual se revisa en el paso 27 (tarea 9.4).

## 3. Servicios

- [x] 3.1 Añadir `subscribeToClassrooms(userId, onChange): () => void` a `ClassroomsService` en `apps/web/src/services/classrooms.service.ts`: un canal con nombre único por llamada, escuchando todas las operaciones de `join_requests` y `class_memberships` en el esquema `public`, y devolviendo la cancelación que retira el canal. Verificar con `npx tsc --noEmit -p apps/web` que la interfaz y la implementación cuadran.
- [x] 3.2 Añadir `subscribeToAssignments(onChange): () => void` a `MissionsService` en `apps/web/src/services/missions.service.ts`, igual pero sobre `mission_assignments` y sin parámetro de usuario (design, decisión 2). Verificar igual.

## 4. Store de salones

- [x] 4.1 En `apps/web/src/context/ClassroomsProvider.tsx`, extraer el cuerpo de `refresh()` a un único `runLoad(silent)` con `refresh()` y `refreshSilently()` encima: el camino silencioso **no** ejecuta `setLoading(true)` y **sí** conserva todos los `setLoading(false)`. No duplicar la función. Verificar que los 28 tests del provider siguen pasando sin tocarlos.
- [x] 4.2 En el mismo archivo, suscribirse en un efecto guardado por `userId` —sin `userId` no se abre ningún canal— llamando a `service.subscribeToClassrooms` y devolviendo su cancelación como limpieza, con `refreshSilently()` como reacción. Verificar con el test de 5.3, que falla si el canal queda vivo tras desmontar.
- [x] 4.3 Dar a `apps/web/src/test/fakeClassroomsService.ts` la capacidad de emitir: implementar `subscribeToClassrooms` registrando el callback, exponer un `emit()` que los dispare y un recuento de suscripciones vivas para poder afirmar que la limpieza ocurrió. Verificar que los tests existentes siguen pasando.

## 5. Tests del store

- [x] 5.1 Test: con el tutor cargado, `server.emit()` tras sembrar una solicitud hace que la solicitud aparezca en el store sin volver a montar. Verificar que pasa.
- [x] 5.2 Test: con el store **ya cargado**, un evento **no** vuelve a poner `loading` en alto en ningún render. Es el test que fija la decisión 5 y sin él el arreglo se deshace solo.
- [x] 5.3 Test: bajo `StrictMode` queda **una sola** suscripción viva, y al desmontar queda **cero**. Verificar que pasa.
- [x] 5.4 Test: sin usuario (`user: null`) no se abre ninguna suscripción. Verificar que pasa.

## 6. Misiones

- [x] 6.1 En `apps/web/src/hooks/useMissionAssignments.ts`, el mismo tratamiento que 4.1: un solo camino de carga, el silencioso sin el `setLoading(true)` de la línea 34 y sin el `setError(null)` de entrada —el error se fija con el resultado (design, decisión 5)—, conservando todos los `setLoading(false)`.
- [x] 6.2 En el mismo archivo, suscribirse con `missionsService.subscribeToAssignments` en un efecto guardado por `userId`, devolviendo la cancelación como limpieza y recargando en silencio.
- [x] 6.3 Tests en `apps/web/src/components/dashboard/shared/AssignedMissionsPanel.test.tsx`, con `subscribeToAssignments` añadido al mock del servicio: un evento hace aparecer una misión recién asignada sin volver a montar, y —el que fija la decisión 5— un evento **no** vuelve a poner `loading` en alto, así que el panel no desaparece. Verificar que pasan.
- [x] 6.4 Completar el mock de `missionsService` en `apps/web/src/components/dashboard/teacher/TeacherPanelModule.test.tsx:15-21`, que hoy declara sólo `listAssignments`, `assignMission` y `unassignMission`. `TeacherPanelModule.tsx:100` monta el mismo hook, así que en cuanto éste llame a `subscribeToAssignments` ese test muere con *is not a function*. **Se completa el mock, no se toca el test**: los `it(` de ese archivo siguen siendo los mismos y se comprueban por nombre contra `git show HEAD:<ruta>` (`docs/ROADMAP.md` §1.3, comprobación 7).

## 7. Verificación final del código

- [x] 7.1 `npm run lint` con cero warnings, `npm run test:run` en verde y `npm run build` sin errores nuevos. Comparar los tests **por el nombre de cada `it(`** contra `git show HEAD:<ruta>`, no por el total.

## 8. Verificación contra la base real

Se apoya en el salón `CP-5J6H` «salon sigma» del tutor 1, que se conserva a
propósito (`docs/CONTEXT.md` §2.7), y en las cuentas de `apps/web/.env`. **Nunca
imprimir una contraseña ni un `access_token` en la salida.**

- [x] 8.1 Caso 1, con dos navegadores: el tutor 1 con el panel abierto ve entrar la solicitud del niño sin recargar. Comprobar además que el panel **no** se sustituye por el spinner y que no se pierde lo escrito en un formulario abierto.
- [x] 8.2 Caso 2, con dos navegadores: el niño ve que lo aceptan, que lo rechazan y que lo retiran, las tres sin recargar y sin spinner sobre la pantalla del salón.
- [x] 8.3 Caso 3, con dos navegadores: el niño ve aparecer la misión que el tutor acaba de asignar y desaparecer la que retira, sin recargar y **sin que el panel entero se vaya** mientras tanto.
- [x] 8.4 Negativo A: el **tutor 2** (`VITE_DEV_TUTOR2_*`, sin salón propio) suscrito no recibe nada de un salón del tutor 1. Emparejar con un positivo simultáneo que sí debe llegarle, para distinguir «no llegó» de «no miré».
- [x] 8.5 Negativo B: el niño no recibe nada de un salón al que no pertenece, con su positivo emparejado.
- [x] 8.6 Anotar el resultado de 8.4 en `docs/CONTEXT.md` §2.7: **cierra el caso «un tutor asigna en el salón de otro tutor»** que el paso 16 dejó sin medir. Sustituir la nota que dice que sigue sin medir por el resultado, no añadirla debajo.

## 9. Cierre

- [x] 9.1 Decidir y ejecutar qué se hace con «salon sigma»: recogerlo ahora que el paso 18 terminó, o dejarlo puesto. **Dejar dicho cuál de las dos** en `docs/CONTEXT.md` §2.7, con lo que quede en la base.
- [x] 9.2 Actualizar `docs/CONTEXT.md`: §2.5 (el store se suscribe y la recarga ajena no declara espera), §2.7 (la 0021 en la tabla de migraciones y lo verificado con sesión real, incluido el límite de los borrados y la medida de la 2.2) y §2.8 (el niño ve la asignación en vivo). Mover el paso 18 a las capacidades aplicadas con las rutas reales.
- [x] 9.3 Marcar el paso 18 como ✅ en la secuencia de `docs/ROADMAP.md` §2, con el nombre del cambio en la columna «Vía», y ajustar la fila para que diga sincronización en vivo y no «notificaciones».
- [x] 9.4 Añadir a la tabla de cabos sueltos de `docs/ROADMAP.md` §3, con «Paso 27» en la columna de dónde se resuelve: el sobre vacío que recibe la clave anónima es ruido mientras la base tenga un salón de pruebas, pero **desplegada y con salones reales pasa a ser telemetría de uso** —cuánta actividad y cuándo— visible para cualquiera, porque la clave es pública por diseño. Verificar que la fila queda en esa tabla y no en otra.
- [x] 9.5 Replicar en `openspec/config.yaml` lo que corresponda del estado y las convenciones, y comprobar con `npx openspec doctor` que el YAML sigue parseando.
- [ ] 9.6 Preparar el commit **enumerando las rutas** en `git add`, nunca `git add -A` (`CLAUDE.md`).
