# salones-tutor Specification

## Purpose

Permitir que el tutor cree salones, decida quién entra en ellos y siga el
progreso de sus alumnos. Es el módulo más desarrollado de la plataforma.

**Seguir el progreso pasó de ser una promesa a ser un dato.** Hasta el paso 17 el
panel calculaba sobre un roster que llegaba con la actividad y el dominio
cableados en vacío, así que enseñaba ceros: las cinco competencias al 0 % y «Sin
actividad» a quien acababa de jugar. Ahora informa de lo que el servidor guarda
—niveles superados, mundos terminados, eficiencia, intentos por nivel y pasos por
partida— y **los reportes por competencia se retiraron**, porque el juego que
existe no tiene con qué entrenar cuatro de las cinco.

**Decidir quién entra ocurre por dos vías, y sólo una pasa por la bandeja de
solicitudes.** Compartir el ID público del salón sirve para muchos a la vez y le
deja la última palabra al aceptar; generar un enlace de invitación sirve para uno
y **adelanta esa palabra al momento de generarlo**, así que quien lo abre entra
sin que el tutor tenga que aprobar otra vez. Ninguna de las dos pide ni almacena
la dirección de correo de nadie: el envío real no existe todavía.

## Requirements

### Requirement: Creación de un salón

El sistema SHALL permitir crear un salón indicando nombre, grado, profesor a
cargo y cupos, y SHALL validar los datos en el cliente antes de crearlo.

#### Scenario: Datos válidos

- **WHEN** el tutor envía el formulario con nombre, grado, profesor y una capacidad entre 1 y 60
- **THEN** se crea el salón con un identificador interno y un tema visual asignado
- **AND** se redirige al detalle del salón recién creado

#### Scenario: Capacidad fuera de rango

- **WHEN** la capacidad indicada es menor que 1 o mayor que 60
- **THEN** se muestra el error de validación y el salón no se crea

### Requirement: Identificador público único por salón

El sistema SHALL asignar a cada salón un identificador público con el formato
`CP-XXXX`, distinto del identificador interno y único entre los salones
existentes, para que un niño pueda buscarlo tal cual.

#### Scenario: Se crea un salón nuevo

- **WHEN** se genera el identificador público
- **THEN** no coincide con el de ningún salón ya existente

### Requirement: Bandeja de solicitudes de ingreso

El sistema SHALL mostrar al tutor las solicitudes pendientes de su salón y SHALL
permitirle aceptarlas o rechazarlas.

Una solicitud que llega mientras el tutor tiene el panel abierto SHALL aparecer
en la bandeja **sin que él recargue ni cambie de pantalla**. La aparición NO
SHALL costarle lo que tuviera a medias: el panel no se sustituye por un
indicador de carga, así que no se pierde el desplazamiento, ni un diálogo
abierto, ni lo escrito en un formulario.

#### Scenario: El tutor acepta una solicitud

- **WHEN** el salón tiene cupos libres y el tutor acepta
- **THEN** el niño pasa a la tabla de seguimiento sin actividad previa
- **AND** la solicitud desaparece de la bandeja

#### Scenario: El salón está lleno

- **WHEN** no quedan cupos libres
- **THEN** la acción de aceptar aparece deshabilitada

#### Scenario: El tutor rechaza una solicitud

- **WHEN** el tutor rechaza
- **THEN** la solicitud se descarta y el niño vuelve a quedar sin salón

#### Scenario: Entra una solicitud con el panel abierto

- **WHEN** un `child` pide entrar a un salón del tutor mientras éste tiene el panel abierto
- **THEN** la solicitud aparece en la bandeja sin recargar
- **AND** el panel no se sustituye por un indicador de carga mientras llega

#### Scenario: Entra una solicitud en el salón de otro tutor

- **WHEN** un `child` pide entrar a un salón que no es de este tutor
- **THEN** su bandeja no cambia

### Requirement: Expulsión de un alumno

El sistema SHALL permitir quitar a un alumno del salón, y SHALL exigir una
confirmación explícita antes de hacerlo.

#### Scenario: El tutor confirma la expulsión

- **WHEN** el tutor pulsa quitar y confirma en la fila del alumno
- **THEN** el alumno sale de la tabla
- **AND** los contadores del salón se recalculan

#### Scenario: El tutor cancela

- **WHEN** el tutor pulsa quitar y después cancela
- **THEN** el alumno permanece en el salón

### Requirement: Eliminación de un salón

El sistema SHALL permitir eliminar un salón mostrando antes cuántos alumnos y
cuántas solicitudes quedarán afectados.

#### Scenario: El tutor elimina un salón con alumnos

- **WHEN** se abre el diálogo de confirmación
- **THEN** indica el número de alumnos y de solicitudes afectados
- **AND** al confirmar, el salón desaparece y todos sus alumnos quedan sin salón
- **AND** se redirige al listado de salones

