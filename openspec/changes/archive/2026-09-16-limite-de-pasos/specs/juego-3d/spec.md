## ADDED Requirements

### Requirement: Un nivel puede conceder un número máximo de pasos

La configuración del nivel SHALL poder traer un **máximo de pasos**: cuántos
pasos concede ese nivel como mucho para llegar a la meta. Es **opcional**. Un
nivel que no lo traiga SHALL jugarse **sin límite ninguno**, exactamente como
hasta ahora, y NO SHALL comportarse de forma distinta en nada.

**Con límite, la ejecución SHALL cortarse al agotarlo.** Cuando los pasos dados
lleguen al máximo, el personaje SHALL quedarse donde está y el recorrido SHALL
terminar ahí: las órdenes que queden NO SHALL ejecutarse. Es la única cosa que
interrumpe una ejecución por sí sola — un avance imposible sigue sin
interrumpirla, y sigue costando su paso.

**Un salto NO SHALL partirse por la mitad.** Saltar a la casilla siguiente cuesta
dos pasos; cuando queda **uno solo**, ese salto NO SHALL ejecutarse y el recorrido
SHALL cortarse antes de él, con el personaje apoyado en su casilla. Quedarse en el
aire no es un estado del juego.

**Llegar a la meta dentro del límite SHALL valer**, y pisarla SHALL contar aunque
el recorrido se corte después: lo que decide es si el personaje llegó a pisarla
con los pasos que tenía, no dónde acabó plantado.

**Al cortarse por agotar el límite, el sistema SHALL decírselo al niño con
palabras suyas y SHALL pedirle reiniciar** para intentarlo otra vez. NO SHALL
decirle solamente que no llegó a la meta: su programa no está mal escrito, es
demasiado largo, y son dos cosas distintas. El recorrido cortado NO SHALL poder
reanudarse: reanudarlo regalaría los pasos que el nivel no concede.

**Un máximo por debajo del mínimo apuntado del nivel SHALL rechazar el nivel
entero**, por el camino de un nivel que no se puede leer: es un nivel que nadie
puede terminar. Es de los errores de siembra que **sí** se pueden comprobar sin
jugar, como la meta sobre un hueco.

#### Scenario: Un nivel sin máximo de pasos

- **WHEN** se juega un nivel cuya configuración no trae máximo de pasos
- **THEN** el recorrido no se corta nunca por pasos, por largo que sea el programa
- **AND** no se ve ningún aviso ni ninguna cuenta de pasos que queden

#### Scenario: El programa se pasa del máximo

- **WHEN** se ejecuta en un nivel con máximo de diez pasos un programa que cuesta quince
- **THEN** el personaje da los diez primeros pasos y se planta donde el décimo lo deje
- **AND** las órdenes que quedaban no se ejecutan

#### Scenario: Al agotarse el máximo se le pide reiniciar

- **WHEN** un recorrido se corta por agotar el máximo de pasos sin haber pisado la meta
- **THEN** se le dice al niño que se quedó sin pasos y se le pide reiniciar para intentarlo otra vez
- **AND** no se le dice sólo que no llegó a la meta

#### Scenario: Un recorrido cortado no se reanuda

- **WHEN** se pide ejecutar después de que un recorrido se cortara por agotar el máximo
- **THEN** el personaje no sigue desde donde se quedó con pasos de más

#### Scenario: Queda un paso y la orden siguiente es un salto

- **WHEN** a un recorrido con máximo le queda un solo paso y la orden siguiente es saltar a la casilla de delante
- **THEN** ese salto no se ejecuta y el personaje se queda apoyado en su casilla
- **AND** no se queda a medio salto

#### Scenario: Se pisa la meta justo con el último paso

- **WHEN** un programa pisa la meta con el último paso que el máximo concede
- **THEN** el nivel se da por resuelto

#### Scenario: El máximo es menor que el mínimo apuntado

- **WHEN** se abre un nivel cuyo máximo de pasos es menor que los pasos de su mejor solución
- **THEN** el nivel se rechaza entero, y no se empieza una partida imposible

## MODIFIED Requirements

### Requirement: El contador de pasos se ve siempre

El sistema SHALL mostrar **en todo momento** lo que va costando el recorrido, y
no sólo mientras una ejecución está en curso, de modo que se sepa sin contar los
movimientos a ojo. **Qué número enseña depende de si el nivel concede un máximo
de pasos**, y son los dos únicos casos:

**En un nivel SIN máximo SHALL decir cuántos pasos lleva dados** el personaje.

- **En reposo SHALL decir cero.** Un marcador que ya está explica de qué van a ser
  los números que suban, y un cero no es un número que haya que batir.
- **Durante la ejecución SHALL avanzar con el personaje**, paso a paso.
- **Al terminar el recorrido SHALL quedarse en lo que costó**, y **al detenerlo
  SHALL quedarse en los pasos dados hasta ahí**. **Al reanudarlo SHALL seguir
  contando desde ese número**, no desde cero.
