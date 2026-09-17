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

Hay tres, y la del medio es la que hace que esto funcione.

> **Nota del 3-sep-2026.** El juego **ya no es un programa aparte**: se descartó
> Unity y se hace con librerías de JavaScript dentro de la misma aplicación web,
> así que el juego y el anfitrión **corren en la misma página**. El reparto de
> responsabilidades de abajo **no cambia** —quién recibe qué, quién habla con el
> servidor y quién decide la puntuación son los mismos—, pero el juego ya no
> tiene que mandar mensajes a través de una frontera: llama a una función. Lo que
> desaparece es el mecanismo, no la separación.
>
> **Y la separación conviene conservarla aunque ya no la imponga la tecnología**:
> es lo que permite añadir un logro o un nivel sin tocar el juego.

```
    EL JUEGO                EL ANFITRIÓN                 EL SERVIDOR
  (la parte que se       (la página que lo               (base de datos
   juega)                 aloja y tiene la sesión)        con reglas)

  recibe un nivel   ◀────  se lo pasa            ◀────  guarda el catálogo
                                                         de niveles

  manda un mensaje  ────▶  lo traduce a          ────▶  decide qué se ganó
  al terminar              llamadas al servidor          y lo escribe
```

**El juego no habla con el servidor.** Habla sólo con el anfitrión. Tres
consecuencias, y las tres son deliberadas:

1. **El juego no lleva credenciales dentro.** Todo lo que corre en el navegador
   es público: cualquiera puede leerlo. Nada secreto puede vivir ahí.
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
volver a subir y volver a desplegar el juego entero. En cuanto el contenido
crezca, eso convierte añadir un nivel en un problema de ingeniería que no tiene
por qué serlo.

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
| `config` | objeto JSON | La definición del puzle: rejilla, salida, meta y pasos óptimos. Su forma exacta, en §4.2 |
| `starterProgram` | JSON | La disposición inicial de bloques, en el mismo formato que se envía al terminar. Ver §4.3 |

`config` **depende del tipo de nivel**, y hoy hay un tipo solo: los nueve niveles
son de rejilla, porque los tres mundos comparten mecánica y cambian únicamente
qué tiene que pensar el niño para resolverla. Su forma está fijada campo por
campo en §4.2. Si algún día aparece un tipo distinto, lo que lo anuncia es
`formatVersion` (§4.3), no una suposición del juego.

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
| `score` | entero 0–100 | **No, y ya no hay dónde** | Ver el aviso de abajo. Desde el J10 (17-sep-2026) **lo calcula el servidor** leyendo el programa, y la llamada que guarda una partida **no tiene ese parámetro** |
| `runtimeMs` | entero ≥ 0 | No | Cuánto duró la partida |
| `metadata` | objeto JSON | No | Observaciones del juego que no encajan en los campos de arriba |

**La puntuación la calcula el servidor, no el juego.** Decidido el 3-sep-2026, y
cambia lo que este campo era antes.

La puntuación mide **eficiencia**: cuantos menos pasos use el niño para llegar a
la meta, más alta. Y el servidor puede calcularla él mismo, porque el programa de
bloques le llega entero y en JSON (§4) — no necesita que nadie se la diga.

**Un paso es una casilla recorrida, un giro o un salto.** Avanzar cuatro casillas
son cuatro pasos; girar es uno, y ocurre sin cambiar de casilla. Se cuentan
movimientos, no bloques: repetir cuatro veces «avanzar» son cuatro pasos aunque
se escriba con dos bloques.

**Saltar cuesta el doble de lo que se hace saltando.** El bloque «saltar» lleva
otros dentro y los ejecuta saltando: vacío cuesta un paso, y con bloques dentro
cuesta el doble de lo que costarían esos bloques sueltos. Sigue siendo la misma
regla: un salto con «avanzar 2» dentro cuesta lo mismo que dos saltos con
«avanzar 1», así que saltar ahorra bloques y no pasos. Decidido el 13-sep-2026.

Eso le impone una condición al formato del programa: **las repeticiones tienen
que ser números presentes en el propio programa**. Mientras lo sean, el servidor
suma recorriendo el JSON. Si un bloque repite un número de veces que sólo se sabe
al ejecutarlo —«repite hasta chocar»—, el recuento deja de poder calcularse
leyendo, y ese caso hay que hablarlo antes de introducirlo.

El motivo no es desconfianza: es que el servidor **ya tiene que leer ese programa
de todos modos** para conceder logros (§5), así que puntuar ahí evita escribir la
misma lógica en dos sitios y que las dos se separen con el tiempo.

