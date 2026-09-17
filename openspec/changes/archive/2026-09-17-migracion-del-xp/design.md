## Context

Ver `proposal.md` — Why. Aquí va lo propio del cómo: quién cuenta, quién concede
y qué se hace con lo que ya está escrito en la base.

Lo que ya estaba puesto y esto aprovecha:

- **El programa se guarda entero desde el J9**, en su sobre con la versión dentro
  (contrato §4.3), y **se lee**: medido el 17-sep-2026 con el lector real del
  cliente contra las 16 filas de `level_attempts`, los 14 del J9 se abren y sus
  pasos leídos coinciden con `metadata.steps` **en los catorce**. Los otros dos son
  del `curl` viejo y no son el sobre.
- **`best_score` ya está acotado de 0 a 100 y nunca baja** en
  `upsert_my_progress`: `greatest(current, nuevo)`. La marca de agua no necesita
  columna nueva, y eso lo decidió `DISENO-DEL-JUEGO.md` §3 antes de este paso.
- **`optimalSteps` de los nueve niveles está comprobado en las dos direcciones**
  por `levelSolutions.test.ts`: la solución a mano llega con esos pasos y ninguna
  búsqueda encuentra nada más corto. La puntuación se calcula contra ese número,
  así que ese test es su cimiento.
- **`countSteps` del cliente es la regla del contrato §4.4** y el número que se
  le enseña al niño ya sale de ahí, no de la ejecución.

## Goals / Non-Goals

**Goals:** que la puntuación la calcule el servidor leyendo el programa; que la
experiencia se conceda por diferencia de marca sin columna nueva; que lo que la
pantalla enseña sea lo que de verdad se concedió; y que las marcas anteriores
queden cuadradas con la experiencia que ya se cobró.

**Non-Goals:** la barra por tramos de 300 (J11); retirar las estrellas (paso 22);
los logros (paso 22), aunque la RPC nueva sea el sitio donde se concederán;
`repetir N veces`, que el editor no construye.

## Decisions

### El recuento vive en la base, en SQL, no en el cliente

Es lo que el contrato §3 lleva fijado desde el 3-sep-2026 y no se reabre: el
servidor ya tiene que leer el programa para conceder logros, y contando ahí no se
escribe la misma lógica dos veces. Que además cierre la puerta a ponerse la
experiencia que uno quiera desde la consola del navegador es efecto secundario.

**El JSON de Blockly se deja recorrer desde SQL**, que era la duda que el J4 dejó
abierta —«si resulta incómodo, se cambia en el J10, con casos reales delante»—.
Con los casos delante: son dos funciones recursivas sobre `jsonb`, una para la
cadena de `next.block` y otra para el cuerpo del salto, y los operadores `->` y
`->>` bastan. **No hace falta traductor propio ni formato nuevo.**

La función de recuento SHALL replicar `interpreter.ts` orden por orden, incluida
la parte que no es del recuento pero decide qué se cuenta:

| Regla | Dónde está en el cliente |
| --- | --- |
| Se cuenta el montón de `y` menor, y `x` menor a igual altura | `firstOnCanvas` |
| La cadena termina donde `next.block` deja de ser un objeto | `readChain` |
| `avanzar N` exige un entero ≥ 1 en `fields.STEPS`, o el programa es ilegible | `readOrder` |
| Un salto dentro de otro deja el programa ilegible | `readOrder` |
| Un tipo de bloque desconocido deja el programa ilegible | `readOrder` |
| Sobre con otra `formatVersion` → ilegible | `openProgram` |

**Ilegible es cero, no un rechazo.** El intento se guarda igual, con su programa
intacto: perder el registro de una partida que ocurrió sería peor que no
puntuarla, y es la misma proporción que el contrato §7 aplica a todo lo demás.

### Una sola RPC, `submit_level_attempt`

La primera decisión del paso, y la que cambia el cliente. Las tres salidas eran
parámetro nuevo en el `upsert`, leer la puntuación de la fila del intento, o una
RPC que haga las dos cosas.

**Gana la tercera.** El motivo no es elegancia: `upsert_my_progress` **no recibe
el programa** y es la que concede la experiencia, así que con dos llamadas hay que
o mandarle el programa otra vez —y contarlo dos veces por partida— o hacer que
busque la fila que la otra acaba de escribir, acoplándose a un orden que nada
garantiza: `submitAttempt.ts` hace las dos llamadas **aunque la primera falle**, a
propósito, y con la segunda leyendo de la primera esa decisión dejaría de tener
sentido.

