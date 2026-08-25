## Context

Ver `proposal.md` — Why. El estado verificado que condiciona el diseño:

- **El proyecto de Supabase existe y las credenciales funcionan.**
  `/auth/v1/settings` responde 200; cualquier consulta a una tabla devuelve 404
  `PGRST205`. La base está vacía: ninguna migración se ha aplicado nunca.
- **La clave de `.env` es del formato nuevo** (`sb_publishable_…`), no un JWT.
  `supabase-js` 2.112 la acepta sin cambios. El endpoint raíz `/rest/v1/`
  responde 401 con claves públicas **por diseño**: no sirve como prueba de salud.
  La prueba válida es `/auth/v1/settings`. La URL de `.env` va sin `/rest/v1/`;
  ese tramo lo añade la librería.
- **El proyecto se creó con «Enable automatic RLS» y sin «Automatically expose
  new tables».** Toda tabla nueva nace con RLS activo y sin permisos: si una
  migración no trae sus políticas y sus `grant`, la tabla existe pero es
  inaccesible. Las nueve migraciones actuales sí los traen —10 `grant`
  explícitos y RLS tabla por tabla—, así que se aplican tal cual.
- **`authService.signUp()` ya envía el rol** en `options.data`, junto a
  `full_name`. El disparador `handle_new_user_profile()` lee `full_name`,
  `username`, `avatar_key` y `country_code` de esos metadatos, pero **ignora
  `role`**, porque la columna no existe.
- **La migración 009 revoca `insert, update, delete` sobre `profiles` a
  `authenticated`**, y concede sólo `select`. `profileService.updateProfile()`
  hace hoy un `.update()` directo sobre la tabla.
- **`profiles` no tiene columna `email`.** El correo vive en `auth.users`.
- **La CLI de Supabase no admite instalación global por npm en Windows.**

## Goals / Non-Goals

**Goals:**

- Dejar el esquema aplicado y verificable contra el proyecto real.
- Que `database.types.ts` describa el esquema de verdad, generado, no escrito.
- Que el rol del registro llegue al perfil sin intervención del cliente.
- Que el repositorio quede compilando y con los 54 tests en verde al terminar.

**Non-Goals:**

- Conectar los formularios de login y registro: eso es P2.
- Las tablas de salones: eso es P3. Después de este cambio siguen sin existir.
- Cambiar el modelo de datos existente. Las nueve migraciones se aplican tal
  como están; no es momento de rediseñarlas.
- Cambiar lo que ven las pantallas. Los valores por defecto que muestran hoy
  siguen mostrándose: no hay datos reales todavía.

## Decisions

### 1. Una migración nueva, no una edición de la 0002

`profiles` se crea en `202606030002_create_profiles.sql`. Editar ese archivo para
añadirle la columna sería lo más limpio *si la base estuviera vacía y fuera a
seguir estándolo* — que es justo el caso hoy. Aun así se añade una migración
nueva.

El motivo: en cuanto se ejecute `db push` por primera vez, el historial de
migraciones queda registrado en el proyecto remoto. A partir de ahí, editar una
migración ya aplicada produce una divergencia entre lo que la base cree haber
aplicado y lo que el archivo dice. Empezar la vida del proyecto con esa costumbre
es sembrar el problema. Una migración es un hecho consumado, no un borrador.

**Consecuencia asumida:** `profiles` se crea sin `role` y acto seguido se le
añade, en la misma tanda. Es ruido en el historial a cambio de una regla que se
sostiene sola.

### 2. `role` como enum de PostgreSQL

**Corregido después de regenerar los tipos.** Esta decisión eligió primero un
`text` con `check (role in ('child','tutor'))`, razonando que «se refleja igual
de bien en los tipos generados —`'child' | 'tutor'`—». El generador desmintió la
premisa: produjo `role: string` y dejó `Enums: {}` vacío, porque PostgREST no
puede leer un `check` como si fuera un dominio. Con eso, `UserRole` degeneraba a
`string` y `isChild()`, `isTutor()` y el enrutado por rol perdían la
comprobación de tipos.

Un tipo `user_role` como enum sí llega al generador, y `UserRole` se deriva de
`Database['public']['Enums']['user_role']`. El argumento que decide: una unión
`'child' | 'tutor'` escrita a mano junto a un `check` de la base es exactamente
la clase de divergencia que este cambio existe para eliminar. La columna se
declara `not null` y se añade sobre una tabla vacía, así que no hay filas que
rellenar.

**Coste asumido.** Los enums de PostgreSQL son rígidos: si algún día `tutor` se
separa en `padre` y `profesor`, hará falta `alter type ... add value`, que no se
puede ejecutar dentro de una transacción junto a otras sentencias y obliga a una
migración dedicada. Hoy esa separación no está planeada. Queda escrito aquí para
que quien la necesite sepa que este documento la contempló y la descartó por
falta de necesidad, no por descuido.

**El `check` se retira.** `profiles_role_valid` sobra en cuanto existe el enum:
el tipo ya restringe el dominio, y mantener los dos obliga a tocar dos sitios
para añadir un valor —con el riesgo de que uno se olvide y queden en desacuerdo.
Una sola fuente por invariante.