Para quien construye el juego eso simplifica: **mande el programa y no se
preocupe de puntuar.** Puede mostrar en pantalla su propia estimación de lo bien
que lo ha hecho el niño, pero la que cuenta es la del servidor.

**Y el campo ya no existe en el camino de una partida.** Hasta el J10 la
puntuación se mandaba en cero y el servidor la guardaba tal cual; desde entonces
la llamada que guarda una partida no la acepta y la calcula ella. La regla es
`redondeo(100 × pasos de la mejor solución ÷ pasos usados)`, acotada de 1 a 100
para una partida con éxito y **cero** para una que no resolvió el nivel
(`DISENO-DEL-JUEGO.md` §3). De la mejor marca histórica sigue ocupándose el
servidor, y de ella sale la experiencia que se concede.

**Lo que el juego SÍ puede mandar es su propia puntuación entre las
observaciones**, y conviene que lo haga: es lo que permite cotejarla con la del
servidor sin creérsela.

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

## 4. El formato: qué forma tienen `config` y `program`

Fijado el **4-sep-2026**. Hasta ese día este documento sólo exigía que el
programa fuera JSON y dejaba su estructura —y la de `config`— sin escribir. Eso
bastaba mientras no lo leyera nadie; lo leen **tres sitios** —el juego para
ejecutar, el cliente para contarle los pasos al niño y el servidor para puntuar y
conceder logros—, y tres lectores de un formato que vive en la cabeza de alguien
acaban leyendo tres formatos distintos.

### 4.1 La serialización de los bloques debe ser JSON

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
formato evolucione. **Por dónde viaja con el intento está en §4.3**, y no era
evidente: el intento no tiene ningún hueco propio para él.

Advertencia medida: hoy el servidor **acepta cualquier texto** en `program`, sin
comprobar que sea JSON. No lo interprete como permiso. Un programa que no sea
JSON se guardará sin error y romperá silenciosamente todo lo de §5 el día que se
intente leer.

### 4.2 `config` — la definición del puzle

Un nivel de rejilla se describe así, y esto es un ejemplo completo y válido:

```json
{
  "tiles": [
    ["floor", "floor", "floor", "wall",  "floor"],
    ["floor", "wall",  "floor", "floor", "floor"],
    ["floor", "floor", "gap",   "floor", "floor"],
    ["floor", "wall",  "floor", "wall",  "floor"],
    ["floor", "floor", "floor", "floor", "floor"]
  ],
  "heights": [
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1],
    [1, 1, 1, 1, 1],
    [1, 1, 1, 1, 1]
  ],
  "start": { "cell": { "row": 4, "column": 0 }, "facing": "north" },
  "goal": { "row": 0, "column": 4 },
  "optimalSteps": 10
}
```

| Campo | Tipo | Qué es |
| --- | --- | --- |
| `tiles` | matriz de textos | El tablero. Filas de **norte a sur**, columnas de **oeste a este**. Cada casilla es `floor`, `wall` o `gap` |
| `heights` | matriz de enteros | La altura de cada casilla, alineada con `tiles`: cuántos cubos tiene su columna. `floor` y `wall`, 1 o más; `gap`, exactamente 0 |
| `start` | pose | Dónde empieza el personaje **y hacia dónde mira**: `north`, `east`, `south` o `west` |
| `goal` | casilla | Dónde hay que llegar. `row` y `column`, sin orientación |
| `optimalSteps` | entero > 0 | Los pasos de la mejor solución posible. Ver §4.4 |
| `stepLimit` | entero > 0, **opcional** | Los pasos que el nivel concede como mucho. Al agotarlos la ejecución se corta. Ver §4.4 |

Escríbalas alineadas: así el JSON se lee como el tablero que describe, y ésa es
la mitad de su valor.

**Todas las filas miden lo mismo.** El tablero es **rectangular**, y un hueco se
escribe siempre `'gap'`, nunca acortando una fila. No es una formalidad: son dos
maneras de dibujar el mismo tablero que **no significan lo mismo al jugarlo**.
Salirse por el borde y toparse con un hueco se pintan igual —en los dos casos no
hay nada que dibujar—, pero son motivos de parada distintos, y el juego se los
explica al niño con palabras distintas: «te saliste del tablero» no es «ahí no
hay suelo». Con filas de largos desiguales, un mismo tablero le diría una cosa u
otra según cómo lo hubiera escrito quien lo sembró. Es el mismo motivo por el que
la casilla no lleva un campo aparte de «transitable»: dos maneras de decir lo
mismo se contradicen en cuanto alguien edita una.

