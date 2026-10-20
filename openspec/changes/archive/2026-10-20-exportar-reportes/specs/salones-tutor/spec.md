## ADDED Requirements

### Requirement: El tutor exporta el reporte de su salón

Desde el detalle de un ClassGroup que tutela, el tutor SHALL poder descargar el
reporte de **todo el salón** en tres archivos, a su elección:

- el **resumen** en CSV;
- el **detalle por nivel** en CSV;
- el **reporte completo** en PDF, con el resumen y el detalle en un solo
  documento.

El reporte SHALL construirse con el mismo progreso que el tutor ya ve en el
panel, y NO SHALL incluir a nadie que no sea miembro del salón en el momento de
exportar. Cada archivo SHALL llevar en su nombre el ID público del salón y la
fecha de la exportación.

Un salón sin miembros NO SHALL ofrecer la exportación, y SHALL decir por qué.
Si el progreso no se puede leer, el tutor SHALL ver un aviso con palabras y NO
SHALL descargarse un archivo vacío ni a medias.

#### Scenario: El tutor exporta el resumen en CSV

- **WHEN** el tutor, en el detalle de un salón con alumnos, elige exportar el resumen en CSV
- **THEN** se descarga un archivo CSV cuyo nombre lleva el ID público del salón y la fecha de hoy
- **AND** trae una fila por cada miembro del salón

#### Scenario: El tutor exporta el reporte en PDF

- **WHEN** el tutor elige exportar el reporte en PDF
- **THEN** se descarga un único PDF con el nombre del salón, la fecha, el resumen y el detalle por nivel

#### Scenario: Un salón sin exploradores

- **WHEN** el tutor abre el detalle de un salón sin miembros
- **THEN** la exportación no está disponible y se le dice que no hay exploradores que reportar

#### Scenario: Falla la lectura del progreso

- **WHEN** el tutor pide una exportación y el servidor no devuelve el progreso
- **THEN** ve un aviso de que no se pudo generar el reporte
- **AND** no se descarga ningún archivo

#### Scenario: Una solicitud pendiente no entra en el reporte

- **WHEN** el tutor exporta un salón con dos miembros y una JoinRequest pendiente
- **THEN** el reporte trae a los dos miembros y no al niño de la solicitud

### Requirement: El reporte recorre el catálogo y no inventa cifras

El **resumen** SHALL traer, por explorador: su nombre, su XP, su racha, los
niveles superados sobre los niveles del catálogo, los mundos terminados sobre los
mundos del catálogo, su marca media de eficiencia, sus intentos totales y la
**fecha y hora** de su última actividad.

El **detalle** SHALL traer una fila por explorador y por **cada nivel del
catálogo publicado**, con el mundo, el nivel, su estado, su marca, sus intentos,
los menos pasos con los que lo superó y los pasos con los que el nivel se
resuelve.

El estado de cada nivel SHALL ser uno de tres, y SHALL distinguirlos:
«Superado», «Sin superar» —lo empezó y no lo superó— y «Sin empezar» —no tiene
ninguna partida—. Un nivel con progreso que ya no esté publicado SHALL aparecer
igualmente.

Lo que no existe SHALL quedar vacío, y NO SHALL escribirse como cero: la marca
media de quien no ha superado nada, la última actividad de quien no ha jugado,
la marca y los intentos de un nivel sin empezar, y los pasos de una partida que
el servidor no supo contar. La última actividad SHALL ser una fecha absoluta y
no una distancia como «hace 3 horas», porque el archivo se lee días después.

#### Scenario: Un explorador que no ha jugado

- **WHEN** se exporta un salón con un miembro sin ninguna partida
- **THEN** en el resumen aparece con cero niveles superados, sin marca media y sin última actividad
- **AND** en el detalle aparecen todos los niveles del catálogo con el estado «Sin empezar»

#### Scenario: Un nivel empezado y no superado

- **WHEN** un explorador tiene partidas en un nivel y ninguna lo supera
- **THEN** su fila del detalle dice «Sin superar», con sus intentos, y sin menos pasos

#### Scenario: Pasos que el servidor no supo contar

- **WHEN** las partidas superadas de un nivel no tienen pasos contados
- **THEN** la columna de menos pasos queda vacía y no dice cero

#### Scenario: El catálogo manda el número de filas

- **WHEN** se exporta un salón de dos exploradores sobre un catálogo de nueve niveles publicados
- **THEN** el detalle trae dieciocho filas, jueguen lo que jueguen

### Requirement: El CSV se abre bien y no ejecuta nada

El CSV SHALL abrirse en una hoja de cálculo configurada en español con cada dato
en su columna y con las tildes y las eñes intactas.

Todo texto que llegue de un usuario —el nombre de un explorador— y empiece por
un carácter que una hoja de cálculo interprete como fórmula (`=`, `+`, `-`, `@`,
tabulador o retorno de carro) SHALL escribirse de forma que se lea como texto y
NO SHALL evaluarse. Un texto con el separador, comillas o saltos de línea NO
SHALL partir la fila.

#### Scenario: Un nombre con forma de fórmula

- **WHEN** un explorador se llama `=HYPERLINK("http://ejemplo.com")` y el tutor abre el CSV en una hoja de cálculo
- **THEN** la celda muestra ese texto tal cual y no crea ningún enlace

#### Scenario: Un nombre con tilde, comillas y punto y coma

- **WHEN** un explorador se llama `José "Pepe"; Núñez`
- **THEN** su nombre ocupa una sola celda y se lee exactamente así
