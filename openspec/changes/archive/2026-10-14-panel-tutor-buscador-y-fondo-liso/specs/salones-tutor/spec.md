## ADDED Requirements

### Requirement: El explorador del seguimiento se busca por nombre

En el panel del tutor, donde se elige un explorador para ver cuánto le costó cada
nivel, el tutor SHALL poder **escribir parte de su nombre** y ver sólo los que
coinciden, **sin distinguir mayúsculas ni tildes**. Pedido por el usuario tras
probar el panel: con 26 nombres largos los botones ocupaban seis filas y
encontrar uno era lento.

La lista de exploradores NO SHALL ocupar más de **unas tres filas** de alto: si
hay más, SHALL desplazarse dentro de su propia caja y no empujar el resto del
panel hacia abajo.

Elegir un explorador SHALL seguir llevándolo a la **dirección** del panel, como
hoy, de modo que recargar o compartir el enlace conserve la ficha abierta. El
explorador elegido SHALL **verse siempre**, aunque la búsqueda lo deje fuera de
la lista, y SHALL poder deseleccionarse.

Si la búsqueda no deja a nadie, SHALL decirse con palabras. Cambiar de salón
SHALL vaciar la búsqueda.

La lista SHALL poder **ordenarse por nombre, de la A a la Z o de la Z a la A**, y
SHALL empezar de la A a la Z. El orden NO SHALL distinguir mayúsculas ni tildes:
«Ángela» va con las A. Se ordena por el **nombre entero**, no por apellido: el
nombre es un campo libre y no hay forma fiable de separar el apellido. El
explorador elegido SHALL seguir fijo encima, sea cual sea el orden.

#### Scenario: Se busca un explorador

- **WHEN** el tutor escribe «sofia» en un salón con una «Sofía» entre 26 exploradores
- **THEN** la lista enseña a Sofía y no a los demás

#### Scenario: Un salón grande no ocupa media pantalla

- **WHEN** el alcance elegido tiene 26 exploradores con nombres largos
- **THEN** la lista se queda en unas tres filas de alto y se desplaza dentro de su caja

#### Scenario: Se elige un explorador

- **WHEN** el tutor pulsa un explorador de la lista
- **THEN** se abre su ficha y la dirección lleva su identificador, como hasta ahora

#### Scenario: La búsqueda deja fuera al elegido

- **WHEN** hay un explorador elegido y el tutor escribe un nombre que no es el suyo
- **THEN** el elegido sigue viéndose como elegido, con la opción de quitarlo

#### Scenario: Se ordena de la Z a la A

- **WHEN** el tutor elige ordenar de la Z a la A en un salón con «Ángela», «beto» y «Carla»
- **THEN** la lista enseña a Carla, beto y Ángela, en ese orden

#### Scenario: El orden de partida

- **WHEN** el tutor abre el panel
- **THEN** la lista va de la A a la Z, con «Ángela» entre las A

#### Scenario: Nadie coincide

- **WHEN** la búsqueda no coincide con ningún explorador
- **THEN** se dice que nadie se llama así