**Tres clases de casilla, y qué hacer con una cuarta.** Un **hueco** es una
casilla que no existe y un **muro** una que existe y no se pisa: para moverse son
lo mismo, y la diferencia está sólo en cómo se pintan. Un valor que no sea uno de
los tres **no se trata como suelo**: se rechaza el nivel entero, igual que una
`formatVersion` desconocida (§7). Es la misma razón — un tablero cargado a medias
se juega hasta el final y guarda un intento que nadie podrá volver a leer.

**Una matriz, y no una lista de casillas.** «Transitable o no» es una propiedad
de cada casilla, que es exactamente lo que una matriz es, y `tiles[row][column]`
responde «¿se puede pisar aquí?» sin construir ningún índice antes.

**`row` y `column`, nunca `x` e `y`.** En una escena 3D esos dos nombres son otra
cosa, y mezclarlos es el error clásico del género.

**La salida lleva orientación y la meta no.** Sin orientación de salida el primer
«avanzar» es ambiguo, así que hace falta. La meta, en cambio, se pisa mirando
adonde sea: exigir una orientación al llegar sería una regla de juego más, y
ninguno de los nueve niveles la pide.

**Con alturas, desde el 13-sep-2026.** Hasta ese día este apartado decía «sin
alturas», porque nada del diseño las pedía; las pidió el mundo 2, que ya no es un
camino llano sino una subida. Cada casilla que existe es una **columna** de uno o
más cubos, y **se apoya siempre en el suelo del tablero**: nada flota, así que
basta un número por casilla para describir qué hay debajo.

- **Andando** se pasa a una casilla de la **misma altura o más baja**, sin límite
  de bajada. Contra una **más alta** se choca, como contra un muro.
- **Saltando** se sube **un nivel**, se avanza a la misma altura o se baja. Contra
  una casilla **dos o más niveles más alta**, un hueco, un muro o el borde, se
  salta en el sitio y se queda.
- **No se cae al vacío**: bajar exige una casilla donde pisar.

**El hueco mide 0 y lo que existe mide 1 o más**, y las dos matrices se comprueban
juntas: un hueco con altura o una casilla con 0 son dos maneras de decir si ahí
hay algo que no coinciden, y se rechaza el nivel entero, igual que una clase de
casilla desconocida. Un tablero con todas las alturas a 1 se juega exactamente
igual que uno sin alturas.

**`optimalSteps` va aquí, y lo decide este documento.** Hasta hoy el número de
pasos de la mejor solución no tenía sitio asignado en ninguna parte. Va en
`config` porque lo necesitan los dos lados: el cliente, para decirle al niño
cuántos pasos eran los buenos, y el servidor, para convertir pasos en puntuación.
Se define **a mano al diseñar el nivel**; no se calcula.

**Y hay que acertarlo, porque nada lo comprueba.** La puntuación sale de comparar
los pasos usados contra este número, así que uno escrito **por debajo** del
óptimo real deja la marca perfecta fuera del alcance de cualquier niño — y no
salta ningún error en ninguna parte: sólo queda un nivel que se siente injusto.
Quien siembre un nivel resuelve antes su puzle a mano y comprueba que el número
que escribe es el de su mejor solución.

**Y el fallo de enfrente se ve jugando: si un niño lo bate, está mal sembrado.**
Un número escrito **por encima** del óptimo real no deja a nadie fuera de nada
—el 100 se alcanza de sobra—, así que no se siente injusto y por eso pasa
desapercibido. La señal es que alguien resuelva el nivel con menos pasos de los
apuntados: eso no puede ocurrir con un número correcto. **El juego no lo trata
como un error ni se lo dice al niño** —su solución es buena y no tiene la culpa
del número—, así que la única forma de cazarlo sigue siendo la del párrafo de
arriba, resolviendo el puzle antes de sembrarlo. Anotado el 7-sep-2026 por el
J6, que es el primero que tiene que decidir qué pinta la pantalla en ese caso.

Y no rompe la regla de §2, aunque lo parezca: **un número no es una solución.**
Decir que la mejor ruta son diez pasos no dice cuáles son esos diez. El niño lo
ve en pantalla **al terminar**, así que tenerlo en un `config` público no revela
nada que no se enseñe.

**Y sólo al terminar, que eso se probó y se retiró.** El J6.1 lo enseñó también
mientras el niño construía, contra el coste de su programa, y el **J6.2** lo quitó
el mismo día por decisión del usuario: «el niño se va a matar la cabeza pensando
cómo llegar al final con sólo 10 pasos en vez de llegar al final». Enseñar el
número a batir **antes** de haber resuelto nada convierte el nivel en un problema
de optimización cuando todavía es un problema de llegar. Quien vuelva a
plantearlo tiene aquí el porqué de que no esté.

