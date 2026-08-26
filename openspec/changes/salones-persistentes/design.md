## Context

Ver `proposal.md` § Why para la motivación. Lo que condiciona el diseño es el
modelo tal y como está aplicado hoy, comprobado leyendo las migraciones 0013 y
0014 y los tipos generados:

- No hay clave ajena de `class_memberships.student_id` ni de
  `join_requests.student_id` hacia `public.profiles`: apuntan a `auth.users`.
  PostgREST no puede incrustar el perfil (`select('*, profiles(*)')` no
  resuelve), así que el nombre del alumno viene de una segunda consulta o de una
  vista.
- `class_memberships.student_id` y `join_requests.student_id` **no tienen
  default `auth.uid()`**. Quien inserta debe enviarlos; si no, la política
  responde `42501`, que se diagnostica mal porque parece un problema de permisos
  y es un campo que falta.
- No hay política de inserción sobre `class_memberships` y no la habrá. Entrar a
  un salón es siempre `accept_join_request`.
- `class_groups.public_id` es `not null unique`, con un `check` de formato
  `CP-XXXX` y **sin default**: lo genera el cliente.
- El historial de solicitudes se acumula en filas. El índice único es parcial,
  sólo sobre las pendientes.
- La política de select de `class_memberships` alcanza a la propia fila del niño
  o al tutor del salón. Nada más.

## Goals / Non-Goals

**Goals:**

- Que el niño y el tutor compartan estado de verdad, desde dispositivos
  distintos, con las políticas que ya están verificadas.
- Que la frontera de `useClassrooms()` sobreviva: el cambio se concentra en
  `ClassroomsProvider` y en un servicio nuevo.
- Que los 54 tests sigan siendo red y no trámite: cada aserto de comportamiento
  que sobrevive lo hace con su afirmación intacta.

**Non-Goals:**

- El historial de progreso de cada alumno —mundo actual, última actividad,
  dominio por habilidad—: el progreso no conoce los salones y decidir qué
  historial ve el tutor es el paso 17, con arista de privacidad. Nada de eso
  existe en la base, así que esas columnas viajan vacías. **XP y racha sí
  viajan**, porque sí existen: ver la decisión 1.
- Tiempo real. Los cambios del otro lado se ven al recargar o al volver a la
  pantalla, no al instante. Supabase Realtime es el paso 18.
- Editar un salón, y enviar de verdad las invitaciones. Ni el `grant` de update
  sobre `class_groups` existe, ni hay servicio de correo contratado.
- Login real: sigue entrándose por el botón «Sin login», que ya autentica de
  verdad. Es el paso 12.

## Decisions

### 1. Dos vistas de sólo lectura, no dos políticas nuevas

El niño necesita dos cosas que hoy no puede leer: cuántos alumnos tiene cada
salón del catálogo, y quiénes son sus compañeros en el suyo. Se resuelve con la
migración 0015 y dos vistas:

- `class_group_directory`: `id`, `public_id`, `name`, `grade_label`,
  `teacher_name`, `capacity`, `tutor_id` y `member_count`. Es el listado que
  alimenta tanto el buscador del niño como «Mis salones» del tutor, que filtra
  por `tutor_id`.
- `classroom_roster`: `group_id`, `student_id`, `joined_at` y **cuatro columnas
  de `profiles`: `full_name`, `avatar_key`, `total_xp` y `current_streak`**, con
  el filtro dentro —el que consulta es el tutor del salón, o pertenece a él—.

**Qué expone el roster, decidido y en un solo sitio.** Esas cuatro y ninguna
más. Fuera quedan el correo, el país y el nombre de usuario, que no pinta nadie;
y fuera queda todo lo que no existe en la base —mundo actual, última actividad,
dominio por habilidad—, que es el paso 17.

`total_xp` valdrá **0 para todos hasta el paso 21**, y eso es correcto, no un
fallo: la columna existe desde la migración 0002, `upsert_my_progress` ya la
incrementa, y sólo falta que el juego escriba progreso. Exponerla ahora cuesta
una línea de `select` y ahorra volver a migrar la vista cuando ese número
empiece a moverse.

**Por qué XP y racha, y no sólo el nombre.** Es decisión del usuario: quiere que
los niños se comparen **dentro de su salón**, como motivación. Eso responde en
parte a la pregunta que `ROADMAP.md` §3.2 dejó abierta sobre el ranking, donde
«acotarlo al salón» figuraba como la alternativa amable al ranking público de
menores. La pregunta sigue escrita allí como sin decidir: al archivar este
cambio hay que recoger esta parte (tarea 6.5), porque el paso 22 la necesita.

Lo que esto **no** cierra: que un compañero vea el nombre completo de otro sigue
siendo materia de consentimiento del acudiente, que es el paso 14. Comparar
dentro del salón y publicar la identidad de un menor son dos decisiones
distintas, y aquí sólo está tomada la primera.

