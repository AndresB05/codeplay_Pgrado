# Backend de Supabase para CodePlay

Este directorio contiene solo la capa backend basada en Supabase:

- `migrations/`: esquema SQL, funciones RPC, trigger, RLS, vista del leaderboard
  y el contenido inicial de mundos y niveles.

No hay `seed.sql`. `db push` no ejecuta el seed —sólo lo hace `db reset` en
local—, así que el contenido nunca llegaba al proyecto remoto. Vive en la
migración 0012 y se aplica como todo lo demás.

## Estructura

1. `202606030001_base_extensions.sql`
   - Extensión `pgcrypto` y trigger helper para `updated_at`.
2. `202606030002_create_profiles.sql`
   - Tabla `profiles`.
3. `202606030003_create_learning_content.sql`
   - Tablas `worlds` y `levels`.
4. `202606030004_create_progress_tracking.sql`
   - Tablas `user_progress` y `level_attempts`.
5. `202606030005_create_achievements.sql`
   - Tabla `achievements`.
6. `202606030006_create_rpc_functions.sql`
   - RPCs seguras para `update_my_profile`, `create_level_attempt` y `upsert_my_progress`.
7. `202606030007_create_profile_trigger.sql`
   - Trigger `on_auth_user_created` para crear `profiles` automáticamente.
8. `202606030008_create_weekly_leaderboard_view.sql`
   - Vista `leaderboard_weekly`.
9. `202606030009_enable_rls_and_policies.sql`
   - RLS, políticas y permisos.
10. `202606030010_add_profile_role.sql`
    - Columna `profiles.role` y disparador que la rellena desde el registro.
11. `202606030011_profile_role_enum.sql`
    - Convierte `role` al enum `user_role` y retira el check redundante.
12. `202606030012_seed_learning_content.sql`
    - Mundos y niveles iniciales. Era `seed.sql`.
13. `202606030013_create_classroom_tables.sql`
    - Las cuatro tablas de salones —`class_groups`, `class_memberships`,
      `join_requests` e `invitations`—, sus índices, sus políticas, sus `grant`
      y la RPC `accept_join_request`, **todo en un solo archivo**: una tabla y su
      acceso no deben poder aplicarse por mitades. Añade además una segunda
      política de lectura a `profiles` para que el tutor vea el nombre de sus
      alumnos, sin tocar la que ya existía.

14. `202606030014_fix_profiles_policy_recursion.sql`
    - Corrige una recursión de RLS que traía la 0013: insertar una solicitud de
      ingreso moría con `42P17`, porque su política consulta `profiles` y
      `profiles_select_own_students` consultaba a su vez `join_requests`. La
      condición pasa a una función `security definer`, que no expande políticas.
      **La 0013 no se edita**: ya estaba aplicada, y corregirla en el sitio
      dejaría el repositorio describiendo un esquema que ninguna base ha tenido.

15. `202606030015_create_classroom_read_views.sql`
    - Dos vistas de sólo lectura: `class_group_directory`, el catálogo de
      salones más el recuento de alumnos de cada uno, y `classroom_roster`, la
      lista de un salón vista por su tutor o por quien pertenece a él.
    - **Por qué vistas y no políticas.** Sin ellas, un niño no puede leer las
      filas de `class_memberships` de nadie más que él, así que la lista de
      compañeros sale vacía y el buscador muestra «0 de N cupos» en todos los
      salones. Ampliar la política de lectura de `class_memberships` con una
      rama «o pertenezco a ese salón» la haría consultar la tabla que protege:
      recursión, la misma familia de fallo que arregló la 0014, y que aparece
      antes al escribir que al leer. Esta migración **no toca ninguna política**.
    - Ninguna de las dos declara `security_invoker = true`, así que no aplican la
      RLS de las tablas que consultan: el filtro de a quién alcanza cada una va
      escrito **dentro** de la vista y es lo primero que hay que leer al
      revisarlas. El linter de Supabase las marca como `security_definer_view`;
      está previsto.
    - **Qué expone el roster:** `full_name`, `avatar_key`, `total_xp` y
      `current_streak`, y ninguna otra columna de `profiles`. Ni correo, ni
      país, ni nombre de usuario. XP y racha están para que los niños se
      comparen dentro de su salón; hoy valen 0 para todos hasta que el juego
      escriba progreso. El recuento del catálogo es un agregado: dice si un
      salón está lleno, nunca quién está dentro.

