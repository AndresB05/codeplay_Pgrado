## Context

Ver `proposal.md` — Why, con lo medido contra la base. Lo que fija este diseño
son cinco hechos del código de hoy:

1. **`achievements` existe y nadie puede escribirla.** La `0009` revoca
   `insert, update, delete` a `anon` y `authenticated`, y sólo concede `select`
   de las filas propias. Conceder exige una función `security definer`.
2. **`submit_level_attempt` ya devuelve un `jsonb`** con lo concedido, y es la
   única llamada de una partida desde el J10. Ahí caben los logros sin una
   consulta más.
3. **`count_block_chain` recorre el JSON de Blockly desde SQL**, reconociendo los
   cuatro tipos y devolviendo `null` ante cualquier bloque que no entienda.
4. **El cliente ya calcula cada caída** en `fall.ts`, pero `LevelFinish` no la
   lleva: hoy muere en la animación.
5. **Los tres niveles de Costa de Bugs tienen `stepLimit`** igual a su óptimo
   (10, 17 y 14); los seis de Selva y Cordillera no tienen ninguno.

## Goals / Non-Goals

**Goals:**

- Que volver al día siguiente cuente, y que el niño vea el número subir.
- Que hacer una tontería con gracia —67 pasos, diez saltos— tenga premio.
- Que el servidor conceda **sin creerse** nada que pueda comprobar.
- Que la Sala de Trofeos enseñe también **lo que falta**, no sólo lo ganado.

**Non-Goals:**

- Ejecutar el juego dentro de la base. Ver «Lo que se cree sin comprobar».
- Misiones. Siguen sin poder completarse: unir los dos catálogos es otra cosa
  (contrato §8) y no entra aquí.
- Notificar un logro fuera de la partida en que se gana. Sin tiempo real, un
  logro de racha que se gane jugando se ve en esa misma partida.

## Decisions

### El catálogo: veinte logros, y vive en la base

| Clave | Título | Condición | XP |
| --- | --- | --- | --- |
| `perfect_w{m}_l{n}` ×9 | «Perfecto: \<nivel\>» | marca 100 en ese nivel | 50 |
| `perfect_world_{m}` ×3 | «Dueño de \<mundo\>» | los tres niveles del mundo al 100 | 200 |
| `perfect_all` | «Maestro Explorador» | los nueve niveles al 100 | 500 |
| `no_dizzy` | «Sin mareos» | cuatro giros a la derecha seguidos, y llegar a la meta | 100 |
| `trying_to_fly` | «Intentando volar» | diez bloques de salto, y llegar a la meta | 100 |
| `unnecessary` | «Eso fue innecesario...» | un programa de 67 pasos, y llegar a la meta | 100 |
| `ouch_my_knees` | «¡Auch! mis rodillas» | en «La torre», caer cinco de golpe y llegar a la meta | 150 |
| `streak_3` | «Vuelvo mañana» | tres días seguidos | 75 |
| `streak_7` | «Semana completa» | siete días seguidos | 200 |
| `streak_30` | «Un mes sin fallar» | treinta días seguidos | 600 |

**Las claves de nivel y mundo se derivan del ORDEN, no del identificador.**
`perfect_w2_l3` y no el UUID de «La torre»: los UUID de la siembra no son los
mismos en otro proyecto de Supabase, y una clave ilegible convierte cualquier
consulta de depuración en un acertijo. El orden sí es estable — un nivel
rediseñado sigue siendo el tercero de su mundo, y eso ya pasó con el mundo 2.

**El catálogo es tabla y no constante del cliente** porque la Sala de Trofeos
tiene que pintar **lo que falta**, y eso exige la lista entera en el cliente. Con
el catálogo en SQL para conceder y una copia en TypeScript para pintar, las dos
se separan en cuanto alguien toque una: es el error que `missionCatalog` ya tiene
—`mission_key` es texto suelto contra un catálogo que sólo existe en el
cliente— y no conviene repetirlo con veinte filas.

`achievements` **sigue copiando** título, descripción e icono al conceder. Sus
columnas son `not null` desde la `0005` y el efecto es bueno: renombrar un logro
no reescribe lo que el niño ya ganó.

### Lo que se cree sin comprobar, dicho en voz alta

El contrato §5 fija tres niveles y este cambio los respeta:

| Se mira | Falsificable | Logros |
| --- | --- | --- |
| El historial | No: lo escribió el servidor | los 13 de nivel, mundo y racha |
| El programa enviado | No: el servidor lo lee | los 3 de acción |
| `success` y la caída observada | **Sí** | los 4 atados a una partida |

**La caída no sube el listón de confianza, lo iguala.** Ya se cree `success`, del
que depende toda la experiencia. Comprobar la caída exigiría ejecutar el programa
contra la rejilla dentro de la base —reimplementar el motor—, y al otro lado hay
una plataforma para niños sin dinero de por medio.

**La mitigación que sí se aplica** es la de §5, y ahora en los cuatro: el logro
exige un intento **con éxito** de ese nivel. Sube el listón de «manipular el
navegador» a «jugar el nivel y además manipular el navegador».