**Alternativa descartada: ampliar las políticas.** Sería añadir a
`class_memberships_select_related` una rama «o pertenezco a ese salón», que
consulta `class_memberships` desde una política de `class_memberships`:
recursión directa, la misma familia de fallo que dejó a los niños sin poder
solicitar entrar hasta la 0014. Se puede esquivar con otra función
`security definer`, pero entonces la mitad del acceso vive en el grafo de
políticas y la otra mitad en funciones, y hay que volver a recorrer el grafo
desde cada escritura. Además no resuelve el recuento del catálogo: contar filas
de `class_memberships` de un salón ajeno no es «ver una fila más», es verlas
todas.

Con la vista, la regla de acceso está escrita en un `where` que se lee de una
vez, y el grafo de políticas de la 0013 queda exactamente como está verificado.

**Coste asumido:** una vista cuyo dueño es `postgres` no aplica la RLS de las
tablas que consulta —de ahí que el filtro tenga que ir dentro— y el linter de
Supabase la marcará como `security_definer_view`. Es deliberado y queda escrito
en el propio archivo de migración. Ninguna de las dos vistas se declara
`security_invoker = true`: con RLS aplicada devolverían justo las filas que el
niño ya podía leer, o sea nada nuevo.

### 2. Un servicio con la forma del repositorio, sin caché

`services/classrooms.service.ts` devuelve `{ data, error }` con `AppError` y no
lanza, como los otros siete. Expone dos lecturas compuestas —el estado del tutor
y el estado del niño— y las escrituras sueltas.

Las lecturas compuestas se resuelven con varias consultas en paralelo
(`Promise.all`) y se cruzan en JavaScript, porque no hay clave ajena que permita
incrustar. Para el tutor son cuatro: directorio filtrado por `tutor_id`, roster
de sus salones, solicitudes pendientes e invitaciones; más los perfiles de los
solicitantes, que sí salen de `profiles` porque `is_visible_student_of` ya los
alcanza y está verificado.

**Después de cada escritura se recarga el estado entero del rol.** Un salón
tiene decenas de filas y un tutor un puñado de salones: la consulta es barata, y
recargar evita toda una familia de errores de sincronía —una aceptación que
falla por cupo y deja al alumno pintado dentro, un `id` inventado en el cliente
que no coincide con el de la base—. La actualización optimista, si alguna vez
hace falta, se añade encima; al revés no se puede.

### 3. `createGroup` es la única firma que cambia de verdad

`TeacherGroupsModule` navega al detalle del salón recién creado, así que
necesita su `id`, que ahora lo asigna la base. `createGroup` pasa a devolver
`Promise<ClassGroup | null>` y el manejador se hace `async`. Es un cambio
inevitable, y es de una línea.

Las demás acciones pasan de `() => void` a `() => Promise<void>`, que TypeScript
acepta donde se esperaba `void`: los `onClick` de las vistas no se tocan.

El contexto gana `loading` y `error`. Son campos añadidos, no sustituidos:
ninguna vista que los ignore deja de compilar. Los consumen sólo las pantallas
donde un estado vacío durante la carga se confundiría con un estado real —«Ese
salón ya no existe», el buscador de salones, el listado del tutor—, porque
anunciar que algo no existe mientras se está preguntando es mentir.

### 4. El ID público lo genera el cliente y la base lo arbitra

`generatePublicId()` se queda, pero su comprobación de colisión sólo alcanza a
los salones que el cliente tiene cargados, y la unicidad es global. El servicio
inserta y, si la base responde `23505` sobre la restricción de `public_id`,
vuelve a generar y reintenta —tres veces—. Con 32 símbolos y cuatro posiciones
el caso es raro; el reintento cuesta cuatro líneas y la alternativa es un salón
que no se crea sin explicación.

### 5. La situación del niño se lee de la solicitud más reciente, nunca con `single()`

Primero su pertenencia (`class_memberships` filtrada por `student_id`, a lo sumo
una fila por la restricción `unique`). Si no hay, su última solicitud, ordenada
por `requested_at` descendente, con `limit(1)` y `maybeSingle()`.

`single()` está prohibido aquí: en cuanto un niño rechazado vuelve a pedir
entrar hay dos filas para el mismo par y `single()` revienta con `PGRST116`. Es
un cabo suelto anotado en `ROADMAP.md` §3, y ésta es la línea donde se paga.

### 6. Lo que el modelo no sabe viaja vacío, no inventado

`ClassroomStudent` pide `currentWorld`, `hoursSinceLastActivity`, `streakDays` y
`skills`. Del roster llegan `full_name`, `avatar_key`, `total_xp` y
`current_streak`: `streakDays` sale de `current_streak` y **el tipo gana un campo
`xp`** para que `total_xp` no se pierda en la frontera. `currentWorld`,
`hoursSinceLastActivity` y `skills` se rellenan con `null` y ceros.