16. `202606030016_drop_invitation_email.sql`
    - Elimina `invitations.email`, **el único sitio del esquema donde se
      almacenaba el correo de alguien sin cuenta**: lo escribía el tutor, no su
      dueño, y en una plataforma para niños ese tercero puede ser un menor. Nada
      lo borraba nunca y la finalidad que lo justificaba —el envío, que es el
      paso 19— no ocurre.
    - **Se elimina la columna en vez de dejar de escribirla:** dejar de escribir
      no borra lo que ya está dentro, y una columna viva se vuelve a llenar en
      cuanto alguien la encuentre disponible, sin volver a hacerse la pregunta.
      **La tabla se queda**: el token, la caducidad, las políticas y la cascada
      siguen sirviendo para el paso 19. Ninguna política ni ningún `grant` se
      tocan.
    - *(Entrada añadida durante el paso 15: la 0016 se aplicó sin documentarse
      aquí, y el listado tenía un hueco.)*

17. `202606030017_create_set_my_role_rpc.sql`
    - `set_my_role(input_role text)`, `security definer`, para fijar el rol del
      perfil **después** del alta. Hace falta porque `signInWithOAuth` no admite
      metadatos: una cuenta creada con Google nace `child` por el disparador de
      la 0011 aunque quien se registró eligiera «Tutor», y la 0009 revoca la
      escritura directa sobre `profiles`.
    - `auth.uid()` se lee **dentro del cuerpo y nunca es parámetro**, que es lo
      que hace imposible fijar el rol de otra persona. Sin sesión, `42501`.
      Parámetro `text` y no el enum: con el enum, un valor inválido muere en la
      conversión de PostgREST con un error que no dice nada útil; así el rechazo
      es explícito con `22023`, y el enum sigue siendo la última defensa.

18. `202606030018_lock_profile_role.sql`
    - Añade `profiles.is_role_declared`, hace **backfill a `true`** de todas las
      filas existentes, y reemplaza el disparador y `set_my_role`. **La 0017 no
      se edita**, por lo mismo que la 0014 no editó la 0013.
    - **Por qué.** Supabase **enlaza identidades por correo verificado**, así que
      entrar con Google con el correo de una cuenta que ya existe no crea usuario
      —le añade el proveedor— y el disparador no corre. Sin esta migración,
      `set_my_role` alcanzaba a esa cuenta: un niño con membresía que entrara
      desde el registro eligiendo «Tutor» quedaba `tutor`, **fuera de su propio
      salón y sin vuelta atrás por la interfaz**. El rol es la reja de
      `class_groups_insert_own` y `join_requests_insert_own`, así que cambiarlo
      no es editar un campo: es dejar una cuenta sin sitio.
    - **El cierre cuelga de dos condiciones, no de una.** La marca corta a quien
      **ya eligió** (`ZC001`); los **lazos de salón** —membresía, solicitud
      `pending` o salón propio— cortan a quien **ya construyó algo** con el rol
      que tiene (`ZC002`). La marca sola dejaba una ventana permanente: una
      cuenta nacida del botón de la pantalla de acceso queda sin declarar para
      siempre. El rol y la marca se escriben en **la misma sentencia**, para que
      no quede un instante con el rol fijado y todavía cambiable.
    - La clase `ZC` de los dos `SQLSTATE` cae en el tramo `I`-`Z` que el estándar
      deja a la implementación, y no es ninguna de las dos que PostgreSQL ocupa
      (`P0` y `XX`).
    - **Pega conocida, anotada y no corregida:** la 0017 comprobaba `if not
      found` **después** del `update`; ésta sólo lo hace tras el `select`. Si el
      perfil desapareciera entre las dos sentencias, la función devolvería `null`
      en vez de `P0002` y el cliente vería un error de PostgREST. Ventana de
      microsegundos y **no produce dato corrupto**. No se corrige en el sitio
      porque ya está aplicada; **que la recoja la próxima migración que toque
      esta función.**

> **Faltan las entradas de la 0019 y la 0020**, que aplicaron los pasos 28 y 16 y
> nunca llegaron aquí. Están descritas en `docs/CONTEXT.md` §2.7 y §2.8. Se anota
> en vez de rellenarse: escribirlas ahora sería documentar de oídas el trabajo de
> otros dos pasos.

