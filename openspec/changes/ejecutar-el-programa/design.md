## Context

El motivo está en `proposal.md` — Why. Lo que condiciona el **cómo** es lo que ya
está escrito y medido:

- **`movement.ts` se escribió para esto.** `turn` y `advance` son puras, no mutan
  la pose que reciben y `advance` devuelve `blockedBy` «aunque hoy no lo lea
  nadie». Ejecutar un programa es plegar esas dos funciones sobre la pose inicial
  quedándose con las intermedias. El intérprete **no reimplementa ninguna regla
  de movimiento**.
- **`program.ts` se niega a saber qué hay dentro del sobre**, y su comentario dice
  por qué: «conocerla sería escribir aquí una segunda copia del formato». La
  forma la fija el contrato §4.3 y quien la conozca es un módulo nuevo.
- **El contrato §4.4 ya decidió que se cuentan los pasos ordenados, no los
  ejecutados.** Eso ata al intérprete: chocar no puede detener el programa.
- **§4.3 dejó dos cosas explícitamente al paso que ejecute**: qué hacer con los
  montones sueltos, y —por omisión— qué pasa al pisar la meta y seguir, que §5
  vuelve crítico porque `success` es el único dato que la plataforma se cree sin
  poder comprobarlo.
- **Las dos fronteras del bundle mandan.** Nada por encima de una frontera
  diferida importa lo que ésa aísla, y **los módulos puros van con su frontera**:
  `interpreter.ts` no arrastra nada, pero importarlo desde el laboratorio lo
  metería en el trozo principal.
- **Una ventana oculta suspende los frames sin que la página se entere**
  (`CONTEXT.md` §2.9). Éste es el primer paso que vive de animación de verdad.

Este cambio **no toca la frontera del store de salones ni el esquema de la base
de datos**. No hay migración, no hay `db push` y `useClassrooms()` no aparece por
ninguna parte: la fase A del juego no habla con Supabase.

## Goals / Non-Goals

**Goals:**

- Que el intérprete sea **puro y probado**: sin Blockly, sin `three` y sin JSX,
  como nacieron `movement.ts` y `program.ts`.
- Que **el recorrido** —no sólo la pose final— sea el resultado del intérprete,
  porque es lo que la escena anima y lo que el J6 va a extender.
- Que el trozo principal **no suba** de 624,78 kB.
- Que las dos decisiones que este paso toma por primera vez —la meta pisada de
  paso y el montón que se ejecuta— queden **en el contrato**, no en el código.

**Non-Goals:**

- **No se diseña el aspecto de la ejecución.** Los botones son del sistema visual
  y el personaje sigue siendo un cubo; cámara, luz y modelos son del J7.4.
- **No se cuenta nada.** El intérprete no suma pasos ni los expone: el recuento
  del J6 sale de **leer el programa**, no de ejecutarlo, y son dos pasadas
  distintas a propósito (§4.4).
- **No se decide cómo llega el programa desde la base.** El `starterProgram` es
  del J8; aquí el programa viene del editor de al lado.

## Decisions

### 1. Un módulo nuevo, `interpreter.ts`, y la frontera con `program.ts` escrita

`program.ts` **abre el sobre** y devuelve el `WorkspaceState` sin mirar dentro;
`interpreter.ts` **lee la carta**. Son dos módulos y no uno porque el sobre lo
usan el J8 y el J9 sin necesitar ejecutar nada, y meter la forma de Blockly
dentro de `program.ts` sería exactamente la segunda copia del formato contra la
que avisa su comentario.

El intérprete expone dos funciones, y la separación no es estética: la primera
convierte JSON en órdenes y **no sabe qué es un tablero**; la segunda ejecuta
órdenes y **no sabe qué es Blockly**. El J6 cuelga su recuento de la primera, sin
tablero y sin ejecutar, que es lo que §4.4 exige.

