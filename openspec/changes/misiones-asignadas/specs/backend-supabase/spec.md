## ADDED Requirements

### Requirement: Esquema de la asignación de misiones

El sistema SHALL guardar en la base de datos la asignación de una misión a un
salón: a qué salón, qué misión, quién la asignó y cuándo.

Una misma misión SHALL poder estar asignada **una sola vez** a un mismo salón: la
unicidad reside en la base de datos, no en la interfaz.

Al borrarse un salón SHALL desaparecer con él sus asignaciones, que no tienen
sentido sin el salón. Lo mismo al borrarse la cuenta de quien asignó.

La clave de la misión SHALL guardarse como **texto sin clave ajena**, porque el
catálogo de misiones vive hoy en el cliente y no existe ninguna tabla a la que
apuntar. Es una decisión provisional tomada a sabiendas y SHALL quedar escrita en
la propia migración, para que quien la lea después no la confunda con un olvido.

NO SHALL existir ninguna tabla que registre el cumplimiento de una misión: qué
reporta el juego y con qué garantía es una decisión previa al paso 20 y no se
toma de paso.

#### Scenario: Un tutor asigna una misión a su salón

- **WHEN** el tutor de un salón asigna una misión
- **THEN** queda guardada la asignación con el salón, la clave de la misión, quién la asignó y el momento

#### Scenario: La misma misión se asigna dos veces al mismo salón

- **WHEN** se intenta asignar al mismo salón una misión que ya tiene asignada
- **THEN** la base de datos no crea una segunda fila

#### Scenario: Se borra un salón con misiones asignadas

- **WHEN** se borra un salón
- **THEN** desaparecen también sus asignaciones de misiones

#### Scenario: Se busca dónde se guarda el cumplimiento

- **WHEN** se revisa el esquema en busca de una tabla de cumplimientos de misiones
- **THEN** no existe ninguna

### Requirement: Las asignaciones de un salón sólo las ve quien pertenece a él

La base de datos SHALL permitir leer las asignaciones de un salón únicamente a su
tutor y a los niños inscritos en ese salón.

SHALL permitir crear y borrar asignaciones únicamente al tutor del salón, y SHALL
registrar como autor de la asignación a quien la escribe.

La clave anónima NO SHALL poder leer ni escribir ninguna asignación, y ese cierre
SHALL retirarse tanto del pseudo-rol `public` como del rol `anon` por separado:
revocar de `public` no retira lo concedido directamente a un rol.

#### Scenario: El niño lee las asignaciones de su salón

- **WHEN** un niño inscrito en un salón consulta sus asignaciones de misiones
- **THEN** obtiene las de su salón

#### Scenario: El niño pide las de otro salón

- **WHEN** un niño consulta las asignaciones de un salón al que no pertenece
- **THEN** obtiene cero filas

#### Scenario: Un tutor escribe en un salón ajeno

- **WHEN** un tutor intenta crear o borrar una asignación en un salón que no es suyo
- **THEN** la base de datos rechaza la escritura

#### Scenario: Un niño intenta asignar

- **WHEN** un niño intenta crear una asignación, incluso en su propio salón
- **THEN** la base de datos rechaza la escritura

#### Scenario: Consulta con la clave anónima

- **WHEN** se consultan las asignaciones con la clave anónima y sin sesión
- **THEN** la respuesta es 401
