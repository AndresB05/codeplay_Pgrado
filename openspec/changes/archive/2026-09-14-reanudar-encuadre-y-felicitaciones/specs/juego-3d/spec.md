## MODIFIED Requirements

### Requirement: El programa de bloques mueve al personaje

El sistema SHALL **ejecutar** el programa que el niño ha construido con los
bloques, moviendo al personaje por el tablero, y SHALL hacerlo **sólo cuando se
le pide**: mientras no se pida, los bloques se colocan sin que nadie se mueva.

Las órdenes SHALL ejecutarse **en el orden en que quedan encadenadas**, y cada
una SHALL producir en el personaje el mismo efecto que produciría dada a mano:
avanzar lo lleva a la casilla contigua en la dirección a la que mira, girar le
cambia la orientación sin sacarlo de su casilla, y **saltar ejecuta su cuerpo
saltando**.

**La ejecución SHALL verse paso a paso**: cada casilla recorrida y cada giro
SHALL representarse por separado y con una duración perceptible, de modo que se
pueda seguir el recorrido con la vista. Un `avanzar` de varias casillas SHALL
verse como varios movimientos de una casilla, no como un salto.

**Saltar SHALL verse como un salto**: un saltar vacío, como un salto en el sitio;
y cada orden de su cuerpo, como **un salto por cada una**. Un `avanzar` de varias
casillas dentro de saltar SHALL verse como **un salto por casilla**, y un giro,
como un salto durante el que el personaje gira. Subir, avanzar a la misma altura,
bajar y quedarse en el sitio SHALL distinguirse a la vista.

**Un avance imposible NO SHALL interrumpir la ejecución.** Cuando la casilla de
destino no se pueda alcanzar, el personaje SHALL quedarse donde está, el intento
SHALL **verse** —de modo que se entienda contra qué se ha topado— y el programa
SHALL continuar con la orden siguiente. Esto vale también para las casillas que
le queden a un `avanzar` de varias, dentro o fuera de saltar: las que no se
pueden dar se intentan igual.

Mientras una ejecución está en curso, el sistema NO SHALL empezar otra.

El sistema SHALL ofrecer, además, **devolver al personaje a la casilla de salida**
con su orientación de partida, tanto al terminar una ejecución como durante ella
o con ella detenida.

**Y SHALL ofrecer detener una ejecución en curso, que no es lo mismo.** Detenerla
SHALL **congelar el recorrido donde va**: el personaje SHALL quedarse en la
casilla y con la orientación del paso en curso, y NO SHALL volver a la salida.
**Detener NO SHALL dejar al personaje a mitad de un salto**: si lo detiene
despegando, SHALL quedarse en la casilla donde ese salto aterriza.

**Un recorrido detenido SHALL reanudarse.** Pedir la ejecución con un recorrido
detenido SHALL **seguir desde el paso en que se quedó**, sin volver a la salida, y
SHALL dar **sólo los pasos que faltaban**: lo que se reanuda es el programa que
se estaba ejecutando. Empezar de nuevo desde la salida SHALL pedirse devolviendo
al personaje a la salida y ejecutando después. Decidido por el usuario el
14-sep-2026: hasta entonces detener no se reanudaba y ejecutar hacía de
reiniciar.

Detener SHALL poder pedirse **sólo mientras hay una ejecución en curso**.

Cuando el lienzo tenga **varias secuencias sueltas**, el sistema SHALL ejecutar
**una sola**: la que empieza más arriba en el lienzo —y más a la izquierda, si
dos empiezan a la misma altura—. Las demás NO SHALL ejecutarse.

Si el programa no tiene ninguna orden, pedir la ejecución SHALL terminar sin
mover a nadie y sin error.

#### Scenario: Se ejecuta un programa que recorre el tablero

- **WHEN** hay bloques encadenados en el lienzo y se pide ejecutar el programa
- **THEN** el personaje recorre el tablero haciendo lo que dicen los bloques, en el orden en que están encadenados

#### Scenario: Se ejecuta un avance de varias casillas

- **WHEN** se ejecuta un bloque de avanzar con un número mayor que uno
- **THEN** el personaje recorre esas casillas **de una en una**, y cada una se ve

