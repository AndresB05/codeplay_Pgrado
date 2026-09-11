## Why

La fase A está terminada y el juego se juega entero en un banco de pruebas que
**no se parece a la pantalla de nivel**: la escena en una tarjeta, el editor en
otra debajo, y los controles en una franja gris pegada al juego. El usuario lo
vio así el 7-sep-2026, con un boceto suyo delante, y pidió dos cosas antes de
sembrar los niveles: que el laboratorio **se componga como estará el nivel** y
que el **mapa se mueva con el ratón**. Éste es el **J6.3** de
`docs/ROADMAP-JUEGO.md` §3, «El ensayo general antes de sembrar».

**Va antes del J7 por el orden de los errores.** Sembrar tres niveles y descubrir
después que la pantalla se compone de otra manera obliga a rehacer lo que ya está
en la base; recomponer hoy, con un tablero de pega y sin ninguna fila sembrada,
no cuesta ninguna migración.

## What Changes

**La composición: paneles flotando sobre el juego donde hoy hay tres tarjetas
apiladas.**

- **El 3D llena su zona de borde a borde** y los paneles van **superpuestos**:
  esquinas muy redondeadas, sombra suave, sin bordes gruesos.
- **A la izquierda, el juego, en UNA zona alta** —todo el alto de la columna
  derecha—, con el contador de pasos en su esquina.
- **El lienzo va dentro de esa zona**, superpuesto al 3D por su parte baja como
  una **bandeja**, y no como un apartado aparte debajo.
- **A la derecha, en columna**: la caja de bloques, los **tres** botones en fila
  y un panel de instrucciones.
- **La franja de controles desaparece.** Los botones se van al panel derecho, y
  lo que se le dice al niño se va a **la franja del título del lienzo**: la
  etiqueta «Lienzo» se queda a la izquierda y el mensaje aparece a su derecha, en
  la misma línea.

**El bloque que se arrastra se ve todo el rato**, por encima de lo que haya
debajo —el `<canvas>` 3D incluido—. Hoy, con la caja y el lienzo en esquinas
opuestas, el trayecto entre las dos pasa por fuera del SVG del lienzo y el bloque
desaparece a mitad de camino.

**Y soltarlo fuera del lienzo lo devuelve a la caja, a la vista.** Hoy se pierde:
no se ve, no se recupera y nada se lo dice al niño. La zona que devuelve el
bloque pasa a ser **todo menos el lienzo**, y con ella se retira la zona de
borrado de fábrica —un semiplano que ninguna orientación hacía correcto—.

**La caja de bloques deja de tener barra de desplazamiento.** Con los tres
bloques de hoy caben todos a la vista; la barra salía mal colocada y los
estrechaba.

**La caja de bloques se separa del lienzo, y eso no era CSS.** Hoy la caja y el
lienzo son la **misma inyección** de Blockly: `TOOLBOX` es un `categoryToolbox`
de una sola categoría y el desplegable pertenece al espacio inyectado. **Medido
antes de prometer esta maqueta**, y sale que sí se puede, por una vía que no es
ninguna de las tres que se temían: **un `VerticalFlyout` suelto**, creado a mano
—API pública: `createDom`, `init`, `show`— y colgado de **cualquier** nodo del
DOM. Verificado en el laboratorio con las dos piezas a **887 px** de distancia y
en tarjetas distintas: el arrastre cruza, el bloque se crea en el espacio
principal y **el `<pre>` de la pantalla pasa a contener `codeplay_advance`**, que
es la única comprobación que vale (§4.10).

**Con tres apoyos en tripas de Blockly, medidos uno a uno:**

- **El bloque no cae donde se suelta**, de fábrica: Blockly resta los orígenes de
  los dos espacios **relativos a su propio `injectionDiv`**, y un flyout suelto no
  tiene ninguno. Soltando en (650,1300) apareció en el origen del lienzo. **Se
  corrige con cinco líneas** —sobrescribir `getOriginOffsetInPixels` en el espacio
  del flyout—, y con el parche puesto el bloque cae **exacto** bajo el cursor.
- **La caja hereda la altura del lienzo**, no la de su hueco: `position()` lee las
  métricas de vista del espacio destino. Medido: 420 px de flyout en un hueco de
  300.
