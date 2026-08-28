> **El orden importa por una razón concreta:** el código se prepara antes del
> `db push`, pero **nada se da por terminado hasta que la columna no está en la
> base real**. El `db push` lo lanza el usuario, así que el grupo 4 es una puerta
> y no un trámite: mientras no pase, el cambio está a medias y se dice.

## 1. La migración

- [x] 1.1 Crear la migración en `supabase/migrations/`, con el número siguiente al de la 0015, que elimine **el índice `invitations_email_idx` y después la columna `email`** de `public.invitations`. Los dos de forma explícita, aunque `drop column` se llevaría el índice por delante: escrito, queda constancia de qué se retira. Verificar leyendo el archivo que no toca ninguna otra tabla ni ninguna política
- [x] 1.2 Comentar **en la propia migración** por qué se va la columna —dato personal de un tercero sin cuenta, posiblemente un menor, conservado sin plazo para un envío que no ocurre— y por qué **la tabla se queda**: el token, la caducidad, las tres políticas y la cascada siguen sirviendo para el paso 19. El comentario explica el porqué, nunca el qué, como el resto del repositorio

## 2. El corte en el front, de dentro afuera

- [x] 2.1 En `apps/web/src/services/classrooms.service.ts`, retirar `inviteByEmail()` (línea 483) y sacar `invitations` de la lectura de salones (línea 212), con su `mapInvitationRow` y el `InvitationRow` que quede huérfano. Verificar con `npm run build`, que es lo que delata un tipo sin usar
- [x] 2.2 En `apps/web/src/context/ClassroomsProvider.tsx` y `ClassroomsContext.ts`, retirar el callback y su firma. **No tocar la frontera**: ningún componente pasa a hablar con Supabase, sólo se estrecha la API de `useClassrooms()`
- [x] 2.3 En `apps/web/src/types/classroom.types.ts`, retirar `EmailInvitation` y el campo `invitations` de `ClassGroup`. Verificar con `npm run build`: los consumidores que queden aparecen aquí
- [x] 2.4 En `apps/web/src/test/fakeClassroomsService.ts`, retirar su tabla de invitaciones y el método del doble, para que el doble siga teniendo la misma forma que el servicio real

## 3. La pantalla del tutor

- [x] 3.1 Reescribir `InviteByEmailPanel.tsx`: fuera el formulario de correo, fuera el aviso de «invitación registrada» y fuera la lista «Invitaciones enviadas». En su lugar, el **ID público del salón** y la explicación de que el niño lo busca y solicita entrar, con la solicitud llegando a la bandeja que ya existe. Tokens del tema, sin hex sueltos
- [x] 3.2 Renombrar el archivo y el componente si el nombre deja de describirlo —`InviteByEmailPanel` ya no invita por correo— y actualizar a **quien lo monta, que es `TeacherGroupDetailModule.tsx` y no sólo en la línea del montaje**: saca `inviteByEmail` del `useClassrooms()` de la línea 31, se lo pasa como `onInvite` en la 143, monta el panel en la 140, y además guarda el estado `inviteOpen` (línea 33) con el botón «Invitar» que lo despliega (líneas 110-114). Los cuatro sitios, decididos aquí y no descubiertos a golpes de `tsc`. Verificar con `npm run lint` y `npm run build`
- [x] 3.3 Comprobar a mano en el panel del tutor que la sección explica el ID público, que **no hay ningún campo de correo** en toda la pantalla, y que el ID que muestra es el del salón abierto

## 4. Puerta: la base real

- [x] 4.1 **La migración se lee antes de aplicarse, que es la regla desde el primer paso con esquema.** El orden es: se escribe la migración (grupo 1), el usuario se la lleva a la sesión que revisa, **la revisora lee el SQL**, y sólo entonces se pide el `db push`. No se pide el push de una migración que nadie ha leído
- [x] 4.2 Con el SQL ya revisado, **pedir al usuario que lance `npx supabase db push`**, que pide credenciales por consola y no puede lanzar esta sesión. Al lanzarlo, **leer la salida con él**: tiene que aplicar **una sola migración**, la nueva, y ninguna más. Si arrastra otras, hay migraciones sin aplicar en la base y eso se mira antes de seguir. Hasta aquí el código está listo pero **el cambio no está terminado**: la columna sigue en la base
- [x] 4.3 Con el `db push` hecho, regenerar `apps/web/src/types/database.types.ts` con `npx supabase gen types typescript --linked`. **Nunca a mano.** Verificar que `invitations` ya no declara `email` y que `npm run build` pasa
- [x] 4.4 Comprobar contra la base real, con la sesión de un tutor, que **la columna no existe**: una lectura de `invitations` pidiendo `email` responde con error de columna desconocida, y la lectura sin ella responde. Es la comprobación que distingue «lo escribí» de «está aplicado»

## 5. Tests

- [x] 5.1 Retirar de `apps/web/src/context/ClassroomsProvider.test.tsx` el test de la línea 416, que prueba exactamente la función eliminada. **No se toca ningún otro**: los 28 restantes del archivo tienen que pasar sin cambios, y si alguno se mueve es señal de que el corte llegó más lejos de lo previsto
- [x] 5.2 Quitar `invitations: []` del dato de ejemplo de `classroomsData.test.ts` (línea 41), que dejará de existir en el tipo
- [x] 5.3 Ejecutar `npm run test:run` y comprobar que quedan **66 tests**: los 67 de hoy menos el retirado. Si el número no cuadra, algo más se movió y hay que mirarlo antes de seguir

## 6. Cierre

- [x] 6.1 Ejecutar `npm run lint` (cero warnings), `npm run test:run` y `npm run build`. Los tres pasan hoy y no deben romperse
- [x] 6.2 En `docs/CONTEXT.md` §2.3, la fila «Invitar alumnos por correo | 🟡 | registra la invitación, **no envía correo**» deja de describir lo que hay: sustituirla por la vía del ID público, y anotar en las decisiones **por qué** se retiró —correo de un tercero sin cuenta, sin plazo y sin finalidad ejecutada—, que es lo que impide que alguien lo «arregle» devolviéndolo
- [x] 6.3 En `docs/CONTEXT.md`, anotar la **decisión de conservación** del usuario: los datos viven mientras exista la cuenta, con borrado en cascada al borrarla, y las invitaciones se purgan a los 14 días por `expires_at` **cuando el paso 19 vuelva a crear filas**. Anotar también la deuda visible: la tabla queda sin escrituras hasta ese paso
- [x] 6.4 En `docs/ROADMAP.md`, dejar constancia en los cabos sueltos de que el ternario de dos ramas sobre un `check` de tres estados **no debe repetirse** al reconstruir la lista en el paso 19, y actualizar la fila del paso 19 con lo que hereda: envío real, enlace canjeable y purga por caducidad desde el primer día
- [x] 6.5 Replicar en `openspec/config.yaml` lo que cambie del estado y de las convenciones, y comprobar con `npx openspec doctor` que el YAML sigue parseando. Validar con `npx openspec validate invitaciones-sin-correo`
- [x] 6.6 Al archivar, revisar **a mano** el `## Purpose` de `openspec/specs/salones-tutor/spec.md`: los deltas no lo transportan y hoy puede mencionar la invitación por correo
- [x] 6.7 Al commitear, **enumerar las rutas** en `git add`. Nada de `git add -A`
