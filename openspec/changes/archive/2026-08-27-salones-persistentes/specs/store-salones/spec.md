## MODIFIED Requirements

### Requirement: Punto de acceso único a los salones

El sistema SHALL exponer los salones y las acciones que los modifican a través
de un único contexto. Ningún componente SHALL leer ni escribir directamente el
origen de esos datos, sea el almacenamiento del navegador o la base de datos.

#### Scenario: Una vista necesita los salones

- **WHEN** un componente necesita leer salones o ejecutar una acción sobre ellos
- **THEN** los obtiene del contexto de salones y no del origen de los datos

#### Scenario: Se sustituye el origen de los datos

- **WHEN** el estado local se reemplaza por consultas a un backend
- **THEN** ninguna vista requiere modificación salvo por la espera que introduce la consulta

### Requirement: Mutaciones estables bajo StrictMode

El sistema SHALL calcular fuera de los actualizadores de estado cualquier valor
que no deba variar entre invocaciones, y SHALL enviar una sola escritura por
acción del usuario, porque React ejecuta esos actualizadores dos veces en
StrictMode.

#### Scenario: Se crea un salón en desarrollo

- **WHEN** React invoca dos veces el actualizador de estado
- **THEN** se registra un único salón y no dos

#### Scenario: El niño solicita entrar a un salón

- **WHEN** React invoca dos veces el actualizador de estado
- **THEN** se registra una única solicitud de ingreso

## ADDED Requirements

### Requirement: Los salones son los de la sesión autenticada

El sistema SHALL identificar al niño y al tutor por el usuario autenticado de la
sesión, y NO SHALL usar ninguna identidad fija de relleno. Sin sesión el
contexto SHALL quedar vacío, sin salones y sin pertenencia, en lugar de mostrar
datos de ejemplo.

#### Scenario: Entra un tutor

- **WHEN** el tutor de la sesión abre sus salones
- **THEN** ve únicamente los salones que él creó

#### Scenario: Entra un niño

- **WHEN** el niño de la sesión abre el módulo de salón
- **THEN** su situación es la que consta en la base de datos para su propio usuario

#### Scenario: No hay sesión

- **WHEN** no hay usuario autenticado
- **THEN** el contexto no expone ningún salón ni ninguna pertenencia

### Requirement: La espera se declara y el error se muestra

El sistema SHALL exponer si los salones se están cargando, para que ninguna
vista tome un estado a medio cargar por un estado vacío.

Cuando una acción sobre salones falle, el sistema SHALL **mostrar el motivo en
la pantalla desde la que se intentó**. No basta con dejarlo disponible en el
estado: un error que ninguna vista pinta es, para quien pulsó el botón,
indistinguible de un botón roto.

El mensaje SHALL desaparecer en cuanto una acción posterior tenga éxito.

#### Scenario: Todavía no han llegado los datos

- **WHEN** la consulta de salones sigue en curso
- **THEN** se declara la carga en progreso
- **AND** la vista no afirma que el salón no existe

#### Scenario: Una escritura falla

- **WHEN** el tutor o el niño ejecuta una acción sobre salones y la base la rechaza
- **THEN** la pantalla desde la que se intentó muestra el motivo del rechazo
- **AND** el estado no cambia

#### Scenario: La pantalla iba por detrás de la base

- **WHEN** el tutor acepta una solicitud de un salón que entretanto se llenó
- **THEN** se muestra que el salón está lleno
- **AND** la solicitud sigue pendiente

#### Scenario: La acción siguiente sale bien

- **WHEN** una acción termina con éxito después de una fallida
- **THEN** el mensaje de error deja de mostrarse

### Requirement: El store comprueba la pertenencia antes de pedir entrar

El sistema SHALL rechazar en el store una solicitud de ingreso cuando el niño ya
pertenece a un salón o ya tiene una solicitud pendiente, sin depender de que la
vista impida llegar hasta ahí.

#### Scenario: El niño ya está inscrito

- **WHEN** se invoca la acción de solicitar ingreso estando inscrito en un salón
- **THEN** no se crea ninguna solicitud
- **AND** la pertenencia al salón actual no cambia

#### Scenario: El niño ya tiene una solicitud pendiente

- **WHEN** se invoca la acción de solicitar ingreso con una solicitud sin resolver
- **THEN** no se crea una segunda solicitud

### Requirement: La situación del niño se deduce de su última solicitud

Como un mismo niño puede acumular varias solicitudes sobre el mismo salón —una
rechazada y otra nueva—, el sistema SHALL determinar su situación a partir de la
solicitud más reciente por fecha, y NO SHALL asumir que existe una sola.

#### Scenario: El niño vuelve a pedir entrar tras un rechazo

- **WHEN** el niño tiene una solicitud rechazada y otra posterior sin resolver
- **THEN** su situación es «en espera» según la más reciente
- **AND** la lectura no falla por encontrar más de una fila

## REMOVED Requirements

### Requirement: Persistencia versionada

**Reason**: Los salones dejan de guardarse en el navegador; la persistencia pasa
a ser la de la base de datos, que no lleva versión de formato en el cliente.

**Migration**: Ninguna. La base de datos está vacía de salones, así que no hay
inventario local que trasladar. La clave `codeplay:classrooms` deja de
escribirse; la que quede de una sesión anterior es inerte y puede borrarse.

### Requirement: Resiembra ante estado inservible

**Reason**: No hay estado local que pueda corromperse, y ya no existen datos de
ejemplo que sembrar: un usuario sin salones ve el listado vacío, que es su
situación real.

**Migration**: Ninguna.
