## ADDED Requirements

### Requirement: El panel cuenta quién está conectado ahora

Las tarjetas de resumen del tutor SHALL contar **cuántos exploradores tienen
CodePlay abierto en este momento**, con la misma presencia en tiempo real que
pone el punto verde y «En línea» en la tabla de seguimiento. SHALL llamarse
**«Conectados ahora»** y NO SHALL contar la actividad del día. Pedido por el
usuario tras la prueba preliminar del 25-sep-2026: «activos hoy» no le decía si
podía contar con ellos en la clase.

Vale para la tarjeta del **detalle de un salón** —«N de M», sobre los inscritos
en ese salón—, para la tarjeta de la **lista de salones** —la suma de todos sus
salones— y para la cifra de cada salón en esa lista. El número SHALL cambiar
**sin recargar** cuando un explorador entra o sale.

El tutor NO SHALL contarse a sí mismo.

#### Scenario: Un explorador abre CodePlay

- **WHEN** el tutor mira el detalle de un salón de tres exploradores y uno de ellos abre CodePlay
- **THEN** la tarjeta pasa a decir «1 de 3» sin recargar la página
- **AND** esa misma fila de la tabla lleva el punto verde

#### Scenario: Un explorador jugó hoy pero ya no está

- **WHEN** un explorador jugó esta mañana y ahora no tiene CodePlay abierto
- **THEN** no cuenta entre los conectados

#### Scenario: La lista de salones suma todos

- **WHEN** el tutor tiene dos salones con un explorador conectado en cada uno
- **THEN** la tarjeta de la lista de salones dice dos conectados, y cada salón dice uno

### Requirement: La tabla de seguimiento se puede filtrar

En el detalle de un salón, el tutor SHALL poder filtrar la tabla de seguimiento
por tres cosas, y sólo por esas tres, que son las que eligió el usuario:

- **nombre**: el texto escrito aparece en el nombre del explorador, sin
  distinguir mayúsculas ni tildes;
- **mundo**: el «Mundo actual» de la tabla, entre los mundos que aparecen en
  ella, más **«Sin empezar»** para quien no ha jugado nunca;
- **actividad**: **conectado** —con CodePlay abierto ahora— o **inactivo**.

Los filtros SHALL combinarse: una fila se ve si cumple todos los que estén
puestos. Sin filtros SHALL verse la tabla entera, como hoy. Si los filtros no
dejan ninguna fila, SHALL decirse con palabras y SHALL poder quitarse los
filtros de un toque. Los filtros NO SHALL cambiar el orden elegido, ni las
tarjetas de resumen, ni el podio.

Los filtros son **del tutor**: la tabla que ve el niño en su salón NO SHALL
llevarlos.

#### Scenario: Se busca por nombre

- **WHEN** el tutor escribe «sofia» y en el salón hay una «Sofía»
- **THEN** la tabla enseña la fila de Sofía y no las demás

#### Scenario: Se filtra por mundo

- **WHEN** el tutor elige el mundo «Cordillera de la Abstracción»
- **THEN** sólo se ven los exploradores cuyo mundo actual es ése

#### Scenario: Se filtran los conectados

- **WHEN** el tutor elige «Conectado»
- **THEN** sólo se ven las filas con el punto verde

#### Scenario: Ningún explorador cumple los filtros

- **WHEN** los filtros puestos no dejan ninguna fila
- **THEN** la tabla dice que nadie coincide y ofrece quitar los filtros

#### Scenario: El niño mira su salón

- **WHEN** un niño abre «Mi salón»
- **THEN** su tabla no lleva filtros
