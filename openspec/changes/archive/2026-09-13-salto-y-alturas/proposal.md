## Why

El mundo 2 ya no es un camino llano: el usuario lo diseñó con **subidas**, y para
subirlas un bloque nuevo, **«salto»**. Hoy el juego no tiene alturas, y no por
omisión: el contrato lo prohíbe por escrito —§4.2 «Sin alturas» y §3 «un paso es
una casilla recorrida o un giro, nunca un escalón»—, y los bloques que existen
son planos, así que nadie ha registrado todavía cómo se guarda un bloque con otros
dentro (§4.3 y §8).

Sin este cambio no se puede sembrar el primer nivel del mundo 2. Va **antes** que
ese nivel y aparte de él, porque cambia el formato del tablero, el recuento de
pasos y la forma del programa, que son las tres cosas que el contrato gobierna.

## What Changes

- **El tablero gana alturas.** Cada casilla que existe es una **columna de
  cubos** de altura 1 o más; nunca hay cubos flotando. Una casilla hueca sigue
  sin existir. Decidido por el usuario el 13-sep-2026.
- **«avanzar» respeta la altura:** pasa a una casilla de la misma altura o **más
  baja, sin límite**; contra una **más alta** choca, como contra un muro.
- **Nace el bloque «salto»**, que lleva **otros bloques dentro** y los ejecuta en
  orden, **saltando**, como una función:
  - vacío, salta en el sitio;
  - con «avanzar N» dentro, recorre N casillas saltando: **sube un nivel**, avanza
    a la misma altura o **baja**; si la casilla de delante está **dos o más
    niveles más alta** o es hueco, salta en el sitio y se queda;
  - con un giro dentro, gira mientras salta.
- **El recuento cambia** (contrato §4.4): un «salto» vacío cuesta **1** paso;
  con bloques dentro, **el doble de lo que cuestan esos bloques**. La idea, del
  usuario: el salto ahorra bloques, no pasos —un salto con «avanzar 2» cuesta lo
  mismo que dos saltos con «avanzar 1»—.
- **Nueva versión del formato, `grid-blockly-2`**, porque cambian las dos formas
  que la versión nombra: `config` gana las alturas y el programa gana un bloque
  con cuerpo. **Pasa a ser la única que el juego acepta**, y **los tres niveles
  del mundo 1 se reescriben a ella** con una migración —mismos tableros, todas
  las alturas a 1—. Se puede hacer sin coste porque todavía no hay ningún intento
  guardado (J9) que lleve la versión 1.
- **El contrato se reescribe** en §3, §4.2, §4.3, §4.4 y §8, y **se registra por
  fin la forma del anidamiento** con una salida real del editor.
- **La escena apila cubos y anima el salto.** Sigue siendo con cubos, sin
  modelos: el aspecto es del J13.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `juego-3d`: el tablero tiene alturas; el movimiento las respeta; hay un bloque
  con cuerpo y su ejecución; el recuento lo cuenta; y la versión del formato deja
  de ser la 1.

## Impact

**Base de datos.** Una migración de datos, `supabase/migrations/202606030027_world_1_levels_format_2.sql`,
que reescribe `programming_language`, `starter_code` y `validation_rules` de los
tres niveles del mundo 1 a `grid-blockly-2`. **Necesita `db push`, y lo lanza el
usuario.** No toca el esquema. **Mientras no se aplique, el mundo 1 deja de
jugarse** en cuanto el código nuevo esté desplegado, así que código y migración
se prueban juntos antes del commit.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/level.ts` | `LevelConfig` gana `heights` |
| `apps/web/src/game/levelConfig.ts` | Comprueba las alturas y exige `grid-blockly-2` |
| `apps/web/src/game/program.ts` | `PROGRAM_FORMAT_VERSION` pasa a `grid-blockly-2` |
| `apps/web/src/game/movement.ts` | `advance` respeta la altura y nace el avance saltando |
| `apps/web/src/game/blockTypes.ts` | El nombre del bloque «salto» y de su cuerpo |
| `apps/web/src/game/blocks.ts` | Define «salto» con cuerpo y lo añade a la caja |
| `apps/web/src/game/interpreter.ts` | Lee el cuerpo, cuenta el salto y lo ejecuta |
| `apps/web/src/game/GameScene.tsx` | Columnas de cubos, personaje a su altura, animación del salto y encuadre que cabe |
| `apps/web/src/game/debugLevel.ts` | La rejilla de pega gana alturas |
| `apps/web/src/game/*.test.ts` | Movimiento con alturas, lectura y recuento del salto, ida y vuelta de un bloque con cuerpo, y los niveles leídos de la 0027 |

**Documentación.** `docs/CONTRATO-DE-INTEGRACION.md` §3, §4.2, §4.3, §4.4 y §8;
`docs/DISENO-DEL-JUEGO.md` donde diga que no hay alturas; `docs/CONTEXT.md` §2.9 y
§1.4; `docs/ROADMAP-JUEGO.md`; `supabase/README.md`; `openspec/config.yaml`.

**Lo que NO entra:** sembrar el nivel 1 del mundo 2, que va en su propio cambio
después de éste; el bloque «repetir»; y el aspecto (J13).
