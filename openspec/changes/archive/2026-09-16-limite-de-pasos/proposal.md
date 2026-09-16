## Why

El mundo 3 —la Costa de Bugs— no es «otro mundo con tableros más grandes». El
usuario lo diseñó el 16-sep-2026 alrededor de una regla propia: **cada nivel trae
un número máximo de pasos, y hay que llegar a la meta sin agotarlo**. Deja de ser
un problema de llegar y pasa a ser uno de elegir el camino más corto, que es lo
que lo hace el mundo difícil.

Esa regla **no existe en ninguna parte**: ni en `config` (contrato §4.2), ni en el
intérprete, ni en la pantalla. Y no basta con sembrarla: el lector de niveles
**descarta en silencio** los campos que no conoce, así que un nivel sembrado hoy
con un límite se jugaría sin él y nadie se enteraría. La mecánica va antes que los
tableros.

## What Changes

- **`config` gana un campo opcional, `stepLimit`** (contrato §4.2): los pasos que
  el nivel concede como mucho. Un nivel sin él se juega exactamente como hoy, sin
  límite y sin contador nuevo — que es el caso de los **seis niveles ya
  sembrados**, que no se tocan.
- **El recorrido se corta al agotar el límite.** El personaje se planta donde
  llegó y no se mueve más; el recorrido termina ahí y no llega a la meta, salvo
  que ya la hubiera pisado antes de quedarse sin pasos.
- **Un salto nunca se parte por la mitad.** Cuesta dos pasos, así que con un solo
  paso de sobra no se ejecuta: el personaje se queda en el borde en vez de
  congelarse en el aire.
- **El contador cambia de sentido en los niveles con límite**: en vez de decir los
  pasos dados, dice **los que quedan**. En reposo marca el límite entero, baja
  mientras el personaje se mueve y llega a cero al agotarse. En los niveles sin
  límite sigue diciendo lo que lleva, como hoy.
- **El resultado tiene texto propio para quedarse sin pasos**, y le pide al niño
  reiniciar. No dice «no llegaste a la meta» a secas, que suena a programa malo
  cuando lo que pasó es que fue demasiado largo.
- **Un `stepLimit` por debajo de `optimalSteps` rechaza el nivel entero.** Es un
  nivel imposible, y de los que **sí** se pueden cazar leyendo, como la meta sobre
  un hueco.
- **No toca la base de datos.** Ninguna migración, ningún nivel sembrado, ningún
  cambio de esquema.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- **`juego-3d`**. Se añade el requisito del máximo de pasos, y cambian dos: el
  del **contador**, que hoy prohíbe expresamente decir cuántos faltan, y el del
  **nivel que no se puede leer**, que gana el rechazo del máximo imposible.

## Impact

**Base de datos.** Nada. Sin migración y sin `db push`.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/level.ts` | `LevelConfig` gana `stepLimit?: number` |
| `apps/web/src/game/levelConfig.ts` | Lee el campo, y rechaza el nivel si es inválido o menor que `optimalSteps` |
| `apps/web/src/game/interpreter.ts` | `runProgram` corta el recorrido al agotar el límite y lo marca |
| `apps/web/src/game/GameScene.tsx` | El contador en cuenta atrás y el texto de quedarse sin pasos |
| `apps/web/src/game/levelConfig.test.ts` | El campo aceptado, el ausente y los rechazos |
| `apps/web/src/game/interpreter.test.ts` | El corte, el salto que no cabe y la meta pisada justo a tiempo |

**Documentación.** `docs/CONTRATO-DE-INTEGRACION.md` §4.2 y §4.4,
`docs/CONTEXT.md`, `docs/ROADMAP-JUEGO.md` y `openspec/config.yaml`.

**Lo que NO entra:**

- **Sembrar los niveles del mundo 3.** Es el cambio siguiente, con su migración
  0030. El usuario tiene dos de los tres tableros y el tercero llega después.
- **El XP.** El usuario decidió que en el mundo 3 pasar el nivel se lleva el XP
  entero, porque pasar y ser óptimo son lo mismo cuando el límite es el óptimo.
  Eso lo escribe el **J10**, que no existe todavía; aquí sólo queda anotado.
- **Bloquear el programa antes de ejecutarlo.** El límite se agota jugando, que es
  como el usuario lo pidió: el niño ve al personaje quedarse sin pasos.
