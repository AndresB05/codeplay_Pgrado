## Context

Ver `proposal.md` §Why. Lo que este documento tiene que resolver son cuatro cosas
que el boceto no dice y que el código de hoy no permite sin más:

1. **La caja de bloques y el lienzo son la misma inyección de Blockly.** `TOOLBOX`
   es un `categoryToolbox` de una categoría y el desplegable pertenece al espacio
   que crea `Blockly.inject`. Ponerlos en dos zonas distintas de la pantalla **no
   es CSS**.
2. **Los botones tienen que subir de zona sin que suba el intérprete.** `start()`,
   el intento y el índice del paso viven en `GameScene.tsx`, **bajo** la frontera
   diferida, y ahí se quedan: `readProgram`, `runProgram` y `blockedBy` están
   medidos a **cero** en el trozo principal y ése es el número que no puede
   moverse. Meter el editor dentro de `GameScene` tampoco vale: son dos fronteras
   y son dos a propósito (`CONTEXT.md` §2.9).
3. **El contador no se destapa, se recalcula.** Hoy pinta `stepsLabel(index + 1)`
   bajo `isRunning`, y al terminar `index` vale `run.steps.length`: quitar la
   condición pintaría **11** en un recorrido de 10.
4. **Con la franja fuera, el resultado y los avisos se quedan sin sitio.**
5. **El bloque que se arrastra vive dentro del SVG del lienzo, que lo recorta.**
   Con la caja y el lienzo en esquinas opuestas, el trayecto entre las dos pasa
   por fuera de ese SVG, y ahí el bloque no se dibuja.

Y una restricción de método que condiciona todo lo que se verifique: **§4.10**.
Si el editor no publica, el `<pre>` se queda en `{}` y **nada de lo que se
compruebe encima vale**.

## Goals / Non-Goals

**Goals**

- Dejar la pantalla compuesta como estará la de nivel, de modo que el **J8 la
  herede** en vez de rehacerla.
- Que la caja separada siga siendo una caja: se arrastra desde ella, y el bloque
  cae **donde se suelta**.
- Que el niño pueda mirar el tablero desde donde quiera **sin poder perderse**.
- Que todo lo nuevo se quede **bajo las fronteras diferidas** donde ya vive.

**Non-Goals**

- **El aspecto.** Siguen los cubos, los colores del tema y los tamaños de hoy. Los
  modelos son el J6.4 y el apartado gráfico serio el J7.4.
- **El contenido de las instrucciones.** Es relleno escrito a mano y se dice que
  lo es.
- **Arreglar §4.10.** Es preexistente y está subido al usuario. Aquí sólo se
  respeta su protocolo de verificación.
- **Tocar el intérprete, el recuento o el formato del programa.**

## Decisions

### 1. La caja separada es un `VerticalFlyout` suelto, no una segunda inyección

**Medido antes de proponer nada**, con un spike en el laboratorio y las dos piezas
a 887 px en tarjetas distintas. Blockly permite crear un flyout a mano y colgarlo
de cualquier nodo: `createDom` lo documenta —«can either exist as its own SVG
element or be a `g` element nested inside a separate SVG element»—, `init` lo ata
al espacio destino, `show` le da los tres bloques y `setAutoClose(false)` lo deja
siempre abierto. `VerticalFlyout`, `Options` y `utils.Svg` se exportan desde
`blockly/core`, que es lo que ya se importa.

**El arrastre cruza de verdad**: el bloque se crea en el espacio principal, la
caja conserva los suyos y **el `<pre>` pasó a contener `codeplay_advance`**.

**Alternativas descartadas, y por qué:**

- **`toolboxPosition`**: mueve la caja **dentro** de la misma inyección, nunca a
  otra zona de la pantalla. El hueco de la inyección tendría que cubrir a la vez
  el lienzo (abajo a la izquierda) y la caja (arriba a la derecha), y eso no es un
  rectángulo.
- **Un segundo espacio inyectado como caja**: pide implementar el arrastre entre
  espacios a mano, que es exactamente lo que el flyout ya hace.
- **Botones de HTML propios que creen el bloque por API**: pierden el arrastre —el
  niño deja de colocar y pasa a pulsar— y disparan justo los eventos de creación
  que §4.10 dice que a veces no se reparten.

### 2. Los apoyos en tripas de Blockly, y qué se hace con cada uno

Están **medidos**, no supuestos, y todos van con su comentario de *por qué* en el
código:

