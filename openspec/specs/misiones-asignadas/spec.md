# misiones-asignadas Specification

## Purpose

Definir qué es una misión en CodePlay, quién puede asignarla y a qué salón, qué
ve de ellas el niño y **qué cuenta como cumplirla**. Una misión es un reto
**especial** que sólo existe para el niño si su tutor se lo asignó, y que premia
con más XP que un nivel normal.

Una misión **no es contenido propio**: es una pregunta sobre los niveles que ya
existen, que responde el servidor leyendo el historial del niño. Se asigna al
salón, se cumple alumno por alumno, y paga su premio **una sola vez en la vida**.

## Requirements

### Requirement: Una misión sólo existe para el niño si su tutor se la asignó

El sistema SHALL mostrar al niño **únicamente** las misiones asignadas al salón
al que pertenece. NO SHALL existir ninguna superficie donde el niño vea el
catálogo completo, ni siquiera bloqueado o en gris: que una misión esté
«bloqueada hasta que el tutor la asigne» es regla del modelo, y se cumple porque
no hay dónde verla.

Un niño sin salón NO SHALL ver ninguna misión.

Una misión asignada o retirada mientras el niño tiene la pantalla abierta SHALL
aparecer o desaparecer **sin que él recargue ni vuelva a entrar**. El panel NO
SHALL desaparecer mientras se actualiza: hoy no se pinta cuando está cargando, y
una recarga provocada por el tutor lo haría parpadear entero.

#### Scenario: El niño pertenece a un salón con misiones asignadas

- **WHEN** el niño abre una pantalla donde se muestran las misiones de su salón
- **THEN** ve exactamente las misiones que su tutor asignó a ese salón, y ninguna más

#### Scenario: El niño pertenece a un salón sin misiones asignadas

- **WHEN** el niño abre esa pantalla y su tutor no ha asignado ninguna misión
- **THEN** no se pinta ninguna tarjeta ni ningún hueco vacío en su lugar

#### Scenario: El niño no tiene salón

- **WHEN** un niño con `membership` en `none` abre esa pantalla
- **THEN** no ve ninguna misión ni ningún aviso sobre misiones

#### Scenario: Las misiones de otro salón no se filtran

- **WHEN** un niño consulta las asignaciones existentes
- **THEN** no obtiene ninguna que pertenezca a un salón que no es el suyo

#### Scenario: El tutor asigna con la pantalla del niño abierta

- **WHEN** el tutor asigna una misión al salón del niño mientras éste tiene la pantalla abierta
- **THEN** la tarjeta de esa misión aparece sin recargar
- **AND** el resto del panel no desaparece mientras llega

#### Scenario: El tutor retira con la pantalla del niño abierta

- **WHEN** el tutor retira una misión del salón del niño mientras éste tiene la pantalla abierta
- **THEN** la tarjeta deja de verse sin recargar

#### Scenario: Se asigna una misión a otro salón

- **WHEN** el tutor asigna o retira una misión en un salón al que el niño no pertenece
- **THEN** su pantalla no cambia

### Requirement: Una misión premia más que un nivel

Cada misión del catálogo SHALL declarar el XP que otorga, y ese premio SHALL ser
**mayor que el del nivel más generoso del contenido sembrado**, porque una misión
es un reto especial y no un nivel más.

El premio SHALL escalar con la dificultad declarada de la misión: a mayor
dificultad, mayor XP.

El sistema SHALL mostrar ese premio al niño en la tarjeta de cada misión
asignada, para que sepa qué gana antes de cumplirla.

**El premio SHALL otorgarse al cumplirla**, y SHALL sumarse al XP total del niño
por el mismo camino que el de un nivel o un logro.

**Una misión SHALL pagar una sola vez en la vida de cada niño.** Volver a
asignársela —en el mismo salón o en otro— SHALL mostrarla ya cumplida y NO SHALL
volver a pagarla.

#### Scenario: El niño mira una misión asignada

- **WHEN** el niño ve la tarjeta de una misión de su salón
- **THEN** la tarjeta indica cuánto XP otorga

#### Scenario: El premio no compite con un nivel corriente

