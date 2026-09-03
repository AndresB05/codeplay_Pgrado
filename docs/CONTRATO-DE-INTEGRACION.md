# Contrato de integración del juego

Este documento define qué debe cumplir el juego para integrarse con la
plataforma, y qué le garantiza la plataforma a cambio.

**Está escrito para quien construye el juego.** No hace falta conocer el código
de la plataforma para leerlo: todo lo que se necesita saber está aquí. El
apéndice final es lo único dirigido al otro lado, y puede ignorarse.

---

## 1. Las dos partes y dónde está la frontera

### Quién es quién

**La plataforma es una web para enseñar pensamiento computacional a niños.** El
juego se juega **dentro de ella**, incrustado en una página, no como aplicación
suelta.

A esa página que incrusta el juego la llamaremos **el anfitrión** en todo el
documento. Es la web de la plataforma: es quien tiene abierta la sesión del
usuario, quien sabe qué nivel se ha elegido, y la única pieza que habla con el
servidor.

**Hay dos tipos de cuenta, y sólo una juega:**

| Cuenta | Qué hace | ¿Abre el juego? |
| --- | --- | --- |
| **Niño** | Juega los niveles, gana experiencia y logros | **Sí.** Es el único |
| **Profesor** | Administra su salón, admite alumnos, les asigna tareas y mira su progreso | **No.** Nunca |

Cuando este documento dice «el niño», se refiere a la persona que está jugando, y
es siempre una cuenta de niño. El profesor no aparece más en el contrato: el
juego no sabe que existe y no tiene que tenerlo en cuenta para nada.

### Las tres piezas

Hay tres, y la del medio es la que hace que esto funcione:

```
    EL JUEGO                EL ANFITRIÓN                 EL SERVIDOR
  (build de WebGL)       (la página que lo               (base de datos
                          incrusta)                       con reglas)

  recibe un nivel   ◀────  se lo pasa            ◀────  guarda el catálogo
                                                         de niveles

  manda un mensaje  ────▶  lo traduce a          ────▶  decide qué se ganó
  al terminar              llamadas al servidor          y lo escribe
```

**El juego no habla con el servidor.** Habla sólo con el anfitrión. Tres
consecuencias, y las tres son deliberadas:

1. **El juego no lleva credenciales dentro.** Un build de WebGL es un archivo
   público: cualquiera puede descargarlo y abrirlo. Nada secreto puede vivir
   ahí.
2. **La sesión del niño la tiene el anfitrión**, que ya la abrió antes de cargar
   el juego. El juego no sabe quién está jugando y no lo necesita.
3. **Cambiar de servidor no toca el juego.** Está previsto que la base cambie de
   sitio; si el juego hablara directamente con ella, ese cambio obligaría a
   volver a publicarlo.

Por eso, en todo lo que sigue, «manda» y «recibe» significan siempre *hacia el
anfitrión* y *desde el anfitrión*.

---

## 2. Lo que el juego recibe: un nivel

El juego **no trae la lista de niveles: la recibe.** Ésta es la regla que
sostiene todo lo demás, y conviene entender por qué antes que cómo.

Añadir un nivel debe costar una fila en una base de datos, no un build nuevo. Si
el juego lleva los niveles cocidos dentro, cada nivel nuevo obliga a recompilar,
volver a subir y volver a desplegar el juego entero. Con treinta niveles
previstos y más después, eso convierte el crecimiento del contenido en un
problema de ingeniería que no tiene por qué serlo.

De ahí dos exigencias sobre el juego:

- **Debe poder cargar cualquier nivel** que se le describa con la estructura de
  abajo, sin conocerlo de antemano.
- **No debe contar el contenido.** Nada de «hay tres mundos» ni «hay diez
  niveles». Un mundo contiene N niveles ordenados, y N cambia.

### La forma del nivel

El anfitrión entrega un objeto con esta forma:

| Campo | Tipo | Qué es |
| --- | --- | --- |
| `levelId` | texto (identificador único) | Lo que el juego devuelve al terminar. Opaco: no se interpreta |
| `formatVersion` | texto | Versión del formato de bloques de este nivel. Ver §4 |
| `config` | objeto JSON | La definición del puzle: rejilla, salida, meta, límites |
| `starterProgram` | JSON | La disposición inicial de bloques, en el mismo formato que se envía al terminar |

