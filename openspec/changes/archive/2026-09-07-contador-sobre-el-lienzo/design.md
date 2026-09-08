## Context

Ver `proposal.md` — Why. Lo que hace falta aquí es lo que el J6.1 dejó montado y
que este paso desmonta a medias.

- **La pieza que se va estaba montada para irse.** El `design.md` del J6.1 §4
  lista sus cuatro trozos y los cinco que no se tocan, y su tarea 3.5 ya lo
  comprobó **borrándolo de verdad** y deshaciendo. Este paso es esa misma
  operación, sin deshacer.
- **El contador de la ejecución vive hoy en el texto de la barra**, mezclado con
  el resultado y los avisos: `runningLine(index + 1, active.steps)` alimenta el
  mismo `<p>` que después dirá «¡Perfecto!…».
- **El contenedor del lienzo es `<div className="min-h-0 flex-1">`**, con el
  `<Canvas>` dentro. Ahí no hay nada superpuesto todavía.
- **Dentro del `<Canvas>` no hay HTML.** Los elementos de ese árbol son objetos
  de `three`; un `<div>` ahí dentro no es un `<div>`. Es la misma razón por la
  que Blockly tiene su propia frontera y no cuelga de la del motor 3D
  (`CONTEXT.md` §2.9).
- **Nada de esto se puede probar montándolo**: jsdom no implementa WebGL.

## Goals / Non-Goals

**Goals:**

- Que **nada le enseñe al niño el número a batir antes de jugar**, que es la
  decisión del usuario.
- Que el contador se vea **donde el niño está mirando**, que es el personaje.
- Que borrar la pieza salga **exactamente igual de barato** que el J6.1 prometió,
  y que si no sale, se diga.

**Non-Goals:**

- **No se toca el resultado del J6.** Ni sus textos, ni su aviso de sueltos, ni
  cuándo aparece.
- **No se rellena el hueco** que deja el aviso de sueltos al construir: es del
  usuario, y se le pregunta.
- **No entra ningún control de la ejecución** —pausa, velocidad—: el contador
  cuenta, no gobierna.
- **No se rediseña la barra.** Pierde el número y recupera el texto que tenía.

## Decisions

### 1. El contador va **superpuesto**, no dentro del `<Canvas>`

El contenedor pasa a `relative` y el contador es un elemento `absolute` en su
esquina superior derecha. La alternativa —meterlo en la escena— exige un
componente `Html` de `drei`, que **no está instalado** y que el roadmap deja
fijado a la misma versión de `three` con la trampa de la copia doble
(`CONTEXT.md` §2.9). Traer una dependencia para pintar un número encima de un
lienzo sería pagar carísimo un `position: absolute`.

Y no es una decisión de escena: el contador **no se mueve con la cámara** ni
tiene que estar anclado a ninguna casilla. Es interfaz sobre el juego.

### 2. Dice **cuántos pasos lleva dados**, y nada más

El número es `index + 1` mientras se anima el paso en curso: el paso que el
personaje **está dando**. Es el mismo que hoy va delante del «de N», sin el «de
N».

Se descarta enseñar «7 de 10» y también «faltan 3»: las dos formas dicen el
total, y el total es el número a batir con otra letra. El usuario retiró
exactamente eso.

**Y se descarta el número desnudo.** Un «7» solo en una esquina no dice de qué,
y esto lo lee un niño: va con la palabra, «7 pasos», por el `stepsLabel` que ya
existe y que escribe «1 paso» en singular. Sigue sin decir el total, que es lo
que se pidió.

### 3. Sale del intento congelado, y eso no se toca

`active.steps` deja de usarse para el texto, pero el número sigue saliendo del
**mismo sitio**: el `index` que la escena lleva sobre el intento que `start()`
congeló. La garantía del J6.1 que este paso **no puede romper** es que tocar los
bloques con el recorrido en marcha no mueva el contador, y se conserva por
construcción: la prop `program` deja de leerse en el pintado **del todo**.

De hecho este paso la refuerza: al irse `programCost`, `GameScene` vuelve a no
mirar la prop más que para pasársela a `start()` por la referencia.

### 4. La barra recupera «Ejecutando el programa…»

Vuelve `OUTCOME_MESSAGES.running`, que el J6.1 había quitado, y se va
`runningLine`. La barra queda como antes del J6.1: un texto y, al terminar, el
resultado con su aviso.

### 5. Qué se borra, y qué prueba que la separabilidad era real

La lista del J6.1 §4, ejecutada:

1. El requisito «El coste del programa se ve mientras se construye» — `REMOVED`.
2. `programCost` en `interpreter.ts` y su bloque de tests — **sustituida** por
   `hasLooseStacks`, ver §6.
3. En `GameScene.tsx`: `canvasCostLine`, el `useMemo` del coste y `visibleCost`.
   **`LOOSE_BLOCKS_NOTICE` y su condición se quedan**, con otra fuente.

Y lo que **no** debe hacer falta tocar: `countSteps`, el `Attempt`, `start()`, el
`useRef` del programa, el resultado del J6 y su `LOOSE_BLOCKS_WARNING`.

**La prueba es que `warning` no cambie ni una letra.** Hoy es
`!isRunning && active !== null && active.rootCount > 1`, y no menciona a la pieza
que se va; era `noticeLooseBlocks` quien miraba a `warning`, y no al revés. Si al
borrar hubiera que tocar esa línea, la separabilidad era de mentira y hay que
decirlo en vez de arreglarlo por dentro.

**Y hay un resto que sí se toca, sin ser de la lista**: `interpreter.ts` importó
el **valor** `openProgram` para `programCost`, y al irse ésta vuelve a bastarle
el tipo. Es la consecuencia de la que el J6.1 avisó, deshecha.

### 6. El aviso de sueltos se queda, y por eso `programCost` no desaparece: se encoge

Se le preguntó al usuario si retirar el aviso junto con el coste, porque su
motivo **no lo cubría** —ese aviso no enseña ningún número y no presiona a
nadie—, y **decidió conservarlo**: evita que el niño crea que su programa está
mal cuando lo que pasa es que no se ejecutó, que es el fallo en silencio del J5.

Eso deja al lienzo con **una sola pregunta** que responder mientras se construye:
si hay secuencias de sobra. Ya no hace falta contar pasos para nada.

Entra **`hasLooseStacks(program: Program | null): boolean`** en `interpreter.ts`,
y sustituye a `programCost` en vez de heredarla. Las alternativas y por qué no:

- **Dejar `programCost` como está** y mirar sólo su `rootCount`: deja `steps`
  calculado y **sin usar**. Código muerto a medias, del que no da error y del que
  el día de mañana alguien vuelve a pintar «porque ya estaba ahí».
- **Devolver el número de montones** —`number | null`—: es un número que **nadie
  enseña**, y el requisito nuevo prohíbe expresamente que el aviso lleve cifras.
  El J6 ya decidió que el aviso **no promete un número**: contar lo que no se
  ejecuta para poder decir una cantidad más grande no compra nada.
- **Un booleano**: responde exactamente lo que la barra pregunta, y colapsa en
  `false` los tres casos en que no hay nada que señalar —sin programa, ilegible y
  lienzo vacío—, igual que `programCost` colapsaba en `null` y por el mismo
  motivo: la pantalla no los distingue.

Se elige el booleano. Y sigue viviendo **fuera del componente** por lo de
siempre: ahí dentro esos casos no se pueden probar.

## Risks / Trade-offs

**El contador tapa una casilla del tablero** → Va en la esquina superior derecha,
que en la cámara fija de `debugLevel` es cielo. Se mira en el navegador; si
tapara algo, se mueve, que es una clase de Tailwind. El J7.4 revisará la cámara
con los modelos delante de todas formas.

**Un número que aparece y desaparece sobre la escena distrae** → Sólo está
mientras el recorrido corre, que es cuando el niño mira ahí. Antes vivía en la
barra, debajo, donde había que apartar la vista del personaje para leerlo — que
es justamente lo que el usuario quiere evitar.

**Se borra una garantía que tenía un día de vida** → Es el segundo `REMOVED` de
esta capacidad, y a diferencia del primero no se retira por estar mal montada.
`ROADMAP.md` §1.3 punto 8 manda leer las líneas borradas del spec al archivar, y
aquí toca de verdad: se van siete escenarios.

**El aviso de sueltos se queda sin el número que lo explicaba** → Antes acompañaba
a un coste y decía de qué montón era ese coste; ahora va solo. No pierde sentido:
lo que dice es que hay bloques de más y cuál se ejecutará, y eso se entiende sin
cifra ninguna. El J6 ya lo redactó **sin prometer un número**.

## Migration Plan

No hay ninguna. No hay base de datos, ni datos guardados, ni nada desplegado: la
pantalla vive en el banco de pruebas, que sólo existe en desarrollo. Revertir es
revertir el commit — y el J6.1 entero está en `fed5f54` si alguna vez hubiera que
recuperar la pieza.