#### Scenario: El programa choca contra algo que no se puede pisar

- **WHEN** durante la ejecución le toca avanzar hacia un muro, un hueco, fuera del tablero o una casilla más alta
- **THEN** se ve que el personaje lo intenta y no puede, y se queda en su casilla mirando hacia donde miraba
- **AND** la ejecución continúa con la orden siguiente en lugar de detenerse

#### Scenario: Se ejecuta un saltar con un avance de dos casillas por una escalera

- **WHEN** se ejecuta un saltar con avanzar 2 dentro, delante de dos casillas que suben un nivel cada una
- **THEN** el personaje sube la escalera con un salto por casilla, y cada salto se ve

#### Scenario: Se ejecuta un saltar vacío

- **WHEN** se ejecuta un saltar sin nada dentro
- **THEN** se ve al personaje saltar en el sitio, sin cambiar de casilla ni de orientación

#### Scenario: Se ejecuta un saltar con un giro y un avance dentro

- **WHEN** se ejecuta un saltar con girar a la derecha y avanzar 1 dentro
- **THEN** el personaje salta girando en su casilla y después salta a la casilla siguiente

#### Scenario: Se pide ejecutar mientras se está ejecutando

- **WHEN** se pide ejecutar el programa con una ejecución ya en curso
- **THEN** no se lanza una segunda ejecución

#### Scenario: Se devuelve al personaje a la salida

- **WHEN** se pide devolver al personaje a la salida
- **THEN** el personaje vuelve a la casilla de salida, mirando hacia la dirección de partida
- **AND** si había una ejecución en curso o detenida, deja de haberla

#### Scenario: Se detiene el recorrido a mitad

- **WHEN** se pide detener con el personaje recorriendo el programa
- **THEN** el recorrido deja de avanzar y el personaje se queda en la casilla y la orientación del paso en curso
- **AND** no vuelve a la casilla de salida

#### Scenario: Se detiene el recorrido a mitad de un salto

- **WHEN** se pide detener con el personaje despegando para saltar a otra casilla
- **THEN** el personaje se queda en la casilla donde ese salto aterriza, apoyado sobre ella

#### Scenario: Se vuelve a ejecutar después de detener

- **WHEN** se detiene un programa de cuatro pasos después del segundo y se pide ejecutar otra vez
- **THEN** el personaje sigue desde la casilla donde se quedó y da sólo los dos pasos que faltaban
- **AND** no vuelve a pasar por la casilla de salida

#### Scenario: Se empieza de nuevo después de detener

- **WHEN** con un recorrido detenido se devuelve al personaje a la salida y después se pide ejecutar
- **THEN** el personaje parte de la casilla de salida y recorre el programa desde el principio

#### Scenario: No hay nada que detener

- **WHEN** no hay ninguna ejecución en curso
- **THEN** no se puede pedir detener

#### Scenario: El lienzo tiene dos secuencias sueltas

- **WHEN** el lienzo tiene dos secuencias que no están encadenadas entre sí y se pide ejecutar el programa
- **THEN** se ejecuta únicamente la que empieza más arriba en el lienzo

#### Scenario: Se ejecuta un lienzo vacío

- **WHEN** no hay ningún bloque en el lienzo y se pide ejecutar el programa
- **THEN** la ejecución termina sin mover al personaje y sin dar error

### Requirement: El contador de pasos se ve siempre

El sistema SHALL mostrar **cuántos pasos lleva dados** el personaje **en todo
momento**, y no sólo mientras una ejecución está en curso, de modo que se sepa lo
que va costando el recorrido sin contar los movimientos a ojo.

**En reposo SHALL decir cero.** Sin ninguna ejecución hecha, el contador está
puesto y marca cero pasos: un marcador que ya está explica de qué van a ser los
números que suban, y un cero no es un número que haya que batir.

**Durante la ejecución SHALL avanzar con el personaje**, paso a paso.

**Al terminar el recorrido SHALL quedarse en lo que costó**, y **al detenerlo
SHALL quedarse en los pasos dados hasta ahí**. **Al reanudarlo SHALL seguir
contando desde ese número**, no desde cero. Al devolver al personaje a la salida
SHALL volver a cero.