- **NO SHALL decir cuántos pasos faltan, ni de cuántos consta el recorrido, ni
  cuántos cuesta la mejor solución.** Enseñar mientras se juega el número que hay
  que batir convierte el nivel en un problema de optimización cuando todavía es
  un problema de llegar; lo que costó y lo que costaba lo bueno se dicen **al
  terminar**, y ahí es una lección y no una exigencia.

**En un nivel CON máximo SHALL decir cuántos pasos le quedan**, contando hacia
atrás. Ahí el nivel **ya es** un problema de optimización —es la regla con la que
está diseñado—, así que esconder el número no protege nada y sólo deja al niño
congelándose sin saber por qué.

- **En reposo SHALL decir el máximo entero**, que es lo que el nivel concede.
- **Durante la ejecución SHALL bajar con el personaje**, paso a paso.
- **Al agotarse SHALL decir cero**, y al detener el recorrido SHALL quedarse en
  los que quedaban en ese punto.
- **SHALL distinguirse a la vista de la cuenta hacia arriba**, de modo que no se
  confunda lo que queda con lo que se lleva.

**Al devolver al personaje a la salida SHALL volver a su valor de reposo** —cero
sin máximo, el máximo entero con él—.

El contador SHALL verse **sobre la propia pantalla del juego**, junto al
recorrido que cuenta, y no entre los textos que acompañan a los controles: el
niño está mirando al personaje, y ahí es donde tiene que ver moverse sus pasos.

Mientras hay una ejecución, ese número SHALL salir **del programa que se está
ejecutando** —el que se leyó al pedir la ejecución—, y NO SHALL salir de lo que
haya en el lienzo en ese momento: **modificar el lienzo con el recorrido en
marcha NO SHALL cambiar el contador**. Lo que se está ejecutando no cambia a
mitad de camino, y un contador que sí cambiara le enseñaría al niño un recorrido
que no es el que está viendo. **Y construir sin ejecutar NO SHALL moverlo de su
valor de reposo**: el contador cuenta pasos dados, no pasos puestos.

Los pasos que cuenta SHALL ser los **ordenados**, contados como los cuenta el
recuento del resultado: un avance imposible cuenta igual. En un nivel sin máximo,
el número **en el que el contador se queda** al terminar SHALL coincidir con el
recuento que se enseña en el resultado — es la misma magnitud contada de la misma
manera, también cuando el recorrido se detuvo y se reanudó por el camino.

#### Scenario: No se ha ejecutado nada todavía

- **WHEN** el niño abre la pantalla de un nivel sin máximo de pasos, con el lienzo vacío o con bloques puestos
- **THEN** ve el contador sobre la pantalla del juego, diciendo cero pasos

#### Scenario: Se ejecuta un programa de varios pasos

- **WHEN** el personaje está recorriendo un programa en un nivel sin máximo de pasos
- **THEN** se ve, sobre la pantalla del juego, cuántos pasos lleva dados
- **AND** ese número avanza con el personaje, paso a paso

#### Scenario: El contador no anuncia lo que falta

- **WHEN** el personaje está recorriendo un programa en un nivel sin máximo de pasos
- **THEN** no se ve cuántos pasos tiene el recorrido, ni cuántos faltan, ni cuántos cuesta la mejor solución

#### Scenario: Se abre un nivel con máximo de pasos

- **WHEN** el niño abre la pantalla de un nivel con un máximo de doce pasos, sin haber ejecutado nada
- **THEN** ve el contador diciendo que le quedan doce pasos

#### Scenario: Se ejecuta un programa en un nivel con máximo

- **WHEN** el personaje está recorriendo un programa en un nivel con máximo de pasos
- **THEN** el contador baja con el personaje, paso a paso
- **AND** al agotarse el máximo dice cero

#### Scenario: Se mueve un bloque con el recorrido en marcha

- **WHEN** el niño cambia los bloques del lienzo mientras el personaje recorre el programa
- **THEN** el contador del recorrido sigue contando el recorrido que empezó

#### Scenario: Un avance imposible también cuenta

- **WHEN** durante la ejecución le toca avanzar hacia un muro, un hueco o fuera del tablero
- **THEN** el contador se mueve igualmente, porque los pasos que cuenta son los ordenados

#### Scenario: Termina el recorrido

- **WHEN** el personaje termina de recorrer el programa en un nivel sin máximo de pasos
- **THEN** el contador se queda en los pasos que ha costado el recorrido
- **AND** se ve además el resultado, con lo que costó y lo que costaba la mejor solución

#### Scenario: Se detiene el recorrido a mitad

- **WHEN** se detiene el recorrido antes de que termine
- **THEN** el contador se queda en los pasos que el personaje había dado hasta ahí, o en los que le quedaban si el nivel tiene máximo

