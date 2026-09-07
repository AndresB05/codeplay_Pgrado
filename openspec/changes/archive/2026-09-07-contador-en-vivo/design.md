## Context

Ver `proposal.md` — Why. Lo que hace falta aquí es lo que ya está en el código y
condiciona la forma de este paso.

**El hallazgo que decide el paso, y que no está en ningún `.md`: el programa vive
a propósito FUERA del estado de React.** En `GameScene.tsx`:

```ts
const latest = useRef(program);
latest.current = program;
```

con este comentario del J5: «El programa se lee al pulsar, no al recibirlo: si
viajara en el estado, mover un bloque a mitad de recorrido cambiaría lo que se
está ejecutando.»

Y la pieza de «mientras construye» necesita **exactamente lo contrario**:
reaccionar al programa **según llega**. Choca de frente con esa decisión, y no se
puede romper.

Lo demás que ya está:

- **`countSteps(orders)`** es pura, está probada y **no ejecuta nada**. Es el
  mismo número para las dos piezas, y lo único que comparten.
- **`readProgram(workspace)`** devuelve `{ orders, rootCount } | null`.
- **El estado de la escena ya es un valor discriminado** —`unreadable | empty |
  run`— con `steps` y `rootCount` dentro, y **`index` ya lleva el paso en curso**:
  es lo que `Character` recibe para animar. Las dos piezas nuevas se apoyan en lo
  que hay; ninguna necesita estado nuevo.
- **El editor publica en cada cambio.** `BlockEditor` llama a `report()` con todo
  evento que no sea de interfaz, así que la prop `program` **ya llega** con cada
  bloque que se mueve. La pieza de construcción no necesita que nadie avise: sólo
  necesita mirar la prop en el render.
- **Nada de esto se puede probar montándolo.** jsdom no implementa WebGL, así que
  un test que monte `<Canvas>` prueba el simulacro. Es el motivo por el que el J6
  no añadió tests de `GameScene`.

## Goals / Non-Goals

**Goals:**

- Que el niño vea lo que cuesta su programa **sin contar los pasos a ojo**, ni
  mientras lo construye ni mientras corre.
- Que las dos piezas queden **independientes de verdad**: que retirar la de
  construcción sea borrar, no rehacer.
- Que los cuatro casos que muerden —sin programa, ilegible, vacío y montones
  sueltos— queden **donde se puedan probar**, y no repartidos por un componente
  que no se puede montar.

**Non-Goals:**

- **No se toca el arranque de la ejecución.** `start()` sigue leyendo el programa
  del `useRef` al pulsar; este paso no cambia ni una línea de cómo se ejecuta.
- **Ninguna maquetación nueva.** El editor al lado del juego es del J8.
- **Ningún control de la ejecución** —pausa, paso a paso, ir más despacio—. El
  contador dice por dónde va; no ofrece gobernarlo.

## Decisions

### 1. Dos números, **dos fuentes**, y no se mezclan nunca

- El coste **mientras construye** sale de la **prop `program` en el render**.
- El contador **mientras se ejecuta** sale del **intento congelado** —el
  `attempt` que `start()` dejó puesto y el `index` que la escena ya lleva—,
  **jamás de la prop**.

Sacar el segundo de la prop es el fallo exacto que el J5 evitó: mover un bloque a
mitad de recorrido cambiaría el contador que el niño está viendo correr, y le
enseñaría un recorrido que no es el que tiene delante. **Si los dos acabaran
saliendo del mismo sitio, está mal montado.**

Y leer la prop para pintar **no rompe la decisión del J5**, aunque lo parezca:
ese `useRef` existe para que `start()` lea el valor fresco sin arrastrar
closures, no para prohibir que el componente pinte lo que ya recibe. La prop
llega igualmente en cada render; lo que el J5 prohibió es que **la ejecución**
dependa de ella.

### 2. `programCost(program)`, pura, en `interpreter.ts`

Entra:

```ts
programCost(program: Program | null): { steps: number; rootCount: number } | null
```

Abre el sobre, lee el programa y cuenta. Devuelve `null` **en los tres casos en
los que no se pinta nada**: no hay programa todavía, el sobre o el programa no se
pueden leer, y el lienzo no tiene ninguna orden.

La alternativa era encadenar `openProgram` + `readProgram` + `countSteps` dentro
del componente, que son tres líneas. **Se descarta porque esas tres líneas
esconden los cuatro casos que muerden**, y dentro de `GameScene.tsx` ninguno se
puede probar: jsdom no monta `<Canvas>`. Sacados a una función pura, los cuatro
son tests corrientes de los que ya hay catorce en ese archivo.

