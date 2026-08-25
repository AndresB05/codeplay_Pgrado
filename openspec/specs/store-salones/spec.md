# store-salones Specification

## Purpose

Sostener el módulo de salones sin backend, de forma que lo que hace el niño siga
ahí al entrar como tutor y al recargar la página. Es una capa deliberadamente
aislada: se diseñó para poder sustituirla por consultas a Supabase sin tocar
ninguna vista.

## Requirements

### Requirement: Punto de acceso único a los salones

El sistema SHALL exponer los salones y las acciones que los modifican a través
de un único contexto. Ningún componente SHALL leer ni escribir el
almacenamiento del navegador directamente.

#### Scenario: Una vista necesita los salones

- **WHEN** un componente necesita leer salones o ejecutar una acción sobre ellos
- **THEN** los obtiene del contexto de salones y no del almacenamiento

#### Scenario: Se sustituye el origen de los datos

- **WHEN** el estado local se reemplaza por consultas a un backend
- **THEN** la interfaz del contexto no cambia y ninguna vista requiere modificación

### Requirement: Persistencia versionada

El sistema SHALL guardar los salones y la pertenencia del alumno junto a un
número de versión del formato.

#### Scenario: Se recarga la página

- **WHEN** existe estado guardado con la versión esperada
- **THEN** se restauran los salones y la pertenencia tal como estaban

### Requirement: Resiembra ante estado inservible

El sistema SHALL descartar el estado guardado y volver a sembrar los datos de
ejemplo cuando el formato no coincide o el contenido no se puede interpretar, en
lugar de arrancar con datos corruptos.

#### Scenario: La versión guardada no coincide

- **WHEN** el estado almacenado declara una versión distinta de la esperada
- **THEN** se descarta y se siembran los salones de ejemplo

#### Scenario: El contenido está corrupto

- **WHEN** el estado almacenado no se puede interpretar o no contiene una lista de salones
- **THEN** se descarta sin propagar el error y se siembran los salones de ejemplo

### Requirement: Mutaciones estables bajo StrictMode

El sistema SHALL calcular fuera de los actualizadores de estado cualquier valor
que no deba variar entre invocaciones, como identificadores y marcas de tiempo,
porque React ejecuta esos actualizadores dos veces en StrictMode.

#### Scenario: Se crea un salón en desarrollo

- **WHEN** React invoca dos veces el actualizador de estado
- **THEN** el salón creado conserva un único identificador y una única marca de tiempo
