## Context

Ver `proposal.md` — Why, con la medición contra la base y contra la pantalla. Lo
que fija este diseño son cuatro hechos del código y de los datos de hoy:

1. **El progreso sólo sabe de lo jugado.** `classroom_level_progress` arranca de
   `user_progress`, y ahí no hay fila hasta la primera partida. El catálogo es
   la otra mitad, y hoy nadie la pide entera.
2. **`getCatalogSize()` ya lee `levels`** filtrando por `is_published`, y de ahí
   saca los dos denominadores del resumen. Traerse la lista completa no añade
   una consulta: la cambia.
3. **El panel recibe el salón por prop y lo guarda en `useState`.**
   `TeacherDashboard` lee `groupId` de la dirección y se lo pasa como
   `initialGroupId`; a partir de ahí, los chips de salón no tocan la dirección.
4. **Un alumno pertenece como máximo a un salón**, invariante del modelo desde
   la 0013, así que un alumno identifica su salón y no hace falta que la
   dirección los case.

## Goals / Non-Goals

**Goals:**

- Que el tutor vea de un vistazo lo que a un alumno le **falta**, nivel a nivel
  y mundo a mundo, y no sólo lo que ha hecho.
- Que un mundo intacto se vea como intacto, con nombre y con contador, en vez de
  no existir.
- Que recargar la pantalla no pierda al alumno que se estaba mirando, y que el
  enlace se pueda pasar.
- Que ningún dato jugado desaparezca de la ficha, pase lo que pase con el
  catálogo.

**Non-Goals:**

- Tocar la base. Ni migración, ni política, ni vista.
- Ordenar el avance. El candado sigue donde lo dejó `niveles-sin-candado`: se
  decide después de la prueba preliminar. Saltar de mundo es normal y la ficha
  no lo señala como error.
- Rachas y logros, que son el paso 22.
- Enseñar el detalle nivel a nivel a los compañeros. El reparto que fijó el paso
  17 —resumen entre compañeros, detalle sólo para el tutor— no se toca.

## Decisions

### El catálogo manda el orden, y el progreso se le monta encima

La ficha se pinta recorriendo el catálogo, no el progreso. Cada nivel busca su
fila de progreso; si no la tiene, se pinta sin ella. Es lo que hace aparecer los
siete que a Axoluk le faltan.

**Y aun así ningún dato jugado se pierde.** Un nivel con progreso que **no** esté
en el catálogo —porque lo despublicaron después de que alguien lo jugara— se
añade al final de su mundo, y si el mundo tampoco está, al final de la lista.
Hoy no hay ningún caso: los nueve niveles sembrados están publicados y los tres
mundos también, comprobado contra la base. Se escribe igualmente porque el fallo
que evita es del peor tipo: despublicar un nivel borraría de la vista del
profesor el historial de un niño **sin ningún error que lo delate**.

### Dos lecturas, no una con anidado

`getCatalog()` pide `worlds` y `levels` en paralelo y los cruza en el cliente,
en vez de pedir los niveles con su mundo anidado. Son dos tablas pequeñas —tres
filas y nueve— y así el filtro `is_published` se aplica explícitamente a cada
una: un mundo despublicado no debe aparecer aunque sus niveles sigan publicados.
Con el anidado, ese filtro cruzado se escribe en la sintaxis de PostgREST y se
lee peor de lo que se comprueba.

`getCatalogSize()` **desaparece** en vez de convivir con la nueva: dos funciones
que leen lo mismo y sólo coinciden mientras nadie las toque. Los recuentos salen
de contar la lista, y el resumen del panel sigue diciendo lo mismo —«11 de 27»,
«3 de 9» con los datos de hoy—, que es la comprobación de que el cambio no
movió el denominador.

### El cruce es una función pura, y vive con las otras cuentas del panel

`buildWorldProgress(catalog, detail)` va en `teacher/classroomsData.ts`, al lado
de `getClassroomProgressSummary`. Es donde ya viven las cuentas del panel, y así
el caso interesante —dos mundos empezados por el nivel 1 y ninguno terminado— se
prueba sin montar una pantalla.

Devuelve un mundo por entrada, con su contador de superados sobre publicados y
sus niveles en orden; cada nivel lleva su progreso (o `null`) y sus intentos.
**El «mundo terminado» se calcula aquí igual que en el servidor**: superados
`>=` publicados, que es lo que hace `classroom_student_activity`. No se lee de
la vista de resumen porque ésa da un número por alumno y aquí hace falta por
mundo.

### La dirección gobierna el alcance y el alumno, los dos

Podría haberse metido sólo el alumno, dejando el salón donde está. Se descarta:
con el salón en `useState` y el alumno en la dirección, elegir un salón dejaría
en la barra un tramo que ya no corresponde, y el siguiente clic en un explorador
escribiría una dirección mintiendo sobre el alcance.

Así que `initialGroupId` deja de ser «inicial»: `TeacherDashboard` pasa
`groupId` y `studentId` leídos de la dirección, y el panel navega al cambiarlos.
Sigue siendo `TeacherDashboard` quien lee la dirección —ya lo hacía— y el panel
quien la escribe.

**El tramo `all`** representa el alcance «Todos», que es el valor que el panel ya
usaba internamente para eso. Los identificadores de salón son UUID, así que
ninguno puede valer `all`. Con «Todos» y sin alumno, la dirección se queda en
`/teacher/panel` a secas: `all` sólo aparece cuando hace falta un hueco que
rellenar antes del alumno.

**Cambiar de salón suelta al alumno.** Un alumno pertenece a un salón; mantenerlo
elegido al cambiar de alcance dejaría una ficha abierta de alguien que no está
en la lista de chips de debajo.

**Un alumno que no esté en el alcance no abre ficha.** Es lo que pasa con una
dirección vieja, o con la de un salón ajeno: la pantalla se comporta como si no
hubiera nadie elegido. El filtro de verdad no está aquí sino dentro de las
vistas de la `0034`, que a un identificador ajeno responden vacío.

### El que no ha jugado nada también ve sus nueve casillas

Es el coste aceptado de la decisión, y se mide en Invitada Prueba: nueve filas
sin una sola marca. Se deja, y **encima va la frase** que dice que todavía no ha
jugado, para que esas nueve filas se lean como el mapa que le espera y no como
un fallo de carga.

## Risks / Trade-offs

- **La ficha crece de 2 filas a 9** para el alumno a medias, y a 9 vacías para
  el que no ha empezado. Es más scroll a cambio de la información que el paso
  pide. Mitiga la cabecera por mundo, que deja leer el contador sin recorrer las
  filas.
- **Elegir salón ahora empuja una entrada al historial.** El botón de volver del
  navegador deshace la elección en vez de salir del panel. Es el precio de tener
  la dirección como fuente, y es el comportamiento que un enlace compartible
  exige.
- **El «mundo terminado» se calcula en dos sitios** —el servidor para el resumen,
  el cliente para la ficha— con la misma regla. Si un día cambia, hay que
  cambiarla en los dos; queda escrito aquí y en el comentario de la función.

## Migration Plan

No hay. Ningún dato guardado cambia de forma ni de sitio, y la pantalla nueva
lee lo mismo que la vieja más el catálogo.

## Open Questions

Ninguna. Las dos que había —la forma, y qué enseñar de un mundo intacto— las
decidió el usuario el 18 de septiembre de 2026 con la medición delante.
