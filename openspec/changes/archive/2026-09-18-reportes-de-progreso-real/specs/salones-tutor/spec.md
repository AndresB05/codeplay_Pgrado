## ADDED Requirements

### Requirement: El panel del tutor informa sobre progreso real

El panel de información SHALL calcular lo que muestra sobre el progreso que los
alumnos del alcance elegido tienen guardado en el servidor, y NO SHALL mostrar
ninguna cifra que no salga de ahí.

Lo que SHALL informar, para el alcance elegido:

- cuántos exploradores tienen alguna actividad, sobre el total inscrito;
- cuántos niveles se han superado, sobre los que el alcance podría superar;
- cuántos mundos se han terminado, sobre los que el alcance podría terminar;
- la **marca media de eficiencia** de lo superado.

Y por explorador con actividad, SHALL informar **cuántos intentos le costó cada
nivel** y **cuántos pasos tuvo cada intento**, porque es lo que distingue a quien
resolvió a la primera de quien llegó al mismo sitio probando.

Un explorador sin actividad SHALL aparecer, dicho como ausencia y no como mal
resultado: no aporta a la marca media, y se le nombra sin cifra.

Un alcance sin ninguna actividad SHALL decirlo con palabras, y NO SHALL pintar
ceros que se lean como un problema de aprendizaje.

#### Scenario: Un salón con un explorador que ha jugado y dos que no

- **WHEN** el tutor abre el panel de un salón de tres alumnos donde sólo uno tiene progreso
- **THEN** ve que uno de los tres tiene actividad
- **AND** los recuentos de niveles y mundos cuentan el total del salón, no sólo el del que jugó
- **AND** la marca media se calcula únicamente sobre lo superado

#### Scenario: El tutor mira cuánto le costó un nivel a un explorador

- **WHEN** abre el detalle de un explorador con actividad
- **THEN** ve, nivel a nivel, cuántos intentos hizo y su marca
- **AND** ve cada intento con los pasos que tuvo, y con cuántos se resolvía ese nivel

#### Scenario: Un salón donde nadie ha jugado todavía

- **WHEN** el tutor abre el panel de un salón cuyos alumnos no tienen progreso
- **THEN** se le dice que todavía no hay actividad que informar
- **AND** no aparece ningún porcentaje ni promedio

#### Scenario: El tutor no tiene ningún salón

- **WHEN** abre el panel sin salones creados
- **THEN** no se produce ningún error ni división por cero

### Requirement: El tutor ve el historial completo del alumno

El progreso que el panel informa SHALL ser **todo** el del alumno, incluido el
anterior a su ingreso en el salón. El sistema NO SHALL recortarlo por
`class_memberships.joined_at`.

Es una decisión explícita del 18 de septiembre de 2026, no un efecto colateral:
un niño puede descubrir la plataforma por su cuenta, jugar semanas y unirse
después al salón de su profesor, y al unirse entrega ese historial. Se documenta
aquí porque es lo que el paso de consentimiento del acudiente tendrá que
recoger.

#### Scenario: Un alumno que jugó antes de entrar al salón

- **WHEN** el tutor mira el progreso de un alumno que superó niveles antes de que su ingreso fuera aceptado
- **THEN** esos niveles cuentan en el informe igual que los posteriores

### Requirement: La tabla de seguimiento dice el mundo y la actividad verdaderos

Las columnas «Mundo actual» y «Última actividad» de la tabla de seguimiento
SHALL mostrar lo que dice el servidor.

El **mundo actual** SHALL ser aquel al que pertenece el último nivel que el
alumno intentó, tenga éxito o no. La **última actividad** SHALL derivarse del
último intento registrado.

Un alumno sin ningún intento SHALL seguir mostrándose como «Sin actividad» y con
el mundo vacío: ahí el hueco es el dato.

#### Scenario: Un alumno que acaba de jugar

- **WHEN** el tutor abre el detalle de un salón donde un alumno jugó hace unas horas
- **THEN** su fila nombra el mundo de ese último nivel
- **AND** su última actividad se expresa en horas, no como «Sin actividad»

#### Scenario: Un alumno que nunca ha entrado

- **WHEN** el tutor mira la fila de un alumno sin ningún intento
- **THEN** la columna de mundo aparece vacía
- **AND** la última actividad dice «Sin actividad»

#### Scenario: El niño mira la tabla de su salón

- **WHEN** el niño con estado `member` abre la vista de su salón
- **THEN** las dos columnas muestran para sus compañeros el mismo dato verdadero que ve el tutor

## REMOVED Requirements

### Requirement: Reportes de habilidades

**Reason**: El juego que existe tiene cuatro bloques —avanzar, girar a la
izquierda, girar a la derecha y saltar—, sin bucle, sin condicional y sin
función. De las cinco competencias que este requisito manda pintar, sólo
«secuencias» tiene con qué entrenarse; las otras cuatro no medirían nada aunque
el progreso llegara, y su 0 % se lee como un problema de aprendizaje que no
existe. Medido el 18 de septiembre de 2026 en el código del editor y en los 28
intentos guardados, donde no aparece ningún otro tipo de bloque.

**Migration**: Lo sustituye «El panel del tutor informa sobre progreso real», que
informa de lo que el dato sostiene: niveles superados, mundos terminados, marca
de eficiencia, intentos por nivel y pasos por intento. El semáforo de tres
tramos —verde, amarillo, coral— desaparece con él. Las cinco claves de
competencia **no** se borran del código: `Mission.skill` las sigue usando para
etiquetar el catálogo de misiones, que pertenece al paso 22.