Tres cosas más que caen del lado de la RPC única:

- **Sincroniza los dos contadores.** `attempt_count` contaba llamadas al
  `upsert`, no filas de `level_attempts`, y «nada los sincroniza» estaba escrito
  en §2.7 como consecuencia heredada. Con una llamada, coinciden.
- **Devuelve lo que la ventana necesita** —puntuación, marca y experiencia
  concedida— en la misma respuesta, sin una segunda consulta.
- **Acerca el código al contrato §3**, que dice «un solo mensaje». Las dos
  llamadas del apéndice existían porque no había una RPC que hiciera las dos
  cosas; ahora la hay, y el apéndice se actualiza.

**Las dos RPC viejas se quedan y `upsert_my_progress` cambia su concesión.** No se
borran: están medidas, documentadas y son la única vía si algún día hace falta
escribir progreso sin intento. Pero la concesión de experiencia por transición a
completado **tiene que morir ahí también**, porque si no la base se queda con dos
reglas contradictorias y la vieja sigue regalando el tope entero. La RPC nueva
delega en ella pasándole la puntuación como marca: **una sola función escribe
progreso y concede experiencia**, y la de arriba se ocupa del intento y de contar.

### La regla de puntuación: `redondeo(100 × óptimo ÷ pasos)`

Decidida el 17-sep-2026 tras medir tres candidatas contra los nueve programas
resueltos a mano y sus excesos —un giro olvidado, dos, un «avanzar 3» de sobra y
el programa duplicado—, todos comprobados con el intérprete real para confirmar
que **siguen superando el nivel**:

| Regla | M1N1, óptimo 4 | M3N1, óptimo 10 | M2N2, óptimo 25 |
| --- | --- | --- | --- |
| **Proporcional**, la elegida | 100 · 80 · 67 · 57 · 50 | 100 · 91 · 83 · 77 · 50 | 100 · 96 · 93 · 89 · 50 |
| Lineal, cero al doble | 100 · 75 · 50 · 25 · 0 | 100 · 90 · 80 · 70 · 0 | 100 · 96 · 92 · 88 · 0 |
| Diez por paso | 100 · 90 · 80 · 70 · 60 | 100 · 90 · 80 · 70 · 0 | 100 · 90 · 80 · 70 · 0 |

*(exacta, +1 paso, +2, +3, programa duplicado)*

Se elige la proporcional porque **es literalmente la eficiencia** que
`DISENO-DEL-JUEGO.md` §3 dice premiar; porque **superar siempre paga algo**, que
para el niño más pequeño importa más que castigar el bloque olvidado; y porque
reproduce sola el ejemplo del propio diseño —80 en la primera pasada, 20 al
mejorarla—. Su precio, que se acepta a sabiendas: es la más dura con el nivel 1,
donde un bloque suelto cuesta 20 puntos porque el óptimo son 4 pasos.

Está en **una función de una línea a cada lado**, así que cambiar de regla es
cambiar esas dos líneas y volver a puntuar. Si no convence al verla en pantalla,
eso es lo que cuesta.

### Fallar no puntúa, y no es lo mismo que puntuar cero

Con la regla vieja, «fallar no concede nada» lo garantizaba la transición a
completado. Al pasar la concesión a la marca, hay que decirlo aparte: **un intento
sin éxito puntúa cero y no mueve la marca**, por eficiente que sea su programa.
Si no, un niño podría cobrar experiencia sin resolver el nivel, y en el mundo 3
—donde quedarse sin pasos es lo normal— sería lo habitual.

### Lo que se hace con las marcas que ya existen

**Decisión del usuario, 17-sep-2026: recalcular desde el mejor intento legible.**
Es la que había que tomar porque los tres niveles superados de la base de pruebas
**ya cobraron el tope entero** con la regla vieja y sus marcas están en 0, 0 y 90:
dejarlas así les deja volver a cobrar hasta 100 cada uno.

La migración, por cada fila de `user_progress`:

1. La marca pasa a ser la **mejor puntuación de sus intentos con éxito legibles**,
   y nunca baja de la que ya tenía.
