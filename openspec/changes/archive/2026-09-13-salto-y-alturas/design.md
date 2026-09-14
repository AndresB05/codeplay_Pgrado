## Context

Ver `proposal.md` — Why. Lo que condiciona el diseño, medido en el repositorio a
13-sep-2026:

- **`LevelConfig`** (`game/level.ts`) es `tiles`, `start`, `goal` y
  `optimalSteps`, y el contrato §4.2 dice que ese JSON es el tipo del juego sin
  traducir.
- **`advance`** (`game/movement.ts`) sólo mira la clase de casilla y devuelve
  `blockedBy` en `'wall' | 'gap' | 'edge'`. El intérprete lo reutiliza tal cual.
- **`readProgram`** (`game/interpreter.ts`) baja por `next.block` y devuelve
  órdenes **planas**; `countSteps` suma, y **dos tests fijan que `countSteps` y
  `runProgram(...).steps.length` coinciden por construcción**. El contador de la
  escena cuenta entradas del recorrido.
- **La versión es una constante**, `PROGRAM_FORMAT_VERSION = 'grid-blockly-1'`,
  y `openLevel` y `openProgram` exigen igualdad con ella.
- **La caja de bloques es una rejilla de 3 × 2** (`CONTEXT.md` §2.9): cabe un
  cuarto bloque sin tocar la maqueta.
- **No hay ningún intento guardado**: nada llama todavía a `create_level_attempt`
  (J9). Ningún dato de la base lleva la versión 1 salvo las tres filas del mundo
  1.

## Goals / Non-Goals

**Goals:**

- Que un nivel con alturas se describa, se compruebe, se juegue y se cuente.
- Que el recuento siga siendo **una lectura del programa**, sin tablero, y que
  siga coincidiendo con el recorrido.
- Registrar en el contrato cómo serializa Blockly un bloque con cuerpo, copiado de
  una salida real.

**Non-Goals:**

- No se siembra ningún nivel del mundo 2: va en su propio cambio.
- No hay «repetir», ni saltos dentro de saltos.
- No se viste nada: cubos de colores.

## Decisions

### Las alturas van en una matriz aparte, `heights`, y el hueco vale 0

```json
{
  "tiles":   [["floor", "gap"], ["floor", "floor"]],
  "heights": [[1,       0    ], [2,       3      ]],
  "start": { "cell": { "row": 1, "column": 0 }, "facing": "east" },
  "goal": { "row": 1, "column": 1 },
  "optimalSteps": 4
}
```

- **`heights` mide lo mismo que `tiles`**, rectangular y alineada con ella.
- **Suelo y muro: entero ≥ 1. Hueco: exactamente 0.** Un hueco con altura, o una
  casilla que existe con altura 0, **rechaza el nivel entero** (§7). Es la regla
  de siempre —dos maneras de decir lo mismo se contradicen en cuanto alguien edite
  una— convertida en comprobación en vez de en un campo quitado.
- **Una altura es una columna**: el usuario lo fijó así —«las plataformas nunca
  flotan»—, así que no hace falta describir qué hay debajo.

**Alternativa descartada: meter la altura dentro de `tiles`** (números en vez de
`"floor"`). Ahorra una matriz, pero mezcla tipos en una misma celda y obliga a
reescribir la distinción entre muro y hueco, que el contrato ya explica al niño con
palabras distintas.

### Una sola versión viva, `grid-blockly-2`, y el mundo 1 se reescribe a ella

**Decisión que conviene que el usuario revise.** Cambian las dos formas que el
token nombra —`config` gana `heights` y el programa gana un bloque con cuerpo—, así
que el contrato §4.3 manda versión nueva.

Quedaban dos caminos:

1. **Aceptar las dos versiones** y leer una `grid-blockly-1` como tablero de
   altura 1. Cero migraciones, pero el juego carga para siempre con dos formas, y
   un nivel de la 1 ofrecería en la caja un «salto» que su versión no define: su
   programa diría `grid-blockly-1` y llevaría un bloque de la 2.
2. **Aceptar sólo la 2 y reescribir los tres niveles del mundo 1** con alturas a
   1. Una migración más y un `db push`, y el juego conoce una sola forma.

**Se elige la 2** porque hoy es gratis: **no hay ningún intento guardado** que
lleve la versión 1, así que no queda nada escrito que deje de poder leerse. El
día que los haya, cambiar de versión obligará a elegir otra vez.

**El riesgo que trae**: entre desplegar el código y aplicar la migración, el mundo
1 cae en el rechazo del §7. No hay despliegue todavía (paso 27), así que se cubre
probando código y migración juntos antes del commit.

### «avanzar» y el avance saltando son dos reglas en `movement.ts`

| Destino | `advance` | `jumpAdvance` |
| --- | --- | --- |
| Misma altura | pasa | pasa |
| Más baja, cualquier diferencia | pasa | pasa |
| Un nivel más alta | **choca** | pasa |
| Dos o más niveles más alta | **choca** | **salta en el sitio** |
| Muro, hueco o fuera | choca | salta en el sitio |

`Blocker` gana **`'high'`**, para que la escena pueda enseñar el topetazo contra
una columna igual que contra un muro. Las dos funciones siguen sin mutar la pose y
sin lanzar: chocar es una regla del juego.

