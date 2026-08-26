# backend-supabase Specification

## Purpose

Definir el esquema de datos de CodePlay, sus políticas de seguridad y las
operaciones de escritura permitidas al cliente.

El esquema vive como migraciones versionadas y **está aplicado** a un proyecto de
Supabase enlazado: las tablas, las funciones RPC, las políticas de RLS y el
contenido inicial de mundos y niveles existen en la base real, y desde la
migración 0013 también las cuatro tablas del módulo de salones. Los requisitos
describen un sistema en funcionamiento.

Lo que todavía no cubre: `achievements` registra los logros concedidos pero no
existe el catálogo que enumere los posibles.

Las políticas de salones están escritas y aplicadas, pero **verificadas sólo
hasta donde llega una clave anónima**: se sabe que las tablas existen y que nadie
sin sesión las lee. Nada de lo que depende del rol o de la pertenencia se ha
observado todavía; hace falta un tutor y un niño reales.

## Requirements

### Requirement: Esquema reproducible desde cero

El sistema SHALL describir la base de datos como migraciones SQL numeradas y
ordenadas, de modo que cualquiera pueda recrear el esquema completo y su
contenido inicial sin pasos manuales.

#### Scenario: Se recrea la base local

- **WHEN** se ejecuta el reinicio de la base de datos con la CLI de Supabase
- **THEN** se aplican todas las migraciones en orden y después el contenido inicial de mundos y niveles

### Requirement: Escrituras encapsuladas en funciones seguras

El sistema SHALL canalizar las escrituras principales del cliente a través de
funciones RPC, en lugar de permitir escritura directa sobre las tablas, para
reducir la manipulación desde el navegador.

#### Scenario: El cliente actualiza su perfil

- **WHEN** se modifica el perfil propio
- **THEN** la operación pasa por la función `update_my_profile`

#### Scenario: El cliente registra progreso o un intento de nivel

- **WHEN** se guarda progreso o el intento de resolver un nivel
- **THEN** la operación pasa por `upsert_my_progress` o `create_level_attempt`

### Requirement: Perfil creado automáticamente al registrarse

El sistema SHALL crear la fila de perfil correspondiente en cuanto se da de alta
un usuario, sin requerir una segunda llamada desde el cliente. El perfil creado
SHALL recoger los datos declarados en el registro, incluido el rol.

#### Scenario: Alta de un usuario nuevo

- **WHEN** se crea el usuario en la capa de autenticación
- **THEN** un disparador crea su perfil asociado

#### Scenario: Alta de un usuario que declara su rol

- **WHEN** se crea el usuario indicando el rol `tutor` en los datos del registro
- **THEN** su perfil queda con el rol `tutor` sin ninguna llamada adicional desde el cliente

### Requirement: Rol almacenado en el perfil

El sistema SHALL guardar en el perfil el rol con el que se registró la persona,
con los valores `child` o `tutor` y `child` por defecto. El rol SHALL residir en
la base de datos y no únicamente en la sesión del navegador, de modo que las
decisiones que dependen de él puedan verificarse en el servidor.

#### Scenario: Se consulta el perfil propio

- **WHEN** una persona autenticada lee su perfil
- **THEN** obtiene su rol junto al resto de campos del perfil

#### Scenario: Un perfil se crea sin rol declarado

- **WHEN** se da de alta un usuario sin indicar rol
- **THEN** su perfil queda con el rol `child`

#### Scenario: Se intenta guardar un rol desconocido

- **WHEN** se intenta escribir en el perfil un rol distinto de `child` o `tutor`
- **THEN** la base de datos rechaza la escritura

### Requirement: Logros de sólo lectura para el cliente

El sistema SHALL exponer los logros como datos de sólo lectura para el cliente
autenticado. La concesión de un logro NO SHALL poder originarse en el navegador.

#### Scenario: El cliente intenta escribir un logro

- **WHEN** se intenta insertar o modificar un logro desde el cliente
- **THEN** la operación se rechaza

### Requirement: Ranking semanal con campos acotados

El sistema SHALL exponer el ranking semanal como una vista que publica
únicamente los campos necesarios para ordenar la clasificación.

#### Scenario: Se consulta la clasificación

- **WHEN** el cliente lee el ranking semanal
- **THEN** obtiene sólo los campos previstos para ranking, sin datos sensibles del perfil

### Requirement: Seguridad a nivel de fila activa

El sistema SHALL mantener la seguridad a nivel de fila habilitada en las tablas
con datos de usuario, con políticas explícitas para cada operación permitida.

#### Scenario: Un usuario consulta datos de otro

- **WHEN** se intenta leer o escribir filas que pertenecen a otro usuario
- **THEN** la política deniega la operación

