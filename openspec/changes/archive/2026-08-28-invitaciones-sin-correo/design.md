## Context

Ver `proposal.md` — Why. Lo que hace falta para entender las decisiones es lo que
hay hoy, comprobado en el esquema y en el código:

- `public.invitations` (migración `202606030013`): `group_id`, `invited_by`,
  **`email text not null`**, `token text unique` con `extensions.gen_random_bytes`,
  `status` con `check (pending|accepted|expired)`, `expires_at` por defecto
  `+ interval '14 days'`, `sent_at`, `accepted_at`. Índices por `group_id` y por
  `lower(email)`.
- RLS: sólo el tutor del salón hace `select`, `insert` y `delete`; revocada de
  `public` y de `anon`. Hay `grant` de `delete`, **pero ninguna pantalla lo usa**.
- El front sólo inserta (`classrooms.service.ts:483`) y lee
  (`classrooms.service.ts:212`). No hay un `delete` sobre `invitations` en todo
  `apps/web/src`.
- El panel avisa por escrito de que el envío «todavía no está conectado». La
  funcionalidad nunca ha funcionado: registra y nada más.

## Goals / Non-Goals

**Goals:**

- Que el esquema deje de poder almacenar el correo de alguien sin cuenta.
- Que el tutor conserve una vía real para sumar alumnos, no un formulario roto.
- Que el paso 19 se encuentre el terreno preparado y no una tabla borrada.

**Non-Goals:**

- No se implementa el envío de correos ni el enlace canjeable: es el paso 19.
- No se toca `class_groups`, `class_memberships` ni `join_requests`.
- No se escribe la política de privacidad: depende de una decisión pendiente.
- No entra el apodo elegido ni la proyección doble del roster: son del cambio de
  consentimiento, que va detrás de la política.

## Decisions

### 1. Se elimina la columna, no sólo la escritura

La alternativa barata era dejar de escribir desde el front y no tocar la base.
Se descarta por dos motivos. El primero: **no borra lo que ya hay dentro**, y el
problema no es sólo que se sigan guardando direcciones, es que las guardadas
siguen ahí sin plazo. El segundo: una columna `not null` viva es una invitación
permanente a volver a llenarla; cualquier camino futuro —el propio paso 19, sin
ir más lejos— la encontraría disponible y la usaría sin volver a hacerse la
pregunta. Quitarla obliga a que esa decisión se vuelva a tomar explícitamente.

`drop column` se lleva por delante el índice `invitations_email_idx`, pero se
elimina también de forma explícita en la migración para que quede escrito qué se
está retirando y por qué.

### 2. La tabla sobrevive; lo que se va es el dato personal

Descartado `drop table`. La migración `202606030013` dejó resuelto lo caro de esa
tabla —el token con `extensions.gen_random_bytes` calificado, la caducidad, las
tres políticas, los `grant` y la cascada—, y nada de eso es el problema. El
problema es una columna. Borrar la tabla entera obligaría al paso 19 a rehacer
ese trabajo y a repetir el análisis de ciclos de RLS desde cada escritura.

Queda una tabla sin escrituras hasta el paso 19. Es deuda visible y anotada, no
un olvido: sin `email` no puede filtrarse nada por ella.

### 3. Qué se ve en el sitio del formulario

El panel no se queda vacío ni se retira la sección: **se sustituye por la
instrucción de la vía que sí funciona**. El tutor ve el ID público de su salón
—`CP-XXXX`, que ya se genera desde el paso 9— y la explicación de que el niño lo
busca y solicita entrar, con la solicitud llegando a la bandeja que ya existe.

Las tres alternativas y por qué no:

- **Dejar el formulario sin guardar nada.** Sigue prometiendo un envío que no
  existe; el problema legal se va y el engaño se queda.
- **Generar un enlace de invitación con el `token`.** Es lo que pide P5, pero
  hoy **nada canjea ese token**: sería cambiar una promesa falsa por otra.
- **Retirar la sección entera.** Deja al tutor sin ninguna respuesta a «¿cómo
  meto a mis alumnos?», que es una pregunta legítima con respuesta real.

La lista «Invitaciones enviadas» desaparece y no se sustituye por otra lista: sin
filas nuevas no hay nada que listar, y el título era falso —no se enviaba nada—.

### 4. Nota para el paso 19, que hoy no se puede arreglar

`InviteByEmailPanel.tsx:134` pinta el estado con
`invitation.status === 'pending' ? 'Pendiente' : 'Aceptada'`, así que una
invitación **caducada** se pintaría como «Aceptada». Hoy está dormido porque sólo
existen filas `pending` y nada marca `expired`. Ese código se va con este cambio,
así que el defecto se va con él; queda escrito aquí para que **quien reconstruya
la lista en el paso 19 no repita el ternario**: los tres estados del `check` son
tres, no dos.

### 5. La API del store pierde una acción, y esa frontera se respeta

`inviteByEmail` sale de `ClassroomsContext`, del provider y del servicio, y con
ella `EmailInvitation` y `ClassGroup.invitations`. Dejar la acción viva sin
efecto sería peor que quitarla: una vista podría llamarla y creer que hizo algo.

La lectura de `invitations` sale también de la consulta de salones. Sin
escrituras siempre devolvería vacío, así que es una consulta menos en cada carga
del panel del tutor.

Ningún componente habla con Supabase por su cuenta: la frontera de
`useClassrooms()` no se toca, sólo se estrecha su superficie.

### 6. Un test se retira, y no es lo mismo que arreglarlo

`ClassroomsProvider.test.tsx:416` comprueba que `inviteByEmail` normaliza el
correo a minúsculas. Ese comportamiento deja de existir, así que el test se
retira: no se está silenciando una señal, se está retirando la prueba de una
función eliminada. Los otros 28 del archivo tienen que seguir pasando sin
tocarlos, y si alguno se mueve es señal de que el corte llegó más lejos de lo
previsto.

## Risks / Trade-offs

- **El cambio no está terminado sin `db push`, que sólo lanza el usuario** → El
  código puede quedar listo antes; hasta el `db push` la columna sigue en la base
  real. Las tareas lo separan explícitamente y la verificación contra la base va
  después.
- **`database.types.ts` queda desincronizado entre el `db push` y su
  regeneración** → Se regenera con la CLI inmediatamente después, nunca a mano, y
  `npm run build` es lo que lo delata si no se hizo.
- **Queda una tabla sin uso hasta el paso 19** → Anotada como deuda en
  `CONTEXT.md`. La alternativa, borrarla, cuesta más y no aporta nada hoy.
- **El tutor pierde una funcionalidad de su panel** → Perdía ya: lo que pierde es
  un formulario que no enviaba nada. A cambio recibe la instrucción del camino
  que sí funciona.

## Migration Plan

Una migración nueva en `supabase/migrations/`, sin datos que trasladar: elimina
el índice `invitations_email_idx` y la columna `email`. Las direcciones que haya
en la base real desaparecen con la columna, que es el objetivo.

**Requiere `db push` del usuario**, y después regenerar `database.types.ts` con
`npx supabase gen types typescript --linked`.

Revertir es volver a añadir la columna, pero **el dato no vuelve** y no debe
volver: recuperarlo exigiría una decisión nueva y un envío que lo justifique.