21. `202606030021_publish_realtime_tables.sql`
    - Añade `join_requests`, `class_memberships` y `mission_assignments` a la
      publicación `supabase_realtime`. **No crea la publicación ni toca qué
      operaciones emite:** ya existía en el proyecto con `insert`, `update`,
      `delete` y `truncate` los cuatro activos, y con **cero tablas**, que es lo
      que la hacía muda. Comprobado en el panel el 2 de septiembre de 2026.
    - **No trae políticas ni `grant`, y es la excepción que confirma la regla de
      abajo**: no crea ninguna tabla. Quién recibe cada evento lo deciden las
      políticas de `select` que ya existen —`join_requests_select_related`,
      `class_memberships_select_related` y `mission_assignments_select_related`—,
      porque Realtime las evalúa por cada suscriptor.
    - **Los `delete` son la excepción, y está aceptada a sabiendas.** Cuando llega
      el evento la fila ya no existe, así que no hay contra qué evaluar la
      política y la base entrega el borrado a **todos** los suscriptores de la
      tabla. Con la identidad de réplica por defecto lo que viaja es la clave
      primaria y nada más. **No se toca `replica identity`**: ponerla en `full`
      haría viajar la fila entera, o sea más filtración y no menos.
    - Idempotente por comprobación contra `pg_publication_tables`, porque
      `alter publication ... add table` no admite `if not exists` y falla si la
      tabla ya está publicada.
    - **No exige regenerar los tipos:** publicar una tabla no cambia el esquema.

22. `202606030022_create_invitation_redemption.sql`
    - Añade las dos funciones del canje de invitaciones: `redeem_invitation`,
      que mete a un niño en el salón con el token del enlace, y
      `preview_invitation`, que dice a qué salón invita y si sigue sirviendo
      **sin consumirlo**. Es la primera migración que le da uso a `invitations`,
      que llevaba desde la 0013 con token, caducidad, políticas y cascada y
      **sin una sola escritura**.
    - **NO crea ni altera ninguna tabla, ninguna política y ningún `grant` de
      tabla**, y no toca `accept_join_request`. El grafo de RLS verificado en la
      0013 y la 0014 queda exactamente como estaba.
    - **Por qué una función y no escrituras del cliente.** Los permisos de la
      0013 son tres muros: las tres políticas de `invitations` son del **tutor**
      del salón, así que quien tiene el token no puede leer su propia fila; el
      grant es `select, insert, delete` **sin `update`**, así que nadie puede
      marcarla aceptada desde el cliente; y `class_memberships` no tiene política
      de inserción. **No hacen falta Edge Functions**, y la fila que lo suponía
      en `docs/CONTEXT.md` estaba equivocada.
    - `redeem_invitation` copia la forma de `accept_join_request`: `auth.uid()`
      leído dentro y nunca como parámetro, `for update` sobre el salón **antes**
      del recuento de alumnos, cupo, «un alumno, un salón» y ningún estado
      intermedio. Bloquea además la **invitación** antes de mirarla, porque un
      enlace es de un solo uso y dos canjes simultáneos del mismo token son la
      carrera del cupo por otra puerta. El orden de bloqueo es siempre invitación
      y después salón; nadie lo toma al revés.
    - **La solicitud pendiente de quien canjea se BORRA, no se resuelve.** Ni
      `accepted` ni `rejected`: ningún tutor la resolvió, y con `accepted` en otro
      salón contradiría además a la pertenencia. Borrarla es la cancelación que
      el niño ya podía hacer por `join_requests_delete_own_pending`. El
      `status = 'pending'` va escrito y no implícito: este `delete` corre como
      definer y sin él se llevaría por delante el historial resuelto.
    - **La caducidad la impone la fecha, no la columna.** `status` admite
      `expired` desde la 0013, pero nada lo escribe ni va a escribirlo. Se
      comprueban las dos cosas igualmente para que no haya dos verdades.
    - Motivos distinguibles con el precedente `ZC0xx` de la 0018: `ZC010` el
      token no existe, `ZC011` caducada, `ZC012` ya canjeada. Los estándar se
      reutilizan donde son los honestos: `42501` sin sesión o rol distinto de
      `child`, `23514` cupo y `23505` ya pertenece a un salón.
    - `preview_invitation` es `stable` y **no escribe nada**. Como las dos, exige
      sesión: no se concede a `anon`, porque con el token se sabe el nombre de un
      salón.
    - **SÍ exige regenerar los tipos**: añade dos funciones que el cliente llama
      por `rpc()`, aunque no cambie el esquema de ninguna tabla.