`config` es libre por diseño: su contenido depende del tipo de nivel, y los tipos
futuros aún no están definidos. Para los niveles de rejilla del primer mundo
lleva la cuadrícula, la casilla de salida, la meta y los límites —por ejemplo, un
número máximo de pasos—.

**`config` es público.** Cualquiera puede leerlo sin haber iniciado sesión. Está
medido, no supuesto. Para un puzle de ir de A a B eso es inofensivo —saber dónde
está la meta no es saber cómo llegar—, pero fija una regla sin excepciones:

> En `config` va **la definición del puzle, nunca su solución**, y nunca la
> condición de un logro que deba ser una sorpresa.

---

## 3. Lo que el juego manda: un intento

Cuando una partida de un nivel termina —con éxito o sin él—, el juego manda **un
solo mensaje**. No dos, no uno por logro: uno.

| Campo | Tipo | Obligatorio | Notas |
| --- | --- | --- | --- |
| `levelId` | texto | Sí | El mismo que recibió. Si no existe o no está publicado, el servidor responde con error |
| `program` | JSON | Sí | El programa de bloques que el niño construyó, serializado. Ver §4 |
| `success` | booleano | Sí | Si el niño resolvió el nivel |
| `score` | entero 0–100 | No | Un porcentaje. Fuera de rango **se recorta en silencio**: enviar 200 guarda 100 |
| `runtimeMs` | entero ≥ 0 | No | Cuánto duró la partida |
| `metadata` | objeto JSON | No | Observaciones del juego que no encajan en los campos de arriba |

**`score` es un porcentaje y no está definido qué mide.** El servidor lo acota
entre 0 y 100 y guarda el mejor histórico del niño en ese nivel. Si el juego no
tiene nada sensato que medir, **no lo mande**: vale 0 y no estorba.

**No mande estrellas.** El servidor todavía acepta un campo de estrellas por
nivel, pero es herencia de un diseño anterior, ninguna pantalla lo muestra y está
previsto retirarlo.

### Lo que el juego NO manda

Esta lista es tan parte del contrato como la de arriba:

- ❌ **Cuánta experiencia se ganó.** La decide el servidor a partir del nivel.
- ❌ **Qué logros se consiguieron.** Ver §5.
- ❌ **Qué misiones se cumplieron.** El juego no necesita saber que existen.
- ❌ **Quién está jugando.** Lo sabe el anfitrión por la sesión abierta.

Si el juego manda cualquiera de estas cosas, se ignoran. No es una omisión: es la
frontera que hace que añadir un logro nuevo no obligue a publicar el juego otra
vez.

---

## 4. La serialización de los bloques debe ser JSON

**Ésta es la línea irreversible del documento.** Cuesta cero hoy y no se puede
arreglar después sin volver a publicar el juego.

El programa que el niño construye —tanto el `starterProgram` que recibe como el
`program` que envía— **tiene que serializarse como JSON**, con una estructura que
se pueda recorrer: qué bloques hay, en qué orden y anidados cómo.

El motivo está en §5: el servidor necesita **leer el programa** para conceder
logros. Si el juego manda un formato opaco —binario, propio del motor, o una
cadena que sólo el juego sabe interpretar—, el servidor no puede leer nada, y
entonces todo logro pasa a depender de que el juego diga la verdad.

Consecuencia práctica: cualquier formato que el juego elija hoy queda grabado en
los intentos ya guardados. Cambiarlo después obliga a publicar el juego de nuevo
**y** a migrar lo guardado. Por eso existe `formatVersion`: acompaña a cada nivel
y viaja con cada intento, para que el servidor sepa qué está leyendo cuando el
formato evolucione. Póngale un valor desde el primer día, aunque sólo haya uno.

Advertencia medida: hoy el servidor **acepta cualquier texto** en `program`, sin
comprobar que sea JSON. No lo interprete como permiso. Un programa que no sea
JSON se guardará sin error y romperá silenciosamente todo lo de §5 el día que se
intente leer.

---

## 5. Cómo se verifica que un logro se consiguió

