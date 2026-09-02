## ADDED Requirements

### Requirement: La base emite en vivo los cambios de las tablas publicadas

La base SHALL publicar los cambios de `join_requests`, `class_memberships` y
`mission_assignments`, de modo que una sesión abierta reciba aviso de que algo
cambió sin volver a preguntar.

Una publicación sin tablas NO emite ningún evento, así que publicar cada tabla es
la condición para que exista la sincronización en vivo. La publicación
`supabase_realtime` **ya existe y ya tiene activadas las cuatro operaciones**
(`insert`, `update`, `delete` y `truncate`): el sistema NO SHALL crearla de nuevo
ni alterar qué operaciones emite.

Añadir una tabla a la publicación SHALL ser idempotente: aplicar la migración dos
veces no SHALL fallar.

Publicar una tabla NO SHALL ampliar **lo que una sesión puede leer**: quién ve
qué contenido lo sigue decidiendo la seguridad a nivel de fila, igual que en una
consulta normal.

Lo que sí amplía es **saber que algo cambió**. Una sesión no autorizada SHALL
poder recibir el aviso de que hubo un cambio en una tabla publicada, **sin una
sola columna dentro**. Eso es lo que la publicación concede y no se puede
retirar sin dejar de publicar: la existencia del cambio, nunca su contenido.

#### Scenario: Una tabla publicada cambia

- **WHEN** se inserta, actualiza o borra una fila de una de las tres tablas publicadas
- **THEN** la base emite el cambio a los suscriptores autorizados

#### Scenario: Una tabla que no se publicó

- **WHEN** cambia una fila de una tabla que no está en la publicación
- **THEN** no se emite ningún cambio

#### Scenario: La migración se aplica dos veces

- **WHEN** se vuelve a aplicar la migración que publica las tablas
- **THEN** termina sin error y la publicación queda igual

#### Scenario: Una sesión sin autenticar escucha

- **WHEN** alguien se suscribe con la clave anónima y cambia una fila de una de las tres tablas
- **THEN** recibe el aviso del cambio **sin ninguna columna**, marcado como no autorizado
- **AND** no obtiene ningún dato de la fila: ni el salón, ni el alumno, ni la misión

#### Scenario: Una sesión escucha cambios que no le corresponden

- **WHEN** un `tutor` está suscrito y cambia una fila de un salón de otro `tutor`
- **THEN** no recibe ese cambio, porque la política de lectura no le da acceso a esa fila

### Requirement: Un borrado emitido no distingue quién tenía acceso a la fila

Un `delete` emitido por la publicación NO SHALL considerarse filtrado por la
seguridad a nivel de fila: la fila ya no existe cuando se evalúa quién puede
verla, así que **la base entrega el borrado a todos los suscriptores de esa
tabla**. Lo entregado SHALL ser, como máximo, la clave primaria de la fila —una
sesión autenticada ajena recibe ese identificador; una sin autenticar no recibe
ni eso—, y nunca ninguna otra columna.

El sistema SHALL asumir esa entrega y NO SHALL derivar de un borrado recibido
ninguna afirmación sobre datos ajenos: lo único que un borrado autoriza a hacer
es volver a consultar, y esa consulta sí pasa por la seguridad a nivel de fila.

Elevar la identidad de réplica de las tablas publicadas NO SHALL usarse para
corregirlo: haría viajar la fila entera en vez de un identificador, que es más
filtración y no menos.

#### Scenario: Se borra una fila de un salón ajeno

- **WHEN** se borra una pertenencia, una solicitud o una asignación de un salón que la sesión suscrita no puede leer
- **THEN** la sesión recibe el aviso de borrado con el identificador de la fila y nada más
- **AND** al volver a consultar no obtiene ningún dato de ese salón

#### Scenario: El borrado que llega a quien no tiene sesión

- **WHEN** alguien con la clave anónima escucha las tres tablas mientras se borra una fila
- **THEN** recibe el aviso vacío, **sin siquiera la clave primaria**