- **La zona de borrado es un SEMIPLANO y hay que declararle el lado.** Con la caja
  inyectada a la izquierda —lo de fábrica—, ese semiplano **se come el lienzo
  entero** y borraría todo bloque que se suelte en él. Con `toolboxPosition` a la
  derecha se da la vuelta. Medido en los dos sentidos.

**Y la categoría desaparece con la caja.** Lo que se ofrece a la derecha son los
**tres bloques**, siempre abiertos, sin el botón «Movimiento» que hoy hay que
pulsar para verlos.

**«Detener» existe, y no es un botón más.** Hoy hay «Ejecutar» y «Reiniciar»;
parar a mitad de un recorrido es comportamiento nuevo. **Congela el recorrido
donde va**: el personaje se queda en la casilla y la orientación del paso en
curso, y quien devuelve a la salida sigue siendo «Reiniciar». Por eso son dos
botones y no dos nombres de lo mismo.

**El contador se ve siempre.** En reposo dice **«Pasos: 0»**, sube durante la
ejecución, y **al terminar o al detener se queda en lo que costó**. Vuelve a cero
con «Reiniciar». Hoy aparece y desaparece con la ejecución.

- **No basta con quitarle la condición**: el contador pinta `index + 1` y al
  terminar `index` vale `run.steps.length`, así que un recorrido de 10 pasos
  pintaría **11**. La cuenta se rehace, no se destapa.
- **No choca con el J6.2**, que retiró el número **a batir** antes de jugar: un
  cero no es un número a batir, y un marcador ya puesto explica de qué van a ser
  los números que suban.

**El resultado del J6 se va con la franja: pasa a la franja del título del
lienzo**, y con él **los dos avisos de bloques sueltos** —el de mientras se
construye y el del resultado—. Es **mover, no rediseñar**: los textos son los
mismos y las reglas de cuál manda no cambian. El **contador** no se mueve: sigue
superpuesto al juego.

**El mapa se gira y se acerca con el ratón**, que es lo único de este paso que no
es maquetación. **Con topes**: el giro y el acercamiento están acotados, **no se
puede mirar el tablero desde abajo**, y **hay forma de recuperar la vista
inicial** — un niño que gire hasta perderse necesita una salida, y en el nivel
real no habrá nadie al lado.

**Entra `drei`**, `^9.122`, y **sólo** por `OrbitControls`. Es el paso que primero
la importa, justo como `ROADMAP-JUEGO.md` §2 lo dejó previsto.

**Lo que NO cambia, y conviene decirlo:**

- **NO entran assets.** Siguen los cubos: el aspecto es del J6.4 y del J7.4.
- **NO se toca el intérprete, ni el recuento, ni el formato del programa.** Los
  textos del resultado y de los avisos se mueven de sitio sin reescribirse.
- **NO sube el intérprete por encima de la frontera diferida.** Los botones se van
  al panel derecho, pero el estado del intento y quien arranca la ejecución se
  quedan **bajo** la frontera; cómo cruzan los controles hacia arriba lo resuelve
  el `design.md`, y se comprueba midiendo el trozo principal.
- **NO se mete el editor dentro de la escena**, ni la escena dentro del editor:
  son dos fronteras diferidas y son dos a propósito.
- **NO se toca `stepsLabel`**, que comparten las cuatro frases del resultado. El
  «Pasos: N» del boceto es del contador y no de ellas.
- **NO se quita el `<pre>` del laboratorio.** El boceto no lo enseña porque el
  boceto es la pantalla de nivel, pero es la única comprobación válida de §4.10:
  quitarlo deja este paso sin forma de verificarse. Se queda debajo de las cuatro
  zonas, fuera de la maqueta.
- **El panel de instrucciones es relleno**, escrito a mano y diciendo que lo es.
  El texto real sale de la narrativa de la fila del nivel, en el J8.
- **NO se toca Supabase**: ni migración, ni `db push`, ni lectura. Esto es fase A.

## Capabilities

### New Capabilities

Ninguna.

### Modified Capabilities

