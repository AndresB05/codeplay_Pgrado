## Context

Ver `proposal.md` — Why. Aquí sólo lo que condiciona el cómo.

**Lo que YA está en el árbol y este cambio no rehace**, del intento rechazado:

- **el límite de error de la escena**, `SceneBoundary` en `GameSceneLoader.tsx`.
  Va encima del `<Canvas>` porque fiber **vuelve a lanzar** el error en el render
  del propio `<Canvas>` y nada de dentro puede atraparlo. Medido antes de
  escribirlo: con un `.glb` que no existe y sin límite, React desmonta el árbol
  **entero** —`#root` con cero hijos: se va la barra lateral, el editor y la
  navegación—;
- **los `name` de `board` y `character`**, con los que la casilla del personaje se
  lee por nombre y no por el color del cubo. Comprobado contra la vía vieja: las
  dos dieron la misma lectura en las 32 muestras de un PROGRAMA A entero.

**Medido en los propios archivos, y es lo que hace posible el diseño nuevo:**

- **`colormap.png` del platformer es una PALETA, no un dibujo.** 512 × 512 con 16
  × 16 celdas de 32 px, y cada modelo apunta a una. Las UV del propio
  `block-grass.glb`: la cara de arriba usa **(0,9688 · 0,5312)** y las de abajo
  **(0,4688 · 0,5312)**. Leído del PNG, el **color del centro** de esas celdas es
  **hierba `#57C186`** y **tierra `#E89066`**, y el de la celda de debajo de la
  hierba, **`#45AF7E`**, es el mismo verde un tono más oscuro. **Los tres colores
  del tablero salen de ahí.**

  **Y las celdas NO son planas del todo**, que conviene decirlo para que quien
  venga a medirlo detrás encuentre lo que hay: la de la hierba tiene **27 colores
  distintos** en sus 32 × 32, la de la tierra otros 27 y la del verde oscuro 31 —un
  degradado mínimo, de compresión—. En pantalla la diferencia no se ve, pero lo que
  se toma es **el color del centro**, no «el color de la celda».
- **El material del kit es `metallicFactor: 0` con la textura como color base y
  sin factor de rugosidad**, o sea la rugosidad por defecto. Un
  `meshStandardMaterial` con esos mismos valores y el color plano del téxel se
  ilumina **igual** que los modelos: la textura en esos téxeles es color liso.
- **Piezas del platformer, medidas**: `platform.glb` es **1 × 0,195 × 1** —justo
  una casilla—, `flowers` 0,78 de ancho, `grass` 0,52, `fence-straight` 1 × 0,4 ×
  0,14, `tree` 1,09 × 1,93 y `tree-pine` 0,95 × 2,0, `block-grass-large` 2,08 × 1
  y `block-grass-large-tall` 2,08 × 2.
- **Piezas del survival, medidas**: `rock-a` 0,56 × 0,39 × 0,62, `rock-b` 0,83 ×
  0,42 × 0,72, `rock-c` 0,78 × 0,51 × 0,57, `rock-flat` **1,79 × 0,195 × 1,45**,
  `tree-trunk` **0,20 × 0,26 × 0,20**. **El kit está a otra escala que el
  platformer**: sus rocas no llegan a una casilla y el tocón es diminuto, así que
  las piezas de obstáculo **hay que escalarlas**.
- **`character-oobi.glb` mira a +z** —sus nodos `leg-left`/`leg-right` caen en x
  +0,107 y −0,093, y el volumen se asoma más por +z—, mientras `FACING_ANGLE` da
  por hecho −z.
- **El personaje lleva esqueleto**, y eso mordió en el intento anterior: `<Clone>`
  copia el grafo sin volver a atar los huesos y la copia **deja de seguir a su
  grupo** —el personaje se quedaba pintado en la salida con el recorrido ya
  terminado—. Va con `<primitive>`, que además es lo correcto: hay uno solo.

## Goals / Non-Goals

**Goals:**

- Que el tablero se lea como **un trozo de suelo**, no como veinticinco piezas.
- Que la rejilla **se cuente** sin que el damero se note más de lo necesario.
- Que las piezas **se fundan** unas con otras, que es el defecto que tumbó el
  primer intento.
