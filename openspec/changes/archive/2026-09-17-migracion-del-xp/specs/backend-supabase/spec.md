## ADDED Requirements

### Requirement: La puntuación de un intento la calcula el servidor leyendo el programa

El servidor SHALL calcular la puntuación de un intento **contando el programa que
recibe**, y NO SHALL aceptar ninguna puntuación que le manden. El recuento SHALL
hacerse **leyendo** el programa —sin tablero, sin saber dónde está el personaje y
sin ejecutar nada—, con las mismas reglas que el juego usa para contarlo:
`avanzar N` cuenta N, un giro cuenta uno, un salto vacío cuenta uno y un salto
con cuerpo cuenta el doble de su cuerpo.

Cuando el programa traiga **varios montones de bloques sueltos**, SHALL contarse
el mismo que el juego ejecuta —el que empieza más arriba, y más a la izquierda a
igual altura—, no el primero que aparezca guardado. Lo que quede fuera de ese
montón no se cuenta, pero **lo que sobre dentro de él sí**: pisar la meta y dejar
bloques detrás se paga en la puntuación.

La puntuación SHALL ser **la eficiencia del programa contra la mejor solución
apuntada del nivel**, acotada entre 0 y 100, de modo que:

- el programa que usa **exactamente** los pasos de la mejor solución SHALL
  puntuar **100**;
- cuantos más pasos de más use, **menos** SHALL puntuar;
- resolver el nivel NO SHALL puntuar nunca **cero**: llegar siempre paga algo.

**Sólo puntúan los intentos con éxito.** Un intento que no resolvió el nivel
SHALL guardarse con puntuación **cero**, por eficiente que fuera su programa: la
puntuación mide cómo se resolvió, no cómo se falló.

**Un programa que el servidor no puede leer SHALL puntuar cero, y NO SHALL
rechazar el intento.** Un formato que no reconoce, un bloque desconocido o un
salto dentro de otro dejan el intento guardado con su programa intacto y sin
puntuación: perder el registro de la partida sería peor que no puntuarla.

**Un nivel sin mejor solución apuntada NO SHALL puntuar.** Sin ese número no hay
contra qué comparar, y la puntuación SHALL ser cero en vez de un número inventado.

#### Scenario: El programa usa los pasos de la mejor solución

- **WHEN** se guarda un intento con éxito cuyo programa cuesta exactamente los pasos de la mejor solución del nivel
- **THEN** el intento queda con puntuación 100

#### Scenario: El programa usa pasos de más

- **WHEN** se guarda un intento con éxito cuyo programa cuesta más pasos que la mejor solución
- **THEN** el intento queda con una puntuación menor que 100 y mayor que cero

#### Scenario: Se dejan bloques detrás de la meta

- **WHEN** se guarda un intento con éxito cuyo programa sigue con más órdenes después de pisar la meta
- **THEN** esas órdenes cuentan en el recuento y el intento puntúa menos que sin ellas

#### Scenario: El niño manda una puntuación

- **WHEN** llega un intento con una puntuación puesta por quien lo manda
- **THEN** se ignora, y la que se guarda es la que el servidor calcula leyendo el programa

#### Scenario: El intento no resolvió el nivel

- **WHEN** se guarda un intento sin éxito
- **THEN** su puntuación es cero

#### Scenario: El programa no se puede leer

- **WHEN** se guarda un intento cuyo programa no está en un formato que el servidor reconozca
- **THEN** el intento queda guardado con su programa entero y con puntuación cero

#### Scenario: El nivel no tiene apuntada su mejor solución

- **WHEN** se guarda un intento con éxito de un nivel cuya configuración no dice cuántos pasos cuesta la mejor solución
- **THEN** el intento queda con puntuación cero

### Requirement: La experiencia se concede por diferencia de marca

La experiencia de un nivel NO SHALL acumularse por jugarlo: SHALL **completarse
hasta su tope**. Cada nivel guarda la **mejor marca histórica** del niño en él, esa
marca NO SHALL bajar nunca, y lo que se concede al guardar una partida SHALL ser:

> **(marca nueva − marca anterior) × tope del nivel ÷ 100**

De ahí salen las tres consecuencias, y SHALL cumplirse las tres:

- **superar un nivel flojo concede lo que valga esa partida**, no el tope;
- **volver a superarlo mejor concede sólo la diferencia**;
- **volver a superarlo peor NO SHALL conceder nada, ni quitar nada.**

Un nivel NO SHALL poder dar más experiencia que su tope, por muchas veces que se
juegue. Y la experiencia NO SHALL concederse por la transición a superado, sino
por la mejora de la marca: superar sin mejorar la marca concede cero.

**Un intento sin éxito NO SHALL conceder experiencia**, ni mover la marca.

#### Scenario: Se supera un nivel sin ser perfecto

- **WHEN** se supera por primera vez un nivel con una partida que puntúa 80
- **THEN** se conceden 80 de experiencia y la marca del nivel queda en 80

#### Scenario: Se vuelve a superar mejorando

- **WHEN** se vuelve a superar ese nivel con una partida que puntúa 100
- **THEN** se conceden 20 de experiencia y la marca queda en 100

#### Scenario: Se vuelve a superar empeorando

- **WHEN** se vuelve a superar ese nivel con una partida que puntúa 60
- **THEN** no se concede ninguna experiencia y la marca sigue en 100

#### Scenario: Se falla un nivel ya superado

- **WHEN** se falla un nivel que ya estaba superado
- **THEN** no se concede ninguna experiencia y la marca no cambia

#### Scenario: Se juega el mismo nivel muchas veces

- **WHEN** se juega y se supera el mismo nivel repetidamente
- **THEN** la experiencia total que ese nivel ha dado nunca pasa de su tope

### Requirement: Las marcas anteriores a la puntuación se recalculan

Las marcas y la experiencia que existían **antes** de que el servidor puntuara
SHALL reconciliarse en la misma migración que estrena la puntuación, porque las
dos cosas dejan de significar lo mismo: hasta entonces completar un nivel
concedía su tope entero con la marca en cero, y a partir de ahora la marca es
**lo que ya se ha cobrado**.

Cada nivel con progreso SHALL recibir como marca la **mejor puntuación de sus
intentos con éxito cuyo programa se pueda leer**, y NO SHALL bajar de la marca que
ya tuviera. Un nivel superado cuyos intentos no se puedan leer SHALL conservar la
marca que tenga, aunque sea cero: no hay nada que recalcular y **inventarle una
marca perfecta sería regalar una puntuación que nadie midió**.

La experiencia total SHALL quedar **cuadrada con las marcas** —la suma de lo que
cada nivel ha concedido, más la de los logros— para que ningún nivel ya superado
pueda volver a pagar lo que ya pagó.

#### Scenario: Un nivel superado con intentos legibles

- **WHEN** la migración encuentra un nivel superado con un intento con éxito cuyo programa se lee y cuesta los pasos de la mejor solución
- **THEN** la marca de ese nivel queda en 100

#### Scenario: Un nivel superado sin intentos legibles

- **WHEN** la migración encuentra un nivel superado cuyo único intento con éxito guarda un programa que no se puede leer
- **THEN** la marca de ese nivel se queda como estaba

#### Scenario: Un nivel empezado y no superado

- **WHEN** la migración encuentra un nivel con progreso pero sin ningún intento con éxito
- **THEN** su marca queda en cero

#### Scenario: La experiencia después del recálculo

- **WHEN** termina la migración
- **THEN** la experiencia total de cada niño es la suma de lo que le han dado sus marcas y sus logros

#### Scenario: Se vuelve a superar un nivel recalculado

- **WHEN** se vuelve a superar con una partida perfecta un nivel cuya marca quedó por debajo de 100
- **THEN** sólo se concede la diferencia que faltaba hasta el tope

## MODIFIED Requirements

### Requirement: Escrituras encapsuladas en funciones seguras

