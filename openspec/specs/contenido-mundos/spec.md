# contenido-mundos Specification

## Purpose

Presentar al niño el contenido educativo organizado en mundos y niveles, junto
con el progreso conseguido en cada uno.

Mientras no haya base de datos conectada, estas pantallas se alimentan de datos
de ejemplo mediante un repliegue explícito.

## Requirements

### Requirement: Origen de datos con repliegue local

El sistema SHALL intentar leer los mundos del backend, y SHALL replegarse a los
datos de ejemplo locales cuando la lectura no devuelve ningún mundo, de modo que
la pantalla siempre tenga contenido que mostrar.

#### Scenario: El backend devuelve mundos

- **WHEN** la consulta de mundos devuelve al menos un resultado
- **THEN** se muestran los mundos del backend

#### Scenario: El backend no devuelve nada

- **WHEN** la consulta falla o devuelve una lista vacía
- **THEN** se muestran los mundos de ejemplo locales
- **AND** no se muestra un error al niño

### Requirement: Filtrado del catálogo de mundos

El sistema SHALL permitir filtrar los mundos por dificultad, por temática y por
categoría.

#### Scenario: El niño filtra por dificultad

- **WHEN** selecciona una dificultad concreta
- **THEN** se listan sólo los mundos de esa dificultad

### Requirement: Progreso por mundo

El sistema SHALL mostrar en cada mundo cuántos de sus niveles ha completado el
niño sobre el total.

#### Scenario: El niño ha completado parte de un mundo

- **WHEN** se calcula el progreso de un mundo
- **THEN** se cuentan los niveles del mundo que figuran completados para ese usuario
- **AND** se muestran como una fracción sobre el total de niveles del mundo

### Requirement: Progresión bloqueada por niveles

El sistema SHALL presentar los niveles de un mundo en orden y SHALL distinguir
visualmente los que todavía no están disponibles.

#### Scenario: Un nivel aún no está disponible

- **WHEN** el nivel está bloqueado
- **THEN** se muestra en estado bloqueado y no permite entrar

### Requirement: Sala de trofeos

El sistema SHALL mostrar al niño los logros existentes, distinguiendo los
conseguidos de los que aún no.

#### Scenario: El niño abre la sala de trofeos

- **WHEN** se cargan los logros
- **THEN** se listan diferenciando los obtenidos de los pendientes