- Que se distinga **lo que estorba de lo que adorna** sin ejecutar el programa.

**Non-Goals:**

- **Elegir el aspecto definitivo.** Es el J13, los tres mundos de una vez.
- **Tocar las reglas del juego, el contrato del nivel o la animación.**
- **Reencuadrar a ojo.**
- **Pintar el resto del Survival Kit.** Entra completo porque el usuario lo
  quiere; hoy sólo se usan rocas y tocón.

## Decisions

### El tablero es UNA geometría generada, no piezas del kit

Se construye en un `useMemo` una sola `BufferGeometry` con **tres grupos de
material** —verde claro, verde oscuro y tierra— y dos partes:

- **la tapa**: un cuadrado por casilla pisable, a y = 0, repartido entre los dos
  verdes según la paridad de `fila + columna`. Las casillas comparten arista, así
  que **no hay junta ni rendija**: lo único que cambia entre una y otra es el
  color;
- **el canto**: sólo el **contorno** —el de fuera y el del hueco—, extruido hacia
  abajo hasta y = −0,6, con el color de tierra. Por dentro no se dibuja nada,
  porque no se ve.

Y **la tapa sobresale 0,04 del canto**, que es el labio de hierba de los bloques
del kit: sin él, el canto y la hierba forman una arista viva que no se parece a
las piezas que van alrededor.

**Alternativas descartadas, las dos por lo mismo:** un bloque del kit por casilla
—es exactamente el intento que el usuario rechazó— y fundir bloques del kit en una
geometría —seguirían viéndose las juntas del labio de hierba, que es lo que les da
forma—.

**El hueco sale gratis**: es una casilla que no entra en la tapa y cuyo contorno sí
entra en el canto. Y **la forma la sigue mandando `LevelConfig`**: la geometría se
recalcula si cambia el tablero, así que el J7 podrá sembrar niveles sin huecos sin
tocar nada de esto.

### Los colores no se inventan: son téxeles del kit

Los tres del tablero salen medidos de `colormap.png` con las UV del propio
`block-grass.glb` —ver Context—. Van como constantes con su UV al lado, junto a
los hexadecimales que ya tenía el archivo, que son la excepción declarada del
repo: **un material de `three` recibe un color, no una clase de Tailwind**.

**Y NO se toma la textura como `map`.** Sería más «puro» —el terreno con la misma
imagen que los modelos—, pero obliga a escribir a mano las UV de cada vértice de
la geometría para que caigan en el téxel correcto, y en esos téxeles la textura es
color liso: el resultado en pantalla es el mismo. Se anota por si el J13 quiere
degradados, que ahí sí cambiaría la respuesta.

### Los obstáculos se hunden, y se salen de su casilla

**Ninguna pieza se posa: todas se meten.** La regla del usuario, aplicada:

- **la plataforma de la fila 0, columna 3** —la de junto a la bandera;
  `platform.glb`, que mide exactamente una casilla— se incrusta en la cuadrícula:
  se hunde un poco por debajo de y = 0, de modo que su canto de madera nace del
  propio suelo;
- **el tocón va en la fila 3, columna 1** —el bulto más cercano al personaje— y
  **las dos rocas en la fila 1, columna 1 y la fila 3, columna 3**. Decidido por
  el usuario sobre el boceto. **Las filas y columnas de este documento cuentan
  desde 0**, como `debugLevel.ts`; al hablarlo con él van descritas con palabras,
  porque él cuenta desde 1;
- **las rocas y el tocón** se escalan hasta pasar de la casilla —el objetivo es
  del orden de 1,2 a 1,4 de ancho contra la casilla de 1— y se hunden **entre un
  cuarto y un tercio de su alto** en el suelo. Una roca apoyada encima parece
  puesta ahí; una hundida parece que está.

**El tamaño es lo que dice «no se pasa»**, y por eso los adornos son pequeños:
`grass` mide 0,52 y `flowers` 0,78 de ancho contra el 1,2–1,4 de un obstáculo.

### El escenario de fuera cuelga del mismo grupo del tablero

Plataformas altas con `block-grass-large` y `block-grass-large-tall` —canto de
hierba y tierra, como el boceto—, árboles `tree` y `tree-pine` **escalados
distinto entre sí** para que no se lean repetidos, y un `rock-flat` tumbado sobre
una plataforma.