- `juego-3d`: pasa de **quince** garantías a **diecinueve**, y modifica tres de
  las que ya tenía.

  **Entra «La pantalla del juego se compone en paneles sobre el juego»**: dónde se ve
  cada cosa —el juego con su contador y el lienzo dentro, la caja de bloques
  separada de él, los tres controles y las instrucciones—, que **la caja separada
  sigue sirviendo para arrastrar** bloques al lienzo —que es lo que la hace una
  caja y no un dibujo—, que enseña todos sus bloques a la vez, que **el lienzo
  vacío dice para qué es**, y que **el tablero se ve entero por encima del
  lienzo**.

  **Entra «El bloque que se arrastra se ve todo el rato»**, por encima de lo que
  haya debajo y en cualquier punto del trayecto.

  **Entra «Soltar un bloque fuera del lienzo lo devuelve a la caja»**, con la
  vuelta a la vista y con la prohibición de que ninguna zona borre en silencio.

  **Entra «El mapa se puede girar y acercar»**, con sus topes, con la prohibición
  de mirar desde abajo y con la vuelta a la vista inicial.

  **Se modifica «El programa de bloques mueve al personaje»**, que es donde ya
  vivían «ejecutar» y «devolver a la salida»: se le añade **detener**, definido
  por contraste con reiniciar —congela donde va, no devuelve a la salida— y con lo
  que pasa después: un recorrido detenido **no se reanuda**, se vuelve a ejecutar
  desde el principio.

  **Se modifica «El paso en curso se ve mientras se ejecuta»**, que además
  **cambia de nombre**: pasa a «El contador de pasos se ve siempre», porque lo que
  garantiza ya no ocurre sólo mientras se ejecuta. En reposo dice cero, al
  terminar y al detener se queda en lo que costó, y con «Reiniciar» vuelve a cero.
  **Lo que no cambia es lo que lo sostiene**: sale del programa que se está
  ejecutando y no del lienzo, no dice lo que falta ni lo que cuesta la mejor
  solución, y el número al que llega sigue coincidiendo con el recuento del
  resultado.

  **Y se modifica «Al terminar se ve lo que costó y lo que costaba lo bueno»**, en
  una sola cosa: **dónde se ve**. Pasa a la **franja del título del lienzo**, a la
  derecha de la etiqueta y en su misma línea, y la garantía de que no tapa lo que
  hay que ver sigue en pie: **no SHALL tapar al personaje ni la casilla en la que
  ha quedado**. Se le añade además qué pasa **al detener**: no hay resultado,
  porque el recorrido no terminó.

  **Lo que no se modifica y podría parecerlo**: «Los bloques sueltos se avisan
  mientras se construye» no dice **dónde** se avisa, así que moverlo a la
  superposición no cambia ninguna garantía. El cambio de sitio se justifica en el
  `design.md`, que es donde vive.

## Impact

**Dependencias: entra una.** `@react-three/drei` `^9.122` en `apps/web`, y sólo
por `OrbitControls`. Dos trampas ya medidas y que este cambio tiene que respetar:

- **Una sola copia de `three`, en 0.170.** Se comprueba con `npm ls three`, que
  hoy da una; con dos, los `instanceof` de fiber dejan de cuadrar y la escena sale
  vacía sin dar error.
- **El lockfile se restaura, nunca se regenera.** Regenerarlo en Windows se lleva
  por delante los binarios opcionales de otras plataformas —los
  `@supabase/cli-linux-*`— y el CI corre `npm ci` sobre ubuntu. La instalación
  tiene que quedar **incremental**, y se comprueba leyendo el diff del lockfile
  antes de darla por buena.

**Supabase: ninguna dependencia y NO hay `db push`.** No hay migración, no se toca
el esquema y no se lee ni se escribe nada de la base, así que no hay ninguna
parada de las de `ROADMAP.md` §1.3 punto 9.

**Código** — diez archivos y el `package.json` del workspace