### La racha: el día de Colombia, y el último día contado

```sql
(timezone('America/Bogota', now()))::date
```

Y una columna nueva, `profiles.last_streak_day date`. Sin ella no se puede
distinguir «tres días seguidos» de «tres días sueltos»: `current_streak` es un
contador sin fecha, que es justo lo que el paso 17 dejó anotado.

Al superar un nivel:

| `last_streak_day` | `current_streak` pasa a |
| --- | --- |
| nulo | 1 |
| hoy | igual — un día sube la racha una sola vez |
| ayer | +1 |
| cualquier otro | 1 |

`max_streak` se queda con el mayor de los dos, y así sirve de récord.

**LA RACHA GUARDADA CADUCA, Y LA PANTALLA TIENE QUE SABERLO.** Sólo se recalcula
al jugar, así que un niño que lleve una semana sin entrar sigue teniendo un `3`
escrito en su fila. **Lo que se enseña se deriva al leer**: la racha vale lo
guardado si `last_streak_day` es hoy o ayer, y **cero** en cualquier otro caso.
La alternativa —una tarea que barra los perfiles cada noche— exige un programador
de tareas que este proyecto no tiene, y para una cifra que sólo se mira estando
dentro.

Por eso `last_streak_day` se expone allí donde la racha se lee, incluida la vista
del salón que ya enseña `current_streak` a los compañeros.

### Dónde se concede: dentro de la partida, no en un disparador

Todo ocurre en `submit_level_attempt`, después de escribir el progreso y antes
de devolver. Un disparador sobre `user_progress` habría separado la concesión de
la respuesta, y entonces la pantalla necesitaría una segunda consulta para saber
qué acaba de ganar — con una carrera contra el propio disparador.

La respuesta gana dos claves:

```json
{ "unlocked_achievements": [ { "key": "...", "title": "...", "awarded_xp": 100 } ],
  "streak": { "current": 3, "max": 3, "last_day": "2026-09-18" } }
```

`total_xp` ya viaja ahí y se lee **después** de conceder, así que incluye lo que
los logros acaban de dar.

**La concesión no puede tumbar la partida.** Es lo primero que se prueba: un
logro que falle no puede perder el intento del niño, que ya está escrito.

### La caída viaja como observación, no como verdad

`LevelFinish` gana `maxDrop`, que el intérprete ya conoce, y `attemptRecord` lo
pone en `metadata` junto a los pasos y la puntuación del cliente — donde ya
viven las observaciones, y con el mismo estatus que ellas.

El servidor lo lee de `input_metadata` y sólo para «¡Auch! mis rodillas». Un
`metadata` sin esa clave, o con basura, **no concede y no rompe**: es la misma
regla que `count_block_chain` aplica a un bloque que no entiende.

### El aviso: cola, y no interrumpe

Un logro puede llegar a la vez que otro —terminar el noveno nivel al 100 concede
el de nivel, el de mundo y el de todo— así que los avisos se **encolan** y se
enseñan de uno en uno. No roban el foco ni bloquean: el niño acaba de terminar
una partida y la pantalla de resultado es lo que está mirando.

## Risks / Trade-offs

- **La caída es falsificable.** Asumido y escrito arriba; el éxito del nivel lo
  acota.
- **20 logros y 2875 XP** contra los 900 que dan los nueve niveles. Los logros
  pasan a ser la mayor fuente de experiencia, y el Nivel Explorador sube más
  deprisa por ahí que jugando. Es coherente con el diseño —«variable según el
  logro: puede ser mucha o poca»— pero conviene verlo en la prueba antes de
  añadir más.
- **Retirar las estrellas cambia la firma de `upsert_my_progress`**, que sigue
  siendo llamable por el cliente. Se retira el parámetro y la columna en la misma
  migración para no dejar dos verdades.
- **Un nivel rediseñado puede volver imposible un logro de acción.** Si algún día
  Selva o Cordillera ganan `stepLimit`, «Eso fue innecesario...» deja de poder
  ganarse sin que nada avise. Queda escrito aquí y en la migración.

## Migration Plan

Una migración, `202606030036`, y **la lanza el usuario** con `db push` y luego
`gen types`. No hay datos que convertir: `achievements` está vacía y las rachas
valen cero, así que el estado anterior y el nuevo coinciden.

Las estrellas se retiran en la misma migración. **Medido, y no era lo que
parecía:** de las nueve filas de progreso de la cuenta de prueba, una tiene
`stars_earned` a 2 y las otras ocho a cero. Se borra igual —ninguna pantalla lo
ha mostrado nunca y no cuelga de él ninguna marca ni experiencia—, pero el
comentario de la migración dice lo que se pierde en vez de afirmar que no se
pierde nada.

## Open Questions

Ninguna. Las cuatro que había —el reloj del día, qué cuenta para la racha, cómo
se comprueba lo que no está en el programa, y qué hacer con la maqueta de la Sala
de Trofeos— las decidió el usuario el 18 de septiembre de 2026, y corrigió de
paso que **todos** los logros exigen superar el nivel.