**La valla va DETRÁS DEL PERSONAJE, en una plataforma propia**, al sur de la
casilla de salida y **fuera de la rejilla**. Decidido por el usuario: sobre una
casilla pisable se leería como muro sin serlo, que es justo lo que el requisito
nuevo prohíbe.

**Y el trozo de pasarela es `platform.glb`**, la tabla de madera del platformer,
saliendo del borde de una plataforma. No se rescata ninguna pieza de `nature/`:
la carpeta se borra entera y limpia. Es la misma pieza que hace de obstáculo
fusionado en el tablero, y no pasa nada: en el kit es una tabla, y de tabla sirve
para las dos cosas.

Va **dentro del grupo `board`**, como el tablero y el personaje: así lo levanta el
mismo `BOARD_LIFT` y la cuenta de la casilla —`col = x + 2`, `fila = z + 2`— sigue
significando lo mismo.

**Y todo se funde**: cada plataforma se solapa con la de al lado o con el tablero,
los árboles se hunden en la plataforma que los sostiene, y la pasarela sale de una
plataforma en vez de flotar entre dos.

### Los modelos se piden con `useLoader` y el `GLTFLoader` de `three`

Pide el archivo por URL, **suspende** mientras llega y cachea por URL. Medido en el
intento anterior: con `useGLTF` de drei el trozo `GameScene` quedaba en 928,28 kB
y con éste en 902,23 —drei arrastra los decodificadores de Draco y de Meshopt, que
aquí no se usan, y de fábrica engancha el de Draco contra `gstatic.com`—. **Con el
cargador de `three` esa pregunta desaparece**; si alguna vez se vuelve a
`useGLTF`, va con `useDraco={false}`.

### Cómo se elige cada pieza, ya que el usuario no puede verlas por nombre

Se elige mirando y se enseña **puesta en la escena**, en captura, a la sesión que
revisa. Si hay duda entre dos, se ponen las dos y se mandan las dos capturas. Lo
que no vale es elegir por el nombre del archivo y dar el aspecto por bueno.

Las `Previews/*.png` del zip del survival sirven para no probar a ciegas —son
miniaturas—, pero **no sustituyen a ver la pieza en la escena**.

## Risks / Trade-offs

- **El damero puede quedarse corto o cantar demasiado.** `#57C186` contra
  `#45AF7E` es la pareja que el kit ya usa. → Se comprueba **contando las cinco
  casillas de una fila en la captura de la vista de partida**; si no se cuentan, se
  baja un téxel más (`#349D75`) antes que inventar un color.
- **Los obstáculos salidos de su casilla pueden tapar la de al lado.** → Es
  requisito que no lo hagan: se mira casilla por casilla en la captura.
- **El survival está a otra escala y escalar deforma la lectura del kit.** → Se
  escala sólo lo que va de obstáculo, y se dice qué factor quedó puesto.
- **Borrar `nature/` es irreversible en el árbol.** → Se borra por su ruta, sin
  comodines, y se comprueba con `git status` que no se ha ido nada más antes de
  seguir.
- **El trozo `GameScene` engorda con el cargador.** → Se mide antes y después; el
  **principal** no debe moverse ni un byte.
- **§4.10 puede impedir verificar.** → Antes de cualquier medida que dependa del
  programa, el `<pre>` tiene que contener `codeplay_advance`; y **el panel de vista
  previa tiene que estar a la vista** o la escena ni siquiera arranca: medido en
  este mismo paso, con el panel oculto `document.hidden` es `true`, no hay frames y
  fiber no llega a crear su raíz.

## Migration Plan

No hay migración: no toca Supabase, ni el esquema, ni ninguna fila. **No hace
falta `supabase db push`.**

El orden es por tramos y **cada uno se verifica antes de abrir el siguiente**:
(1) los kits en disco y el README, (2) el suelo de una pieza con su damero,
(3) los obstáculos y la meta, (4) la decoración, (5) el escenario de fuera,
(6) el personaje. Si un tramo no queda verificado, los siguientes no se abren y se
dice hasta dónde se llegó.

Deshacer es revertir el commit **y volver a poner `nature/`** desde su zip.