23. `202606030023_seed_level_1_world_1.sql`
    - **La primera migración de datos desde la 0012**, y la primera que siembra
      un nivel del juego de bloques: rediseña el nivel 1 de la Selva
      Algorítmica —título, slug, descripción, narrativa y las tres columnas del
      formato— e iguala `xp_reward` a 100 en los nueve niveles, que estaban
      sembrados con nueve cifras distintas.
    - **NO toca el esquema**: ninguna columna se añade, se renombra ni cambia de
      tipo, así que **no exige regenerar los tipos**. Tampoco trae políticas ni
      `grant`, y por el mismo motivo: no crea ninguna tabla.
    - **Localiza la fila por `(world_id, sort_order)`, no por slug**, porque el
      slug es justo lo que cambia —`ruta-del-colibri` es del concepto anterior—.
      Por el slug viejo no la encontraría la segunda vez y por el nuevo no la
      encontraría la primera. La pareja sobrevive al cambio y tiene índice único
      propio desde la 0003 (`levels_world_sort_order_unique`), así que señala una
      fila y sólo una.
    - **Las tres columnas van reinterpretadas**, como decidió el paso 23.1:
      `validation_rules` lleva la definición del puzle, `starter_code` la
      disposición inicial de bloques —aquí el sobre con el lienzo vacío— y
      `programming_language` la versión del formato, `grid-blockly-1`. Ver
      `docs/CONTRATO-DE-INTEGRACION.md` §4.
    - Sin `insert`: las nueve filas existen desde la 0012. Repetible, con una
      salvedad: el disparador `handle_levels_updated_at` de la 0003 mueve
      `updated_at` en cada pasada aunque el contenido quede idéntico.

24. `202606030024_level_1_vertical_board.sql`
    - Rediseña **sólo `validation_rules`** del nivel 1 de la Selva: el usuario
      vio el tablero 1 × 4 jugándose y lo pidió más largo y en profundidad, así
      que pasa a 5 × 1 con `optimalSteps` 4. **La 0023 no se edita**: ya estaba
      aplicada.
    - De datos, no de esquema. Misma fila, localizada igual, por
      `(world_id, sort_order)`.
    - *(Entrada añadida en el J7.2: la 0024 se aplicó sin documentarse aquí.)*

25. `202606030025_seed_level_2_world_1.sql`
    - Siembra el **nivel 2 de la Selva** con el boceto del usuario: reescribe
      slug, título, descripción, narrativa y las tres columnas del formato de
      la fila que era «Puente Condicional». Tablero 5 × 5 con un único camino
      en zigzag —el resto, huecos `'gap'`—, salida mirando al sur y
      `optimalSteps` 12.
    - De datos, no de esquema, así que **no exige regenerar los tipos**. No
      toca `xp_reward`: la 0023 ya igualó los nueve.
    - Localiza la fila por `(world_id, sort_order)` y no por slug, por lo mismo
      que la 0023.
    - **Su `optimalSteps` lo comprueba un test**, `levelSolutions.test.ts`, que
      lee este archivo: que la solución a mano llega con 12 y que la búsqueda
      del mínimo no encuentra menos.

26. `202606030026_seed_level_3_world_1.sql`
    - Siembra el **nivel 3 de la Selva**, el último del mundo 1, con el boceto
      del usuario: reescribe la fila que era «Ciclo del Río». Tablero 5 × 5 con
      un único camino de 14 casillas que rodea el tablero y sube una escalera
      —el resto, huecos—, salida mirando al oeste y `optimalSteps` 20.
    - **Sin «repetir»**, decidido por el usuario: se resuelve con los tres
      bloques de siempre.
    - De datos, no de esquema; localiza la fila por `(world_id, sort_order)`, y
      su `optimalSteps` lo comprueba `levelSolutions.test.ts` como el de la 0025.

