## ADDED Requirements

### Requirement: El progreso de un salón se lee por vista

El progreso de un alumno SHALL seguir siendo ilegible para cualquier otra
persona a través de sus tablas: las políticas de `user_progress` y
`level_attempts` NO SHALL ampliarse para que el tutor alcance las filas de sus
alumnos.

Esa lectura SHALL concederse mediante vistas de sólo lectura que lleven dentro
el filtro de a quién alcanzan: **el tutor del salón al que el alumno pertenece, o
el propio alumno**, y nadie más. Las vistas SHALL quedar revocadas para el rol
anónimo y concedidas al rol autenticado, como las de la migración `0015`.

Cada fila de progreso SHALL poder situarse en su nivel y en su mundo, para que
quien consulta no tenga que cruzarla por su cuenta.

#### Scenario: El tutor consulta el progreso de su salón

- **WHEN** el tutor de un salón consulta las vistas de progreso
- **THEN** obtiene las filas de los alumnos de ese salón

#### Scenario: Un tutor sin relación con el alumno

- **WHEN** un tutor que no tutela a un alumno consulta su progreso por las vistas
- **THEN** no obtiene ninguna fila suya

#### Scenario: Un niño consulta el progreso de un compañero

- **WHEN** un niño consulta las vistas
- **THEN** obtiene las suyas, y no las de ningún compañero de salón

#### Scenario: Una consulta sin sesión

- **WHEN** se consultan esas vistas con la clave anónima
- **THEN** la operación se rechaza por falta de permiso

#### Scenario: Las políticas de las tablas no cambian

- **WHEN** un alumno consulta `user_progress` o `level_attempts` directamente
- **THEN** sigue viendo únicamente sus propias filas

### Requirement: Los pasos de un intento los cuenta el servidor

El número de pasos que se informa de un intento SHALL calcularlo el servidor
leyendo el programa enviado, con la misma función que puntúa la partida, y NO
SHALL leerse de los metadatos que acompañan al intento.

El motivo es que esos metadatos los escribe el cliente. Coinciden hoy con lo que
cuenta el servidor —está medido—, pero coincidir no es lo mismo que ser la
fuente: informar de un número que manda quien juega convierte el informe del
tutor en algo que el niño puede escribir.

Un programa que el servidor no sepa leer SHALL informarse **sin** número de
pasos, nunca con un cero: un cero diría que se resolvió sin hacer nada.

#### Scenario: Un intento cuyo programa el servidor sabe leer

- **WHEN** se consulta un intento con un programa válido
- **THEN** los pasos informados son los que cuenta el servidor

#### Scenario: Un intento con un programa ilegible

- **WHEN** el servidor no puede contar los pasos de un programa
- **THEN** ese intento se informa sin número de pasos