**El orden de las sentencias es el contenido de esta migración.** Convertir una
columna a un tipo nuevo obliga a desmontar primero todo lo que la menciona,
porque `alter column type` no actúa sobre la columna aislada. Dos tropiezos, en
este orden:

1. **El `check` se retira antes de convertir, no después.** `alter column type`
   revalida los constraints que mencionan la columna, y `profiles_role_valid` la
   compara con literales de texto. Con el check todavía vivo, PostgreSQL intenta
   evaluar `user_role = text`, operador que no existe, y aborta con `42883`. La
   primera versión de la migración lo retiraba al final y `db push` falló ahí.
2. **El `default` se retira antes de convertir, y se repone después.**
   `default 'child'` es un literal `text` y no se convierte solo.

La regla general, que vale para la próxima columna que cambie de tipo: **todo lo
que dependa de una columna —constraints, defaults— se desmonta antes de la
conversión y se rehace después.** No es una peculiaridad de los enums.

Está así en la migración 0011: `drop constraint` → `drop default` →
`alter type ... using` → `set default`.

### 3. El disparador lee el rol, y valida

`handle_new_user_profile()` pasa a leer `new.raw_user_meta_data ->> 'role'`. El
valor viene del cliente, así que no se inserta a ciegas: si no es `child` ni
`tutor` —o falta— se cae a `'child'`. Sin esa comprobación, un registro
manipulado haría fallar la conversión al enum y el alta entera reventaría con un
error de base de datos en vez de crear un perfil con el rol por defecto.

El tipo `user_role` sigue siendo la última defensa; la validación en el
disparador es para que el camino normal degrade con elegancia.

### 4. La aplicación del esquema la ejecuta una persona, y el cambio se parte ahí

`supabase login`, `supabase link` y `supabase db push` piden credenciales por
consola —token de acceso y contraseña de la base de datos— y la terminal del
agente no es interactiva. Además, esa contraseña no debe pasar por el chat ni
acabar en ninguna variable de entorno del repositorio.

Las tareas están partidas en dos mitades con una **pausa explícita** en medio:
todo lo que se puede preparar sin credenciales va antes; el resto va después de
que el usuario confirme. En la pausa se le entregan los tres comandos exactos.

**Verificación después de la pausa, sin credenciales de administrador:** se
comprueba por HTTP con la clave publishable de `.env` que las tablas responden.
El criterio es el inverso del diagnóstico inicial: donde antes salía 404
`PGRST205`, ahora debe salir 200 —o 401 por RLS, que también prueba que la tabla
existe—. Lo que no puede volver a aparecer es `PGRST205`.

### 5. `User` se reconstruye sobre las columnas reales, y `email` sale de la sesión

El mapeo queda así:

| `User` hoy | Origen real |
| --- | --- |
| `xp` | `profiles.total_xp` |
| `streakDays` | `profiles.current_streak` |
| `avatarUrl` | `profiles.avatar_key` → se renombra a `avatarKey` |
| `email` | **no está en `profiles`**: sale de `session.user.email` |
| `role` | `profiles.role`, nuevo |

`avatar_key` guarda un identificador (`'colibri'`), no una URL. Mantener el
nombre `avatarUrl` sobre él sería heredar la mentira que este cambio viene a
quitar, así que se renombra a `avatarKey`. Ningún componente lo consume hoy:
sólo lo tocan `user.types.ts` y `profile.service.ts`.

`email` es el caso interesante. No está en el perfil y no debe estarlo: el correo
es de la capa de autenticación. Se toma de la sesión, que es donde vive. El
`AuthProvider` ya dispone de ambos.

Se añaden `username`, `countryCode` y `maxStreak`, que existen en la tabla y hoy
no se exponen. No se usan todavía; se incluyen porque el tipo debe describir la
fila, y omitirlos volvería a abrir la brecha entre tipo y realidad.

### 6. `updateProfile` pasa por la función RPC

No es una mejora opcional: la migración 009 revoca `update` sobre `profiles`, así
que el `.update()` directo de hoy empezaría a fallar con un error de permisos en
cuanto el esquema exista. `update_my_profile(input_username, input_full_name,
input_avatar_key, input_country_code)` es la vía prevista, ya tiene su `grant
execute` a `authenticated`, y devuelve la fila completa.

Esto además pone el código en conformidad con un requisito que ya estaba escrito
en `openspec/specs/backend-supabase/spec.md` —«El cliente actualiza su perfil →
la operación pasa por `update_my_profile`»— y que el código incumplía en
silencio, porque nada lo ejecutaba nunca.

### 7. El Purpose de la capacidad se edita en el spec principal, no en el delta

El delta lleva un requisito ADDED y uno MODIFIED. El Purpose de
`backend-supabase` —que afirma que el esquema «todavía no se ha aplicado a
ninguna base de datos»— deja de ser cierto con este cambio, pero **los deltas no
transportan el Purpose**: al archivar se ignora. Se edita directamente en
`openspec/specs/backend-supabase/spec.md`, como una tarea más.

### 8. La CLI entra como `devDependency` de la raíz

