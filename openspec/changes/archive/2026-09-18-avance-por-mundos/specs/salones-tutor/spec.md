## MODIFIED Requirements

### Requirement: El panel del tutor informa sobre progreso real

El panel de información SHALL calcular lo que muestra sobre el progreso que los
alumnos del alcance elegido tienen guardado en el servidor, y NO SHALL mostrar
ninguna cifra que no salga de ahí.

Lo que SHALL informar, para el alcance elegido:

- cuántos exploradores tienen alguna actividad, sobre el total inscrito;
- cuántos niveles se han superado, sobre los que el alcance podría superar;
- cuántos mundos se han terminado, sobre los que el alcance podría terminar;
- la **marca media de eficiencia** de lo superado.

Y por explorador elegido, SHALL informar su avance **sobre el catálogo completo
de mundos y niveles publicados**, no sólo sobre lo que ha jugado. Para cada
mundo SHALL decir cuántos de sus niveles lleva superados, y dentro de él SHALL
nombrar **todos** sus niveles, incluidos los que no ha empezado, que SHALL
distinguirse de los empezados y no superados.

De cada nivel jugado SHALL informar **cuántos intentos le costó** y **cuántos
pasos tuvo cada intento**, porque es lo que distingue a quien resolvió a la
primera de quien llegó al mismo sitio probando.

Un nivel con progreso guardado que ya no esté en el catálogo publicado NO SHALL
desaparecer de la ficha.

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

#### Scenario: Un explorador que empezó dos mundos y no terminó ninguno

- **WHEN** el tutor abre la ficha de un alumno que sólo ha superado el primer nivel de dos mundos, de tres que hay
- **THEN** los tres mundos aparecen, cada uno con cuántos de sus niveles lleva superados
- **AND** el mundo que no ha tocado aparece con su nombre y su recuento en cero
- **AND** los niveles que no ha empezado aparecen nombrados y marcados como no empezados

#### Scenario: Un explorador que no ha jugado nada

- **WHEN** el tutor abre la ficha de un alumno sin ningún intento
- **THEN** se le dice que todavía no ha jugado
- **AND** el catálogo completo aparece igualmente, con todos sus niveles sin empezar

#### Scenario: Un nivel que se despublicó después de jugarse

- **WHEN** el tutor abre la ficha de un alumno que tiene progreso en un nivel que ya no está publicado
- **THEN** ese nivel sigue apareciendo con sus intentos y su marca

#### Scenario: Un salón donde nadie ha jugado todavía

- **WHEN** el tutor abre el panel de un salón cuyos alumnos no tienen progreso
- **THEN** se le dice que todavía no hay actividad que informar
- **AND** no aparece ningún porcentaje ni promedio

#### Scenario: El tutor no tiene ningún salón

- **WHEN** abre el panel sin salones creados
- **THEN** no se produce ningún error ni división por cero

### Requirement: Selector de alcance del panel

El sistema SHALL permitir al tutor ver la información agregada de todos sus
salones o restringirla a uno concreto.

El alcance elegido SHALL gobernar **todo** el panel, no sólo lo que se lee: las
métricas, los reportes y también **el destino de las misiones que el tutor
asigna**. Un selector que se ignora al escribir es peor que no tenerlo, porque el
tutor cree haber elegido algo que no se tuvo en cuenta.

El alcance elegido y el explorador elegido SHALL vivir en la dirección de la
pantalla. Volver a abrir esa dirección SHALL devolver la misma vista, y quien ya
tenga permiso para ver ese avance SHALL poder llegar a él por el enlace.

Cambiar de alcance SHALL soltar al explorador elegido, porque un alumno
pertenece a un solo salón. Una dirección que nombre a un explorador fuera del
alcance NO SHALL abrir su ficha ni producir error.

#### Scenario: El tutor elige un salón

- **WHEN** selecciona un salón en el selector de alcance
- **THEN** las métricas y los reportes pasan a referirse sólo a ese salón

#### Scenario: El tutor asigna con un alcance elegido

- **WHEN** el tutor asigna una misión con un salón elegido en el selector
- **THEN** la misión se asigna a ese salón y a ningún otro

#### Scenario: El tutor cambia de alcance

- **WHEN** el tutor cambia de un salón a otro en el selector
- **THEN** lo que aparece como asignado corresponde al salón elegido, no al anterior
- **AND** deja de haber un explorador elegido

#### Scenario: El tutor recarga con una ficha abierta

- **WHEN** recarga la pantalla mientras mira la ficha de un explorador
- **THEN** vuelve a ver la misma ficha del mismo explorador

#### Scenario: La dirección nombra a alguien que no está en el alcance

- **WHEN** el tutor abre una dirección que nombra a un explorador que no pertenece al alcance
- **THEN** la pantalla se comporta como si no hubiera ninguno elegido
- **AND** no se muestra ningún error