### Requirement: Tipos generados, nunca escritos a mano

Los tipos TypeScript que describen la base de datos SHALL generarse con la
herramienta de Supabase a partir del esquema real, y NO SHALL editarse
manualmente.

#### Scenario: El esquema cambia

- **WHEN** se añade, elimina o renombra una columna
- **THEN** los tipos se regeneran con la CLI en lugar de ajustarse a mano

### Requirement: Esquema del módulo de salones

El sistema SHALL guardar en la base de datos los salones y todo lo que cuelga de
ellos: el salón con su tutor, su ID público, su grado y su cupo; la pertenencia
de un niño a un salón; las solicitudes de ingreso con su estado; y las
invitaciones por correo con su token y su caducidad.

El ID público SHALL ser único entre todos los salones, porque es lo que el niño
teclea en el buscador para encontrar uno concreto.

Al borrarse un salón, SHALL desaparecer con él su pertenencia, sus solicitudes y
sus invitaciones: ninguna de esas filas tiene sentido sin el salón.

#### Scenario: Se crea un salón

- **WHEN** un tutor crea un salón
- **THEN** el salón queda guardado con su tutor, su nombre, su grado, su cupo y un ID público único

#### Scenario: Dos salones intentan el mismo ID público

- **WHEN** se intenta crear un salón con un ID público que ya usa otro
- **THEN** la base de datos rechaza la escritura

#### Scenario: Se borra un salón con alumnos y solicitudes

- **WHEN** se borra un salón
- **THEN** desaparecen también sus pertenencias, sus solicitudes y sus invitaciones

### Requirement: Un alumno pertenece como máximo a un salón

La base de datos SHALL impedir que un mismo niño pertenezca a dos salones a la
vez, y SHALL impedir que tenga dos solicitudes pendientes al mismo tiempo. Un
niño que ya pertenece a un salón NO SHALL poder crear una solicitud para otro.

El invariante SHALL residir en la base de datos y no únicamente en la navegación
de la interfaz, de modo que se sostenga aunque la escritura llegue por otro
camino.

#### Scenario: Un niño que ya es miembro pide entrar a otro salón

- **WHEN** un niño con pertenencia activa intenta solicitar ingreso a un salón distinto
- **THEN** la base de datos rechaza la solicitud

#### Scenario: Un niño envía dos solicitudes

- **WHEN** un niño con una solicitud pendiente intenta enviar otra
- **THEN** la base de datos rechaza la segunda

#### Scenario: Un niño sale de su salón y pide entrar a otro

- **WHEN** un niño abandona su salón y después solicita ingreso a otro
- **THEN** la solicitud se acepta, porque ya no tiene pertenencia activa

### Requirement: El ingreso a un salón pasa siempre por una solicitud aceptada

El sistema SHALL crear la pertenencia de un niño a un salón únicamente al
aceptarse una solicitud suya pendiente. Un tutor NO SHALL poder inscribir a un
niño que no ha pedido entrar, y un niño NO SHALL poder inscribirse a sí mismo.

Aceptar una solicitud SHALL registrar la pertenencia y marcar la solicitud como
aceptada en una sola operación indivisible: no SHALL quedar un estado en el que
el niño es miembro y su solicitud sigue pendiente, ni al revés.

Sólo el tutor del salón SHALL poder aceptar o rechazar sus solicitudes.

#### Scenario: El tutor acepta una solicitud

- **WHEN** el tutor de un salón acepta una solicitud pendiente de ese salón
- **THEN** el niño queda inscrito y la solicitud queda marcada como aceptada

#### Scenario: Un tutor intenta inscribir a un niño sin solicitud

- **WHEN** se intenta crear una pertenencia sin una solicitud pendiente que la respalde
- **THEN** la operación se rechaza

#### Scenario: Alguien que no es el tutor intenta aceptar

- **WHEN** una persona que no es el tutor del salón intenta aceptar una solicitud suya
- **THEN** la operación se rechaza

#### Scenario: El tutor rechaza una solicitud

- **WHEN** el tutor rechaza una solicitud pendiente
- **THEN** la solicitud queda marcada como rechazada y el niño no queda inscrito

#### Scenario: El tutor intenta marcar una solicitud como aceptada sin pasar por la aceptación

- **WHEN** el tutor intenta escribir directamente el estado `accepted` sobre una solicitud
- **THEN** la operación se rechaza, porque saltarse la aceptación dejaría la solicitud aceptada y al niño sin pertenencia

### Requirement: Una solicitud resuelta es inmutable, y volver a pedir entrar es una solicitud nueva