### Requirement: El panel del tutor informa sobre progreso real

El panel de información SHALL calcular lo que muestra sobre el progreso que los
alumnos del alcance elegido tienen guardado en el servidor, y NO SHALL mostrar
ninguna cifra que no salga de ahí.

Lo que SHALL informar, para el alcance elegido:

- cuántos exploradores tienen alguna actividad, sobre el total inscrito;
- cuántos niveles se han superado, sobre los que el alcance podría superar;
- cuántos mundos se han terminado, sobre los que el alcance podría terminar;
- la **marca media de eficiencia** de lo superado.

Y por explorador elegido, SHALL informar su avance **sobre el catálogo completo
de mundos y niveles publicados**, no sólo sobre lo que ha jugado. Para cada
mundo SHALL decir cuántos de sus niveles lleva superados, y dentro de él SHALL
nombrar **todos** sus niveles, incluidos los que no ha empezado, que SHALL
distinguirse de los empezados y no superados.

De cada nivel jugado SHALL informar **cuántos intentos le costó** y **cuántos
pasos tuvo cada intento**, porque es lo que distingue a quien resolvió a la
primera de quien llegó al mismo sitio probando.

Un nivel con progreso guardado que ya no esté en el catálogo publicado NO SHALL
desaparecer de la ficha.

Un explorador sin actividad SHALL aparecer, dicho como ausencia y no como mal
resultado: no aporta a la marca media, y se le nombra sin cifra.

Un alcance sin ninguna actividad SHALL decirlo con palabras, y NO SHALL pintar
ceros que se lean como un problema de aprendizaje.

#### Scenario: Un salón con un explorador que ha jugado y dos que no

- **WHEN** el tutor abre el panel de un salón de tres alumnos donde sólo uno tiene progreso
- **THEN** ve que uno de los tres tiene actividad
- **AND** los recuentos de niveles y mundos cuentan el total del salón, no sólo el del que jugó
- **AND** la marca media se calcula únicamente sobre lo superado

#### Scenario: El tutor mira cuánto le costó un nivel a un explorador

- **WHEN** abre el detalle de un explorador con actividad
- **THEN** ve, nivel a nivel, cuántos intentos hizo y su marca
- **AND** ve cada intento con los pasos que tuvo, y con cuántos se resolvía ese nivel

#### Scenario: Un explorador que empezó dos mundos y no terminó ninguno

- **WHEN** el tutor abre la ficha de un alumno que sólo ha superado el primer nivel de dos mundos, de tres que hay
- **THEN** los tres mundos aparecen, cada uno con cuántos de sus niveles lleva superados
- **AND** el mundo que no ha tocado aparece con su nombre y su recuento en cero
- **AND** los niveles que no ha empezado aparecen nombrados y marcados como no empezados

#### Scenario: Un explorador que no ha jugado nada

- **WHEN** el tutor abre la ficha de un alumno sin ningún intento
- **THEN** se le dice que todavía no ha jugado
- **AND** el catálogo completo aparece igualmente, con todos sus niveles sin empezar

#### Scenario: Un nivel que se despublicó después de jugarse

- **WHEN** el tutor abre la ficha de un alumno que tiene progreso en un nivel que ya no está publicado
- **THEN** ese nivel sigue apareciendo con sus intentos y su marca

#### Scenario: Un salón donde nadie ha jugado todavía

- **WHEN** el tutor abre el panel de un salón cuyos alumnos no tienen progreso
- **THEN** se le dice que todavía no hay actividad que informar
- **AND** no aparece ningún porcentaje ni promedio

#### Scenario: El tutor no tiene ningún salón

- **WHEN** abre el panel sin salones creados
- **THEN** no se produce ningún error ni división por cero

### Requirement: El tutor ve el historial completo del alumno

El progreso que el panel informa SHALL ser **todo** el del alumno, incluido el
anterior a su ingreso en el salón. El sistema NO SHALL recortarlo por
`class_memberships.joined_at`.

Es una decisión explícita del 18 de septiembre de 2026, no un efecto colateral:
un niño puede descubrir la plataforma por su cuenta, jugar semanas y unirse
después al salón de su profesor, y al unirse entrega ese historial. Se documenta
aquí porque es lo que el paso de consentimiento del acudiente tendrá que
recoger.

#### Scenario: Un alumno que jugó antes de entrar al salón

- **WHEN** el tutor mira el progreso de un alumno que superó niveles antes de que su ingreso fuera aceptado
- **THEN** esos niveles cuentan en el informe igual que los posteriores

### Requirement: La tabla de seguimiento dice el mundo y la actividad verdaderos

Las columnas «Mundo actual» y «Última actividad» de la tabla de seguimiento
SHALL mostrar lo que dice el servidor.

El **mundo actual** SHALL ser aquel al que pertenece el último nivel que el
alumno intentó, tenga éxito o no. La **última actividad** SHALL derivarse del
último intento registrado.