**Los tres casos se colapsan en `null` a propósito**, y por eso esto no es una
copia de lo que hace `start()`: la barra del J6 **tiene que distinguirlos** —cada
uno lleva su texto—, y el indicador de construcción **no debe**, porque en los
tres no pinta nada. Dos lectores del mismo encadenado con dos colapsos distintos,
y cada uno dice cuál es el suyo.

Va **en `interpreter.ts`** y no en un módulo nuevo: es la misma lectura que ya
vive ahí, con `openProgram` delante.

**Y trae la única consecuencia estructural del paso**: `interpreter.ts` hoy
importa de `program.ts` **sólo un tipo**, y pasa a importar un **valor**. El
grafo no cambia de lado de la frontera —`GameScene` ya importa los dos—, y la
dirección es la buena: **el que conoce la carta importa al que sólo conoce el
sobre**, nunca al revés, que es justo lo que el comentario de `program.ts`
protege. Lo que queda por saber es si mueve algo de trozo, y eso se mide.

### 2b. Y con ella entra el test de que **las dos cadenas dan lo mismo**

`start()` y `programCost` hacen **la misma composición por caminos separados**:
los dos abren el sobre, leen el programa y cuentan. Un test fija que sobre un
mismo espacio de trabajo `programCost(sealProgram(ws))?.steps` y
`countSteps(readProgram(ws)!.orders)` coinciden.

Hoy **no puede fallar**, y ése es el motivo de escribirlo, igual que el test de
igualdad que el J6 dejó puesto: lo que fija es la construcción. Se rompe el día
que alguien toque una de las dos cadenas sin la otra, y el síntoma sería que el
número que se enseña **al construir** y el que se enseña **al terminar** dejan de
coincidir — el mismo fallo del que el J6 se cuidó entre cliente y servidor,
aquí dentro de la misma barra.

### 3. El coste del lienzo se calcula con `useMemo` sobre `program`

`readProgram` recorre la cadena de bloques y `countSteps` los suma: es barato,
pero corre con **cada cambio del editor**, y además con cada paso terminado del
recorrido, que es una vez cada tercio de segundo. `useMemo` sobre `program` deja
fuera lo segundo, que es lo que no tiene nada que ver.

### 4. Son **dos requisitos** en el spec, no uno

Es la separabilidad hecha estructura y no un consejo escrito: **retirar la pieza
de construcción es borrar un requisito entero**, no reescribir uno que hable de
las dos cosas y quedarse a medias.

Lo que se borraría el día que la profesora lo dicte, en una lista, para que no
haya que averiguarlo:

1. El requisito «El coste del programa se ve mientras se construye» del spec.
2. `programCost` en `interpreter.ts` y su bloque de tests.
3. En `GameScene.tsx`: el `useMemo`, la línea del coste en la barra y los dos
   textos que la escriben —el del coste y el del aviso de sueltos **en presente**.

Y lo que **no** se toca al hacerlo: `countSteps`, el `Attempt`, `start()`, el
contador de la ejecución y el aviso de sueltos del J6, que es otro texto y otra
condición.

### 5. Mientras se ejecuta, el coste del lienzo **no se pinta**

Durante el recorrido el niño no está construyendo, así que la pieza no pierde
nada; y un número del lienzo puesto al lado de un recorrido **que no gobierna**
sí pierde algo: si el niño toca un bloque mientras corre, el número del lienzo
cambia y el del recorrido no, y en pantalla eso se lee como un fallo.

La alternativa —dejarlo visible— es defendible y se descarta por eso: el caso
raro es el que enseña algo equivocado.

Es una condición **dentro** de la pieza, así que se borra con ella.

### 6. Después de una ejecución **sí vuelve**, aunque repita el número

Terminado el recorrido, la barra dice «Usaste 13 pasos…» y el coste del lienzo
vuelve a decir lo que cuesta lo que hay puesto. Si el niño no ha tocado nada, los
dos dicen 13 con palabras distintas.

Se acepta esa redundancia en vez de esconder la línea cuando coincide con el
resultado. Esconderla obligaría a **comparar los dos números para decidir qué se
pinta**, que es justamente mezclar las dos fuentes que la decisión 1 separa, y
haría parpadear la línea según el niño edita.

