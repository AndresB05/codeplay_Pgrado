## Why

El nivel 2 de la Selva Algorítmica sigue sembrado con el contenido del juego
anterior —«Puente Condicional», que además pedía una condición—, así que el juego
lo rechaza entero por el contrato §7. Éste es el **J7.2**: el segundo puzle
diseñado por el usuario, que es el primero con giros, sembrado en su fila y
jugado desde ella.

## What Changes

- **Se siembra el nivel 2 del mundo 1** con el boceto del usuario del
  13-sep-2026: un tablero de 5 × 5 con un único camino de 10 casillas en zigzag
  —el resto, huecos—, salida en la segunda casilla del borde oeste mirando al
  sur, meta en la esquina noreste y **`optimalSteps` = 12**.
- **Título, slug, descripción y narrativa nuevos**, elegidos por la sesión por
  encargo del usuario: `Nivel 2 - Camino con curvas`, `camino-con-curvas`. La
  narrativa —lo que el niño lee en «Instrucciones»— explica, en palabras de niño,
  que el número del bloque `avanzar` se puede cambiar y que un `avanzar 4` hace
  lo mismo que cuatro `avanzar 1`, que es lo que pidió el usuario.
- **El tablero se enseña jugándose ANTES de escribir la migración definitiva y
  antes de cualquier `db push`**, con varias vistas de cámara como imágenes para
  que el usuario elija. Es la lección del J7.1: allí se sembró primero y el
  rediseño costó una migración.
- **Si el usuario elige una vista distinta de la de hoy**, cambia la cámara de
  partida para todos los niveles, no sólo para éste: el encuadre es uno.
- **La migración, `202606030025_seed_level_2_world_1.sql`**, es de datos: un
  `update` localizado por `(world_id, sort_order)`, igual que la 0023.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

Ninguna. Sembrar un nivel más es contenido: los requisitos que lo gobiernan
—«El contenido de un nivel jugable se siembra en el formato del contrato» en
`backend-supabase`, y la pantalla de nivel en `contenido-mundos`— ya existen y no
cambian. Por eso el cambio declara `skip_specs: true`. **Si el usuario elige otra
vista de cámara**, tampoco toca requisitos: el ángulo no está en ningún spec.

## Impact

**Base de datos.** Una migración de datos, `supabase/migrations/202606030025_seed_level_2_world_1.sql`.
No toca el esquema, así que `apps/web/src/types/database.types.ts` no se
regenera. **Necesita `db push`, y lo lanza el usuario** con `npx supabase db push`,
después de haber leído en palabras qué fila toca y con qué valores.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/levelConfig.test.ts` | Acepta el `config` del nivel 2 **leído de su migración**, y el comentario de `previousGame` deja de decir que son las reglas del nivel 2 |
| `apps/web/src/game/levelSolutions.test.ts` | **Nuevo.** Comprueba sobre el tablero sembrado que la solución resuelta a mano llega a la meta con `optimalSteps` pasos, y que **no existe ninguna más corta** |
| `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` | **Sólo mientras dura la revisión del tablero**: el laboratorio juega el nivel 2 en lugar de `debugLevel`. Se revierte antes del commit |
| `apps/web/src/game/GameScene.tsx` | **Sólo si el usuario elige otra vista**: `CAMERA_START` |

**Documentación.** `docs/CONTEXT.md` §2.7 (la migración 25), §2.9 y §4.2b
(quedan siete niveles sin rediseñar), `docs/ROADMAP-JUEGO.md` §3 (J7.2 hecho) y
`supabase/README.md`, que además gana la entrada de la **0024**, que le falta.

**Lo que NO entra:** el candado (va en `niveles-sin-candado`), el nivel 3 (J7.3),
mandar el intento (J9), el XP (J10) y el aspecto (J13).