- **WHEN** se compara el premio de cualquier misión del catálogo con el de cualquier nivel sembrado
- **THEN** el de la misión es estrictamente mayor

#### Scenario: El niño cumple una misión

- **WHEN** cumple una misión que otorga XP
- **THEN** su XP total sube en esa cantidad

#### Scenario: La misma misión se asigna dos veces al mismo niño

- **WHEN** un niño que ya cumplió una misión vuelve a tenerla asignada y a satisfacer su condición
- **THEN** no recibe XP por segunda vez

### Requirement: El tutor asigna misiones al alcance que tiene elegido

El sistema SHALL asignar la misión al salón que el tutor tenga elegido en el
selector de alcance del panel, y con «Todos» elegido SHALL asignarla a todos sus
salones.

Con «Todos» elegido, una misión SHALL mostrarse como «Asignada» **sólo si todos**
los salones del tutor la tienen; si la tiene alguno pero no todos, el sistema
SHALL decir a cuántos.

Un tutor sin ningún salón NO SHALL poder asignar: los controles SHALL quedar
deshabilitados, porque no hay destino posible.

La asignación SHALL sobrevivir a recargar la aplicación y SHALL ser visible desde
otra sesión, incluida la del niño en otro dispositivo.

Una misma misión SHALL poder estar asignada **una sola vez** a un mismo salón:
asignarla de nuevo no crea una segunda asignación ni produce un error al tutor.

El tutor SHALL poder retirar una misión que asignó; retirarla la quita de la
vista del niño.

**Al asignar, el sistema SHALL dar por cumplida la misión a los alumnos del
alcance que ya satisfagan su condición**, sin esperar a que vuelvan a jugar. Un
salón donde varios ya la cumplían y sale entero en «Pendiente» se lee como un
fallo de la aplicación.

Un fallo al poner al día a los alumnos NO SHALL deshacer la asignación: asignar y
conceder son dos operaciones, y la primera vale por sí sola.

#### Scenario: El tutor asigna con un salón elegido

- **WHEN** el tutor elige un salón concreto y asigna una misión
- **THEN** la misión queda asignada a ese salón y a ningún otro

#### Scenario: El tutor asigna con «Todos» elegido

- **WHEN** el tutor tiene «Todos» elegido y asigna una misión
- **THEN** la misión queda asignada a todos sus salones

#### Scenario: La misión está en unos salones y no en otros

- **WHEN** el tutor tiene «Todos» elegido y una misión está asignada sólo a parte de sus salones
- **THEN** la misión no se muestra como «Asignada», y se indica en cuántos salones lo está

#### Scenario: El tutor no tiene salones

- **WHEN** un tutor sin ningún salón abre la sección de asignación de misiones
- **THEN** los controles de asignar están deshabilitados y se explica que antes hace falta un salón

#### Scenario: La asignación sobrevive a la recarga

- **WHEN** el tutor asigna una misión y vuelve a cargar la aplicación
- **THEN** la misión sigue apareciendo como asignada

#### Scenario: El tutor asigna la misma misión dos veces

- **WHEN** el tutor asigna una misión ya asignada a ese salón
- **THEN** el salón sigue teniendo una sola asignación de esa misión y el tutor no ve ningún error

#### Scenario: El tutor retira una misión

- **WHEN** el tutor retira una misión asignada a su salón
- **THEN** deja de estar asignada y el niño deja de verla

#### Scenario: El tutor asigna a un salón donde ya la cumplían

- **WHEN** asigna una misión a un salón en el que hay alumnos que ya satisfacen su condición
- **THEN** esos alumnos aparecen como «Cumplida» sin haber vuelto a jugar

### Requirement: Una misión puede tener fecha límite

Al asignar una misión, el tutor SHALL elegir entre **dejarla sin fecha límite** o
fijar el **último día** para cumplirla, que SHALL ser hoy o un día posterior.
Una fecha pasada SHALL rechazarse también en el servidor, no sólo en el
calendario. El día se cuenta en **hora de Colombia**, y la misión SHALL valer
hasta el final de ese día.