El sistema SHALL conservar las solicitudes ya resueltas —aceptadas o
rechazadas— y NO SHALL permitir al niño borrarlas ni modificarlas. El niño SHALL
poder cancelar únicamente una solicitud suya que siga pendiente.

Un niño con una solicitud rechazada SHALL poder volver a solicitar ingreso al
mismo salón, y esa petición SHALL registrarse como una solicitud nueva sin
borrar ni alterar el rechazo anterior. Lo mismo SHALL valer para un niño que
abandonó un salón y quiere volver a él.

#### Scenario: Un niño cancela su solicitud pendiente

- **WHEN** un niño con una solicitud pendiente la cancela
- **THEN** la solicitud desaparece y el niño puede solicitar ingreso a cualquier salón

#### Scenario: Un niño intenta borrar su rechazo

- **WHEN** un niño intenta borrar o modificar una solicitud suya ya rechazada
- **THEN** la operación se rechaza

#### Scenario: Un niño rechazado vuelve a pedir entrar al mismo salón

- **WHEN** un niño cuya solicitud fue rechazada solicita de nuevo el ingreso a ese mismo salón
- **THEN** queda registrada una solicitud pendiente nueva y el rechazo anterior sigue guardado

#### Scenario: Un niño vuelve al salón que abandonó

- **WHEN** un niño que se dio de baja de un salón solicita entrar otra vez a ese mismo salón
- **THEN** la solicitud se registra como pendiente

### Requirement: El cupo del salón se respeta al aceptar

El sistema SHALL rechazar la aceptación de una solicitud cuando el salón ya
tiene tantos alumnos como su cupo. La comprobación SHALL hacerla la base de
datos al aceptar, no la interfaz antes de pedirlo.

#### Scenario: Se acepta una solicitud en un salón lleno

- **WHEN** el tutor acepta una solicitud y el salón ya alcanzó su cupo
- **THEN** la operación se rechaza y el niño no queda inscrito

### Requirement: Fecha de ingreso registrada

El sistema SHALL guardar en la pertenencia el momento en que el niño entró al
salón.

Este requisito NO decide qué parte del historial del niño ve su tutor: sólo
garantiza que el dato existe para poder decidirlo más adelante sin inventarlo.

#### Scenario: Un niño entra a un salón

- **WHEN** se acepta la solicitud de un niño
- **THEN** su pertenencia queda con la fecha y hora del ingreso

### Requirement: Acceso a los datos de un salón acotado por pertenencia

El sistema SHALL limitar la lectura y la escritura de los datos de salones a
quien le corresponden:

- El tutor SHALL poder leer y administrar únicamente los salones que él creó,
  con sus pertenencias, sus solicitudes y sus invitaciones.
- El niño SHALL poder leer únicamente su propia pertenencia y sus propias
  solicitudes, y SHALL poder cancelar su solicitud y abandonar su salón.
- Las invitaciones por correo SHALL ser visibles únicamente para el tutor del
  salón que las envió.
- El catálogo de salones —nombre, grado, profesor, ID público y cupo— SHALL ser
  legible por cualquier persona autenticada, porque el buscador del niño
  necesita encontrar un salón antes de pertenecer a él.

#### Scenario: Un tutor consulta los salones de otro

- **WHEN** un tutor intenta leer las pertenencias, solicitudes o invitaciones de un salón que no creó
- **THEN** no obtiene ninguna fila

#### Scenario: Un niño busca un salón por su ID público

- **WHEN** un niño autenticado busca un salón que no es el suyo
- **THEN** obtiene sus datos de catálogo, sin la lista de alumnos ni las solicitudes ni las invitaciones

#### Scenario: Un niño intenta retirar a otro de un salón

- **WHEN** un niño intenta borrar la pertenencia de otro niño
- **THEN** la operación se rechaza

### Requirement: El tutor ve el nombre de los niños de su salón

El sistema SHALL permitir a un tutor leer el perfil de los niños que pertenecen
a sus salones y de los que tienen una solicitud pendiente en ellos, para poder
mostrarlos por su nombre en la lista del salón y en la bandeja de solicitudes.

Ese acceso SHALL limitarse a esos niños: un tutor NO SHALL poder leer el perfil
de una persona sin relación con sus salones.

#### Scenario: El tutor abre la lista de su salón

- **WHEN** el tutor consulta los perfiles de los niños inscritos en su salón
- **THEN** obtiene sus datos de perfil

#### Scenario: El tutor consulta un perfil ajeno a sus salones

- **WHEN** el tutor intenta leer el perfil de un niño que no pertenece a ninguno de sus salones ni ha solicitado entrar
- **THEN** no obtiene ninguna fila