**No se puede caer al vacío**, dicho por el usuario: bajar exige casilla donde
pisar, y un hueco delante bloquea igual que hoy.

### El salto es una orden con cuerpo, y el recorrido lleva dos entradas por cada paso saltado

`Order` gana `{ kind: 'jump'; body: Order[] }`. **Dentro sólo caben `avanzar` y
los giros**: un «salto» dentro de otro no tiene regla de coste ni de movimiento, y
se impide **en el editor** —el cuerpo no acepta ese bloque— y **en la lectura**
—un salto anidado hace ilegible el programa entero, como un bloque desconocido—.

**El recuento**, que es lo que el servidor tendrá que reproducir:

```
pasos(salto [])      = 1
pasos(salto [cuerpo]) = 2 × pasos(cuerpo)
```

**El recorrido conserva la invariante** de que tiene tantas entradas como pasos
cuenta la lectura, porque de ella cuelgan el contador y dos tests:

- un **salto vacío** deja **una** entrada: salta en el sitio;
- **cada paso de su cuerpo** deja **dos**: el despegue y el aterrizaje. Un giro
  dentro de un salto despega en su casilla y aterriza girado; cada casilla de un
  «avanzar N» despega en una y aterriza en la siguiente —o en la misma, si no
  pudo—.

`RunStep` gana `motion: 'walk' | 'takeoff' | 'landing' | 'hop'`, que es lo único
que la escena necesita para elegir la animación. **El contador sube dos veces por
casilla saltada**, y es correcto: cuenta pasos, y esa casilla cuesta dos.

**Alternativa descartada: una sola entrada que valga dos.** Rompe la invariante
entre lectura y recorrido que protegen los tests del J6, y el contador tendría
que sumar pesos en vez de contar entradas.

### El bloque «salto» y su forma serializada

- `codeplay_jump`, con una entrada de sentencias **`BODY`**, que en el JSON de
  Blockly aparece como `inputs.BODY.block` con su propia cadena `next`.
- **La forma exacta se copia de una salida real del editor** al contrato §4.3 y a
  un test, no se escribe de memoria: es el mismo método que usó el J4.
- Color propio del tema —ninguno de los tres que ya usan los otros bloques— y
  texto en español: «saltar».

### La escena apila columnas y el encuadre cuenta con la altura

- **Una columna de cubos por casilla**, de `TILE_SIZE` cada uno, con el de arriba
  del color que toque —salida, meta o damero—, y la cara de arriba de la columna
  en `y = altura − 1`, de modo que un tablero todo a 1 se vea **exactamente como
  hoy**.
- **El personaje se pinta sobre la cara de arriba** de su columna, y el salto es
  un **arco** sobre el mismo reloj de `useFrame` que ya anima el paso: sin
  librerías nuevas.
- **El encuadre**: `boardScale` hoy mira sólo el lado mayor. Con columnas de 3 el
  tablero crece hacia arriba y puede salirse por encima o tapar la bandeja. **Se
  mide con el nivel real del mundo 2 delante** y se ajusta `BOARD_LIFT` o la
  escala con la altura máxima; con alturas a 1 la vista tiene que seguir siendo
  **la de hoy**, que el usuario eligió dos veces.

### El contrato

- **§3**: un paso es una casilla recorrida, un giro o **un salto**, con la regla
  del doble.
- **§4.2**: fuera «Sin alturas»; entra `heights` con sus reglas y el ejemplo.
- **§4.3**: la versión pasa a `grid-blockly-2` y **se registra el anidamiento**
  con una salida real.
- **§4.4**: la tabla gana las dos filas del salto y un ejemplo resuelto con
  subida.
- **§8**: sale de la lista «cómo se serializa un bloque con cuerpo».

## Risks / Trade-offs

- **El mundo 1 deja de jugarse hasta que se aplique la 0027** → Se prueban juntos
  y el commit no sale hasta que la base tenga la migración.
- **Cambiar la versión ahora deja escrito que cambiarla es barato** → Sólo lo es
  porque no hay intentos guardados; queda dicho en el contrato para que el J9 lo
  sepa.
- **Un árbol en vez de una lista rompe supuestos de `readProgram`**, como la
  cadena que acaba en `null` a mitad de un arrastre → Los tests de lectura llevan
  el cuerpo con su `null` literal, igual que la cadena principal.
- **El editor deja de publicar de forma intermitente** (`CONTEXT.md` §4.10) → La
  verificación mira dónde está el personaje, leído de la escena.

## Migration Plan

1. Código y tests, con la rejilla de pega y los tableros del mundo 1 leídos de la
   0027 todavía sin aplicar.
2. Se enseña en el laboratorio un tablero de prueba con subidas, y el salto
   animado.
3. Se mide la fila de los tres niveles del mundo 1, se cuenta la 0027 en palabras,
   y **el usuario lanza `npx supabase db push`**.
4. Se juegan los tres niveles del mundo 1 en su pantalla, que tienen que verse y
   puntuarse igual que antes.
5. **Vuelta atrás:** no la hay por edición. Si algo sale mal, otra migración.
