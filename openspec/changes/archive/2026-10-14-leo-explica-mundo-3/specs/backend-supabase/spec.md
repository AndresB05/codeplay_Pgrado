## ADDED Requirements

### Requirement: El niño anota en su propia fila qué explicaciones de mundo vio

El perfil SHALL guardar qué mundos tienen ya vista su explicación, como una
lista de identificadores de mundo que empieza vacía.

El cliente SHALL poder leer esa lista sólo de su propio perfil, por la misma
política de lectura que ya tiene `profiles`.

El cliente NO SHALL poder escribirla con un `update` sobre `profiles`: SHALL
anotarla con una operación del servidor que sólo alcanza a la fila de quien la
llama, que exige sesión, que rechaza un mundo que no existe y que no duplica un
mundo ya anotado.

#### Scenario: Anotar un mundo

- **WHEN** un niño con sesión anota el mundo 3
- **THEN** su perfil, y sólo el suyo, lista ese mundo como visto

#### Scenario: Anotar dos veces

- **WHEN** anota el mismo mundo una segunda vez
- **THEN** la lista sigue teniéndolo una sola vez

#### Scenario: Sin sesión

- **WHEN** se llama a la operación sin sesión
- **THEN** se rechaza y no cambia ninguna fila

#### Scenario: Mundo inexistente

- **WHEN** se anota un identificador que no es de ningún mundo
- **THEN** se rechaza y la lista no cambia
