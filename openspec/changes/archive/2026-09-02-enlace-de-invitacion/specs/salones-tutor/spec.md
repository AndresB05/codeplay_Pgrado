## ADDED Requirements

### Requirement: Enlace de invitación canjeable

El sistema SHALL permitir al tutor generar, desde la pantalla de su salón, un
**enlace de invitación** que mete en ese salón a quien lo abra, sin pasar por la
bandeja de solicitudes.

El enlace NO SHALL crear una solicitud que el tutor tenga que aprobar después: el
tutor ya consintió al generarlo, y pedirle que apruebe otra vez sería aprobar dos
veces lo mismo. Ésa es la diferencia con el ID público, que sigue existiendo y
sigue pasando por la bandeja.

El sistema SHALL entregarle el enlace al tutor de forma que pueda compartirlo por
el medio que él elija. El sistema NO SHALL enviarlo: mientras no exista el envío
real, la plataforma no manda ningún correo y NO SHALL insinuar que lo hace.

Cada enlace SHALL servir **una sola vez**. Un enlace ya canjeado o ya caducado
NO SHALL volver a meter a nadie: eso lo comprueba el servidor al canjear, y es
una propiedad del sistema.

El sistema SHALL generar los enlaces con **14 días** de caducidad. Ese plazo,
**a diferencia de lo anterior, NO lo garantiza el esquema**: lo sostienen el
valor por defecto de la columna y que el cliente no envíe ese campo. Nada acota
la fecha —la tabla no tiene ningún `check` sobre ella y la política de inserción
sólo comprueba quién invita y de quién es el salón—, así que **quien pueda
insertar puede fijar la fecha que quiera, incluida una que no llegue nunca**.
Hoy sólo puede insertar el tutor del salón, y sólo en el suyo, así que el daño
se lo hace a sí mismo; pero **ningún requisito puede prometer los 14 días como
propiedad del sistema**, porque sería afirmar algo falso.

Un enlace con la fecha puesta lejos NO caduca y NO lo alcanza la purga, que se
apoya en esa misma fecha: deja de ser un enlace de catorce días y pasa a ser uno
que, si se filtra, no deja de servir. Ponerle una barrera es trabajo aparte —
haría falta acotar la columna en el esquema— y no entra en este cambio.

El tutor SHALL poder retirar un enlace que todavía no se ha usado, y retirarlo
SHALL bastar para que deje de funcionar.

Generar un enlace NO SHALL pedir ni almacenar la dirección de correo de nadie.

#### Scenario: El tutor genera un enlace

- **WHEN** el tutor pulsa generar un enlace en la pantalla de su salón
- **THEN** el sistema le entrega un enlace listo para compartir
- **AND** no se le pide ninguna dirección de correo

#### Scenario: El enlace mete al niño sin pasar por la bandeja

- **WHEN** un `child` sin salón abre un enlace válido y lo canjea
- **THEN** queda inscrito en el salón inmediatamente
- **AND** no aparece ninguna solicitud suya en la bandeja del tutor

#### Scenario: El mismo enlace se abre dos veces

- **WHEN** alguien abre un enlace que ya canjeó otra persona
- **THEN** se le dice que ese enlace ya se usó y no queda inscrito

#### Scenario: Un enlace caducado

- **WHEN** alguien abre un enlace generado hace más de 14 días
- **THEN** se le dice que caducó y no queda inscrito

#### Scenario: El tutor retira un enlace sin usar

- **WHEN** el tutor retira un enlace que nadie ha canjeado y después alguien lo abre
- **THEN** el enlace ya no vale y quien lo abre no queda inscrito

#### Scenario: El salón está lleno cuando se canjea

- **WHEN** alguien canjea un enlace de un salón que ya alcanzó su cupo
- **THEN** no queda inscrito y se le dice que el salón está lleno
- **AND** el enlace sigue sin usarse, para que valga cuando haya un cupo libre

### Requirement: La lista de enlaces distingue tres estados

El sistema SHALL mostrar al tutor los enlaces de su salón indicando en cuál de
**tres** situaciones está cada uno: activo, usado o caducado.

El estado mostrado NO SHALL deducirse de una única condición con dos salidas: un
enlace que no está usado puede estar caducado, y presentarlo como activo le diría
al tutor que puede compartir algo que no va a funcionar.

La caducidad SHALL calcularse comparando la fecha de caducidad con el momento
actual, y NO SHALL depender de que algo haya marcado el enlace como caducado.

