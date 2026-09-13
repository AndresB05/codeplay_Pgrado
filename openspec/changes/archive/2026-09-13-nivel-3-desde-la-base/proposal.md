## Why

El nivel 3 de la Selva Algorítmica sigue sembrado con el contenido del juego
anterior —«Ciclo del Río», que pedía un bucle—, así que el juego lo rechaza entero
por el contrato §7. Éste es el **J7.3**, el último del mundo 1: el tercer puzle
diseñado por el usuario, sembrado en su fila y jugado desde ella. Con él, el J7
queda cerrado.

## What Changes

- **Se siembra el nivel 3 del mundo 1** con el boceto del usuario del
  13-sep-2026: un tablero de 5 × 5 con un único camino de 14 casillas que rodea
  el tablero, con una escalera en el centro —el resto, huecos—, salida en el
  borde sur mirando al oeste, meta en el borde este y **`optimalSteps` = 20**.
- **Sin «repetir»**, decidido por el usuario: se resuelve con `avanzar N` y los
  dos giros, aunque la escalera sea un patrón que se repite. Ese bloque no existe
  y construirlo es trabajo aparte.
- **Título, slug, descripción y narrativa nuevos**, elegidos por la sesión por
  encargo del usuario: `Nivel 3 - La escalera`, `la-escalera`.
- **La vista de cámara no se toca**: el usuario eligió en el J7.2 la de hoy para
  todos los niveles.
- **El tablero se enseña jugándose en el laboratorio antes de cualquier
  `db push`**, como en el J7.2.
- **La migración, `202606030026_seed_level_3_world_1.sql`**, es de datos: un
  `update` localizado por `(world_id, sort_order)`.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna. Sembrar un nivel más es contenido, gobernado por requisitos que ya
existen. Por eso el cambio declara `skip_specs: true`, igual que el J7.2.

## Impact

**Base de datos.** Una migración de datos, `supabase/migrations/202606030026_seed_level_3_world_1.sql`.
No toca el esquema. **Necesita `db push`, y lo lanza el usuario** con
`npx supabase db push`, después de haber leído en palabras qué fila toca.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/levelConfig.test.ts` | Acepta el `config` del nivel 3 leído de su migración |
| `apps/web/src/game/levelSolutions.test.ts` | Añade el nivel 3: la solución llega con 20 y no hay ninguna más corta |
| `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` | **Sólo mientras se enseña el tablero**: juega el nivel 3. Se revierte antes del commit |

**Documentación.** `docs/CONTEXT.md` §2.7, §1.3 y §4.2b (quedan seis),
`docs/ROADMAP-JUEGO.md` §3 (J7.3 y J7 hechos), `supabase/README.md` y
`openspec/config.yaml`.

**Lo que NO entra:** el bloque «repetir», los mundos 2 y 3 (J12), mandar el
intento (J9), el XP (J10) y el aspecto (J13).
