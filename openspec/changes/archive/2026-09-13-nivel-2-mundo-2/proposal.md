## Why

El nivel 2 de la Cordillera Binaria sigue sembrado con el contenido del juego
anterior —«Mochila de Datos»—, así que el juego lo rechaza entero. El boceto del
usuario del 13-sep-2026 con subidas, el que motivó `salto-y-alturas`, va aquí:
el usuario lo jugó en el laboratorio y pidió sembrarlo **como nivel 2**, porque el
nivel 1 del mundo será uno más fácil que todavía no está diseñado.

## What Changes

- **Se siembra el nivel 2 del mundo 2** con el boceto del usuario: 5 × 5, una
  subida de altura 1 a una meseta de altura 3 por un escalón de altura 2, salida
  mirando al norte y **`optimalSteps` = 15**.
- **Título, slug, descripción y narrativa nuevos**, elegidos por la sesión:
  `Nivel 2 - Salta y sube`, `salta-y-sube`. La narrativa explica en palabras de
  niño cómo se usa «saltar» —el avanzar va dentro— y avisa de que hay más de un
  camino y no todos cuestan lo mismo.
- **La migración, `202606030028_seed_level_2_world_2.sql`**, es de datos y va en
  la versión 2 del formato. Se aplica en el mismo `push` que la 0027, que es la
  que devuelve el mundo 1 al juego.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna. Sembrar un nivel es contenido gobernado por requisitos que ya existen.
El cambio declara `skip_specs: true`, igual que el J7.2 y el J7.3.

## Impact

**Base de datos.** `supabase/migrations/202606030028_seed_level_2_world_2.sql`,
un `update` por `(world_id, sort_order)`. No toca el esquema. **Necesita `db push`
y lo lanza el usuario**, junto a la 0027.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/levelConfig.test.ts` | Acepta el `config` del nivel leído de la 0028 |
| `apps/web/src/game/levelSolutions.test.ts` | Añade el nivel: la solución llega con 15 y no hay nada más corto |

**Documentación.** `docs/CONTEXT.md` §1.3, §2.7 y §4.2b (quedan cinco),
`docs/ROADMAP-JUEGO.md` (J12.2), `supabase/README.md` y `openspec/config.yaml`.

**Lo que NO entra:** el nivel 1 del mundo 2, que el usuario quiere más fácil y
todavía no ha diseñado; el nivel 3 del mundo 2; el mundo 3.