Y en cuanto toca un bloque deja de ser redundante y pasa a ser lo más útil de la
pantalla: **«usaste 13, lo que tienes ahora cuesta 11»**, antes de volver a
ejecutar. Los tiempos verbales llevan la distinción: el resultado va en pasado
—«usaste»— y el lienzo en presente —«tu programa cuesta»—.

### 7. Con montones sueltos **se avisa ya al construir**, y en presente

El número que se enseña es el del montón **que se ejecutaría**, no la suma.
Enseñarlo callando **reabre mientras se construye** el fallo silencioso que el J6
cerró al terminar: el niño ve un número que no es el de lo que tiene delante y no
tiene cómo saber por qué.

Se avisa con **texto propio y en presente** —«se ejecutará»—, no con el del J6,
que habla en pasado de una ejecución que aquí no ha ocurrido.

La alternativa era callar al construir y avisar sólo al terminar, como hoy. Se
descarta: el paso entero existe para no tener que esperar al final.

**Y el aviso del lienzo CEDE cuando el del resultado está en pantalla.** Salió al
revisar el código, no al diseñarlo: al terminar una ejecución con montones
sueltos, `isRunning` vuelve a ser falso, el coste del lienzo reaparece con su
aviso y el del resultado sigue puesto, así que el niño lee la misma frase dos
veces seguidas y en dos tiempos verbales —«sólo se ejecutará» y «sólo se
ejecutó»—, las dos en coral. Se queda el del resultado, que habla de lo que ya
ocurrió.

Que el aviso del lienzo mire al del resultado **no rompe la separabilidad**: la
dependencia va de la pieza retirable a la que se queda, nunca al revés, y
borrarla no toca el aviso del J6. Lo que sí sería un enredo es lo contrario.

**Y trae un riesgo que se verifica en el navegador**, en el punto 4.4 de las
tareas: un bloque **arrastrado fuera de la cadena** es un montón suelto mientras
está fuera, así que el aviso puede aparecer y desaparecer al reorganizar bloques.
Si al verlo resulta molesto, la decisión se revisa **con el caso delante**, y se
anota lo que se vea; no se decide aquí a ciegas.

### 8. El total del contador sale del recuento **leído**, y el numerador del índice de ejecución

«Paso 4 de 12»: el 12 es `attempt.steps` —el recuento que `countSteps` leyó del
programa— y el 4 es `index + 1`, el índice del paso que la escena está animando.

Podría usarse `run.steps.length`, que da el mismo número. Se usa `attempt.steps`
porque es **el número que el resultado va a decir al terminar**: así el niño ve
«paso 12 de 12» y acto seguido «Usaste 12 pasos», y no dos cuentas que se
parecen.

Que esos dos números no puedan separarse **ya lo sostiene un test**: el del J6
que fija `countSteps(orders) === runProgram(...).steps.length`, y que se rompe el
día que alguien haga que chocar detenga el programa. Este contador es el segundo
sitio del proyecto que se apoya en esa igualdad, y el spec le añade un escenario
que la dice desde fuera.

Y por lo mismo, **un avance imposible cuenta**: son pasos ordenados, y el
contador los cuenta como los cuenta el recuento.

### 9. La forma en la barra

La barra conserva los dos botones y su columna de texto. Con `optimalSteps` de
10:

| Estado | Qué dice |
| --- | --- |
| Construyendo, sin nada que contar | Sólo el texto que ya había —«Coloca bloques y pulsa «Ejecutar»…»—, **sin ninguna línea de coste** |
| Construyendo, con programa | Se añade: «Tu programa cuesta 12 pasos. La mejor solución cuesta 10 pasos.» |
| Construyendo, con montones sueltos | Se añade además: «Tienes bloques sueltos: sólo se ejecutará el montón de más arriba.» |
| Ejecutando | «Ejecutando el programa… paso 4 de 12.» — y **sin** línea de coste |
| Terminado | El resultado del J6, tal cual, **más** la línea del coste del lienzo |
| Terminado, con montones sueltos | Lo anterior **más el aviso del J6 y sólo ése**: el del lienzo cede para no decir lo mismo dos veces |

**Hubo una redacción alternativa, y se miró con la pantalla delante (tarea
4.10).** Al terminar el PROGRAMA A sin tocar nada, la barra dice el resultado
—«…con 10 pasos, justo lo que cuesta la mejor solución»— **y** la línea del
coste, con «la mejor solución» en las dos. La salida propuesta era que la línea
del coste **dejara de decir el óptimo**, que no acopla nada.