**NO SHALL decir cuántos pasos faltan, ni de cuántos consta el recorrido, ni
cuántos cuesta la mejor solución.** Enseñar mientras se juega el número que hay
que batir convierte el nivel en un problema de optimización cuando todavía es un
problema de llegar; lo que costó y lo que costaba lo bueno se dicen **al
terminar**, y ahí es una lección y no una exigencia.

El contador SHALL verse **sobre la propia pantalla del juego**, junto al
recorrido que cuenta, y no entre los textos que acompañan a los controles: el
niño está mirando al personaje, y ahí es donde tiene que ver subir sus pasos.

Mientras hay una ejecución, ese número SHALL salir **del programa que se está
ejecutando** —el que se leyó al pedir la ejecución—, y NO SHALL salir de lo que
haya en el lienzo en ese momento: **modificar el lienzo con el recorrido en
marcha NO SHALL cambiar el contador**. Lo que se está ejecutando no cambia a
mitad de camino, y un contador que sí cambiara le enseñaría al niño un recorrido
que no es el que está viendo. **Y construir sin ejecutar NO SHALL moverlo de
cero**: el contador cuenta pasos dados, no pasos puestos.

Los pasos que cuenta SHALL ser los **ordenados**, contados como los cuenta el
recuento del resultado: un avance imposible cuenta igual. El número **en el que
el contador se queda** al terminar SHALL coincidir con el recuento que se enseña
en el resultado — es la misma magnitud contada de la misma manera, también cuando
el recorrido se detuvo y se reanudó por el camino.

#### Scenario: No se ha ejecutado nada todavía

- **WHEN** el niño abre la pantalla del juego, con el lienzo vacío o con bloques puestos
- **THEN** ve el contador sobre la pantalla del juego, diciendo cero pasos

#### Scenario: Se ejecuta un programa de varios pasos

- **WHEN** el personaje está recorriendo un programa
- **THEN** se ve, sobre la pantalla del juego, cuántos pasos lleva dados
- **AND** ese número avanza con el personaje, paso a paso

#### Scenario: El contador no anuncia lo que falta

- **WHEN** el personaje está recorriendo un programa
- **THEN** no se ve cuántos pasos tiene el recorrido, ni cuántos faltan, ni cuántos cuesta la mejor solución

#### Scenario: Se mueve un bloque con el recorrido en marcha

- **WHEN** el niño cambia los bloques del lienzo mientras el personaje recorre el programa
- **THEN** el contador del recorrido sigue contando el recorrido que empezó

#### Scenario: Un avance imposible también cuenta

- **WHEN** durante la ejecución le toca avanzar hacia un muro, un hueco o fuera del tablero
- **THEN** el contador avanza igualmente, porque los pasos que cuenta son los ordenados

#### Scenario: Termina el recorrido

- **WHEN** el personaje termina de recorrer el programa
- **THEN** el contador se queda en los pasos que ha costado el recorrido
- **AND** se ve además el resultado, con lo que costó y lo que costaba la mejor solución

#### Scenario: Se detiene el recorrido a mitad

- **WHEN** se detiene el recorrido antes de que termine
- **THEN** el contador se queda en los pasos que el personaje había dado hasta ahí

#### Scenario: Se reanuda el recorrido detenido

- **WHEN** se reanuda un recorrido detenido con dos pasos dados
- **THEN** el contador sigue desde dos y termina en lo que cuesta el recorrido entero

#### Scenario: Se devuelve al personaje a la salida a mitad del recorrido

- **WHEN** se pide devolver al personaje a la salida con una ejecución en curso
- **THEN** el contador vuelve a decir cero pasos

#### Scenario: Se devuelve al personaje a la salida con el recorrido terminado

- **WHEN** se pide devolver al personaje a la salida después de una ejecución terminada o detenida
- **THEN** el contador vuelve a decir cero pasos

#### Scenario: El total del contador y el recuento del resultado dicen lo mismo

- **WHEN** termina un recorrido y se compara el número **en el que el contador se queda** con el recuento que muestra el resultado
- **THEN** los dos números coinciden

### Requirement: El tablero se ve entero sea cual sea su forma

