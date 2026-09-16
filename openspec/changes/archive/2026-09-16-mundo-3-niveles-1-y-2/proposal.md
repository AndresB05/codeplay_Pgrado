## Why

Los tres huecos del mundo 3 —la Costa de Bugs— siguen con el contenido del juego
anterior: «Ola de Errores», «Faro Asíncrono» y «Tormenta Final», con
`validation_rules` de escribir JavaScript. El juego los rechaza enteros y la
pantalla se lo dice al niño.

El usuario diseñó sobre boceto **los niveles 1 y 2** el 16-sep-2026, y el 3 llega
después. Decidió sembrar ya los dos que hay, en vez de esperar: así los juega hoy
y el tercero entra en una migración propia. **La mecánica que los gobierna —el
máximo de pasos— ya está construida** por `limite-de-pasos`, así que estos dos
niveles sólo tienen que traerla en su fila.

## What Changes

- **Se siembra el nivel 1**, `Nivel 1 - Dos caminos`: un anillo llano alrededor de
  un agujero de tres por tres, con salida y meta en esquinas opuestas. Hay dos
  maneras de rodearlo y **dos pilares de altura 2** deciden cuál gana: el camino
  que el personaje tiene **de frente** al empezar tiene un giro menos y cuesta
  **11**, y el otro cuesta **10**. Salida mirando al este, `optimalSteps` = 10 y
  **`stepLimit` = 10**.
- **Se siembra el nivel 2**, `Nivel 2 - El faro`: una torre de altura 6 en el
  borde oeste a la que sólo se entra desde arriba. La salida mira al lado que
  **se acaba a dos casillas**, así que de frente no se llega. Salida mirando al
  norte, `optimalSteps` = 17 y **`stepLimit` = 17**.
- **El nivel 3 NO se toca.** Sigue siendo `tormenta-final` y el juego lo sigue
  rechazando, que es el estado esperado hasta que el usuario pase su boceto. Va
  en la **0031**.
- **Una migración, `202606030030_world_3_levels_1_2.sql`**, con dos `update` por
  `(world_id, sort_order)`. No toca el esquema, ni `xp_reward`, ni `difficulty`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna. Sembrar niveles es contenido gobernado por requisitos que ya existen, y
el máximo de pasos lo especificó `limite-de-pasos`. El cambio declara
`skip_specs: true`, igual que `mundo-2-completo`.

## Impact

**Base de datos.** `supabase/migrations/202606030030_world_3_levels_1_2.sql`, dos
`update` sobre `costa-de-bugs`. **Necesita `db push` y lo lanza el usuario.**

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/levelConfig.test.ts` | Lee los dos niveles del mundo 3 de la 0030, con su `stepLimit` |
| `apps/web/src/game/levelSolutions.test.ts` | Los dos: cada solución llega con sus pasos y no hay nada más corto |

**Documentación.** `docs/CONTEXT.md`, `docs/ROADMAP-JUEGO.md` (J12.5 y J12.6),
`supabase/README.md` y `openspec/config.yaml`.

**Lo que NO entra:** el nivel 3 del mundo 3; el XP del mundo 3, que es el J10.
