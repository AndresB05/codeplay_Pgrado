## Why

`public.invitations` guarda `email text not null` —con índice por `lower(email)`—
y esa columna es **el único sitio del esquema donde se almacena el correo de un
tercero**: alguien que no tiene cuenta, que no ha aceptado nada y que, siendo
esta una plataforma para niños, **puede ser un menor**. La fila la escribe el
tutor desde `InviteByEmailPanel`, no su dueño.

Tres cosas se cruzan ahí, y la tercera es la que no admite espera:

1. **Nadie borra esas filas.** La aplicación sólo inserta
   (`classrooms.service.ts:483`): no hay un solo `delete` sobre `invitations` en
   todo el front, aunque la política y el `grant` existan. `expires_at` —por
   defecto 14 días— y `status` son decorativos: nada los evalúa, nada marca
   `expired`, nada purga. La única desaparición posible es en cascada, al borrar
   el salón o la cuenta del tutor.
2. **El titular de ese dato nunca es informado**, porque nunca se le pide nada.
3. **La finalidad no se ejecuta.** El panel «registra la invitación, **no envía
   correo**» —el envío real es el paso 19, sin servicio contratado—, así que hoy
   se conserva indefinidamente el correo de un tercero **para algo que no
   ocurre**.

El paso 14 sacó esto a la luz. La política de privacidad y el consentimiento
esperan a una decisión pendiente del usuario; **esto no espera a nadie**, porque
la forma más barata y más limpia de proteger un dato que no se usa es no
guardarlo.

## What Changes

- **El panel deja de pedir y de almacenar la dirección.** En su lugar explica
  cómo entra hoy un niño en un salón de verdad: el tutor le comparte el **ID
  público** (`CP-XXXX`) y el niño lo busca y solicita entrar. Es el camino que
  **sí funciona** desde el paso 10, y sustituye a un formulario que prometía un
  envío inexistente.
- **La lista «Invitaciones enviadas» desaparece con él.** No se sustituye por
  otra lista: sin filas que escribir no hay nada que listar, y el título mentía
  —no se enviaba nada—. Lo que queda en su sitio es la instrucción del ID
  público.
- **BREAKING (esquema):** migración nueva que hace `drop column email` sobre
  `public.invitations` y elimina el índice `invitations_email_idx`. La tabla
  **sobrevive** con `token`, `status` y `expires_at` para cuando el paso 19
  traiga el envío y el enlace canjeable; lo que se va es el dato personal.
- **BREAKING (API del store):** `inviteByEmail` sale de `ClassroomsContext`, de
  `ClassroomsProvider` y del servicio. Con ella se van `EmailInvitation` y
  `ClassGroup.invitations`, y la lectura de `invitations` sale de la consulta de
  salones —una consulta menos por carga—.
- **Se retira un test, y consta aquí para que no parezca un descuido:**
  `ClassroomsProvider.test.tsx:416` («inviteByEmail añade la invitación con el
  correo normalizado») prueba exactamente el comportamiento que se elimina. No
  se «arregla» un test que falla: se retira uno cuyo objeto deja de existir. El
  doble de `test/fakeClassroomsService.ts` pierde su tabla de invitaciones.
- **Queda anotada la decisión de conservación** que tomó el usuario y que este
  cambio hereda: los datos viven **mientras exista la cuenta**, con borrado en
  cascada al borrarla —que es lo que el esquema ya hace—, más la **purga a los
  14 días** de las invitaciones por `expires_at` **cuando el paso 19 vuelva a
  crear filas**. Hoy no hay nada que purgar porque no se escribe nada.

### Lo que NO entra

El texto de la política de privacidad y su página, que dependen de una decisión
pendiente —quién figura como responsable del tratamiento—. El consentimiento del
acudiente y su tabla, que van detrás de la política. El apodo elegido y la
proyección doble del roster, que son de ese mismo cambio de consentimiento. Y el
envío real de correos, que es el paso 19.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `salones-tutor`: se **elimina** «Registro de invitaciones por correo» —el
  sistema deja de registrar invitaciones y de almacenar direcciones— y se
  **añade** en su lugar cómo el tutor suma alumnos hoy, compartiendo el ID
  público, con la prohibición explícita de almacenar el correo de un tercero.
- `backend-supabase`: «Esquema del módulo de salones» dice hoy que se guardan
  «las invitaciones por correo con su token y su caducidad». Pasa a decir que se
  guarda la invitación **sin dirección de correo**.

## Impact

**Depende de Supabase y SÍ necesita `db push`.** La migración que elimina la
columna sólo puede lanzarla el usuario, porque la CLI pide credenciales por
consola. Sin ese `db push` la columna sigue en la base real —vacía de escrituras
nuevas, pero con lo que ya haya dentro—, así que **el cambio no está terminado
hasta que se lance**. Después hay que regenerar `types/database.types.ts` con la
CLI, nunca a mano.

| Archivo | Qué cambia |
| --- | --- |
| `supabase/migrations/` | **Nueva.** `drop column email` e índice `invitations_email_idx` |
| `apps/web/src/types/database.types.ts` | Regenerado con la CLI tras el `db push` |
| `apps/web/src/components/dashboard/teacher/InviteByEmailPanel.tsx` | Deja de pedir correo; explica el ID público. Desaparece la lista |
| `apps/web/src/services/classrooms.service.ts` | Fuera `inviteByEmail()` (línea 483) y la lectura de `invitations` (línea 212) |
| `apps/web/src/context/ClassroomsProvider.tsx` | Fuera el callback `inviteByEmail` (línea 163) |
| `apps/web/src/context/ClassroomsContext.ts` | Fuera la firma (línea 24) |
| `apps/web/src/types/classroom.types.ts` | Fuera `EmailInvitation` y `ClassGroup.invitations` |
| `apps/web/src/test/fakeClassroomsService.ts` | Fuera su tabla de invitaciones |
| `apps/web/src/context/ClassroomsProvider.test.tsx` | Se retira el test de la línea 416 |
| `apps/web/src/components/dashboard/teacher/classroomsData.test.ts` | Fuera `invitations: []` del dato de ejemplo |
| `docs/CONTEXT.md`, `docs/ROADMAP.md`, `openspec/config.yaml` | Estado, la fila 🟡 de §2.3 y la decisión de conservación |

**Riesgo conocido:** los 67 tests de hoy. Sólo deberían moverse los que tocan
invitaciones —uno se retira y el doble se ajusta—; los 28 restantes de
`ClassroomsProvider` tienen que seguir pasando. Si falla otra cosa, es señal.