Pasada la fecha, la misión SHALL dejar de estar asignada **para todos a la vez**:
el niño deja de verla, el tutor la ve como no asignada y NO SHALL concederse,
sin depender de que ningún proceso la borre.

El tutor SHALL poder **reasignar** una misión vencida con una fecha nueva o sin
ella. Quien ya la cumplió NO SHALL cobrarla otra vez: el cumplimiento se guarda
una sola vez en la vida. Reasignar a un salón que ya la tiene SHALL dejarle la
fecha recién elegida.

#### Scenario: El tutor asigna sin fecha límite

- **WHEN** el tutor asigna una misión y deja marcada la opción «Sin fecha límite»
- **THEN** la misión queda asignada y no vence nunca

#### Scenario: El tutor asigna con fecha límite

- **WHEN** el tutor elige un día en el calendario y asigna la misión
- **THEN** el tutor ve hasta cuándo vale y el niño, mientras no la haya cumplido, también

#### Scenario: Se intenta asignar con una fecha pasada

- **WHEN** llega al servidor una asignación con un día anterior a hoy
- **THEN** se rechaza y no se asigna nada

#### Scenario: La misión vence

- **WHEN** termina el último día de una misión asignada
- **THEN** el niño deja de verla, el tutor la ve como no asignada y jugar ya no la concede

#### Scenario: El tutor da una segunda oportunidad

- **WHEN** el tutor reasigna una misión vencida
- **THEN** vuelve a estar asignada, y quien ya la había cumplido la sigue viendo cumplida sin cobrarla otra vez

### Requirement: Sólo el tutor del salón asigna en él

El sistema SHALL permitir asignar misiones a un salón únicamente al tutor de ese
salón. Un tutor NO SHALL poder asignar en un salón ajeno, y un niño NO SHALL
poder asignar en ninguno, tampoco en el suyo.

La garantía SHALL residir en la base de datos y no únicamente en la navegación de
la interfaz, de modo que se sostenga aunque la escritura llegue por otro camino.

Sin sesión NO SHALL poder leerse ni escribirse ninguna asignación.

#### Scenario: Un tutor asigna en un salón ajeno

- **WHEN** un tutor intenta asignar una misión a un salón que no es suyo
- **THEN** la escritura se rechaza

#### Scenario: Un niño intenta asignar

- **WHEN** un niño intenta asignar una misión, incluso a su propio salón
- **THEN** la escritura se rechaza

#### Scenario: Consulta sin sesión

- **WHEN** se consultan las asignaciones sin una sesión autenticada
- **THEN** la petición se rechaza sin devolver ninguna fila

### Requirement: Una misión se cumple con los niveles que ya existen

Una misión SHALL cumplirse **jugando los niveles publicados**, sin contenido
propio: su condición SHALL ser una pregunta sobre lo que el niño ya ha hecho —qué
niveles ha superado, con qué marca y en qué intento— y NO SHALL exigir ningún
puzle que no esté en el catálogo.

**Quien decide si una misión se cumplió SHALL ser el servidor**, leyendo el
progreso guardado y el programa enviado. El cliente NO SHALL nombrar ninguna
misión ni declarar ninguna cumplida, de modo que añadir una misión no obligue a
volver a publicar el juego.

El catálogo SHALL pedir únicamente cosas que el juego permita hacer. Con los
cuatro bloques de hoy —avanzar, dos giros y saltar— ninguna misión SHALL exigir
bucles, condicionales, funciones, estructuras de datos, variables ni depuración.

Una misión NO SHALL pedir lo mismo que un logro ya premia: las que se cumplen
terminando un mundo SHALL pedir **superarlo**, no conseguir la marca máxima en
todos sus niveles, que es lo que el logro de ese mundo ya exige.

#### Scenario: El niño cumple una misión jugando

- **WHEN** termina la partida con la que su progreso pasa a satisfacer la condición de una misión asignada a su salón
- **THEN** la misión queda cumplida sin que él la elija ni la empiece

#### Scenario: Una partida que no cumple nada

- **WHEN** termina una partida que no completa la condición de ninguna misión asignada
- **THEN** no se da ninguna por cumplida