**`stepLimit` es la excepción a ese párrafo, y sólo la de algunos niveles.**
Desde el 16-sep-2026 un nivel puede conceder **un máximo de pasos**: al agotarlo
la ejecución se corta, el personaje se queda donde esté y el nivel no se resuelve
salvo que ya hubiera pisado la meta. Es lo que convierte un tablero en un
problema de «elige el camino más corto» en lugar de uno de «llega», y es el
motivo de que el párrafo de arriba deje de valer **en esos niveles**: el número a
batir se enseña mientras se juega —bajando— porque ahí el nivel **ya es** un
problema de optimización por diseño, y esconderlo sólo dejaría al niño
plantándose sin saber por qué.

```json
"optimalSteps": 10,
"stepLimit": 10
```

- **Es opcional, y que falte no es cero.** Un nivel sin el campo se juega **sin
  límite**, que es como se juegan todos los del mundo 1 y del mundo 2.
- **Nunca por debajo de `optimalSteps`.** Por debajo no es un nivel difícil, es
  uno que nadie puede terminar, y ése sí se rechaza al leer (§7) — a diferencia
  de un `optimalSteps` mal apuntado, que no hay forma de comprobar sin resolver
  el puzle.
- **Son dos números distintos y los dos siguen haciendo falta**: `optimalSteps`
  es lo que cuesta la mejor solución y de él sale la puntuación; `stepLimit` es
  lo que el nivel concede. Que coincidan es decisión de quien siembra el nivel,
  no una regla de este formato.

**Este JSON es, campo por campo, el tipo del juego.** No hay traducción entre el
cable y el código, y es una decisión tomada, no un descuido: `config` viaja
entero, en un solo hueco, y lo que entra sale igual. Una segunda forma sería un
traductor que mantener en dos sitios sin ganar información. Lo que sí hace falta
en la frontera es **comprobar, no traducir**: el JSON llega sin tipo, y hay que
validarlo antes de dárselo al juego — un `config` que no describa un tablero es
el caso de §7.

### 4.3 `program` y `starterProgram` — un sobre con la versión dentro

El programa viaja **dentro de un sobre**, y el sobre lleva la versión:

```json
{
  "formatVersion": "grid-blockly-2",
  "workspace": { "…": "lo que serialicen los bloques" }
}
```

Los dos campos del contrato usan este mismo sobre: el `starterProgram` que el
juego recibe (§2) y el `program` que manda al terminar (§3). Un solo lector sirve
para los dos.

**Por qué un sobre y no el JSON de los bloques a secas.** Porque §4.1 promete que
`formatVersion` «viaja con cada intento» y, medido, **el intento no tiene por
dónde**: de un intento se guardan el programa, el éxito, la puntuación, la
duración y unas observaciones libres, y ninguno de esos huecos es una versión.
Quedaban dos salidas —meterla en las observaciones o meterla en el programa— y
las observaciones son **otro campo**: quien lea el programa solo, que es
justamente lo que hace el servidor al puntuar, se quedaría sin saber qué está
leyendo. La versión tiene que ir pegada a los bytes que describe. El sobre lo
consigue sin cambiar nada del servidor.

**Dentro del sobre va el JSON nativo del editor de bloques, sin traducir.**
Blockly —la librería elegida— serializa y deserializa solo, así que no cuesta
código. El precio es que el formato es verboso y es suyo, y que una actualización
puede cambiarlo; pero para eso existe `formatVersion`, y escribir un traductor
propio antes de que exista el primer nivel es trabajo sin evidencia. Si recorrer
ese JSON resulta incómodo desde el servidor, se cambia entonces, con casos reales
delante.

**El interior del sobre, registrado el 5-sep-2026 con Blockly `12.5.1`
instalado.** Hasta ese día este documento no transcribía ningún ejemplo a
propósito, porque el editor no estaba instalado y escribirlo de memoria es
escribirlo mal. Éste es el **PROGRAMA A de §4.4** —girar derecha, avanzar 4,
girar izquierda, avanzar 4— tal y como lo serializa el editor:

```json
{
  "formatVersion": "grid-blockly-2",
  "workspace": {
    "blocks": {
      "languageVersion": 0,
      "blocks": [
        {
          "type": "codeplay_turn_right",
          "id": "q`?B*tqQ(NK]!y$45l:L",
          "x": 0,
          "y": 0,
          "next": {
            "block": {
              "type": "codeplay_advance",
              "id": "wzIPDa)Y5@bF]AG}yj2O",
              "fields": { "STEPS": 4 },
              "next": {
                "block": {
                  "type": "codeplay_turn_left",
                  "id": "+{JkZ7]Vb}a_X5(SMDfi",
                  "next": {
                    "block": {
                      "type": "codeplay_advance",
                      "id": "y]7[v^m-bD:=:x()v3dL",
                      "fields": { "STEPS": 4 }
                    }
                  }
                }
              }
            }
          }
        }
      ]
    }
  }
}
```

Lo que hay que saber para recorrerlo:

- **La secuencia se anida, no se lista.** `workspace.blocks.blocks` sólo trae los
  bloques **sueltos** del lienzo —los que no cuelgan de nadie—, y cada uno lleva
  el siguiente colgado de `next.block`. Recorrer un programa es bajar por esa
  cadena, no iterar un array. Un lienzo con dos montones sin conectar da dos
  entradas en ese array; para el juego, **el programa es el montón que empieza
  donde corresponda**, y qué hacer con los sueltos lo decide el paso que ejecute.
- **`x` e `y` sólo aparecen en el bloque raíz**: son su sitio en el lienzo, no
  del puzle, y no significan nada para el recuento. Aquí valen 0 porque el
  programa se armó encajando bloques; arrastrándolos traen la posición real.
- **Los números viajan en `fields`**, y siempre son números escritos: el bloque
  de avanzar lleva su cantidad en un campo propio, no en un hueco donde encaje
  otro bloque, así que **no hay forma de escribir ahí una expresión**. Es la
  condición de §4.4 —las repeticiones tienen que ser números presentes en el
  programa— garantizada por la forma del bloque y no por convenio.
- **`languageVersion` es de Blockly, no nuestro.** No lo confunda con
  `formatVersion`: la versión que este contrato gobierna es la del sobre.
- **Un lienzo vacío da `"workspace": {}`**, y es un sobre válido: es lo que
  §7 llama «sin programa de partida».

**Qué montón se ejecuta cuando hay varios, decidido el 5-sep-2026 por el J5**,
que es el paso al que la primera viñeta dejaba esta decisión. Se ejecuta el
montón cuyo bloque raíz tenga la **`y` menor** —y la `x` menor, si dos empiezan a
la misma altura—: el que empieza más arriba en el lienzo. Los demás no se
ejecutan.

Lo natural sería coger el primero del array, y es justo lo que no vale: **ese
orden es de construcción, no de pantalla**, así que dos lienzos idénticos a la
vista ejecutarían montones distintos según en qué orden se armaron. La regla
tiene que poder verse. Y no se rechaza el programa por tener bloques sueltos,
aunque sería defendible: eso exige decírselo al niño, y castiga el bloque
olvidado en una esquina, que es lo más frecuente en un lienzo de niño.

**Un bloque con otros dentro, registrado el 13-sep-2026 con el primero que
existe: «saltar».** Hasta ese día este apartado avisaba de que todos los bloques
eran planos y de que el anidamiento seguía sin ejemplo, a propósito, para que
nadie supusiera su forma. Éste es un «saltar» con «girar a la derecha» y
«avanzar 1» dentro, tal y como lo serializa el editor:

```json
{
  "formatVersion": "grid-blockly-2",
  "workspace": {
    "blocks": {
      "languageVersion": 0,
      "blocks": [
        {
          "type": "codeplay_jump",
          "id": "Pq1%xd]X/,P|J+;fKFw6",
          "x": 0,
          "y": 0,
          "inputs": {
            "BODY": {
              "block": {
                "type": "codeplay_turn_right",
                "id": "eZM-Km`3q2O`+/SBQc|a",
                "next": {
                  "block": {
                    "type": "codeplay_advance",
                    "id": "{#tQ/xChQguT@OkGx-O}",
                    "fields": { "STEPS": 1 }
                  }
                }
              }
            }
          }
        }
      ]
    }
  }
}
```

- **Lo que va dentro cuelga de `inputs.BODY.block`**, y desde ahí sigue su propia
  cadena por `next`, exactamente igual que la secuencia principal. Recorrer un
  bloque con cuerpo es bajar por esa segunda cadena.
- **Un «saltar» vacío no trae `inputs`**, o lo trae con el bloque ausente. Es un
  bloque válido: salta en el sitio.
- **Dentro de un «saltar» sólo caben «avanzar» y los giros.** Un «saltar» dentro
  de otro no tiene regla de coste ni de movimiento, así que un programa que lo
  traiga **no se interpreta a medias: se rechaza entero**, como uno con un bloque
  desconocido.
- **`repetir N veces [cuerpo]`**, que §4.4 define, **sigue sin construir**. Cuando
  exista, su cuerpo usará esta misma forma de entrada, pero su nombre y su campo
  se registran entonces.

**`formatVersion` versiona las dos formas, no sólo los bloques.** El token nombra
el par: `grid` por la forma de `config` de §4.2, `blockly` por el interior del
sobre y el número por la versión. Si cambia cualquiera de las dos, el juego
desplegado no puede con ese nivel y la salida es la misma (§7), así que versionar
cada una por separado no compraría nada. **Valor actual, y único:**
`grid-blockly-2`.

**La 1 se retiró el 13-sep-2026**, cuando cambiaron las dos formas a la vez:
`config` ganó las alturas y el programa ganó un bloque con cuerpo. Un nivel en la
1 **se rechaza** como cualquier versión desconocida. Se pudo retirar sin coste
porque todavía no había ningún intento guardado que la llevara, y los niveles
sembrados en ella se reescribieron a la 2. **El día que haya intentos guardados,
cambiar de versión obligará a decidir qué se hace con ellos**, y no será gratis.

### 4.4 Cómo se cuentan los pasos, con un ejemplo resuelto

La regla es la de §3 —**un paso es una casilla recorrida o un giro**— traducida a
las tres órdenes que existen:

| Orden | Pasos |
| --- | --- |
| `avanzar N` | **N** |
| `girar` a un lado o al otro | **1** |
| `saltar` vacío | **1** |
| `saltar [cuerpo]` | **2 × pasos(cuerpo)** |
| `repetir N veces [cuerpo]` | **N × pasos(cuerpo)** — definido, todavía sin construir |

Recorrer y sumar. Sin tablero, sin saber dónde está el personaje y sin ejecutar
nada.

Sobre el tablero de §4.2 —salida en la fila 4, columna 0, mirando al norte; meta
en la fila 0, columna 4— hay dos programas que lo resuelven:

```
  PROGRAMA A — cuatro bloques          PROGRAMA B — tres bloques

  girar derecha              1         girar derecha              1
  avanzar 4                  4         repetir 2 veces
  girar izquierda            1           avanzar 4
  avanzar 4                  4           girar izquierda   2 × 5 = 10
                          ────                                 ────
                            10                                   11