| Qué pasa de fábrica | Qué se hace |
| --- | --- |
| **El bloque no cae donde se suelta.** Blockly resta los orígenes de los dos espacios, cada uno medido **relativo a su propio `injectionDiv`**; un flyout suelto no tiene ninguno, así que las dos cifras están en marcos distintos. Soltando en (650,1300) el bloque apareció en el origen del lienzo | Se sobrescribe `getOriginOffsetInPixels` en el espacio del flyout para devolver su origen **en el marco del `injectionDiv` del lienzo** (`getScreenCTM` contra el rect de aquél). Con el parche, soltando en (650,1300) con el bloque agarrado por (20,16), cayó en **(630,1284)**: exacto |
| **La caja hereda la altura del lienzo**: `position()` lee las métricas de vista del espacio destino. Medido: 420 px de flyout en un hueco de 300 | Se deja que el hueco lo recorte, y se le da al hueco la altura que la maqueta pida. Sobrescribir `position()` es más tripa por menos: la caja sólo tiene tres bloques y no necesita desplazarse |
| **La zona de borrado es un SEMIPLANO.** Con la caja a la izquierda —lo de fábrica— borra todo lo que se suelte a la izquierda de su borde derecho, **y eso incluye el lienzo entero** | Se le quita entera. Ver la decisión 2b: `toolboxPosition` ya no gobierna qué se borra |

`toolboxPosition` **sigue puesto a la derecha**, pero sólo por lo que le queda:
por qué lado se redondea el fondo de la caja. Lo que llegó a decidir —el
semiplano de borrado— ya no lo decide, y **el sentido del arrastre nunca lo
decidió**: `isDragTowardWorkspace` de un flyout VERTICAL acepta los dos lados por
igual, comprobado en el fuente.

### 2b. La zona que devuelve el bloque es TODO MENOS EL LIENZO

**Esta decisión sustituye entera a la anterior, y no la parchea.** El J6.3 la
tomó a medias: con la caja a la derecha, el semiplano de borrado pasaba a ser
«todo lo que quede a la derecha del borde de la caja». Eso salvaba el lienzo —que
era lo que se estaba mirando— pero dejaba media pantalla borrando bloques en
silencio, y no salvaba el resto: soltar en cualquier otro punto perdía el bloque
igual, sólo que sin borrarlo —quedaba en una coordenada del lienzo a la que el
niño no sabe llegar—.

Lo que hace falta no es un semiplano mejor orientado: es **el complemento del
lienzo**, y eso no es un rectángulo, así que ningún `getClientRect` puede
describirlo. La salida:

- **La caja deja de ser destino de arrastre**: `getClientRect()` devuelve `null`
  y desaparece de la lista de zonas de Blockly. Con eso, **ninguna zona de la
  pantalla borra nada**.
- **La decisión se toma al soltar**, en el evento de movimiento que cierra el
  arrastre: si el punto donde el niño soltó cae fuera del rectángulo del lienzo,
  el bloque vuelve a la caja. Si cae dentro, no pasa nada.
- **El punto se apunta ANTES que Blockly**, en un oyente de `pointerup` en fase
  de captura. Medido y necesario: Blockly reparte sus eventos en un
  `requestAnimationFrame`, y para cuando llega el de movimiento **ya ha
  desplazado el lienzo hasta el bloque** — un bloque soltado 257 px por encima
  del lienzo aparece pegado a su borde superior, y medido ahí parecería que se
  soltó dentro. Es la misma trampa que §4.10 con el `<pre>`: la señal que se lee
  tarde ya no dice lo que pasó.

**Alternativas descartadas:**

- **Registrar dos componentes en el `ComponentManager`** —uno con el rectángulo
  del lienzo y otro, más pesado, con la pantalla entera— sale igual de bien pero
  pinta el bloque como «a punto de borrarse» en todo el trayecto, que es
  justamente lo contrario de lo que pide la decisión 2c.
- **Devolver el bloque a donde estaba** (`revertDrag` de Blockly) no vale para el
  que viene de la caja: ese bloque no estaba en ninguna parte.

### 2c. El bloque no se recorta mientras se arrastra

El bloque agarrado se dibuja dentro del SVG del lienzo, y ese SVG —como el hueco
de la inyección, la bandeja y el marco— recorta lo que se sale. Con la caja
arriba a la derecha y el lienzo abajo a la izquierda, **el trayecto entero pasa
por fuera**: el niño saca un bloque de la caja y lo pierde de vista hasta que
entra en el lienzo.