**Se descarta, y no por gusto: choca con lo que el usuario pidió.** El J6.1 dice
«lo que cuesta el programa del lienzo, **contra el óptimo del nivel**», y quitarle
el óptimo a esa línea deja al niño **sin nada contra lo que comparar mientras
construye** —que es la lección entera del paso—; el resultado no puede suplirlo,
porque antes de la primera ejecución no hay resultado. La repetición se limita al
estado «recién terminado y sin tocar nada» y se deshace en cuanto mueve un
bloque, que es cuando la línea pasa a decir algo que el resultado no dice.

El singular pasa por el `stepsLabel` que el J6 ya escribió —«1 paso», no «1
pasos»—: un giro suelto cuesta uno, y un nivel puede tener `optimalSteps` de 1.

Todo dentro de `GameScene.tsx`, debajo del `<Canvas>` y fuera de él, con los
estilos del sistema visual y sin hexadecimales sueltos. `StudentGameLabModule.tsx`
**no se toca**: si hubiera que tocarlo, el contador está en el sitio equivocado.

### 10. El delta **modifica** el requisito del resultado

«Al terminar se ve lo que costó y lo que costaba lo bueno» dice que mientras la
ejecución está en curso «no se muestra ningún resultado ni recuento **final**».
Esa palabra ya deja sitio al contador en vivo —el paso en curso no es el recuento
final—, así que un delta sólo de `ADDED` **no dejaría el spec contradictorio**.

Se modifica igualmente, y por un motivo que no es la corrección: puestos uno al
lado del otro, un requisito que prohíbe «recuento» durante la ejecución y otro
que manda enseñar un número durante la ejecución **se leen como contrarios**, y
quien llegue en el J8 tendría que deducir de una sola palabra cuál manda. El
requisito pasa a decir qué prohíbe —el **resultado**— y qué sí se ve.

El cambio son **dos sitios y ni una línea más**: la frase de «mientras la
ejecución está en curso» y el escenario «La ejecución está en curso». Se verifica
leyendo el diff, que es el punto 8 de `ROADMAP.md` §1.3 aplicado a un `MODIFIED`.

## Risks / Trade-offs

**El aviso de sueltos parpadea al reorganizar bloques** → Es el riesgo real de la
decisión 7. Se mira en el navegador arrastrando un bloque fuera de la cadena y
volviéndolo a encajar, y **si molesta se revisa con el caso delante**. No se
decide a ciegas ahora.

**El niño ve `optimalSteps` antes de jugar, y hasta hoy lo veía al terminar** →
Lo autoriza el contrato §4.2 con el argumento que ya está escrito ahí: **un
número no es una solución** —decir que la mejor ruta son diez pasos no dice
cuáles son—. Lo que sí deja de ser cierto es el **cuándo**: ese apartado dice «el
niño lo ve en pantalla al terminar», y hay que corregir esa frase.

**Enseñar el coste antes de ejecutar puede invitar a optimizar sin jugar** →
Es el efecto buscado —la lección de eficiencia sin tener que ejecutar—, y es
además la elección pedagógica que el usuario dejó **retirable**: si la profesora
la desaconseja, se borra la pieza. Por eso la decisión 4 escribe qué se borra.

**Dos números en pantalla que un niño puede confundir** → Nunca están los dos a
la vez: el del lienzo desaparece mientras se ejecuta (decisión 5). Cuando
conviven —resultado y lienzo, después de una ejecución— los separan el tiempo
verbal y el sujeto: «usaste» contra «tu programa cuesta».

**Las dos piezas no se pueden probar con tests** → jsdom no implementa WebGL y
`<Canvas>` no se monta; es lo mismo que en el J4, el J5 y el J6. Lo que se prueba
es `programCost`; los escenarios del delta que hablan de la pantalla se verifican
**en el navegador**, con el viewport emulado, y queda escrito en `CONTEXT.md`
§2.9 qué se verificó. **No se inventa un test de componente para que la lista
parezca completa.**

**La importación nueva `interpreter.ts` → `program.ts` mueve bytes al trozo
principal** → No debería: los dos módulos están ya bajo la frontera diferida y
`GameScene` importa los dos. Se mide, y el principal no puede subir de 625,00 kB.

## Migration Plan

No hay ninguna. No hay migración de base de datos, no hay `db push`, no hay datos
guardados que reinterpretar y no hay nada desplegado: la pantalla vive en el
banco de pruebas, que sólo existe en desarrollo. Revertir es revertir el commit.

Ninguna firma existente cambia: `programCost` se añade, y `readProgram`,
`countSteps` y `runProgram` se quedan como están.
