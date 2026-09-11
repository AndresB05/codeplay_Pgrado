## Why

El J6.3 dejó la pantalla compuesta como estará el nivel, pero lo que hay dentro
siguen siendo cubos de colores. Éste es el **J6.4** de `docs/ROADMAP-JUEGO.md` §3
—«El ensayo general antes de sembrar»—, y va **antes del J7** por el orden de los
errores: encuadre, escala y contraste sólo se juzgan con algo delante, y
descubrir después de sembrar tres niveles que el tablero pide otra cosa obliga a
rehacer lo que ya está en la base.

**Esta propuesta es la SEGUNDA, y la primera está tirada entera.** Se implementó
un tanteo en el que cada casilla era un bloque suelto del kit, con decorado del
Nature Kit alrededor; **el usuario lo vio el 9-sep-2026 y lo rechazó por el
aspecto**: veinticinco bloques uno al lado de otro no se leen como un suelo, y las
piezas posadas y despegadas se ven mal. Lo que sigue sale de su boceto, que es la
referencia y manda sobre este texto.

**Sobrevive del intento anterior lo que no era aspecto**: el límite de error de la
escena y la forma de leer la casilla del personaje por nombre. Los dos están ya en
el árbol y esta propuesta no los rehace.

## What Changes

**EL SUELO ES UNA SOLA PIEZA DE TERRENO**, no veinticinco bloques: canto de tierra
continuo alrededor, cara de arriba de hierba, y **ninguna junta ni hueco entre
casillas**. Es el cambio que motiva esta segunda vuelta.

**La cuadrícula se marca por COLOR**: damero de dos verdes, uno un poco más oscuro
que el otro. Y **los tres tonos salen del propio kit**, no de un color inventado:
medidos en `platformer/Textures/colormap.png`, con las UV leídas del propio
`block-grass.glb` — hierba `#57C186`, su tono siguiente `#45AF7E` y tierra
`#E89066`. Poco contraste, pero contable: el niño cuenta casillas para saber
cuántos pasos da, y ésa es la única razón por la que la cuadrícula se ve.

**El tablero no cambia ni una casilla**: 5 × 5, el hueco del centro se queda —y es
sólo del laboratorio, los niveles de verdad no llevarán huecos— y `debugLevel` no
se toca.

**Los cuatro muros dejan de ser cubos y cada uno es una cosa distinta:**

| Casilla | Qué va | Kit |
| --- | --- | --- |
| fila 0, col 3 —pegada a la meta— | una **plataforma fusionada** con la cuadrícula | Platformer |
| fila 1, col 1 · fila 3, col 1 · fila 3, col 3 | dos **rocas** y un **tocón** | Survival |

**Los obstáculos van un poco más grandes que su casilla**, a propósito: así se
leen como obstáculo y no como adorno.

**La meta lleva `flag.glb`. La salida no se marca de ninguna manera**: basta con
que el personaje esté ahí. El azul y el amarillo de hoy se van.

**Decoración: flores y pasto del Platformer Kit sobre casillas pisables, sin
colisión.** El pasto y la hierba **nunca estorban**; para eso los obstáculos son
más grandes.

**Fuera del tablero**, como en el boceto: plataformas altas con su canto de
hierba, árboles de dos formas y escalados distinto, un `rock-flat` tumbado sobre
una plataforma, una valla y un trozo de pasarela pegado a una plataforma.

**Y LA REGLA QUE MANDA SOBRE TODO: las piezas se FUSIONAN.** Nada se posa entero y
despegado al lado de otra cosa: una parte de cada pieza queda metida dentro de
otra. Lo que queda apoyado y separado es justo el defecto que este paso viene a
arreglar.

**Los kits cambian.** `nature/` se borra entero —330 archivos, 3,7 MB— y entra el
**Survival Kit** completo: 80 GLB (1,24 MB), su `Textures/colormap.png` hermano y
su `License.txt`. Hoy sólo se usan sus rocas y su tocón; el resto entra porque el
usuario quiere tenerlo. Autorizado por él.

**Lo que este cambio NO hace:**

- **no cierra el aspecto**: el apartado gráfico de verdad es el **J13**, los tres
  mundos de una vez, y rehará esto entero;