Se apagan los recortes **sólo mientras dura el arrastre** —y el vuelo de vuelta—,
con una clase en la raíz del documento que enciende `BlockEditor` al recibir el
evento de arrastre de Blockly. La regla vive en `main.css`, junto a las zonas que
recorta, y le sube la bandeja por encima de la columna derecha.

**Sólo mientras dura, y no siempre**: con los recortes apagados en reposo, un
bloque colocado lejos del centro del lienzo se saldría de la bandeja y se
dibujaría sobre el juego.

### 2d. La caja no se desplaza

Blockly le pone barra de desplazamiento a todo flyout, quepa o no su contenido, y
la coloca en el borde del SVG del flyout —que no es el borde del hueco que se ve—,
así que sale flotando en medio de la caja y estrechando los bloques. Con tres
bloques que caben de sobra —152 px de contenido en 200 de caja, medido— no hay a
dónde desplazarse: se destruye la barra después de `init`.

**Cuando el J7 traiga más bloques se decide entonces** cómo se llega a los que no
quepan. Montar hoy la solución de ese día sería adivinar cuántos son.

### 3. Las dos piezas diferidas pintan en un hueco que les baja la composición

**Un mismo patrón usado dos veces**, y es lo que permite que la maqueta viva
arriba sin que suba nada de lo que hay abajo:

- `StudentGameLabModule` —por encima de las dos fronteras— **posee la maqueta** y
  crea tres nodos vacíos: el de la caja de bloques, el de los controles y el del
  mensaje, en la franja del título del lienzo.
- Esos nodos **bajan como dato** (`HTMLElement | null`) por los dos cargadores,
  que siguen sin importar ni `blockly` ni `three`.
- `BlockEditor` cuelga su flyout del primero. `GameScene` pinta sus tres botones
  en el segundo y su mensaje en el tercero, los dos con `createPortal`, así que
  **el JSX y los manejadores siguen bajo la frontera** aunque se vean en la
  columna derecha y en la franja del lienzo.

**Alternativas descartadas:**

- **Subir el estado del intento a `StudentGameLabModule`**: sube el intérprete con
  él. Es exactamente lo que el J5 evitó y lo que se mide en cada paso.
- **Un `ref` imperativo con `start`/`stop`/`reset`**: obliga además a subir
  `isRunning` para poder inhabilitar «Ejecutar», reparte los controles entre dos
  archivos y no ahorra nada frente al portal.

El nodo llega **en estado**, no en `ref`: un `ref` no provoca repintado y el
portal se crearía contra `null` en el primer pintado.

### 4. Detener es adelantar el índice y marcar el intento como congelado

`stop()` hace dos cosas: **avanza el índice una posición** y marca el intento como
congelado. Con eso, sin tocar nada más:

- la pose del personaje pasa a ser la del **paso en curso** —que es lo que el
  usuario pidió: la casilla y la orientación de ese paso—, porque `pose` ya se
  deriva de `steps[index - 1]`;
- el paso a animar pasa a ser `null`, así que el bucle de frames se planta;
- el contador se queda en `index`, que es el paso que se estaba dando.

**El personaje aterriza en la casilla del paso en curso en vez de congelarse entre
dos**, y es deliberado: un cubo parado a medio camino entre dos casillas se lee
como un fallo de dibujo, y el salto que evita dura como mucho un tercio de
segundo.

**Un recorrido detenido no se reanuda**: «Ejecutar» vuelve a leer el lienzo y
empieza desde la salida. Reanudar exigiría decidir qué pasa si el niño cambió los
bloques mientras estaba parado, y eso es un problema nuevo que nadie ha pedido.

**Y detener NO produce resultado**, que es lo que evita repetir un fallo que este
repositorio ya cometió una vez. No es sólo que un recorrido congelado a mitad no
haya terminado y no haya nada que juzgar: es que el resultado diría **«No
llegaste a la meta»**, y eso es acusar al niño de un fallo que no ha cometido
—paró él—. Es **el mismo error que el J6 corrigió con el lienzo vacío**, donde se
le contaba que su programa era malo cuando lo que pasaba es que no había
programa. Lo que queda a la vista al detener es dónde se ha quedado el personaje
y lo que llevaba gastado.

### 5. Los pasos dados se calculan fuera del componente

La cuenta se rehace en una función pura junto a `countSteps`, en `interpreter.ts`
—misma magnitud, mismo archivo, un solo sitio que cuenta pasos—, con la forma
`(run, index, running) => number`: **cero** sin intento, `index + 1` mientras
corre, e `index` cuando está terminado o congelado.