#### Scenario: El catálogo no pide lo que el juego no tiene

- **WHEN** se revisan las condiciones del catálogo de misiones
- **THEN** ninguna exige bucles, condicionales, funciones, estructuras de datos, variables ni depuración

### Requirement: El catálogo de misiones vive en la base

El catálogo de misiones SHALL guardarse en **un solo sitio**, la base de datos, y
las pantallas SHALL leerlo de ahí. NO SHALL existir una copia del catálogo en el
cliente: con una lista para conceder y otra para pintar, las dos se separan en
cuanto alguien toque una.

Una asignación SHALL apuntar a una misión **que exista en el catálogo**, y la
base SHALL impedir que se guarde una asignación a una clave desconocida.

Cada misión del catálogo SHALL declarar su título, su descripción, su dificultad
y el XP que otorga, y NO SHALL declarar ningún dato que nadie mida, como una
duración estimada.

#### Scenario: Se intenta asignar una misión que no existe

- **WHEN** llega una asignación cuya clave no está en el catálogo
- **THEN** la escritura se rechaza

#### Scenario: El niño y el tutor ven la misma misión

- **WHEN** los dos miran la misma misión asignada
- **THEN** leen el mismo título, la misma descripción y el mismo premio

### Requirement: El cumplimiento es individual y se guarda con su salón

Una misión se SHALL asignar **a un salón** y se SHALL cumplir **alumno por
alumno**. Que un alumno la cumpla NO SHALL retirarla del resto: la misión SHALL
seguir visible para todos los del salón hasta que el tutor la retire.

El cumplimiento SHALL guardarse, y SHALL guardar **el salón en el que ocurrió**,
no derivarlo de dónde esté el niño después: un niño que cambie de salón NO SHALL
hacer desaparecer lo cumplido de los informes de su antiguo tutor.

El sistema SHALL mostrar al tutor, para el salón que tenga elegido, quién ha
cumplido cada misión asignada y quién no. Ese apartado SHALL mostrarse **sólo con
un salón concreto elegido**: con «Todos» no hay una lista que enseñar sin mezclar
alumnos de salones distintos.

#### Scenario: Un alumno del salón cumple una misión

- **WHEN** uno de los alumnos cumple una misión asignada al salón
- **THEN** el tutor lo ve como «Cumplida» para ese alumno
- **AND** los demás alumnos siguen viendo la misión en su panel

#### Scenario: El niño mira una misión que ya cumplió

- **WHEN** abre el panel de misiones de su salón después de cumplir una
- **THEN** la tarjeta dice que está cumplida, y no desaparece

#### Scenario: El tutor tiene «Todos» elegido

- **WHEN** el tutor tiene «Todos» elegido en el selector de alcance
- **THEN** el apartado de cumplimiento no se muestra

#### Scenario: El salón elegido no tiene alumnos

- **WHEN** el tutor elige un salón con misiones asignadas y sin alumnos inscritos
- **THEN** el apartado lo dice en vez de mostrar una lista vacía

#### Scenario: El niño cambia de salón

- **WHEN** un niño que cumplió una misión deja su salón
- **THEN** el cumplimiento sigue registrado con el salón donde ocurrió

### Requirement: El niño se entera en cuanto cumple una misión

El sistema SHALL avisar al niño de cada misión cumplida **en la misma partida en
que la cumple**, sin que tenga que ir a buscarla.

El aviso SHALL distinguirse del de un logro: una misión es algo que su tutor le
puso, y llamarla logro confundiría las dos cosas.

Varias misiones cumplidas a la vez, o una misión y un logro en la misma partida,
SHALL avisarse **de una en una**. El aviso NO SHALL robar el foco ni impedir
seguir jugando.

#### Scenario: El niño cumple una misión y gana un logro a la vez

- **WHEN** la misma partida cumple una misión y concede un logro
- **THEN** ve los dos avisos, uno detrás de otro, y cada uno dice cuál de las dos cosas es

#### Scenario: Una partida sin misiones cumplidas

- **WHEN** termina una partida que no cumple ninguna
- **THEN** no aparece ningún aviso de misión
