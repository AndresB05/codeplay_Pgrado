# logros-y-rachas Specification

## Purpose

Que volver al día siguiente cuente y que hacer una tontería con gracia tenga
premio, sin que el juego pueda regalarse nada.

Define **la racha** —cuántos días seguidos el niño ha superado algún nivel, en
hora de Colombia— y **el catálogo de logros**: qué se puede conseguir, qué lo
concede y quién decide que se consiguió. Quien concede es siempre el servidor,
leyendo el historial y el programa enviado; el juego no nombra ningún logro, y
por eso añadir uno no obliga a volver a publicarlo.

El catálogo se lee **entero**, para que la Sala de Trofeos enseñe también lo que
falta, y lo ya concedido conserva el nombre con el que se ganó.

## Requirements

### Requirement: La racha cuenta días de vuelta, no partidas

El sistema SHALL llevar por cada niño **cuántos días seguidos ha superado algún
nivel**, y el récord de esa cuenta.

Un **día** SHALL ser el día natural en **hora de Colombia (UTC−5)**, no en la
hora del servidor. Es una decisión del usuario del 18 de septiembre de 2026 con
la medición delante: con los mismos 28 intentos guardados, contar en UTC daba
racha 2 y contar en hora local daba 0, porque las partidas de la noche caen ya en
el día siguiente en UTC.

La racha SHALL subir con una partida **superada**, y NO SHALL subir con una
partida fallida. Vale cualquier nivel, incluido uno ya superado antes.

Varias partidas superadas el mismo día SHALL subir la racha **una sola vez**.

El sistema SHALL guardar el último día contado. Una racha cuyo último día no sea
hoy ni ayer SHALL mostrarse como **cero**, aunque el contador guardado diga otra
cosa: el contador sólo se recalcula al jugar.

#### Scenario: El niño juega dos días seguidos

- **WHEN** supera un nivel un día y vuelve a superar otro al día siguiente
- **THEN** su racha vale 2

#### Scenario: El niño juega tres veces el mismo día

- **WHEN** supera tres niveles la misma tarde
- **THEN** su racha sube una sola vez

#### Scenario: El niño juega de noche

- **WHEN** supera un nivel a las nueve de la noche, hora de Colombia
- **THEN** ese día cuenta como el día que el niño está viviendo, no como el siguiente

#### Scenario: El niño lo intenta y no lo consigue

- **WHEN** juega varias partidas en un día y no supera ninguna
- **THEN** su racha no sube

#### Scenario: El niño deja de entrar una semana

- **WHEN** mira su racha después de siete días sin jugar
- **THEN** se le muestra cero

### Requirement: Los logros los concede el servidor

El sistema SHALL conceder los logros por sí mismo, y el juego NO SHALL decir
nunca qué logro cree merecer.

Un logro SHALL concederse **una sola vez** por niño.

Todo logro atado a una partida SHALL exigir que esa partida **superara el
nivel**. Es una decisión del usuario del 18 de septiembre de 2026, y coincide con
lo que el contrato de integración ya pedía: sube el listón de quien quiera
falsearlo de manipular el navegador a jugar el nivel y además manipularlo.

El sistema SHALL decidir cada logro mirando una de estas tres cosas, y NO SHALL
aceptar ninguna otra:

- **el historial** que el propio servidor escribió;
- **el programa enviado**, que el servidor lee entero;
- **una observación de la partida**, que el juego manda y **no se puede
  comprobar** — al mismo nivel que el éxito del nivel, del que ya depende toda la
  experiencia.

Conceder un logro NO SHALL poder hacer que se pierda la partida que lo disparó.

Una observación ausente o ilegible NO SHALL conceder nada ni producir error.

#### Scenario: El mismo logro dos veces

- **WHEN** el niño vuelve a cumplir la condición de un logro que ya tiene
- **THEN** no se le concede otra vez ni se le suma más experiencia

#### Scenario: La acción sin llegar a la meta

- **WHEN** escribe un programa que cumple la condición de un logro de acción pero no resuelve el nivel
- **THEN** no se le concede el logro

#### Scenario: El juego dice haber ganado un logro

- **WHEN** el mensaje de la partida incluye logros que el juego cree merecer
- **THEN** se ignoran

#### Scenario: Falla la concesión

- **WHEN** algo impide conceder un logro al terminar una partida
- **THEN** la partida, el progreso y la experiencia se guardan igualmente

### Requirement: El catálogo de logros es único y se lee entero

El sistema SHALL guardar el catálogo de logros en **un solo sitio**, y las
pantallas SHALL poder leerlo completo para mostrar también **los que faltan**.

Un logro ya conseguido SHALL conservar el título y la descripción que tenía al
concederse, de modo que renombrar un logro no reescriba lo que un niño ya ganó.
Eso SHALL valer igual cuando lo renombrado no sea el logro sino **el contenido
que le da nombre**: un mundo o un nivel.

El catálogo SHALL premiar únicamente cosas que el juego permita hacer. Con los
cuatro bloques de hoy —avanzar, dos giros y saltar— ningún logro SHALL exigir
bucles, condicionales ni variables.

**El catálogo no se deriva del contenido cada vez que se lee: lo copió al
sembrarse.** Por eso, renombrar un mundo o un nivel NO SHALL actualizar el
catálogo por sí solo, y **ponerlo al día SHALL formar parte del renombrado**. Un
catálogo que nombre contenido que ya no se llama así es un defecto, no un
registro histórico.

La clave de un logro SHALL derivarse del **orden** del mundo y del nivel, nunca
de su nombre, de modo que renombrar contenido NO SHALL invalidar ninguna clave ni
obligar a reconceder nada.

#### Scenario: El niño abre la Sala de Trofeos sin ningún logro

- **WHEN** entra y no ha conseguido ninguno
- **THEN** ve el catálogo entero como pendiente, y no una sala vacía

#### Scenario: Un logro cambia de nombre

- **WHEN** se renombra un logro que alguien ya tenía
- **THEN** quien lo tenía sigue viendo el nombre con el que lo ganó

#### Scenario: Se renombra un mundo que el catálogo nombra

- **WHEN** un mundo cambia de nombre y el catálogo se pone al día en el mismo cambio
- **THEN** quien todavía no tiene ese logro lo ve anunciado con el nombre nuevo
- **AND** quien ya lo ganó lo sigue viendo con el nombre viejo
- **AND** la clave del logro no cambia

### Requirement: El niño se entera en cuanto gana un logro

El sistema SHALL avisar al niño de cada logro conseguido **en la misma partida en
que lo gana**, sin que tenga que ir a buscarlo.

Varios logros conseguidos a la vez SHALL avisarse **de uno en uno**.

El aviso NO SHALL robar el foco ni impedir seguir jugando.

#### Scenario: Tres logros de golpe

- **WHEN** el niño termina su último nivel al 100 y con eso completa el mundo y el juego
- **THEN** ve los tres avisos, uno detrás de otro

#### Scenario: Una partida sin logros

- **WHEN** termina una partida que no consigue ninguno
- **THEN** no aparece ningún aviso