```
readProgram(workspace)  →  Order[] | null      // JSON del editor → órdenes
runProgram(config, orders)  →  Run             // órdenes → recorrido + meta
```

`Order` es `{ kind: 'advance', steps }` o `{ kind: 'turn', side }` — las tres
órdenes de §4.4 menos `repetir`, que no existe.

**Alternativa descartada:** un solo `run(config, workspace)`. Ahorra una línea y
le quita al J6 el punto de enganche, obligándole a volver a partir esto.

### 2. El recorrido lleva **una entrada por paso ordenado**, incluidas las que no se pudieron dar

```ts
interface RunStep { pose: Pose; blockedBy: Blocker | null }
interface Run { steps: RunStep[]; success: boolean }
```

`avanzar 4` produce **cuatro** entradas aunque el muro esté a dos: las dos
últimas repiten la pose y traen `blockedBy`. No es un detalle de animación, es
§4.4 metida en la estructura — **lo natural al escribir esto es parar, y parar
rompe el recuento**. Con esta forma, el recorrido que se ve en pantalla tiene
tantos tramos como pasos cuenta el contrato, así que el número del J6 y el del
servidor no pueden discrepar de lo que el niño vio.

Eso **no** significa que el J6 cuente `steps.length`: contar tiene que salir de
leer el programa (§4.4), sin tablero. La coincidencia es la comprobación, no la
implementación.

`success` va en el `Run` y no se calcula fuera porque hace falta el recorrido
entero para saberlo — ver la decisión 4.

### 3. Un programa que no se entiende se rechaza **entero**, y `readProgram` devuelve `null`

Misma forma y mismo motivo que `openProgram`: un bloque de tipo desconocido o un
`STEPS` que no sea un número entero positivo **no se saltan**. Es lo que el
contrato §4.2 manda con una casilla de clase desconocida —«se rechaza el nivel
entero»— por la misma razón: un programa ejecutado a medias se juega hasta el
final y produce un resultado que nadie puede volver a explicar.

Hoy el único productor es nuestro editor, así que este camino no debería
dispararse nunca; el día que el programa venga de la base (J8) o de un intento
guardado, sí.

### 4. Pisar la meta y seguir **cuenta como haber llegado**

Nadie lo había decidido: §5 define `success` como «si el niño resolvió el nivel»
y el programa B de §4.4 llega y luego gira **sin salir de la casilla**, así que
ese ejemplo funciona con cualquier criterio. El caso de irse, no.

Se decide **a favor de contarlo**, y el argumento es de coherencia con la única
regla parecida que ya está tomada: `avanzar 4` contra un muro suma cuatro porque
**chocar es ineficiencia, y la eficiencia es lo que se puntúa**. Pasarse de largo
es exactamente lo mismo —recorrido de más—, y ya se paga: los pasos sobrantes
bajan la puntuación contra `optimalSteps`. Cobrarlo dos veces, además invalidando
el nivel, castigaría dos veces el mismo error.

**Alternativa descartada:** exigir que el programa **acabe** sobre la meta. Se lee
más limpio en pantalla —el personaje termina donde debía— y es lo que haría
pensar la palabra «llegar». Se descarta porque convierte un error de eficiencia
en un fracaso, y porque abre un caso desagradable de explicar a un niño: el
programa que pasa por la meta y sigue **hizo** lo que había que hacer y la
pantalla le diría que no.

**Consecuencia visual, y se acepta a sabiendas:** el personaje puede acabar lejos
de la meta con el resultado diciendo que llegó. Se mitiga sin inventar nada: la
ejecución se ve entera, así que el niño ve el momento en que la pisa y ve el
paseo de más que dio después. La pantalla de resultado del J6 es la que puede
darle nombre a eso.

Va a `CONTRATO-DE-INTEGRACION.md` §4.4, junto a la regla de la que se deriva.

### 5. Con varios montones se ejecuta el de **más arriba**

§4.3 lo dejó abierto: «para el juego, el programa es el montón que empieza donde
corresponda, y qué hacer con los sueltos lo decide el paso que ejecute».