La vista de partida SHALL enseñar **el tablero entero** del nivel que se está
jugando, con sus casillas contables, sin que el niño tenga que girar ni acercar
la cámara.

Eso SHALL cumplirse para tableros de tamaños distintos **y de alturas
distintas**, y NO SHALL depender de que el tablero tenga la forma de ninguno en
concreto. **La columna más alta SHALL verse entera, con la casilla que la
corona**: una meta en lo alto de una torre que se sale por arriba del encuadre es
una meta que no se ve. El acercamiento de partida SHALL quedar **dentro** de los
topes que la cámara impone, para que ningún tablero arranque recortado por ellos.

Si alguna vez se dibuja algo **fuera** del tablero, SHALL quedar fuera de su
huella: no SHALL meterse en ninguna casilla ni taparla. Hoy no hay nada fuera —el
usuario retiró el decorado entero—, así que la regla gobierna lo que traiga el
paso que vuelva a vestir el juego.

#### Scenario: Un tablero pequeño

- **WHEN** se abre un nivel cuyo tablero es mucho menor que el de otro nivel
- **THEN** se ve entero y sus casillas se cuentan desde la vista de partida

#### Scenario: Un tablero mayor que la referencia

- **WHEN** se abre un nivel cuyo tablero es mayor que aquel contra el que se midió el encuadre
- **THEN** se ve entero, sin que los topes de la cámara lo recorten al arrancar

#### Scenario: Un tablero con una torre alta

- **WHEN** se abre un nivel con una columna de altura seis y la meta encima de ella
- **THEN** se ven la columna entera y la meta desde la vista de partida, sin girar ni acercar la cámara
- **AND** el tablero entero sigue quedando por encima del lienzo

## ADDED Requirements

### Requirement: El tablero aprovecha el hueco del juego sin deformarse

La vista de partida SHALL **acercar o alejar la cámara y subir o bajar el
tablero** hasta que ocupe el hueco que el lienzo deja libre tanto como quepa: el
tablero NO SHALL quedarse pequeño en el centro cuando hay sitio para verlo más
grande.

El tablero NO SHALL **deformarse** para llenar el hueco: **las casillas SHALL
verse cúbicas**, aunque sobre ancho a los lados. Estirar la imagen a lo ancho se
probó y el usuario lo retiró el 14-sep-2026 al verlo: se veía aplastado y
amontonado.

#### Scenario: Un tablero plano en un hueco ancho

- **WHEN** se abre un nivel de cinco por cinco casillas planas
- **THEN** el tablero se ve tan grande como cabe por encima del lienzo, con sus casillas cúbicas

#### Scenario: Un camino llano con huecos

- **WHEN** se abre un nivel plano cuyo camino ocupa poco de su rejilla
- **THEN** la cámara no se acerca más que para el mismo tablero lleno, y el camino no queda pegado a ella

#### Scenario: Una torre en el mismo hueco

- **WHEN** se abre un nivel con una columna de altura seis
- **THEN** la cámara se aleja o el tablero baja lo que haga falta para que la torre entera quepa
- **AND** las casillas siguen viéndose cúbicas

### Requirement: El lienzo se bloquea mientras el recorrido está detenido

Mientras un recorrido esté **detenido**, el sistema NO SHALL dejar cambiar el
programa: ni mover, añadir o quitar bloques en el lienzo, ni sacarlos de la caja.
Así lo que se reanuda es siempre lo que está a la vista. Decidido por el usuario
el 14-sep-2026.

El bloqueo SHALL **decir por qué** y cómo salir de él: que el recorrido está
detenido, que «Ejecutar» lo sigue y que «Reiniciar» deja volver a cambiar los
bloques.

El bloqueo SHALL levantarse **al reanudar**, **al terminar** y **al devolver al
personaje a la salida**. Mientras el recorrido está en curso sin detener, el
lienzo NO SHALL bloquearse.

#### Scenario: Se intenta mover un bloque con el recorrido detenido

- **WHEN** el recorrido está detenido y el niño intenta arrastrar un bloque del lienzo o de la caja
- **THEN** el bloque no se mueve y se ve por qué

#### Scenario: Se reinicia un recorrido detenido