Los logros no se ganan por avanzar, sino por hacer cosas: «da tres vueltas sobre
tu propio eje usando bloques», «resuelve el nivel con cinco bloques o menos».
Premian la exploración, no el progreso.

**El juego nunca concede un logro, y nunca dice cuál cree merecer.** El servidor
los concede solo, mirando dos cosas que ya tiene — y hay una tercera que no
puede comprobar:

```
   ┌─────────────────────────────────────────────────────────────┐
   │  ¿Qué escribió el niño?                                     │
   │  El programa enviado, que el servidor puede recorrer.       │
   │  «usa un bucle», «tres bloques de giro», «≤ 5 bloques»      │
   │  → NO es falsificable: el servidor lee el dato, no confía   │
   ├─────────────────────────────────────────────────────────────┤
   │  ¿Qué ha hecho el niño hasta ahora?                         │
   │  Su historial de intentos y niveles completados.            │
   │  «primer nivel», «mundo completo», «N días seguidos»        │
   │  → NO es falsificable: lo escribió el servidor              │
   ├─────────────────────────────────────────────────────────────┤
   │  ¿Funcionó de verdad el programa?                           │
   │  Sólo lo sabe el juego. Es el campo `success`.              │
   │  → SÍ es falsificable                                       │
   └─────────────────────────────────────────────────────────────┘
```

Esa tercera fila es **el único dato que la plataforma se cree sin poder
comprobarlo**, y conviene decirlo en voz alta en vez de fingir lo contrario. No
es un riesgo que traigan los logros: es el mismo bit del que ya depende la
experiencia por completar un nivel.

La razón de no comprobarlo es de proporción, no de descuido. Verificar que el
programa resuelve el nivel exige ejecutarlo contra la rejilla dentro del
servidor, es decir, reimplementar el motor del juego en la base de datos. Eso es
un proyecto entero. Y al otro lado de la balanza: es una plataforma para niños,
no hay dinero de por medio, y quien haga trampa se engaña sólo a sí mismo.

La mitigación que sí se aplica, y que cuesta una condición: **un logro que
dependa de un nivel exige un intento con éxito de ese nivel.** Sube el listón de
«manipular el navegador» a «jugar el nivel y además manipular el navegador».

Lo importante para quien construye el juego se resume en una frase: **mande el
programa completo y fiel.** Un programa recortado, normalizado o simplificado
antes de enviarlo puede hacer que un logro legítimo no se conceda, y el juego no
se enterará, porque el juego no sabe qué logros existen.

---

## 6. Lo que el servidor garantiza a cambio

Todo esto está medido contra la base real, no razonado:

- **La experiencia se concede una sola vez por nivel.** Completar un nivel ya
  completado no vuelve a darla, así que reintentar nunca perjudica al niño. Sí
  deja registrado otro intento: ver §7.
- **La puntuación nunca baja.** Se guarda la mejor histórica del niño en ese
  nivel.
- **La fecha de finalización no se mueve.** Queda la del primer éxito.
- **Cada intento se guarda entero**, con su programa, su duración y sus
  observaciones. Nada se pierde ni se sobrescribe.
- **Ningún cliente puede escribir progreso, intentos ni logros directamente.**
  Todo pasa por funciones del servidor que toman la identidad de la sesión, no de
  lo que se les mande. Un cliente no puede escribir en nombre de otro.

---

## 7. Errores que el juego debe saber encajar

El juego no habla con el servidor, pero el anfitrión le devolverá el resultado, y
hay cuatro casos que no debe tratar como catástrofes:

| Situación | Qué hacer |
| --- | --- |
| El nivel no existe o no está publicado | El nivel se retiró mientras se jugaba. Volver a la selección de niveles |
| No hay sesión | La sesión caducó. El anfitrión se encarga; el juego sólo debe no perder la partida |
| Fallo de red | Reintentar **no duplica experiencia** (§6), pero **sí deja otro intento registrado**. Ver abajo |
| `formatVersion` que el juego no reconoce | No intente adivinar. Ver abajo |

**Reintentar es seguro para la experiencia, no gratis para el historial.** Por §6
repetir el envío no vuelve a conceder experiencia ni baja la puntuación, así que
reintentar nunca perjudica al niño. Pero **cada reintento queda guardado como un
intento más**, y la plataforma usa ese recuento para los informes que ve el
profesor. Un juego que reintente en bucle ante una red inestable no rompe nada,
pero ensucia esos informes. Reintente con moderación: unas pocas veces,
espaciando, y ríndase en silencio.

