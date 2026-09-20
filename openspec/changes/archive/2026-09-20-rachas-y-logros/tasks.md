## 1. La migración `202606030036`

- [x] 1.1 `achievement_catalog`: clave primaria de texto, título, descripción, icono, XP, categoría y orden, con `grant select` a `authenticated` y RLS que deje leerlo entero — es catálogo, no dato de nadie
- [x] 1.2 Sembrar los veinte, derivando las claves de nivel y mundo del `sort_order` y no del UUID; los nueve títulos de nivel y los tres de mundo se leen de `levels` y `worlds` al sembrar
- [x] 1.3 `profiles.last_streak_day date`, nula al principio, y documentar por qué la racha sin fecha no servía
- [x] 1.4 Las lecturas de programa que faltan, junto a `count_block_chain` y con su misma regla de devolver `null` ante lo que no entienda: bloques de salto del programa y giros a la derecha seguidos
- [x] 1.5 `award_achievements(...)`: concede los que correspondan y devuelve los concedidos, sin duplicar —el único de `(user_id, achievement_key)` es la red— y sin poder tumbar la partida
- [x] 1.6 El recuento de días, con `timezone('America/Bogota', now())::date` y la tabla de transiciones del diseño
- [x] 1.7 `submit_level_attempt` llama a las dos y añade `unlocked_achievements` y `streak` al `jsonb`, leyendo `total_xp` **después** de conceder
- [x] 1.8 Retirar las estrellas: `user_progress.stars_earned`, `levels.stars_reward` y el parámetro `input_stars_earned` de `upsert_my_progress`
- [x] 1.9 Pedir al usuario que lance `db push` y `gen types`, y reconvertir a UTF-8 si PowerShell deja el archivo en UTF-16

## 2. Comprobar la migración contra la base

- [x] 2.1 Que `achievement_catalog` tiene veinte filas y que el niño de `.env` puede leerlas
- [x] 2.2 Que un `select` sobre `stars_earned` responde `42703`, que es lo que confirma que la columna se fue de verdad
- [x] 2.3 Que `authenticated` sigue **sin** poder escribir en `achievements` por REST
- [x] 2.4 Las lecturas de programa, con los programas ya guardados: los de 32 y 14 pasos dan lo mismo que `count_program_steps`
- [x] 2.5 Los nueve logros de nivel y los tres de mundo se conceden a la cuenta que ya tiene los nueve al 100, jugando una partida cualquiera

## 3. El juego observa la caída

- [x] 3.1 Llevar la caída mayor de la partida a `LevelFinish`, desde lo que el intérprete ya calcula
- [x] 3.2 Ponerla en `metadata` en `attemptRecord`, junto a las demás observaciones y con el mismo estatus
- [x] 3.3 Test de que una partida sin ninguna caída la manda en cero y no la omite

## 4. El aviso de logro desbloqueado

- [x] 4.1 El componente del aviso, con el estilo del tema y sin robar el foco
- [x] 4.2 La cola: varios logros a la vez se enseñan de uno en uno
- [x] 4.3 Montarlo donde termina la partida, leyendo lo que `submit_level_attempt` devolvió
- [x] 4.4 Que una partida sin logros no pinte nada

## 5. La Sala de Trofeos

- [x] 5.1 El servicio y el hook pasan a traer el catálogo con lo conseguido encima, no sólo lo conseguido
- [x] 5.2 Retirar la sección «Lógica» entera
- [x] 5.3 «Grandes trofeos» pasa a ser los tres logros de mundo perfecto, conseguidos o no
- [x] 5.4 La lista de abajo enseña el catálogo entero, distinguiendo lo ganado de lo que falta sin depender sólo del color
- [x] 5.5 Que la racha que se enseña sea la derivada —cero si `last_streak_day` no es hoy ni ayer—, en la barra lateral, la superior y la tabla del salón

## 6. Las estrellas, en el cliente

- [x] 6.1 Quitarlas de los tipos, del servicio de progreso y del de mundos
- [x] 6.2 Comprobar que no queda ninguna referencia y que `npx tsc --noEmit -p apps/web` lo confirma

## 7. Tests

- [x] 7.1 De la racha derivada: hoy, ayer, anteayer y nunca
- [x] 7.2 De la cola de avisos: uno, tres, ninguno
- [x] 7.3 De la Sala de Trofeos: enseña lo que falta, y no enseña la maqueta retirada
- [x] 7.4 De la caída en `metadata`
- [x] 7.5 Comprobar que los tests nuevos tienen dientes rompiendo el código que prueban
- [x] 7.6 Comparar los `it(` contra `HEAD` y confirmar que no se retiró ninguno

## 8. Verificación contra la base

- [x] 8.1 Ganar «Eso fue innecesario...» con 67 pasos en un nivel sin tope — hecho por REST y no construyendo el programa en el editor, así que **el aviso no se vio dispararse jugando**, sólo en sus tests
- [x] 8.2 Ganar «Sin mareos» y «Intentando volar», y comprobar que **sin llegar a la meta no se conceden**
- [x] 8.3 Ganar «¡Auch! mis rodillas» en «La torre» cayendo de la casilla de altura 6 a la de altura 1
- [x] 8.4 Que la racha sube a 1 hoy, no sube dos veces el mismo día —comprobado con once partidas seguidas— y que `max_streak` la sigue. **NO verificado contra la base**: que pase de 1 a 2 al día siguiente y que se reinicie tras un hueco, porque exige esperar días
- [x] 8.5 Cuadrar `total_xp` con la suma de niveles y logros después de todo lo anterior
- [x] 8.6 Que el tutor sigue viendo su panel igual: el paso 31 no se toca
- [x] 8.7 `npm run lint`, `npm run test:run` y `npm run build`

## 9. Documentación

- [x] 9.1 `docs/CONTEXT.md`: sección nueva con el catálogo, quién concede, qué se cree sin comprobar y la racha que caduca al leerse
- [x] 9.2 `docs/CONTRATO-DE-INTEGRACION.md`: §5 gana la observación de la caída y §8 pierde el catálogo de logros de su lista de pendientes; §3 pierde el aviso de las estrellas, que ya no existen
- [x] 9.3 `docs/ROADMAP.md`: el paso 22 a hecho, y la deuda §4.2 resuelta
- [x] 9.4 Replicar en `openspec/config.yaml` y comprobar con `npx openspec doctor`
- [x] 9.5 Archivar el cambio dentro del commit, enumerando las rutas

## 10. Lo que salio mal, y quedo escrito

- [x] 10.1 Seis migraciones en vez de una, **cinco por fallos propios**: anotadas una a una en `docs/CONTEXT.md` §2.11 con las tres lecciones —reescribir desde el texto y no de memoria, `array_append` en vez de `||`, y que proteger una operación no es ocultar su error—
- [x] 10.2 Replicadas las tres en `openspec/config.yaml`, para que las consuma quien escriba la siguiente migración
