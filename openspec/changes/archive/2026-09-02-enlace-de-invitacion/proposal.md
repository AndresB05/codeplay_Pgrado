## Why

Hoy un niño sólo entra a un salón por el ID público `CP-XXXX`: lo busca, solicita
y espera a que el tutor lo acepte desde su bandeja. Es la vía que existe y
funciona, pero obliga al tutor a aprobar uno por uno a gente que él mismo acaba
de invitar, y obliga al niño —o a su familia— a copiar bien un código.

El paso 19 del roadmap son **dos** cosas: el enlace canjeable y el envío real por
correo. Éste cambio hace **sólo la primera**, y no por comodidad: el envío real
depende de un servicio de correo contratado (`ROADMAP.md` §2.2), y el enlace no
depende de nada. Además, un enlace **sin** correo no almacena la dirección de
nadie, así que esquiva entera la decisión de privacidad de `ROADMAP.md` §3.4 —la
misma que motivó la migración 0016, que borró `invitations.email` a propósito—.

La tabla `invitations` lleva desde la 0013 esperando este momento con su token,
su caducidad, sus tres políticas y su cascada. Sigue **sin una sola escritura**,
y eso está anotado como deuda visible desde entonces.

## What Changes

- **El tutor genera un enlace de invitación** desde la pantalla de su salón,
  junto al ID público que ya se le ofrece ahí. Se copia al portapapeles y él lo
  comparte por donde quiera: la plataforma no envía nada.
- **Quien abre el enlace entra al salón directamente, sin pasar por la bandeja.**
  No crea una solicitud: el tutor ya aprobó al generar el enlace, y pedirle que
  apruebe otra vez sería aprobar dos veces lo mismo. Es justo lo que distingue al
  enlace del ID público, que sigue existiendo y sigue pasando por la bandeja.
- **Quien no tiene cuenta se registra y el canje ocurre solo al terminar**, que
  es el caso normal: el tutor le pasa el enlace a una familia nueva. El token
  sobrevive al registro por contraseña **y a la vuelta por Google**, que sale de
  la aplicación entera.
- **Una invitación pendiente cancela la solicitud pendiente del niño**, en la
  misma transacción y sea del salón que sea. Hoy nadie lo había decidido y el
  esquema lo permitía: quedaría dentro de un salón con una solicitud viva en
  otro, media violación del invariante «un alumno, un salón».
- **El enlace es de un solo uso y caduca a los 14 días.** La caducidad se
  comprueba al canjear, no por el valor de la columna `status`: nada la marca
  `expired` y nada va a marcarla.
- **La lista de enlaces del tutor pinta TRES estados** —activo, usado y
  caducado—, no dos. El panel anterior usaba un ternario de dos ramas que habría
  enseñado un enlace caducado como «Aceptada»; el aviso está vivo en
  `ROADMAP.md` §3 desde `invitaciones-sin-correo`.
- **La purga por `expires_at` entra desde el primer día**, como exige el plazo de
  conservación de `CONTEXT.md` §2.7: el panel del tutor borra las invitaciones
  caducadas de sus salones al listarlas, por la política de borrado que ya existe.
- **Migración nueva** con las dos funciones `security definer` que el canje
  necesita, `redeem_invitation` y `preview_invitation`. **No hacen falta Edge
  Functions**: la fila de la 0013 de `CONTEXT.md` §3 se corrige.
- **FUERA DE ALCANCE, y se dice para que no se busque:** el envío por correo, que
  necesita servicio contratado. Ninguna tabla gana una columna de correo. Si un
  cambio se ve añadiéndola, se salió de aquí.

## Capabilities

### New Capabilities

Ninguna. El enlace no es una capacidad nueva: es otra puerta a los mismos dos
lados del salón que ya tienen spec, el del tutor y el del niño.

### Modified Capabilities

- `salones-tutor`: gana el requisito de **generar y compartir un enlace
  canjeable**, y con él la lista de enlaces con sus tres estados. El requisito
  «El tutor suma alumnos compartiendo el ID público» se amplía: el ID sigue
  siendo la vía para muchos a la vez, el enlace es la vía para uno; la
  prohibición de pedir o almacenar el correo de un tercero **se mantiene intacta**.
- `salones-alumno`: la máquina de estados gana una transición que hoy no existe
  —de «sin salón» a «en un salón» **sin pasar por en espera**— y la regla de qué
  ocurre con una solicitud pendiente al canjear.
- `backend-supabase`: las dos funciones `security definer` de la migración nueva
  y las reglas que hacen que el canje sea RPC y no escritura directa.

## Impact

**Base de datos — SÍ necesita `db push`, y lo lanza el usuario.** La migración
`supabase/migrations/202606030022_create_invitation_redemption.sql` es nueva y
crea las dos funciones. **No crea tablas ni columnas**: `public.invitations`
existe desde la 0013 con todo lo que hace falta. Como el esquema **sí** cambia
—dos funciones nuevas que el cliente llama por `rpc()`—, hace falta además
regenerar `apps/web/src/types/database.types.ts` con la CLI, que también lanza el
usuario. Se documenta en `supabase/README.md`.

**Código nuevo**

- `apps/web/src/services/invitations.service.ts` — generar, listar, borrar,
  previsualizar y canjear, con la forma `{ data, error }` y sus mensajes en
  español por código.
- `apps/web/src/hooks/useInvitations.ts` — los enlaces del salón que mira el
  tutor, con su propia carga y su propio error, como `useMissionAssignments`.
- `apps/web/src/context/invitationToken.helpers.ts` — la intención de canje que
  sobrevive el registro, con el patrón exacto de `oauthRole.helpers.ts`:
  **se lee y se borra en la misma llamada**.
- `apps/web/src/pages/Invite/Invite.tsx` — la pantalla del enlace.

**Código que se toca**

- `apps/web/src/components/dashboard/teacher/AddStudentsPanel.tsx` — ahí va la
  generación. Es donde vive hoy el párrafo «Todavía no enviamos correos de
  invitación», que se va porque deja de ser cierto a medias.
- `apps/web/src/constants/routes.ts` y `apps/web/src/router/AppRouter.tsx` — la
  ruta `/invite/:token`, **sin guarda**, por el mismo motivo que `/auth/callback`.
- `apps/web/src/pages/AuthCallback/AuthCallback.tsx` — consumir el token al
  volver de Google, después de resolver el rol.
- `apps/web/src/hooks/useRoleHomeRedirect.ts` — el destino tras registrarse o
  entrar deja de ser siempre el panel del rol cuando hay un canje esperando.

**Documentación**

`docs/CONTEXT.md` (§2.3, §2.4, §2.7, §3 y la fila equivocada de P5),
`docs/ROADMAP.md` (§2.1 el motivo de partir el 19, §2.2 y la fila del 19) y
`openspec/config.yaml`.

**Sin dependencias nuevas.** No entra ninguna librería: el token lo genera
PostgreSQL con `extensions.gen_random_bytes`, que la 0013 ya usa, y copiar al
portapapeles lo hace el navegador.