27. `202606030027_world_1_levels_format_2.sql`
    - Pasa **los tres niveles del mundo 1** a la versión 2 del formato,
      `grid-blockly-2`, que llegó con `salto-y-alturas`: el tablero gana
      `heights` y el programa un bloque con cuerpo. El juego sólo acepta ya la
      2, así que sin esta migración el mundo 1 deja de jugarse.
    - **No cambia ningún puzle**: mismos tableros, salidas, metas y pasos óptimos
      —4, 12 y 20—, con altura 1 en cada casilla que existe y 0 en cada hueco.
      Tampoco toca títulos, slugs ni textos.
    - Tres `update` localizados por `(world_id, sort_order)`. De datos, no de
      esquema. Los tests del juego leen los tres tableros de este archivo.

28. `202606030028_seed_level_2_world_2.sql`
    - Siembra el **nivel 2 de la Cordillera Binaria**, el primero del mundo 2 y
      el primero con subidas: reescribe la fila que era «Mochila de Datos».
      Tablero 5 × 5 de alturas 1, 2 y 3 que se sube con el bloque «saltar»,
      salida mirando al norte y `optimalSteps` 15. Va en el nivel 2 por decisión
      del usuario: el 1 será uno más fácil, sin diseñar.
    - **Su `optimalSteps` se corrigió antes de aplicarse**: a mano se contaron 17
      por el camino de la esquina, y la búsqueda del mínimo de
      `levelSolutions.test.ts` encontró el salto directo del escalón a la meseta.
    - De datos, no de esquema, en la versión 2 del formato; necesita la 0027
      aplicada antes, que el orden de las migraciones garantiza.

29. `202606030029_world_2_levels.sql`
    - Completa **los tres niveles de la Cordillera Binaria**. «Salta y sube»
      baja al nivel 1 con el mismo tablero y 15 pasos, reescribiendo la fila que
      era «Eco de Funciones». El nivel 2 pasa a ser «El gran rodeo» —un camino
      único que rodea un valle, salida mirando al este, `optimalSteps` 25— y el
      3, que era «Sendero Recursivo», «La torre» —meta a altura 6, salida
      mirando al norte, `optimalSteps` 23—.
    - **El `update` del nivel 2 va antes que el del 1**: `levels_world_slug_unique`
      se comprueba sentencia a sentencia, y `salta-y-sube` es del 2 hasta que
      se reescribe.
    - Tres `update` por `(world_id, sort_order)`. De datos, no de esquema. Los
      tests del juego leen los tres tableros de este archivo.

30. `202606030030_world_3_levels_1_2.sql`
    - Siembra **los niveles 1 y 2 de la Costa de Bugs**, los primeros con
      **máximo de pasos** (`stepLimit`, la mecánica del mundo 3). El 1, que era
      «Ola de Errores», pasa a ser «Dos caminos» —un anillo llano con dos
      pilares de altura 2 que deciden por qué lado sale más barato rodearlo;
      salida mirando al este, `optimalSteps` 10—. El 2, que era «Faro
      Asíncrono», pasa a ser «El faro» —torre de altura 5 a la que sólo se
      entra desde arriba; salida mirando al norte, `optimalSteps` 17—. En los
      dos `stepLimit` vale lo mismo que `optimalSteps`.
    - **El nivel 3 NO se toca**: sigue siendo «Tormenta Final», del juego
      anterior, y el juego lo rechaza entero. Va en la 0031, cuando el usuario
      pase su boceto.
    - **El orden de los `update` es libre aquí**, al revés que en la 0029: los
      dos slugs nuevos no coinciden con ninguno de los tres viejos del mundo, así
      que `levels_world_slug_unique` no puede saltar entre sentencias.
    - Dos `update` por `(world_id, sort_order)`. De datos, no de esquema, y sin
      tocar `xp_reward` ni `difficulty`. Los tests del juego leen los dos
      tableros de este archivo.

31. `202606030031_world_3_level_3.sql`
    - Siembra **el nivel 3 de la Costa de Bugs**, `muchos-caminos`, y con él
      cierra los nueve. Una colina compacta con la meta a altura 4 en el borde
      norte; la salida, en la esquina suroeste, **mira al este contra una casilla
      un escalón más alta**, así que el primer «avanzar» choca. `optimalSteps` 13.
    - Un `update` por `(world_id, sort_order)`. De datos, no de esquema.