| Archivo | Cambio |
| --- | --- |
| `apps/web/package.json` | Entra `@react-three/drei` `^9.122` |
| `package-lock.json` | Sólo lo que añada esa instalación, comprobado en el diff |
| `apps/web/src/game/GameScene.tsx` | `OrbitControls` con topes y vuelta a la vista; el contador pasa a verse siempre y con la cuenta rehecha; el resultado y los avisos dejan la franja y pasan a la del título del lienzo; entra «detener»; los controles se pintan en el panel derecho sin salir de este archivo; el tablero se reencuadra sobre la bandeja |
| `apps/web/src/game/GameSceneLoader.tsx` | Dos datos más de paso, los huecos donde pintar los controles y el mensaje. Sigue sin importar `three` |
| `apps/web/src/game/BlockEditor.tsx` | La caja deja de inyectarse con el lienzo: se crea un flyout suelto en el hueco que le den, con sus correcciones medidas, sin barra de desplazamiento y sin zona de borrado; y el retorno del bloque a la caja |
| `apps/web/src/main.css` | La regla que apaga los recortes mientras se arrastra un bloque |
| `apps/web/src/game/BlockEditorLoader.tsx` | Un dato más de paso, el hueco de la caja. Sigue sin importar `blockly` |
| `apps/web/src/game/blocks.ts` | El `categoryToolbox` deja sitio a la lista de bloques que muestra el flyout, y los dos giros pasan a llevar colores distintos |
| `apps/web/src/game/interpreter.ts` | Los pasos dados se calculan en una función pura, fuera del componente, porque es donde se pueden probar |
| `apps/web/src/game/interpreter.test.ts` | Sus tests: reposo, primer paso, a mitad, detenido y terminado, más el que ata el número final al recuento del resultado |
| `apps/web/src/components/dashboard/student/StudentGameLabModule.tsx` | La composición en un solo rectángulo, los tres huecos que baja a las piezas diferidas, el panel de instrucciones de relleno y el `<pre>` debajo de todo |

**Bundle.** La línea de partida, **medida** sobre `1a98595`: principal
**625,00 kB** (167,90 gzip), `program` **0,35** (0,24), `BlockEditor` **644,43**
(172,75), `GameScene` **830,75** (224,43), **221 módulos**. `drei` moverá
`GameScene` —es lo que se espera y donde debe salir—; **el principal no debe
moverse**, y se comprueba con marcas que sobrevivan a la minificación:
`rootCount` y los textos, no los nombres de función.

**Tests.** Entran los de la cuenta de pasos dados. Lo que **no** se puede probar
sigue sin probarse y se dice: la composición, la cámara y la superposición son
pantalla, y jsdom no implementa WebGL — el mismo motivo por el que el J6, el J6.1
y el J6.2 no probaron `GameScene`. Se verifican en el navegador, con el viewport
emulado y **mirando el `<pre>` antes de nada**.

**Documentación**

- `docs/ROADMAP-JUEGO.md` §3: el J6.3 pasa a ✅.
- `docs/CONTEXT.md` §2.9: la composición nueva y qué hereda el J8; la vía del
  flyout suelto con sus tres apoyos medidos, que es lo que el J8 va a repetir; la
  cuenta del contador rehecha; y qué se decidió sobre detener.
- `docs/CONTEXT.md` §4.8: las medidas nuevas del bundle, con `drei` dentro.
- `docs/CONTEXT.md` §4.10 y §2.9: **la causa de que el editor deje de publicar**,
  encontrada al medir la caja separada y confirmada en el fuente de Blockly. Es
  **documentación, no alcance**: no se arregla aquí, porque qué hacer con §4.10 lo
  decide el usuario. Lo que se anota es la línea, que el `rAF` sólo se programa con
  la cola vacía, y que el estrangulamiento de la página no fue el mismo en las dos
  máquinas que lo han medido.
- `docs/CONTEXT.md` §1.2 y `openspec/config.yaml`: `drei` entra en el stack, y es
  el único punto de duplicación deliberada del proyecto. Se comprueba con
  `npx openspec doctor`.
- `openspec/specs/juego-3d/spec.md`, el `## Purpose`: cuenta **quince** garantías
  y describe el contador como algo que se ve mientras se ejecuta. **Ningún delta
  transporta el Purpose**: se reescribe a mano **al archivar**.
- `docs/CONTRATO-DE-INTEGRACION.md`: **no se toca**. Ni el formato del programa ni
  las reglas de recuento cambian, y el contrato no dice dónde se pintan las cosas.