2. `profiles.total_xp` se recalcula como **la suma de lo que conceden las marcas
   más lo que dieron los logros** —hoy cero filas, pero se suma para no dejar la
   cuenta atada a que siga vacía—.

Medido contra la base antes de escribirla: dos marcas pasan de 0 a 100 —12/12 y
10/10—, la de 90 se queda porque su único intento con éxito guarda
`{"blocks":[{"t":"forward"}…]}`, que no es el sobre del contrato, y `total_xp`
pasa de 300 a 290. Los nueve intentos fallidos de «La torre» no dan marca.

**Lo que NO se hace: rellenar `score` en las filas de intentos viejas.** Se podría
—los 14 del J9 son legibles—, y no se hace: la puntuación de un intento es de
cuando se jugó, reescribirla a posteriori borra la única señal de que aquellas
partidas se jugaron sin puntuación, y **nada la lee**. Lo que sí lee alguien es la
marca, y esa se recalcula.

### La pantalla enseña la puntuación al instante y la experiencia cuando llega

La ventana no puede esperar al servidor —contrato §7— pero la experiencia
concedida **depende de la marca anterior**, que el cliente no tiene. La salida es
partir el número en dos:

- **La puntuación se enseña al instante**, calculada por el cliente con la misma
  regla. El contrato §3 lo permite explícitamente: «puede mostrar su propia
  estimación, pero la que cuenta es la del servidor».
- **La experiencia concedida se enseña cuando llega la respuesta**, y si el
  guardado falla no se enseña ninguna. Enseñar un número inventado es exactamente
  lo que este paso viene a arreglar.

Y la puntuación del cliente **se guarda entre las observaciones**, al lado de la
del servidor, que es el cotejo que el J9 dejó preparado con los pasos.

## Risks / Trade-offs

- **Dos recuentos que pueden separarse** → el mismo riesgo que el J9 dejó
  anotado, y la misma mitigación: las dos cuentas viajan juntas en la misma fila.
  Lo que este paso añade es que ahora se cotejan **dos números** por partida, los
  pasos y la puntuación.
- **`optimalSteps` mal sembrado deja el 100 fuera de alcance sin que salte nada**
  → sigue siendo verdad y ahora muerde de verdad, porque de ese número sale la
  experiencia. Mitigado por `levelSolutions.test.ts`, que lo comprueba en las dos
  direcciones para los nueve niveles; un nivel nuevo sin su entrada ahí es un
  nivel sin comprobar.
- **La experiencia recalculada baja** para quien ya había jugado: 300 → 290 en la
  cuenta de pruebas. Es lo decidido, y es la única forma de que las marcas y la
  experiencia digan lo mismo. En una base con niños de verdad habría que
  pensárselo dos veces; hoy las únicas filas son de la verificación.
- **Concesión duplicada por `React.StrictMode`** → el J9 ya lo resolvió mandando
  desde el manejador y no desde un efecto, y sigue en pie. Lo que cambia es el
  daño: antes un intento de más, ahora también experiencia de más. Se comprueba
  jugando, no razonando.
- **La regla puede no convencer en pantalla** → cuesta dos líneas y una nueva
  pasada de puntuación. El usuario cambia de idea al ver la pantalla y es lo
  normal; el diseño se deja barato de rehacer a propósito.

## Migration Plan

1. Escribir `202606030033_score_by_steps.sql`: recuento, puntuación, RPC nueva,
   concesión por marca en `upsert_my_progress` y recálculo de las marcas.
2. Contarle al usuario en palabras qué cambia y esperar su visto bueno.
3. **El usuario** lanza `npx supabase db push`. La sesión sólo comprueba con
   `npx supabase migration list`.
4. **El usuario** lanza `npx supabase gen types`. Hasta entonces el cliente no
   puede llamar a la RPC nueva sin que `tsc` falle.
5. Terminar el cliente, y verificar jugando los tres casos que hay que provocar:
   superar flojo, volver a superar mejor y volver a superar peor.

**Vuelta atrás.** La migración es `create or replace` sobre funciones, así que
deshacerla es volver a aplicar la 0006 —que está en el repositorio entera— y
dejar de llamar a la RPC nueva. Lo que **no** se deshace solo es el recálculo de
las marcas: los valores anteriores quedan en este documento y en §2.7 de
`docs/CONTEXT.md` —0, 0 y 90, con `total_xp: 300`—, y son cuatro filas.
