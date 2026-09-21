## MODIFIED Requirements

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