**Va fuera del componente porque dentro no se puede probar**: jsdom no implementa
WebGL y `GameScene` no se monta en un test. Es el mismo motivo por el que
existieron `programCost` y `hasLooseStacks`. Y es la trampa que el paso vino a
evitar: el `+1` que sobra al terminar es un fallo de una línea que un test fija
para siempre.

Uno de sus tests **no puede fallar hoy** y por eso está: que el número en el que
el contador se queda es `countSteps(orders)`. Fija la construcción — se rompe el
día que alguien haga que chocar detenga el programa, igual que los dos del J6.

### 6. Lo que se le dice al niño va en la franja del título del lienzo

**El mensaje es uno solo y dice todo**: reposo, ejecución, resultado y los dos
avisos de bloques sueltos. **Es mover, no rediseñar**: los textos no se tocan y
las reglas de cuál manda —el aviso del resultado gana al del lienzo— siguen donde
estaban.

**Dónde va, y por qué ahí.** En la franja del título del lienzo, a la derecha de
la etiqueta «Lienzo» y en su misma línea. La etiqueta se queda como rótulo fijo:
la zona sigue diciendo qué es cuando no hay nada que contar.

**La banda sobre el juego, que es donde el J6.3 la puso, se va.** Ocupaba la
parte baja del juego, que es justo donde ahora está el lienzo, y estorbaba
delante del tablero. El **contador** no se mueve: sigue superpuesto al juego,
arriba a la derecha, porque cuenta lo que el niño está mirando.

**Cruza la frontera diferida por el mismo camino que los botones**: la
composición crea un tercer hueco vacío en la franja y `GameScene` pinta ahí su
mensaje con un portal. Así el intento y quien lo lee siguen debajo de la
frontera, que es el número que no puede moverse.

**Y lleva una comprobación asociada**, porque el requisito lo exige: al verificar
hay que **ver al personaje y la casilla en la que ha quedado** con el resultado en
pantalla.

### 7. La cámara: acotada por los cuatro lados y con una salida

`OrbitControls` de `drei`, dentro del `<Canvas>`, con:

- **giro** libre alrededor del eje vertical;
- **`maxPolarAngle` por debajo de la horizontal**, que es lo que impide mirar el
  tablero desde abajo —y por debajo se ve el envés de las losas, que no está
  dibujado para verse—;
- un **`minPolarAngle`** que impida además la vista cenital pura, donde la marca
  de la cara del personaje deja de distinguirse;
- **`minDistance` / `maxDistance`** para que el tablero ni se salga de la pantalla
  ni se quede lejísimos;
- **`enablePan` desactivado**: desplazar el centro es la única forma de perder el
  tablero de vista, y un niño que lo pierda no sabe volver;
- **damping** activado, que es lo que hace que el giro se sienta como un objeto y
  no como un salto.

**La vuelta a la vista inicial** se pide a los propios controles —guardan el
estado de partida—, y su botón va **superpuesto sobre la pantalla del juego**, en
la esquina libre, y no en la columna derecha: el boceto tiene ahí tres botones y
son los del programa. Éste es de la cámara, y vive con lo que gobierna.

### 8. `drei` entra con las dos trampas ya medidas

`@react-three/drei` `^9.122`, **sólo** por `OrbitControls`, tal como
`ROADMAP-JUEGO.md` §2 lo dejó fijado para la pareja de React 18.

- **Una sola copia de `three`, en 0.170**: se comprueba con `npm ls three` **antes
  y después**. Con dos copias los `instanceof` de fiber dejan de cuadrar y la
  escena sale vacía sin un solo error.
- **El lockfile se restaura, nunca se regenera**: la instalación tiene que ser
  incremental, y se comprueba leyendo el diff — si los `@supabase/cli-linux-*`
  desaparecen, se restaura el lockfile y se busca otra vía, porque el CI corre
  `npm ci` sobre ubuntu.

### 9. El lienzo es una bandeja dentro del juego, y eso obliga a reencuadrar

**La maqueta son paneles flotando sobre el juego, no tarjetas apiladas.** El 3D
llena su zona de borde a borde y encima van, superpuestos, la bandeja del lienzo
abajo y los dos paneles de la derecha. Sin bordes gruesos: esquinas muy
redondeadas, sombra suave y blanco sobre el fondo del tema.

