## Why

El mundo 2 tiene sembrado un solo nivel, «Salta y sube», en el hueco del 2. El
usuario lo iba a acompañar de un nivel 1 más fácil y cambió de plan el
14-sep-2026: **«Salta y sube» pasa a ser el nivel 1**, y diseñó sobre boceto dos
niveles más difíciles para el 2 y el 3. Los huecos 1 y 3 siguen con el contenido
del juego anterior —«Eco de Funciones» y «Sendero Recursivo»—, que el juego
rechaza.

## What Changes

- **«Salta y sube» baja al nivel 1** con el mismo tablero y los mismos 15 pasos;
  sólo cambia el título, a `Nivel 1 - Salta y sube`.
- **Se siembra el nivel 2**, `Nivel 2 - El gran rodeo`: un camino único que rodea
  un valle, sube a un muro de altura 2 y termina a altura 3. Salida mirando al
  este, **`optimalSteps` = 25**.
- **Se siembra el nivel 3**, `Nivel 3 - La torre`: una torre con la meta a altura
  6 a la que se llega dándole la vuelta. Salida mirando al norte, **`optimalSteps`
  = 23**.
- **Una sola migración, `202606030029_world_2_levels.sql`**, con los tres
  `update`, decidido por el usuario para hacer un solo `push`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna. Sembrar niveles es contenido gobernado por requisitos que ya existen.
El cambio declara `skip_specs: true`, igual que `nivel-2-mundo-2`.

## Impact

**Base de datos.** `supabase/migrations/202606030029_world_2_levels.sql`, tres
`update` por `(world_id, sort_order)`. No toca el esquema. **Necesita `db push` y
lo lanza el usuario.**

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/levelConfig.test.ts` | Lee los tres niveles del mundo 2 de la 0029 en vez de la 0028 |
| `apps/web/src/game/levelSolutions.test.ts` | Los tres niveles: cada solución llega con sus pasos y no hay nada más corto |

**Documentación.** `docs/CONTEXT.md`, `docs/ROADMAP-JUEGO.md` (J12.1 a J12.3),
`supabase/README.md` y `openspec/config.yaml`.

**Lo que NO entra:** el mundo 3.