- **WHEN** con el recorrido detenido se devuelve al personaje a la salida
- **THEN** los bloques se pueden volver a mover

#### Scenario: Se reanuda un recorrido detenido

- **WHEN** con el recorrido detenido se pide ejecutar
- **THEN** el recorrido sigue y el lienzo deja de estar bloqueado

### Requirement: Llegar a la meta abre una ventana de felicitaciones

Cuando **termine** un recorrido que **ha llegado a la meta**, la pantalla de
nivel SHALL abrir **una ventana de felicitaciones**, siempre, llegue con los pasos
justos o con más. Decidido por el usuario el 14-sep-2026.

La ventana SHALL decir que se completó el nivel, **cuántos pasos se usaron y
cuántos cuesta la mejor solución**. Con los pasos justos o menos SHALL felicitar
el recorrido perfecto; con más, SHALL felicitar la llegada y **animar a
intentarlo con menos**, sin presentarlo como un fracaso.

La ventana SHALL ofrecer **tres botones**:

- **«Salir al mundo»**, que lleva a la lista de niveles del mundo del nivel;
- **«Volver a intentar»**, que cierra la ventana y devuelve al personaje a la
  salida con el contador a cero, **dejando los bloques del lienzo** como estaban:
  quien vuelve a intentarlo suele querer mejorar su programa, no rehacerlo.
  Pedido por el usuario el 14-sep-2026;
- **«Siguiente nivel»**, que abre el nivel con el orden siguiente **del mismo
  mundo**, empezando de cero: lienzo, personaje y contador.

En el **último nivel de un mundo**, «Siguiente nivel» NO SHALL aparecer.

La ventana SHALL mostrar además **la experiencia que da el nivel**, la de su fila.
Es un recordatorio pedido por el usuario el 14-sep-2026 y **todavía no se
concede**: mostrarla NO SHALL sumar experiencia a nadie. Lo que se gane de verdad
lo decide el paso que la conceda.

La ventana NO SHALL salir al detener un recorrido, al terminar uno que no llegó a
la meta, ni con un lienzo vacío. SHALL poder cerrarse con Escape para volver a
mirar el tablero.

Fuera de la pantalla de nivel —el banco de pruebas— NO SHALL abrirse: no hay
mundo al que salir.

#### Scenario: Se llega a la meta con los pasos justos

- **WHEN** termina un recorrido que llega a la meta con los pasos de la mejor solución
- **THEN** se abre la ventana, felicita el recorrido perfecto y dice los pasos usados y los de la mejor solución

#### Scenario: Se llega a la meta con pasos de más

- **WHEN** termina un recorrido que llega a la meta con más pasos de los de la mejor solución
- **THEN** se abre la ventana, felicita la llegada, dice los dos números y anima a intentarlo con menos

#### Scenario: No se llega a la meta

- **WHEN** termina un recorrido que no pisa la meta
- **THEN** no se abre la ventana

#### Scenario: Se detiene un recorrido

- **WHEN** se detiene un recorrido antes de que termine
- **THEN** no se abre la ventana

#### Scenario: Se pasa al siguiente nivel

- **WHEN** en la ventana del nivel 1 de un mundo se pulsa «Siguiente nivel»
- **THEN** se abre el nivel 2 de ese mundo con el lienzo vacío, el personaje en la salida y el contador a cero

#### Scenario: La ventana enseña la experiencia del nivel

- **WHEN** se abre la ventana de un nivel cuya fila da 100 de experiencia
- **THEN** la ventana dice que el nivel da 100 de experiencia
- **AND** la experiencia del niño no cambia

#### Scenario: Se vuelve a intentar el nivel

- **WHEN** en la ventana se pulsa «Volver a intentar»
- **THEN** la ventana se cierra, el personaje está en la salida y el contador dice cero
- **AND** los bloques del lienzo siguen donde estaban

#### Scenario: Se sale al mundo

- **WHEN** en la ventana se pulsa «Salir al mundo»
- **THEN** se ve la lista de niveles del mundo del nivel

#### Scenario: El último nivel del mundo

- **WHEN** se completa el último nivel de un mundo
- **THEN** la ventana ofrece «Salir al mundo» y «Volver a intentar», y no «Siguiente nivel»