**Una `formatVersion` desconocida significa que el juego está desactualizado.**
Es una consecuencia directa de que añadir un nivel cueste una fila y no un build:
se puede publicar un nivel con un formato más nuevo que el juego desplegado. Si
llega uno que no reconoce, **no intente interpretarlo ni cargarlo a medias**: avise
al anfitrión de que no puede con ese nivel y deje que él lo resuelva. Un nivel que
no se puede cargar es un contratiempo; un nivel cargado mal y jugado hasta el
final guarda un intento con un programa que nadie podrá volver a leer.

**Nunca bloquee la partida esperando confirmación.** El niño debe poder seguir
jugando aunque el guardado falle.

---

## 8. Lo que este contrato todavía no fija

Escrito a propósito, para que nadie lo dé por resuelto:

- **El mecanismo concreto** por el que el juego y el anfitrión se pasan los
  mensajes. Depende de un build de WebGL que aún no existe y se define cuando lo
  haya.
- **La estructura interna de `program` y de `config`.** Las fija quien diseñe los
  bloques. Este documento sólo exige que sean JSON recorrible.
- **El catálogo de logros**: cuáles hay, qué condición cumple cada uno y cuánta
  experiencia da. Es diseño de producto y no afecta al juego, que no los nombra.
- **Cómo se relacionan las misiones que un profesor asigna con los niveles del
  juego.** Hoy son dos catálogos distintos y nada los une. Mientras no se unan,
  ninguna misión puede completarse. **No afecta al juego**, por §3.

---

## Apéndice — para quien implementa el lado web

Esta sección sí supone conocimiento del repositorio.

**Correspondencia de campos**

| Contrato | Dónde vive |
| --- | --- |
| `config` | `levels.validation_rules` (`jsonb`) |
| `starterProgram` | `levels.starter_code` (`text`) |
| `formatVersion` | `levels.programming_language`, reaprovechado. Hoy `'javascript'` en las nueve filas sembradas, sin `check` que lo ate |
| `program` | `level_attempts.submitted_code` (`text`, **sin `check`**) |
| `metadata` | `level_attempts.metadata` (`jsonb`) |

**Un mensaje del juego son dos llamadas.** El anfitrión traduce cada mensaje a
`create_level_attempt` y, si procede, `upsert_my_progress`. Son independientes:
`user_progress.attempt_count` cuenta llamadas a la segunda, no filas de
`level_attempts`. No se sincronizan solas.

**Nada de esto se había ejecutado nunca.** Ambas RPC están ahora medidas por
`curl` contra la base real y funcionan, pero desde la aplicación siguen sin
consumidor: `createAttempt` no lo tiene, y ningún componente desestructura
`upsertProgress`.

**Falta cable para §2.** `mapLevelRow` no mapea `starter_code` ni
`validation_rules`, y el tipo `Level` no los declara, aunque el `select('*')` los
trae. Se cablea cuando exista quien los consuma.

**Conceder un logro exige una RPC que no existe.** `achievements` no tiene
`grant insert` para ningún rol —medido: `42501` incluso autenticado—, así que la
única vía es una función `security definer`. No es una preferencia de diseño: es
la única puerta que el esquema deja abierta.

**Las misiones necesitan tabla de cumplimientos propia.** No pueden montar sobre
`achievements`: su `unique (user_id, achievement_key)` significa «una vez en la
vida», y una misión es reasignable —`mission_assignments` ya declara
`unique (group_id, mission_key)` porque la misma misión en dos salones es lo
normal—. Misma maquinaria de concesión, cardinalidad distinta. Y el cumplimiento
debe guardar el salón, no derivarlo: un niño que cambie de salón haría
desaparecer lo cumplido de los informes de su antiguo profesor.

**La condición de un logro no va en `validation_rules`.** Esa columna la lee
cualquiera sin sesión —`grant select ... to anon` más la política de lectura de
publicados—, así que publicar ahí la condición de un logro sorpresa lo revela.
Va en el catálogo de logros, que no necesita ser público.