Se ejecuta el montón cuyo bloque raíz tenga la **`y` menor** —y la `x` menor a
igualdad de `y`—, que son las coordenadas que §4.3 documenta en el bloque raíz.

**Alternativa descartada:** el primero del array. Es una línea menos y es
**invisible**: ese orden es de construcción, no de pantalla, así que dos lienzos
idénticos a la vista podrían ejecutar montones distintos según en qué orden se
armaron. La regla tiene que poder verse.

**Alternativa descartada:** no ejecutar nada si hay más de un montón. Es
defendible —obliga al niño a limpiar—, pero exige una forma de decírselo que este
paso no tiene, y castiga el bloque olvidado en una esquina, que es lo más
frecuente en un lienzo de niño.

### 6. **No entra `@react-spring/three`**, y `useFrame` hace las tres interpolaciones

El roadmap la asigna a este paso, pero lo que este paso necesita es esto:

| Qué | Cómo |
| --- | --- |
| Posición entre dos casillas | Interpolación lineal entre los dos centros |
| Giro | Interpolación del ángulo **por el lado corto** — de norte a oeste es un cuarto de vuelta, no tres |
| Topetazo | La misma interpolación de posición con ida y vuelta, a una fracción de casilla |

Las tres van sobre el mismo reloj —el `delta` de `useFrame`, que ya viene con
fiber—, y ese reloj es además el que decide cuándo termina un paso y empieza el
siguiente. Traer un segundo planificador para animar y dejar el avance del
recorrido en el primero es tener dos relojes para una cosa.

`DISENO-DEL-JUEGO.md` §5 avisa de que una dependencia que nadie importa es peso
sin evidencia, y el trozo de la escena ya va por 825 kB. **Y la evidencia llega
en el J7.4**: los 25 clips con esqueleto del personaje de Kenney son de esa
pasada, y ahí se decide con el modelo delante si la interpolación propia se queda
corta. Es el mismo trato que el J2 le dio a `drei` y por el mismo motivo.

**Alternativa descartada:** instalarla ahora porque el roadmap la nombra aquí.
`ROADMAP-JUEGO.md` §2 dice literalmente que las librerías «entran en el paso que
primero las importe», no en el que las tenía apuntadas.

Queda comprobado igualmente que **`three` sigue en una sola copia 0.170.0** — el
chequeo que el J2 dejó escrito para el ecosistema 3D y que nunca se había
ejecutado.

### 7. La escena es la dueña del estado, y el programa **baja como dato**

`StudentGameLabModule` ya tiene el programa en un `useState`; pasa a bajarlo por
`GameSceneLoader` hasta `GameScene`. Lo que **no** sube es el intérprete: se
importa desde `GameScene.tsx`, bajo la frontera, y así viaja en el trozo de la
escena con el recorrido que el J6 extenderá. `GameSceneLoader` recibe el tipo del
sobre y nada más — un tipo desaparece al compilar, igual que en
`BlockEditorLoader`.

Dentro de la escena el estado es el mínimo: el recorrido en curso y por qué paso
va. La pose que se pinta **se deriva** del recorrido y del índice; no se guarda
aparte, para no tener dos versiones de dónde está el personaje.

**El programa se lee en el momento de pulsar «Ejecutar»**, a través de una
referencia que se actualiza en cada render — el mismo patrón que `BlockEditor`
usa para publicar hacia arriba. Así, mover bloques con la ejecución en marcha no
altera lo que se está ejecutando, y volver a pintar la escena no la reinicia.

### 8. Los botones viven **dentro** del juego

`GameScene.tsx` deja de ser sólo un `<Canvas>` y pasa a ser el lienzo más una
barra con «Ejecutar», «Reiniciar» y el resultado. Los controles no pueden ir
dentro del `<Canvas>` —ahí los elementos son objetos de `three`, no etiquetas de
HTML— y **no deben ir en el laboratorio**: la pantalla de nivel del J8 tendría
que volver a construirlos, y con ellos el cableado de la ejecución acabaría por
encima de la frontera.