En Windows, `npm install -g supabase` no está soportado. Como dependencia de
desarrollo queda con versión fijada en el lock, disponible vía `npx supabase`
para cualquiera que clone, y sin instalación global que se desincronice entre
máquinas. El coste es un binario grande en `node_modules`; a cambio, el comando
de regenerar tipos es reproducible.

### 9. La siembra viaja como migración, y `seed.sql` desaparece

`supabase db push` no ejecuta el seed: sólo lo hace `db reset` en local. Con el
contenido en `supabase/seed.sql`, mundos y niveles nunca llegaban al proyecto
remoto — comprobado, las dos tablas respondían 200 con `[]` después del primer
push.

Mundos y niveles no son datos de ejemplo, son contenido de referencia, así que su
sitio es una migración. El archivo se **movió** con `git mv` a
`202606030012_seed_learning_content.sql`, no se copió: tener el mismo contenido
en dos lugares es precisamente la divergencia que este cambio vino a resolver en
`database.types.ts`. Una sola fuente o ninguna. Sus `on conflict ... do update`
ya lo hacían repetible, así que sirve como migración sin tocar el SQL.

### 10. Las escrituras de progreso e intentos también pasan a RPC

Al aplicar el esquema se comprobó que `progress.service.ts` y
`attempts.service.ts` escriben directamente sobre `user_progress` y
`level_attempts`, y que la migración 009 revoca `insert, update, delete` sobre
ambas al rol `authenticated`. Es el mismo caso que `updateProfile`, y el mismo
requisito ya escrito en `openspec/specs/backend-supabase/spec.md` lo cubre: las
escrituras del cliente pasan por `upsert_my_progress` y `create_level_attempt`.
Las tres funciones toman el usuario de la sesión, así que los servicios dejan de
recibir `userId` al escribir.

### 11. La sala de trofeos se recorta a lo que el esquema sostiene

`achievements.service.ts` trataba la tabla `achievements` como un catálogo de
definiciones con `requirement_type`, `requirement_value` y `category`, y
calculaba en el navegador el avance hacia cada logro bloqueado. La tabla real es
el registro de logros **concedidos** a cada niño, con `unique (user_id,
achievement_key)`. No hay catálogo en el esquema.

Diseñar ese catálogo es producto, no una consecuencia de aplicar el esquema, y
tiene sitio propio: el paso 22 del roadmap. Aquí el servicio se reduce a listar
lo conseguido, y `AchievementList` deja de agrupar por categoría y de pintar
barras de progreso.

Esto obliga a modificar el requisito «Sala de trofeos» de `contenido-mundos`, que
prometía distinguir obtenidos de pendientes. Dejarlo intacto sería mantener en la
fuente de verdad una promesa que el esquema no puede cumplir.

## Risks / Trade-offs

- **`db push` aplica nueve migraciones nunca ejecutadas, de una vez** → Es el
  paso con más superficie de fallo del cambio. Si una migración tiene un error de
  SQL, se descubre aquí. Mitigación: `db push` es transaccional por migración y
  se detiene en la primera que falle, dejando el resto sin aplicar; el mensaje
  identifica el archivo. Si ocurre, se arregla esa migración y se repite.
- **El orden de aplicación depende del nombre del archivo** → La migración nueva
  debe ordenarse *después* de la 0009, no sólo después de la 0002 que crea la
  tabla. Se nombra con marca de tiempo posterior a `202606030009`.
- **Los tipos regenerados pueden romper más de lo previsto** → El inventario del
  proposal se hizo leyendo el código, pero `tsc` es el juez. Se acepta: la tarea
  de compilar es la que fija el alcance real, y cualquier archivo extra que salga
  entra en este cambio, porque sin él el repositorio no compila.
- **La verificación por HTTP usa la clave publishable, no la de servicio** →
  Sólo puede comprobar que las tablas existen y responden, no inspeccionar el
  esquema columna por columna. Para eso está la regeneración de tipos: si
  `database.types.ts` sale con la columna `role` y las columnas reales de
  `profiles`, el esquema aplicado es el correcto. Las dos comprobaciones juntas
  bastan; ninguna por separado.
- **El disparador no puede probarse sin dar de alta un usuario** → Crear usuarios
  de prueba es P2. Aquí se verifica que la función y el disparador existen y que
  la columna acepta los dos valores; el camino completo del alta se prueba cuando
  el registro esté conectado.
- **La contraseña de la base de datos** → No entra en el repositorio, ni en
  `.env`, ni en el chat. `supabase link` la pide por consola y la guarda en la
  configuración local de la CLI, fuera del árbol del proyecto.

## Migration Plan

No hay datos que migrar: la base está vacía y no hay nada desplegado. El esquema
se aplica por primera vez.

**Retroceso.** Si algo sale mal después de `db push`, el proyecto de Supabase
puede reiniciarse desde el panel o con `supabase db reset --linked`, que vuelve a
aplicar las migraciones desde cero. En el repositorio, revertir el commit deja
`database.types.ts` como estaba. Las dos mitades son independientes: el código
sin el esquema aplicado compila igual, sólo que sus consultas fallarían en
tiempo de ejecución — exactamente la situación de hoy.
