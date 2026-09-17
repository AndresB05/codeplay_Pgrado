## Why

Es el **último de los nueve niveles**. La 0030 sembró el 1 y el 2 de la Costa de
Bugs sin esperar al tercero, que el usuario diseñó un día después, el
17-sep-2026. Esa fila sigue siendo «Tormenta Final» —del juego anterior— y el
juego la rechaza entera.

Con esta migración se cierra el **J12** y con él la deuda de `CONTEXT.md` §4.2b:
desde aquí los nueve niveles se juegan desde su fila, y el **J13** —la pasada de
gráficos, que exige los nueve puzles jugándose— deja de estar bloqueado.

## What Changes

- **Se siembra el nivel 3**, `Nivel 3 - Muchos caminos`: una colina compacta con
  la meta a altura 4 en el borde norte, a la que sólo se entra desde el sur. La
  salida está en la esquina suroeste y **mira al este, contra una casilla un
  escalón más alta**: el primer «avanzar» choca.
- **La dificultad de este mundo se mide en CAMINOS, no en pasos**, fijado por el
  usuario al ver este tablero medido. Este nivel cuesta menos que el 2 —14 contra
  17— y no es un fallo de progresión: lo que aporta son **48 recorridos posibles
  con sólo dos que caben**, y dos más que se quedan a un paso.
- **La orientación de salida la eligió el usuario para multiplicar los caminos.**
  Mirando al norte el mínimo era 12 con dos caminos óptimos; mirando al este es
  13 con cuatro.
- **Y se retoca UNA altura sobre lo sembrado**, en una segunda migración: el
  usuario subió a 4 la casilla de la fila 3, columna 4 al ver el nivel medido, ya
  con la 0031 aplicada. `optimalSteps` pasa de 13 a **14** y `stepLimit` con él.
- **Dos migraciones, `202606030031_world_3_level_3.sql` y
  `202606030032_world_3_level_3_retune.sql`**, con un `update` cada una por
  `(world_id, sort_order)`. La 0031 no se edita porque está aplicada — mismo caso
  que la 0024 sobre la 0023. Ninguna toca el esquema, ni `xp_reward`, ni
  `difficulty`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna. Sembrar niveles es contenido gobernado por requisitos que ya existen, y
el máximo de pasos lo especificó `limite-de-pasos`. El cambio declara
`skip_specs: true`, igual que `mundo-3-niveles-1-y-2`.

## Impact

**Base de datos.** `supabase/migrations/202606030031_world_3_level_3.sql` y
`202606030032_world_3_level_3_retune.sql`, un `update` cada una sobre
`costa-de-bugs`. **Cada una necesita su `db push` y los lanza el usuario**; la
0031 ya está aplicada.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/levelConfig.test.ts` | Lee el nivel 3 del mundo 3 de **la 0032**, que es la que manda, y los tres del mundo comparten el caso del `stepLimit` |
| `apps/web/src/game/levelSolutions.test.ts` | La solución resuelta a mano llega con 14 pasos y no hay nada más corto |

**Documentación.** `docs/CONTEXT.md` —§4.2b **se cierra**—,
`docs/ROADMAP-JUEGO.md` (J12.7 y el J12 entero), `supabase/README.md` y
`openspec/config.yaml`.

**Lo que NO entra:**

- **El paso del coyote**, que el usuario pidió el 17-sep-2026: al bajar, el
  personaje atraviesa la esquina del cubo porque la escena interpola las tres
  coordenadas a la vez. Su diseño: dar el paso en el aire manteniendo la altura y
  caer después. Es **puramente visual** y no puede tocar el recuento de pasos. Va
  a otra sesión por decisión suya, junto al J9.
- El XP del mundo 3, que es el J10.