### 9. `window.codeplayGame` se va con su requisito

No es limpieza oportunista: la consola y la ejecución escriben **la misma pose**,
y dejarlas juntas es dejar dos dueños de un mismo estado —una llamada a
`forward()` a mitad de un recorrido dejaría al personaje en una casilla que el
recorrido no contempla—. Su requisito se retira en el mismo cambio, que es lo que
lo convierte en el **primer `REMOVED` del proyecto**.

## Risks / Trade-offs

**[La ventana oculta suspende los frames y parecerá un fallo del intérprete]** →
Es el riesgo que `CONTEXT.md` §2.9 dejó anotado para este paso. Sin frames no hay
`useFrame`, así que un recorrido lanzado con la ventana detrás **se queda
quieto**, y `document.hidden` seguirá diciendo `false`. Mitigación: **verificar
siempre con la ventana delante**, y si «no va», sospechar de esto antes que del
código.

**[Avanzar el recorrido desde el bucle de frames]** → El paso termina dentro de
`useFrame` y avanzar el índice es un `setState` desde el bucle de render. Ocurre
una vez por paso —del orden de tres o cuatro por segundo—, no por frame.
Mitigación: que el frame **sólo** decida «este tramo terminó»; toda la aritmética
de qué viene después vive en el estado de React, y el `Run` es inmutable.

**[El montón de más arriba falla en silencio, y de forma verosímil]** → Un niño
saca un bloque de la caja, lo suelta cerca del borde de arriba y construye su
programa debajo: **el bloque suelto es el que se ejecuta**. El personaje gira una
vez y se para, la barra dice que no llegó, y el niño **no tiene forma de
distinguir «mi programa está mal» de «mi programa no se ejecutó»**. Es el espejo
de la alternativa descartada y es peor en una cosa: «no ejecutar nada» falla
ruidosamente —no se mueve nadie, se nota—, y esto falla callando. La regla se
queda porque la alternativa exige decírselo al niño y este paso no tiene dónde.
Mitigación, y **es un encargo para el J6**: la pantalla de resultado es el sitio
natural para «te sobraron bloques sueltos», y el intérprete ya sabe cuántos
montones había cuando eligió. Queda anotado aquí porque si no, en el J6 nadie
sabrá que hay algo que contar ahí.

**[`React.StrictMode` monta dos veces en desarrollo]** → Ya mordió al editor. Aquí
el efecto sería una ejecución duplicada si el arranque colgara de un efecto.
Mitigación: la ejecución arranca **de un evento**, no de un efecto.

**[El recorrido se calcula entero antes de animarlo]** → Un programa con
`avanzar 10` repetido produce cientos de entradas, y con `repetir` (J6 en
adelante) podrían ser miles. Mitigación: hoy el editor acota `avanzar` a 10 y no
hay bucles, así que el techo es el número de bloques por diez; si algún día deja
de serlo, el intérprete es puro y se puede acotar sin tocar la escena.

**[Retirar un requisito por primera vez]** → El punto 8 de `ROADMAP.md` §1.3 pide
leer las líneas borradas del spec principal al archivar y confirmar que lo
suprimido es exactamente ese requisito y sus escenarios. **Ese punto no se ha
ejercitado nunca.** Mitigación: es una tarea explícita, y el `## Purpose` —que
cuenta las garantías y ningún delta transporta— se reescribe en la misma parada.

## Migration Plan

No hay despliegue ni migración: la fase A no toca Supabase y el cambio vive
entero en `apps/web/src/game/` más la pantalla del laboratorio, que sólo existe
en desarrollo. Revertirlo es revertir el commit.

Lo único que no se revierte solo son las **dos decisiones que se escriben en el
contrato** (§4.3 y §4.4), y por eso van a un documento y no al código.