32. `202606030032_world_3_level_3_retune.sql`
    - **Retoca UNA altura del nivel anterior**, con la 0031 ya aplicada: la
      casilla de la fila 3, columna 4 sube de 3 a 4, y `optimalSteps` y
      `stepLimit` pasan de 13 a **14**. La 0031 no se edita — mismo caso que la
      0024 sobre la 0023.
    - **El porqué, que es diseño de producto**: con la altura a 3 el nivel tenía
      cuatro caminos correctos de entre 113 recorridos; el usuario rechazó las
      variantes que dejaban uno solo —«una línea recta entre caminos curvados»— y
      eligió **dos caminos correctos entre 48**, con dos que fallan por un paso.
    - Un `update` por `(world_id, sort_order)`. De datos, no de esquema. **Los
      tests del juego leen este archivo, no la 0031.**

33. `202606030033_score_by_steps.sql`
    - **La puntuación y el XP por marca de agua (J10).** No crea ni altera
      ninguna tabla, ninguna política ni ningún `grant` de tabla.
    - **Tres funciones de lectura**, sin acceso a tablas y sin `execute` para
      nadie: `count_block_chain` y `count_program_steps` recorren el `jsonb` del
      programa guardado —el sobre del contrato §4.3— y devuelven sus pasos, o
      `null` si no lo pueden leer; `score_for_steps` aplica la regla,
      `redondeo(100 × optimalSteps ÷ pasos)` con suelo de uno.
    - **`submit_level_attempt`**, la única concedida a `authenticated`: guarda el
      intento con la puntuación que ella calcula, escribe el progreso delegando
      en `upsert_my_progress` y devuelve puntuación, pasos, marca, XP concedida y
      total. **Una partida es una llamada**, así que `attempt_count` pasa a
      contar partidas y coincide con las filas de `level_attempts`.
    - **`upsert_my_progress` cambia una sola cosa:** concede
      `(marca nueva − marca anterior) × xp_reward ÷ 100` en vez del `xp_reward`
      entero al pasar a completado. Se cambia ahí y no sólo en la nueva para que
      la base no quede con dos reglas.
    - **Y dos actualizaciones de datos**, que son la parte que no se deshace
      sola: las marcas pasan a ser la mejor puntuación de los intentos con éxito
      **legibles** —sin bajar nunca— y `total_xp` queda cuadrado con la suma de
      las marcas más los logros. Los valores anteriores están en
      `docs/CONTEXT.md` §2.7.

## Cómo aplicarlo

Si ya tienes el proyecto Supabase enlazado con la CLI. **Va con `npx`**: la CLI
es dependencia del repositorio —`supabase` en el `package.json` de la raíz— y no
hay ninguna instalada en el PATH, así que el comando a secas no corre.

```sh
npx supabase db push
```

Para reiniciar en local, aplicando de nuevo las treinta y tres migraciones
—siembra incluida—:

```sh
npx supabase db reset
```

**Toda migración nueva debe traer sus propias políticas y sus `grant`.** El
proyecto se creó con RLS automática y sin exposición automática de tablas, así
que una tabla sin ellos existe pero es inaccesible.

Al revocar, `revoke ... from public` **no** retira lo concedido directamente a un
rol: hay que revocar de `anon` aparte, o una tabla podría nacer legible sin
sesión si el esquema tuviera privilegios por defecto para ese rol. La migración
0013 lo hace; las anteriores sólo revocan de `public`.

Las funciones también: PostgreSQL concede `execute` a `public` por defecto, así
que una RPC nueva necesita su `revoke` antes de su `grant`.

**Cuando una política consulte otra tabla, comprueba el ciclo desde cada
escritura, no sólo desde las lecturas.** La 0013 se aplicó con una recursión que
sólo aparecía al insertar, nunca al leer, y por eso pasó dos revisiones.

## Notas de seguridad

- Las tablas con datos sensibles no aceptan escrituras directas desde el cliente.
- Las escrituras principales quedan encapsuladas en RPCs para reducir manipulación directa.
- `achievements` queda solo de lectura para el cliente autenticado; su otorgamiento debería venir de lógica segura adicional si más adelante añades Edge Functions o SQL controlado.
- La vista `leaderboard_weekly` expone solo campos seguros para ranking semanal.