**Hubo dos formas antes de ésta**, y conviene que quede escrito porque la segunda
parecía la buena: la primera eran tres tarjetas apiladas —lo que el usuario
devolvió—, y la segunda un **único rectángulo con líneas finas dentro**, que es
lo que pidió al devolverla. Ésta, la tercera, la fijó él con una imagen el
9-sep-2026: **paneles flotantes**. Lo que sobrevive de las tres es el reparto de
zonas, que no ha cambiado desde el boceto.

**El juego pasa a ser UNA zona alta** —todo el alto de la columna derecha, de
arriba de la caja de bloques a abajo del panel de instrucciones— y **el lienzo se
mete dentro**, superpuesto al 3D por su parte baja, como una bandeja: un
rectángulo más pequeño con su propio borde fino, no un apartado aparte debajo.

**Y eso obliga a reencuadrar el tablero, que es lo que no se veía venir.** Con el
hueco del juego pasando de 340 px a 635, el tablero —que se dibuja centrado y
crece con el alto del hueco— mete su fila sur debajo de la bandeja. **Medido: la
esquina sureste caía 154 px por debajo del borde de la bandeja**, y ahí está la
casilla de salida y el camino que recorre el PROGRAMA A.

No se arregla con la maqueta. La cuenta sale sola: al encuadre de partida el
tablero ocupa el 84 % del alto del hueco, y para que quepa encima de una bandeja
de 245 px haría falta un hueco de más de 1.600. Se corrige por los dos lados,
con dos constantes en `GameScene.tsx`:

- **alejar la cámara** hasta que el tablero quepa en la franja libre —de 8,53 a
  11,86 de distancia, dentro del tope de acercamiento que ya había—;
- **levantar el tablero** sobre el centro de la órbita, hasta el centro de esa
  franja.

Alejar sin levantar no basta —la perspectiva deja la esquina cercana abajo por
mucho que se aleje, medido hasta distancia 14,5— y levantar sin alejar saca el
borde norte por arriba.

**Se levanta el tablero y NO el punto al que mira la cámara**, aunque
geométricamente sea lo mismo: los controles guardan su vista de partida al
construirse, con el punto en el origen, y moverlo dejaría «Vista inicial»
devolviendo a otro sitio. El personaje va dentro del mismo grupo, así que su
casilla se sigue calculando igual.

**Los botones pasan a una fila**, como en el boceto, y no a una columna: «Ejecutar»
ancho con su icono al lado, «Detener» y «Reiniciar» estrechos con el icono encima.
**«Detener» deja el coral y pasa a gris**: parar no es un error, y el coral en
este tema es el color de que algo ha ido mal.

**Y el lienzo vacío dice para qué es.** Un marco discontinuo con un texto dentro,
pintado **debajo** del editor: el fondo propio de Blockly se pone transparente en
`main.css` para que se vea a través. Debajo y no encima, porque encima taparía el
bloque que el niño arrastra —que es lo que la decisión 2c acaba de destapar—.
**Sin mascota**: el hueco de la ilustración se deja vacío, como manda el repo
hasta que existan las definitivas.

**Los dos giros pasan a llevar colores distintos** —naranja y morado—: son el
único par de bloques cuyo texto se diferencia en la última palabra, y en la caja
el niño los busca por el color antes de leerlos.

### 10. Lo que se queda fuera de la maqueta

El **`<pre>` del programa** no está en el boceto porque el boceto es la pantalla
de nivel, donde no pinta nada. Aquí se queda, **debajo de las cuatro zonas**, con
su tarjeta: es la única comprobación válida de §4.10 y quitarlo dejaría este paso
sin forma de verificarse.

El **panel de instrucciones** es HTML de la composición, por encima de las dos
fronteras: no depende de nada del juego y su texto real llegará de la fila del
nivel en el J8. Dice de sí mismo que es un ejemplo, para que nadie lo lea como
contenido de producto.

Y la **categoría «Movimiento» desaparece** con la caja: el flyout enseña los tres
bloques directamente y siempre abiertos. Un desplegable de una sola categoría era
un clic entre el niño y sus bloques.

## Risks / Trade-offs

- **Apoyarse en tripas de Blockly** (`getOriginOffsetInPixels`, anular
  `getClientRect`, destruir la barra del flyout) → Blockly está fijado a
  `^12.5.1` por el instalador, no por gusto, así que no va a moverse solo. Los
  parches viven en **un único archivo** con su porqué escrito, y **se detectan al
  instante**: si el primero deja de valer, el bloque no cae bajo el cursor; si
  fallan los otros dos, el bloque se borra al soltarlo o vuelve la barra. Es lo
  que se comprueba al verificar.
