# misiones-asignadas Specification

## Purpose

Definir qué es una misión en CodePlay, quién puede asignarla y a qué salón, qué
ve de ellas el niño, y por qué su cumplimiento sale hoy entero en pendiente. Una
misión es un reto **especial** que sólo existe para el niño si su tutor se lo
asignó, y que premia con más XP que un nivel normal.

## Requirements

### Requirement: Una misión sólo existe para el niño si su tutor se la asignó

El sistema SHALL mostrar al niño **únicamente** las misiones asignadas al salón
al que pertenece. NO SHALL existir ninguna superficie donde el niño vea el
catálogo completo, ni siquiera bloqueado o en gris: que una misión esté
«bloqueada hasta que el tutor la asigne» es regla del modelo, y se cumple porque
no hay dónde verla.

Un niño sin salón NO SHALL ver ninguna misión.

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

### Requirement: Una misión premia más que un nivel

Cada misión del catálogo SHALL declarar el XP que otorga, y ese premio SHALL ser
**mayor que el del nivel más generoso del contenido sembrado**, porque una misión
es un reto especial y no un nivel más.

El premio SHALL escalar con la dificultad declarada de la misión: a mayor
dificultad, mayor XP.

El sistema SHALL mostrar ese premio al niño en la tarjeta de cada misión
asignada, para que sepa qué gana antes de que la misión pueda jugarse.

#### Scenario: El niño mira una misión asignada

- **WHEN** el niño ve la tarjeta de una misión de su salón
- **THEN** la tarjeta indica cuánto XP otorga

#### Scenario: El premio no compite con un nivel corriente

- **WHEN** se compara el premio de cualquier misión del catálogo con el de cualquier nivel sembrado
- **THEN** el de la misión es estrictamente mayor

### Requirement: Las misiones todavía no se pueden jugar

Ninguna misión SHALL ofrecer al niño una vía para empezarla, jugarla o darla por
cumplida: no existe todavía nada capaz de completarlas, y eso llega con el juego.

La tarjeta de una misión asignada SHALL decir explícitamente que la misión
llegará con el juego, en lugar de mostrar un botón que no llevaría a ninguna
parte.

#### Scenario: El niño quiere empezar una misión

- **WHEN** el niño ve la tarjeta de una misión asignada
- **THEN** no hay ningún botón ni enlace que prometa jugarla
- **AND** la tarjeta explica que la misión llegará con el juego

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

### Requirement: El cumplimiento se calcula y hoy sale entero en pendiente

El sistema SHALL mostrar al tutor, para el salón que tenga elegido, quién ha
cumplido cada misión asignada y quién no.

Ese estado SHALL **calcularse** a partir del progreso conocido, y NO SHALL
guardarse en ninguna tabla de cumplimientos: qué reporta el juego y con qué
garantía es una decisión previa al paso 20 que este cambio no toma.

Mientras nada pueda completar una misión, todos los alumnos del salón SHALL
aparecer en «Pendiente», y la pantalla **SHALL decir por qué**: que nadie puede
cumplirla hasta que el juego reporte el progreso. Una lista de pendientes sin
explicación parece un fallo de la aplicación.

El apartado SHALL mostrarse **sólo con un salón concreto elegido**: con «Todos»
no hay una lista que enseñar sin mezclar alumnos de salones distintos.

#### Scenario: El tutor mira el cumplimiento de un salón

- **WHEN** el tutor elige un salón con misiones asignadas y alumnos inscritos
- **THEN** ve a cada alumno en «Pendiente» para cada misión asignada
- **AND** ve el motivo: nadie puede cumplirlas hasta que el juego reporte el progreso

#### Scenario: El tutor tiene «Todos» elegido

- **WHEN** el tutor tiene «Todos» elegido en el selector de alcance
- **THEN** el apartado de cumplimiento no se muestra

#### Scenario: El salón elegido no tiene alumnos

- **WHEN** el tutor elige un salón con misiones asignadas y sin alumnos inscritos
- **THEN** el apartado lo dice en vez de mostrar una lista vacía