Un alumno sin ningún intento SHALL seguir mostrándose como «Sin actividad» y con
el mundo vacío: ahí el hueco es el dato.

#### Scenario: Un alumno que acaba de jugar

- **WHEN** el tutor abre el detalle de un salón donde un alumno jugó hace unas horas
- **THEN** su fila nombra el mundo de ese último nivel
- **AND** su última actividad se expresa en horas, no como «Sin actividad»

#### Scenario: Un alumno que nunca ha entrado

- **WHEN** el tutor mira la fila de un alumno sin ningún intento
- **THEN** la columna de mundo aparece vacía
- **AND** la última actividad dice «Sin actividad»

#### Scenario: El niño mira la tabla de su salón

- **WHEN** el niño con estado `member` abre la vista de su salón
- **THEN** las dos columnas muestran para sus compañeros el mismo dato verdadero que ve el tutor

### Requirement: Selector de alcance del panel

El sistema SHALL permitir al tutor ver la información agregada de todos sus
salones o restringirla a uno concreto.

El alcance elegido SHALL gobernar **todo** el panel, no sólo lo que se lee: las
métricas, los reportes y también **el destino de las misiones que el tutor
asigna**. Un selector que se ignora al escribir es peor que no tenerlo, porque el
tutor cree haber elegido algo que no se tuvo en cuenta.

El alcance elegido y el explorador elegido SHALL vivir en la dirección de la
pantalla. Volver a abrir esa dirección SHALL devolver la misma vista, y quien ya
tenga permiso para ver ese avance SHALL poder llegar a él por el enlace.

Cambiar de alcance SHALL soltar al explorador elegido, porque un alumno
pertenece a un solo salón. Una dirección que nombre a un explorador fuera del
alcance NO SHALL abrir su ficha ni producir error.

#### Scenario: El tutor elige un salón

- **WHEN** selecciona un salón en el selector de alcance
- **THEN** las métricas y los reportes pasan a referirse sólo a ese salón

#### Scenario: El tutor asigna con un alcance elegido

- **WHEN** el tutor asigna una misión con un salón elegido en el selector
- **THEN** la misión se asigna a ese salón y a ningún otro

#### Scenario: El tutor cambia de alcance

- **WHEN** el tutor cambia de un salón a otro en el selector
- **THEN** lo que aparece como asignado corresponde al salón elegido, no al anterior
- **AND** deja de haber un explorador elegido

#### Scenario: El tutor recarga con una ficha abierta

- **WHEN** recarga la pantalla mientras mira la ficha de un explorador
- **THEN** vuelve a ver la misma ficha del mismo explorador

#### Scenario: La dirección nombra a alguien que no está en el alcance

- **WHEN** el tutor abre una dirección que nombra a un explorador que no pertenece al alcance
- **THEN** la pantalla se comporta como si no hubiera ninguno elegido
- **AND** no se muestra ningún error

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

### Requirement: La tabla de seguimiento muestra el XP

La tabla de seguimiento SHALL mostrar el XP de cada alumno en una columna propia,
junto a las que ya tiene —mundo actual, última actividad y racha—. El valor
mostrado SHALL ser el que devuelve el servidor, incluido el cero, y NO SHALL
inventarse ninguna cifra.

La **posición** de esa columna SHALL depender de quién mira: en la vista del niño
va entre la última actividad y la racha, y en la del tutor entre la racha y las
acciones. Es una diferencia buscada, no un descuido de la reutilización.

**La columna SHALL enseñar las tres cosas: la barra, el XP acumulado y el tramo.**
Decidido por el usuario el 17-sep-2026, y no es adorno: **la barra sola ordena
mal**. Como se vacía al subir de tramo, un alumno recién ascendido se ve casi
vacío al lado de otro que va por detrás pero a punto de ascender, y quien mira la
tabla es quien tiene que comparar. El número es lo que ordena y el tramo es lo que
explica la barra.

#### Scenario: El tutor abre el detalle de un salón

- **WHEN** el tutor abre el detalle de un salón con alumnos
- **THEN** la tabla muestra una columna de XP entre «Racha» y «Acciones»
- **AND** cada alumno muestra su barra, su XP acumulado y su tramo

#### Scenario: El niño mira la tabla de su salón

- **WHEN** el niño con estado `member` abre la vista de su salón
- **THEN** la tabla muestra una columna de XP entre «Última actividad» y «Racha»
- **AND** no aparece la columna de acciones, que sigue reservada al tutor

#### Scenario: Alumno sin actividad

- **WHEN** un alumno de la tabla tiene cero XP
- **THEN** su barra se muestra vacía, con cero XP y el primer tramo

#### Scenario: Dos alumnos a distinto lado de un salto de tramo

- **WHEN** un alumno acaba de subir de tramo y otro está a punto de subir con menos XP que él
- **THEN** quien mira la tabla puede ver cuál de los dos va por delante

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