- **La regla del retorno cuelga del punto donde se suelta, no del bloque** →
  medir el bloque cuando llega el evento no vale, porque Blockly ya ha
  desplazado el lienzo. Si algún día Blockly deja de emitir `pointerup` antes que
  su propio manejador, el retorno dejaría de dispararse; se ve al instante,
  porque el bloque se quedaría fuera del lienzo.
- **El tablero se reencuadra con dos números atados a la maqueta** → si la
  bandeja cambia de alto habrá que volver a medirlos. La comprobación es una
  sola: el tablero entero por encima de la bandeja en la vista de partida.
- **A ventanas estrechas el tablero no cabe de ancho** → a 1024 px se sale 31 px
  por la izquierda y 16 por la derecha, medido; a 1280 cabe entero. El apartado
  del panel no es responsive (§4.4) y esta pantalla es de desarrollo; el niño
  puede alejar la vista con la rueda. Se anota en vez de arreglarlo aquí.
- **La rueda del ratón sobre el juego deja de desplazar la página** — es la misma
  trampa por la que el editor desactivó la suya en el J4 → la composición nueva
  cabe **en una pantalla**, que es justo lo que será la del J8, así que casi no
  queda página que desplazar. Se acepta a sabiendas: «acercar con el ratón» es lo
  que el usuario pidió.
- **`drei` engorda el trozo de la escena** → se espera y ahí debe salir. Lo que no
  puede moverse es el principal, y se comprueba con marcas que sobreviven a la
  minificación (`rootCount`, los textos), nunca con nombres de función.
- **§4.10 puede impedir verificar** → el protocolo es mirar el `<pre>` **antes de
  nada**; si no contiene `codeplay_advance`, se dice y no se verifica encima. Y
  ahora se sabe por qué pasa, que es lo que ahorra la tarde: **el reparto de
  eventos de Blockly 12 cuelga de un `requestAnimationFrame`**. Está en el fuente,
  en `fireInternal` —`blockly_compressed.js:86`—: si la cola está vacía, programa
  un `rAF` que a su vez programa el vaciado. **Sin `rAF` no se vacía nunca**,
  mientras crear el bloque y serializarlo siguen funcionando porque son
  síncronos — que es exactamente lo que se ve. Medido de acuerdo con eso: con la
  página estrangulada —`document.hidden` en `true` y **cero** frames— ni un evento,
  y un espacio de trabajo **recién inyectado de fábrica** en esa misma página falla
  igual; en cuanto vuelve el `rAF`, el mismo programa publica y el `<pre>` se
  llena. **Y el `rAF` sólo se programa con la cola vacía**, así que una vez cargada
  ningún evento nuevo programa otro: el reparto se reanuda cuando corre el `rAF`
  aplazado, no antes. Esto **no se arregla aquí** —§4.10 es decisión del usuario—:
  se anota al cerrar el paso.

**Y cómo se verifica esta pantalla, para quien venga detrás.** Hace falta
`document.hidden === false`: **`resize_window` sola no basta**. Aquélla desatasca
el bucle de render de fiber —§2.9— pero no destrangula la página, y con la página
estrangulada no hay `rAF`, así que no hay eventos de Blockly y el `<pre>` se queda
vacío por mucho que la escena avance. Se comprueban las dos cosas antes de dar
nada por bueno: `document.hidden` y que un `requestAnimationFrame` llegue a
correr.
- **La caja hereda la altura del lienzo** → deja de ser cosmético desde que la
  caja no se desplaza: si el lienzo se queda más bajo que los bloques que la caja
  ofrece, los últimos se ven cortados y no hay barra que los alcance. Hoy sobra
  sitio —152 px de bloques en 200 de caja— y el J7 tendrá que volver a medirlo.

## Migration Plan

No hay migración: ni base de datos, ni datos, ni formato de programa. La ruta del
laboratorio sigue siendo de desarrollo. La vuelta atrás es revertir el commit;
`drei` quedaría instalado y sin usar, y desinstalarlo es otra vez la regla del
lockfile.

## Open Questions

- **¿La superposición estorba?** **Respondida, y la respuesta fue que sí.** El
  usuario la vio maquetada sobre el juego y pidió sacarla de ahí: el mensaje se
  fue a la franja del título del lienzo (decisión 6). El contador se quedó.
- **¿Cabe la pantalla sin desplazamiento?** La maqueta sí; el laboratorio
  entero, no. Ver la tarea 5.1, que se queda abierta con la medida.