```

**B tiene menos bloques y da más pasos**, y ésa es toda la lección: lo que se
puntúa son los pasos, no los bloques. El de más es el giro de la segunda vuelta
del bucle, que se ejecuta cuando ya se ha llegado. Como `optimalSteps` de ese
tablero es **10**, A es perfecto y B no.

**Se cuentan los pasos ordenados, no los ejecutados**, y la diferencia se nota en
un caso: `avanzar 4` contra un muro que está a dos casillas suma **cuatro**, no
dos. Es deliberado —chocar es ineficiencia, y la eficiencia es lo que se puntúa—
y es lo que permite contar leyendo. Lo que importa es que los dos lados cuenten
**igual**: el número que el juego le enseña al niño y el que el servidor usa para
puntuar salen de esta misma tabla.

**Pisar la meta y seguir cuenta como haber llegado.** Decidido el 5-sep-2026 al
escribir el intérprete (J5), porque hasta ese día no estaba en ninguna parte: §5
define `success` como «si el niño resolvió el nivel», y el PROGRAMA B de arriba
llega a la meta y luego gira **sin salir de la casilla**, así que ese ejemplo se
resuelve igual con cualquier criterio. El caso de irse, no. El nivel se resuelve
si el personaje pisa la meta **en algún momento** de la ejecución, aunque el
programa continúe después y lo deje en otra casilla.

Es la regla de arriba mirada desde el otro lado. Pasarse de largo es **recorrido
de más**, y el recorrido de más ya se paga: son pasos que cuentan contra
`optimalSteps` y bajan la puntuación. Cobrarlo dos veces —en la puntuación y
además invalidando el nivel— castigaría dos veces el mismo error. La alternativa
era exigir que el programa **acabara** sobre la meta; se descartó porque
convierte un error de eficiencia en un fracaso, y porque deja un caso que no hay
manera de explicarle a un niño: su programa hizo lo que había que hacer y la
pantalla le dice que no.

La consecuencia se acepta a sabiendas: **el personaje puede acabar lejos de la
meta con el resultado diciendo que llegó.** No se esconde, se enseña — la
ejecución se ve entera, así que el niño ve el momento en que la pisa y ve el
paseo que dio después.

**Agotar `stepLimit` corta la ejecución, y es lo único que la corta.** Un avance
imposible no la interrumpe —sigue con la orden siguiente y sigue costando su
paso—; quedarse sin pasos sí: las órdenes que queden no se ejecutan. El personaje
se planta donde el último paso concedido lo deje.

**Y un salto no se parte por la mitad.** Saltar a la casilla de delante cuesta
dos pasos; cuando queda **uno solo**, ese salto no se ejecuta y la ejecución se
corta antes de él. La alternativa —partirlo— dejaría al personaje colgado a media
parábola, que no es un estado del juego. La consecuencia es que el contador puede
quedarse en **uno** y no en cero: ese paso sobrante no se puede gastar en nada.

**Pisar la meta dentro del límite vale, aunque el corte llegue después.** Es la
regla de arriba sin excepción: un programa que llega en el paso ocho, sigue y se
queda sin pasos en el diez **resolvió el nivel**. Y el recuento que se enseña
sigue siendo el del programa entero, no el de los pasos que se llegaron a dar —es
el número que el servidor puede recalcular leyendo, sin ejecutar nada—. Es el
único sitio donde «pasos contados» y «pasos dados» dejan de coincidir.

**Y esta forma se deja ejecutar plegando.** Las tres órdenes son «avanza» y
«gira» aplicadas en orden sobre una pose inicial, sin modificarla, quedándose con
las intermedias para animarlas. Recorrer el programa para **contar** y recorrerlo
para **ejecutar** son la misma pasada con distinto acumulador — que es la
propiedad que hace que el cliente y el servidor no puedan discrepar.

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

- **La experiencia de un nivel nunca pasa de su tope.** Se completa hasta él en
  vez de acumularse: una partida concede lo que su puntuación mejore la mejor
  marca anterior, así que mejorar paga la diferencia y **empeorar no paga ni
  quita nada**. Reintentar nunca perjudica al niño. Sí deja registrado otro
  intento: ver §7.

  *Hasta el J10 (17-sep-2026) esto decía «se concede una sola vez por nivel»,
  medido: el tope entero al completar y cero después. Cambió con la migración
  `202606030033`, y lo que lo sustituye está medido igual —87 al superar flojo,
  13 al mejorarlo a perfecto, cero al volver a empeorar—.*
- **La puntuación nunca baja.** Se guarda la mejor histórica del niño en ese
  nivel.
- **La puntuación la calcula el servidor leyendo el programa**, y sale de la
  eficiencia: los pasos de la mejor solución sobre los usados. Resolver el nivel
  nunca puntúa cero, y no resolverlo nunca puntúa más.
- **La fecha de finalización no se mueve.** Queda la del primer éxito.
- **Cada intento se guarda entero**, con su programa, su duración y sus
  observaciones. Nada se pierde ni se sobrescribe.
- **Ningún cliente puede escribir progreso, intentos ni logros directamente.**
  Todo pasa por funciones del servidor que toman la identidad de la sesión, no de
  lo que se les mande. Un cliente no puede escribir en nombre de otro.

---

## 7. Errores que el juego debe saber encajar

El juego no habla con el servidor, pero el anfitrión le devolverá el resultado, y
hay seis casos que no debe tratar como catástrofes:

| Situación | Qué hacer |
| --- | --- |
| El nivel no existe o no está publicado | El nivel se retiró mientras se jugaba. Volver a la selección de niveles |
| No hay sesión | La sesión caducó. El anfitrión se encarga; el juego sólo debe no perder la partida |
| Fallo de red | Reintentar **no duplica experiencia** (§6), pero **sí deja otro intento registrado**. Ver abajo |
| `formatVersion` que el juego no reconoce | No intente adivinar. Ver abajo |
| `config` que no describe un tablero | Tampoco lo adivine: mismo camino que la versión desconocida. Ver abajo |
| `starterProgram` vacío | **No es un error.** Ver abajo |

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

**Un nivel puede llegar en blanco, y no significa lo mismo en los dos campos.**
El sitio donde la plataforma guarda `config`, `starterProgram` y `formatVersion`
tiene un valor de partida para cada uno, y **ninguno de los tres es una instancia
válida de §4**, así que un nivel publicado puede traerlos así. Lo que hay que
hacer con cada uno es distinto:

- **`starterProgram` vacío** significa **sin programa de partida**, y eso es un
  nivel perfectamente normal: se empieza con el espacio de bloques vacío. No
  avise de nada.
- **`config` vacío** significa **que no hay puzle**, y ahí no hay nada que jugar.
  Trátelo como una `formatVersion` desconocida: avise al anfitrión y no cargue el
  nivel.
- **`stepLimit` ausente** significa **sin límite de pasos** (§4.2), y eso es un
  nivel perfectamente normal. Presente y menor que `optimalSteps`, en cambio, es
  un nivel que nadie puede terminar: rechácelo entero, como el tablero ilegible.

**Nunca bloquee la partida esperando confirmación.** El niño debe poder seguir
jugando aunque el guardado falle.

---

## 8. Lo que este contrato todavía no fija

Escrito a propósito, para que nadie lo dé por resuelto:

- **El mecanismo concreto** por el que el juego y el anfitrión se pasan los
  mensajes. Desde que el juego dejó de ser un programa aparte (§1) esto se
  simplificó mucho —comparten página, así que basta una llamada—, pero la forma
  exacta se fija al construirlo.
- **Cuántos pasos son «perfectos» en cada nivel.** Dónde vive ese número ya está
  fijado —`optimalSteps`, §4.2—, pero el valor de cada nivel sale del diseño de
  su puzle, y los puzles están sin diseñar.
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
| `formatVersion` del nivel | `levels.programming_language`, reaprovechado. Hoy `'grid-blockly-2'` en las filas ya rediseñadas y `'javascript'` en las demás, sin `check` que lo ate |
| `formatVersion` del intento | **Dentro** de `level_attempts.submitted_code`, en el sobre de §4.3. No tiene columna |
| `program` | `level_attempts.submitted_code` (`text`, **sin `check`**) |
| `metadata` | `level_attempts.metadata` (`jsonb`), donde viaja además la puntuación del cliente |

**Por qué el sobre y no `metadata`.** No es preferencia de diseño: `level_attempts`
**no tiene columna** para la versión y `create_level_attempt` **no tiene
parámetro** —sus seis son `input_level_id`, `input_submitted_code`,
`input_is_success`, `input_score`, `input_runtime_ms` e `input_metadata`—, y la
fase A del roadmap del juego no escribe migración. Quedaba `metadata`, que es
`jsonb` libre, y se descartó por lo que dice §4.3: quien lea `submitted_code`
solo —el J10, al puntuar— se queda sin saber qué formato está leyendo. El sobre
no cuesta ni migración ni columna.

**Y el J10 lo cobró.** `count_program_steps` lee exactamente eso: abre el sobre,
comprueba la versión y cuenta. Un sobre con otra versión no puntúa en vez de
puntuar mal, que es lo que este apartado compró.

~~**`createAttempt` llama con cuatro de los seis parámetros.**~~ **Dejó de ser
cierto con el J9**, que la amplió a los seis, y **dejó de ser el camino con el
J10**: una partida se guarda hoy con `submitAttempt`, que llama a
`submit_level_attempt`. `createAttempt` sigue existiendo porque la RPC sigue
existiendo —la nueva se apoya en ella—, pero guarda el intento con la puntuación
que se le pase, así que usarla para una partida escribiría un cero.

**Los valores por defecto de las tres columnas no son instancias válidas de §4**,
y ninguno se arregla en la fase A, que no escribe migración:

| Columna | Valor por defecto | Por qué no vale |
| --- | --- | --- |
| `starter_code` | `''` (`text not null`) | La cadena vacía no es JSON |
| `validation_rules` | `'{}'::jsonb` | Es JSON, pero no describe un tablero |
| `programming_language` | `'javascript'`, **sin `check`** | No es un valor de §4.3 |

Una fila publicada puede llegar con las tres por defecto y **el juego no debe
reventar**: §7 dice qué hacer con cada una.

**Las filas que no se han rediseñado no cumplen §4, y eso es lo esperado.** Siguen con
`programming_language = 'javascript'`, con `validation_rules` del juego anterior
—`requiresAsyncAwait`, `requiresRecursion`, `requiresArray`, `requiresDebugging`—
y con `starter_code` en texto JavaScript. **Las reescribe el J7**, una migración
por nivel, y hasta entonces ningún nivel de la base se puede cargar en el juego.
Por §7 eso es un nivel que no carga, no un fallo que perseguir.

**Un mensaje del juego es UNA llamada**, desde el J10: `submit_level_attempt`
escribe el intento, el progreso y la experiencia dentro de la misma operación, y
devuelve la puntuación, la marca y la experiencia concedida.

Eran dos —`create_level_attempt` y, si procedía, `upsert_my_progress`— y dejaron
de serlo porque la puntuación sale de contar el programa: la llamada que concede
la experiencia tiene que tener el programa delante, y la segunda **no lo recibe**.
Con una sola llamada, `user_progress.attempt_count` **cuenta partidas** y
coincide con las filas de `level_attempts` de ese nivel; antes eran dos
contadores que nada sincronizaba.

~~**Nada de esto se había ejecutado nunca.**~~ Las llama la aplicación desde el
J9 y están medidas jugando. `upsertProgress` sigue sin consumidor propio en la
interfaz: quien escribe progreso es la RPC nueva, que delega en ella dentro del
servidor.

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