#### Scenario: Se reanuda el recorrido detenido

- **WHEN** se reanuda un recorrido detenido con dos pasos dados en un nivel sin máximo
- **THEN** el contador sigue desde dos y termina en lo que cuesta el recorrido entero

#### Scenario: Se devuelve al personaje a la salida a mitad del recorrido

- **WHEN** se pide devolver al personaje a la salida con una ejecución en curso
- **THEN** el contador vuelve a su valor de reposo: cero pasos sin máximo, el máximo entero con él

#### Scenario: Se devuelve al personaje a la salida con el recorrido terminado

- **WHEN** se pide devolver al personaje a la salida después de una ejecución terminada o detenida
- **THEN** el contador vuelve a su valor de reposo

#### Scenario: El total del contador y el recuento del resultado dicen lo mismo

- **WHEN** termina un recorrido en un nivel sin máximo y se compara el número **en el que el contador se queda** con el recuento que muestra el resultado
- **THEN** los dos números coinciden

### Requirement: Un nivel que no se puede leer no se juega

El sistema SHALL **comprobar** lo que recibe antes de jugarlo, y NO SHALL
traducirlo ni adivinarlo. Si la definición del puzle no describe un tablero, o si
la versión del formato no es una que el juego reconozca, el nivel SHALL
rechazarse **entero**.

Una definición vacía SHALL tratarse igual: significa que no hay puzle, y no hay
nada que jugar.

Un tablero SHALL rechazarse cuando alguna de sus casillas no sea de una de las
tres clases conocidas. Un valor desconocido NO SHALL tratarse como suelo.

**La casilla de salida y la de meta SHALL poder pisarse.** Un nivel que empiece
sobre una casilla intransitable, o cuya meta lo sea, SHALL rechazarse: el
personaje nacería dentro de ella o no habría forma de llegar. Es un nivel
imposible, y se distingue del número de pasos mal escrito en que éste **sí** se
puede comprobar sin jugarlo.

**El máximo de pasos, cuando venga, SHALL ser un número entero mayor que cero y
NO SHALL ser menor que los pasos de la mejor solución del nivel.** Un máximo por
debajo de ese mínimo describe un nivel que nadie puede terminar, y es de la misma
familia que la meta sobre un hueco: se comprueba leyendo. Que el campo **falte**
NO SHALL ser motivo de rechazo — significa que el nivel no tiene límite.

**La versión del nivel y la del sobre de su disposición inicial SHALL coincidir.**
La del nivel es la que decide si el juego puede con él; la del sobre gobierna lo
que el sobre lleva dentro. Cuando las dos no digan lo mismo, el nivel SHALL
rechazarse **aunque cada una por separado sea conocida**: una descripción que se
contradice a sí misma no tiene una lectura correcta, y quedarse con una de las
dos en silencio deja la otra sin que nadie la compruebe nunca.

Al rechazarlo, el sistema SHALL decírselo al niño con palabras que entienda y
SHALL ofrecerle volver a la lista de niveles. NO SHALL dibujarse un tablero a
medias, y NO SHALL quedarse la pantalla en blanco.

La disposición inicial de bloques vacía NO SHALL ser un motivo de rechazo.

#### Scenario: La definición no describe un tablero

- **WHEN** se abre un nivel cuya definición no describe un tablero
- **THEN** no se dibuja ningún tablero
- **AND** se le dice al niño que ese nivel no se puede jugar, con la vuelta a la lista a mano

#### Scenario: Una casilla de clase desconocida

- **WHEN** el tablero de un nivel trae una casilla que no es ni suelo, ni muro, ni hueco
- **THEN** el nivel se rechaza entero, y esa casilla no se juega como suelo

#### Scenario: La salida o la meta no se pueden pisar

- **WHEN** un nivel sitúa su salida o su meta sobre una casilla que no se pisa
- **THEN** el nivel se rechaza entero, y no se empieza una partida imposible

#### Scenario: El máximo de pasos no es un número válido

- **WHEN** se abre un nivel cuyo máximo de pasos no es un entero mayor que cero
- **THEN** el nivel se rechaza entero

#### Scenario: El nivel no trae máximo de pasos

- **WHEN** se abre un nivel cuya definición no incluye el máximo de pasos
- **THEN** el nivel se juega con normalidad, sin límite

#### Scenario: La versión del formato no se reconoce

- **WHEN** se abre un nivel cuya versión del formato el juego no conoce
- **THEN** el nivel se rechaza entero, sin intentar interpretarlo

#### Scenario: Las dos versiones del nivel no coinciden

- **WHEN** la versión del nivel y la del sobre de su disposición inicial son distintas, aunque las dos sean conocidas
- **THEN** el nivel se rechaza entero
- **AND** no se juega eligiendo una de las dos