#### Scenario: Un enlace recién generado

- **WHEN** el tutor mira un enlace generado hoy y todavía sin usar
- **THEN** se muestra como activo, con su fecha de caducidad

#### Scenario: Un enlace ya canjeado

- **WHEN** el tutor mira un enlace que alguien canjeó
- **THEN** se muestra como usado

#### Scenario: Un enlace sin usar y pasado de fecha

- **WHEN** el tutor mira un enlace sin canjear cuya fecha de caducidad ya pasó
- **THEN** se muestra como caducado, y NO como activo ni como usado

### Requirement: Las invitaciones caducadas no se conservan

El sistema SHALL borrar las invitaciones caducadas de los salones del tutor
cuando éste consulta sus enlaces, sin pedirle que lo haga ni avisarle de ello.

Una invitación caducada no sirve para nada: su enlace ya no vale, y conservarla
sólo alarga una lista que el tutor tiene que leer. El plazo de conservación de la
plataforma dice que estas filas viven 14 días, y esa promesa SHALL cumplirla algo
que se ejecute, no una columna que nadie evalúa.

El criterio SHALL ser **la fecha, y sólo la fecha**: se borra toda invitación
pasada de plazo, la haya canjeado alguien o no. El plazo dice que estas filas
viven 14 días, no que vivan 14 días si nadie las usó, y salvar las canjeadas las
dejaría guardadas para siempre. Mientras el plazo dure, un enlace usado SHALL
seguir viéndose como usado, que es cuando esa información le sirve al tutor.

Este borrado NO SHALL ser lo que impide canjear un enlace caducado: la caducidad
se comprueba al canjear, así que un enlace vencido que todavía no se haya borrado
tampoco mete a nadie.

Y **la purga alcanza sólo a lo que la fecha declara vencido**. Una invitación
insertada con una caducidad lejana no la alcanza nunca, porque el criterio es esa
misma fecha. Es el mismo hueco de arriba visto desde el otro lado, y merece
decirse aquí porque el motivo de traer la purga «desde el primer día» era no
repetir lo de `invitaciones-sin-correo`: filas que nada borra nunca.

#### Scenario: El tutor abre la pantalla de su salón

- **WHEN** el tutor consulta los enlaces de un salón que tiene invitaciones caducadas
- **THEN** esas invitaciones dejan de existir y no aparecen en la lista

#### Scenario: Un enlace usado que ya pasó de plazo

- **WHEN** el tutor consulta los enlaces y uno canjeado hace más de 14 días sigue guardado
- **THEN** también se borra, porque el plazo se cuenta por la fecha y no por si se usó

#### Scenario: Un enlace caducado que aún no se ha borrado

- **WHEN** alguien canjea un enlace vencido antes de que nadie lo haya borrado
- **THEN** el canje se rechaza igualmente por la fecha de caducidad

## MODIFIED Requirements

### Requirement: El tutor suma alumnos compartiendo el ID público

El sistema SHALL ofrecer al tutor, en su pantalla de salón, la vía por la que un
niño entra **por su cuenta**: **compartirle el ID público del salón** para que lo
busque y solicite ingreso, que el tutor acepta desde su bandeja de solicitudes.

Ésa SHALL seguir siendo la vía para sumar a muchos a la vez, porque el mismo ID
público sirve para todo un curso. El enlace de invitación, que entra sin pasar
por la bandeja, es la vía para uno.

El sistema NO SHALL pedir ni almacenar la dirección de correo de un tercero
mientras no exista el envío real, porque esa dirección pertenece a alguien que no
tiene cuenta, no ha autorizado nada y puede ser un menor.

El sistema NO SHALL ofrecer un formulario que prometa un envío que no se produce.

#### Scenario: El tutor quiere sumar un alumno

- **WHEN** el tutor abre la sección para sumar alumnos a su salón
- **THEN** se le indica el ID público del salón y que el niño puede buscarlo y solicitar ingreso
- **AND** se le ofrece además generar un enlace que mete al niño directamente
- **AND** no se le pide ninguna dirección de correo

#### Scenario: No queda rastro de terceros

- **WHEN** el tutor usa esa sección, por cualquiera de las dos vías
- **THEN** no se almacena ninguna dirección de correo de nadie

#### Scenario: La solicitud llega por el camino que existe

- **WHEN** el niño busca el salón por su ID público y solicita entrar
- **THEN** la solicitud aparece en la bandeja del tutor, que puede aceptarla o rechazarla