Añadir `xp` al tipo es deliberado aunque hoy no lo pinte ninguna pantalla: sin
él, la columna de la vista llega hasta el servicio y se tira allí mismo, y el
paso 21 tendría que volver a pasar el cable entero. Cuesta un campo y el ajuste
de los fixtures de `classroomsData.test.ts`. Dónde se muestra el XP es una
decisión del paso 21, y `ROADMAP.md` §3.2 la tiene abierta: aquí no se pinta.

La consecuencia es visible y hay que decirla: la tabla de seguimiento del tutor
mostrará «Sin actividad» en todos sus alumnos y los reportes de habilidades
marcarán 0 %, y el XP y la racha valdrán 0 hasta los pasos 21 y 22. Antes
mostraban porcentajes creíbles porque venían de una semilla inventada.
Preferimos el hueco honesto: un cero visible reclama ese trabajo mejor que un
74 % falso.

`buildInitials()` y `pickAvatarTone()` siguen derivando iniciales y color del
nombre y del id, sin columna nueva, igual que el tema visual del salón.

### 7. El invariante «un alumno, un salón» se comprueba antes de escribir

`requestJoin()` mira la pertenencia y la solicitud pendiente que el store ya
tiene cargadas, y no llama al servicio si alguna existe. Es una guarda de
cortesía, no la garantía: la garantía son el `unique (student_id)`, el índice
parcial y el `with check` que consulta `class_memberships`, y siguen ahí debajo.
Sin la guarda, el niño vería un `42501` crudo donde antes la vista simplemente
no le ofrecía el botón.

## Risks / Trade-offs

- **La migración 0015 hay que aplicarla, y no puedo aplicarla yo** → El
  `db push` pide credenciales por consola. El código se escribe y compila antes,
  pero no se puede comprobar contra la base hasta entonces. Las tareas están
  ordenadas para que la migración vaya primero y el bloqueo se vea en cuanto
  aparece.

- **Los tipos generados no conocerán las vistas hasta regenerarlos** → Tras el
  `db push`, `npx supabase gen types typescript --linked`. Escribir a mano las
  dos vistas en `database.types.ts` reabriría la brecha entre tipo y realidad
  que el paso 8 cerró; no se hace.

- **Una vista `security definer` que filtre mal expone datos de menores** → El
  filtro es el `where`, y hay que leerlo entero al revisar. `classroom_roster`
  expone las cuatro columnas de la decisión 1 —nombre, avatar, XP y racha— y
  ninguna más: ni correo, ni país, ni nombre de usuario.
  `class_group_directory` expone un recuento, nunca identidades. Ambas se
  revocan de `public` y de `anon` explícitamente: revocar de `public` no retira
  lo concedido a un rol, y esa lección ya está pagada en la 0013.

- **Un compañero ve el nombre completo de otro, y ahora también su XP y su
  racha** → Que se vean entre sí es lo que la pantalla ya prometía —«ve el salón
  propio y a los compañeros»— y lo que un salón es; que se comparen por XP y
  racha es la decisión del usuario recogida en la decisión 1. Ambas cosas siguen
  siendo materia de consentimiento del acudiente: queda anotado para el paso 14,
  que es donde se decide qué se enseña de un menor y a quién.

- **Los tests del store hay que reescribirlos, y ahí es fácil colar una red más
  floja** → El andamio cambia —un servicio falso en vez de la semilla y
  `localStorage`—, los asertos no. La forma de comprobarlo al revisar es
  contarlos: 19 de los 24 conservan su afirmación, 5 desaparecen con la
  capacidad que probaban y su propio comentario ya lo anunciaba. Si al terminar
  hay menos afirmaciones de comportamiento que ahora, la red se aflojó.

- **Sin datos de ejemplo, la aplicación arranca vacía** → Es lo correcto, y
  también lo que hace la demostración más frágil: un tutor recién entrado no ve
  nada hasta que crea un salón. La base de pruebas está limpia a propósito
  (`CONTEXT.md` §2.7) y las tres cuentas existen, así que el flujo se recorre
  entero a mano en pocos minutos, que es la comprobación que cierra el paso.

## Migration Plan

1. Escribir `202606030015_create_classroom_read_views.sql`.
2. El usuario lanza `npx supabase db push`.
3. Regenerar `database.types.ts` con la CLI.
4. Servicio, provider y tests. El código anterior se sustituye de golpe: no hay
   modo mixto ni bandera de conmutación, porque no hay inventario local con el
   que convivir.

**Vuelta atrás:** revertir el commit. Las dos vistas se pueden dejar aplicadas
sin efecto —no las lee nadie más— o retirar con un `drop view`. Ninguna tabla,
columna ni política cambia, así que no hay dato que pueda perderse.

## Open Questions

- Qué se hace con las invitaciones ya registradas cuando se borra un salón: hoy
  la clave ajena las borra en cascada y nadie lo ha decidido. No cambia nada de
  este diseño; se decide en el paso 19, cuando las invitaciones se envíen de
  verdad y tengan valor propio.