- **no toca las reglas del juego**: `level.ts`, `movement.ts` e `interpreter.ts` se
  quedan como están, y `LevelConfig` no gana ni un campo;
- **no toca el encuadre a ojo**: si con los modelos hay que mover `CAMERA_START` o
  `BOARD_LIFT`, se mide como lo midió el J6.3 y los números se suben antes;
- **no añade dependencias**: `three` 0.170 trae su `GLTFLoader` y drei ya está por
  `OrbitControls`. El lockfile no se toca.

## Capabilities

### New Capabilities

Ninguna. Todo cae en `juego-3d`.

### Modified Capabilities

- `juego-3d`: cinco deltas.
  - **ADDED** «Los modelos 3D se piden por URL en tiempo de ejecución» — que el
    aspecto no entre en el bundle ni crezca con cada pieza que se pruebe.
  - **ADDED** «Un modelo que no llega no deja la pantalla en blanco» — **ya
    implementado y verificado**; el requisito lo estaba pidiendo el código sin que
    nadie lo hubiera escrito.
  - **ADDED** «Se ve hacia dónde mira el personaje» — hoy lo sostiene el saliente
    sobre la cabeza del cubo; la exigencia es del producto y no de la pieza que
    la cumple, así que sobrevive al modelo que la sustituya.
  - **MODIFIED** «El tablero se dibuja a partir de la configuración del nivel» —
    la rejilla **SHALL poder contarse**, y lo que dibuja una casilla **puede
    salirse de ella** —el obstáculo más grande, el labio de hierba— sin abrir
    rendijas ni esconder la casilla de al lado.
  - **MODIFIED** «El mapa se puede girar y acercar» — su tope de arriba lo
    justifica hoy «la marca que lleva sobre la cabeza», que es el cubo.

**Y una garantía que se escribió aquí y NO entra al spec: «lo que estorba se
distingue de lo que adorna»** —el pasto y las flores nunca bloquean, y un
obstáculo se ve como tal antes de que el niño choque—. Es del usuario y sigue en
pie como intención, pero **el árbol no la cumple**: la tabla de madera de la
casilla junto a la meta es plana, está sobre la hierba y se lee como adorno.
Archivarla sería meter en el spec una garantía falsa, así que **se va al J13**,
que es donde los obstáculos se dibujan de verdad y donde se puede cumplir.

## Impact

**Código.**

- `apps/web/src/game/GameScene.tsx` — el grueso: el tablero pasa a ser geometría
  generada de una pieza, y entran obstáculos, meta, decoración y el escenario de
  fuera. Es el único archivo que importa `three` y `drei`, y sigue bajo la
  frontera diferida.
- `apps/web/src/game/GameSceneLoader.tsx` — **no se toca**: su límite de error ya
  está puesto y verificado.
- `apps/web/src/game/level.ts`, `debugLevel.ts`, `movement.ts`, `interpreter.ts` y
  sus tests — **no se tocan**.

**Assets.**

- `apps/web/public/models/nature/` — **se borra entera**, con su `LICENSE.txt`.
- `apps/web/public/models/survival/` — **nueva**: 80 GLB, `Textures/colormap.png`
  y `License.txt`, sacados de `Models/GLB format/` del zip original. Sólo GLB,
  como manda el README.
- `apps/web/public/models/README.md` — **se rehace**: la tabla de kits, los
  recuentos, el total y el «qué hay dentro» quedan mintiendo en cuanto se toquen
  las carpetas. Y la regla de la textura hermana pasa a estar escrita **para los
  dos kits**: al survival le pasa lo mismo que al platformer.

**Peso.** `GameScene` está hoy en **849,48 kB** (§4.8). Los `.glb` no entran al
bundle; el cargador sí. Se mide antes y después y se anota. El trozo principal
—625,00 kB— no debe moverse ni un byte.

**Documentación.** `docs/CONTEXT.md` §2.9 y §4.8 —cuyas cifras de `BlockEditor` y
de la hoja de estilos vienen de antes del commit `7b5c43a` y no cuadran con el
árbol: se corrigen— y el estado del J6.4 en `docs/ROADMAP-JUEGO.md` §3.

**Supabase: no.** Este cambio no toca el esquema, no lee de la base y **no pide
ningún `supabase db push`**.