El sistema SHALL canalizar las escrituras principales del cliente a través de
funciones RPC, en lugar de permitir escritura directa sobre las tablas, para
reducir la manipulación desde el navegador.

Toda función de escritura SHALL identificar a quien la llama por la sesión, y NO
SHALL aceptar como parámetro a quién afecta. Una llamada sin sesión SHALL
rechazarse con error de permiso en lugar de escribir nada.

El permiso de ejecución de esas funciones SHALL concederse **sólo** al rol
autenticado, y SHALL retirarse del rol anónimo y del público.

Cuando una de estas funciones rechace una operación, SHALL hacerlo con un código
de error **distinguible de los demás rechazos** de esa misma función, para que el
cliente pueda darle a cada uno la respuesta que le corresponde en vez de tratar
todos los fallos como el mismo.

**Una partida terminada SHALL guardarse con una sola llamada**, la que lleva el
programa. El intento y el progreso del nivel SHALL escribirse **dentro de esa
misma operación**, y la experiencia concederse ahí: la puntuación sale de contar
el programa, así que quien concede la experiencia NO SHALL ser una llamada que no
tenga el programa delante.

De ahí se sigue que **el recuento de intentos del progreso cuenta partidas**, y
SHALL coincidir con las filas de intentos de ese nivel: ya no son dos contadores
que nada sincroniza.

Esa llamada SHALL devolver lo que la pantalla tiene que enseñar —la puntuación
de la partida, la marca que queda y la experiencia concedida—, para que el
cliente NO SHALL tener que adivinarlo ni volver a consultarlo.

#### Scenario: El cliente actualiza su perfil

- **WHEN** se modifica el perfil propio
- **THEN** la operación pasa por la función `update_my_profile`

#### Scenario: El cliente registra progreso o un intento de nivel

- **WHEN** termina una partida de un nivel, con éxito o sin él
- **THEN** una sola llamada guarda el intento, el progreso y la experiencia que corresponda
- **AND** devuelve la puntuación de la partida, la marca del nivel y la experiencia concedida

#### Scenario: El cliente fija el rol de su perfil

- **WHEN** se fija el rol del perfil propio después del alta
- **THEN** la operación pasa por la función `set_my_role`

#### Scenario: Se llama a una función de escritura sin sesión

- **WHEN** se invoca `set_my_role` con la clave anónima y sin sesión
- **THEN** la llamada es rechazada y no se escribe nada

#### Scenario: Se guarda una partida sin sesión

- **WHEN** se intenta guardar una partida con la clave anónima y sin sesión
- **THEN** la llamada es rechazada y no se escribe nada

#### Scenario: Los rechazos de una misma función se distinguen entre sí

- **WHEN** `set_my_role` rechaza por falta de sesión, por rol desconocido, por perfil inexistente, porque el rol ya estaba declarado o porque el perfil tiene lazos de salón
- **THEN** cada uno de esos rechazos responde con un código de error distinto

#### Scenario: Se guarda una partida de un nivel que no existe

- **WHEN** se guarda una partida contra un nivel que no existe o no está publicado
- **THEN** la llamada es rechazada con su propio código y no se escribe ni intento ni progreso

### Requirement: Todos los niveles conceden la misma experiencia

Todos los niveles SHALL tener **el mismo tope de experiencia**, en lugar de una
escala creciente por dificultad. Ese tope es lo máximo que un nivel puede llegar a
dar, y lo que de verdad concede cada partida sale de su puntuación.

Lo que distingue a un nivel difícil de uno fácil SHALL ser la puntuación que se
saca en él —que sale de los pasos— y no una recompensa mayor por terminarlo.

#### Scenario: Se compara la recompensa de dos niveles

- **WHEN** se leen la experiencia de un nivel del primer mundo y la de uno del último
- **THEN** las dos son la misma cantidad

#### Scenario: Se comparan dos partidas del mismo nivel

- **WHEN** se supera un nivel con los pasos justos y otra vez con pasos de más
- **THEN** la partida de los pasos justos concede más experiencia, aunque el tope del nivel sea el mismo
