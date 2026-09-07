## Context

Ver `proposal.md` — Why. Lo que hace falta aquí es lo que ya está en el código y
condiciona la forma de este paso:

- **El recuento ya existe, aunque no se llame así.** `runProgram` devuelve
  `steps: RunStep[]` con **una entrada por paso ordenado**, no por paso
  conseguido: `avanzar 4` contra un muro a dos casillas deja cuatro entradas.
  Es el contrato §4.4 metido en la estructura, y `interpreter.test.ts:158` ya lo
  fija contra el `optimalSteps` del tablero. Así que `run.steps.length` **ya es**
  el número que hay que enseñar.
- **La barra de resultado ya existe y está en su sitio.** `OUTCOME_MESSAGES` vive
  en `GameScene.tsx`, fuera del `<Canvas>` y bajo la frontera diferida, con el
  comentario «el recuento es del J6» que el J5 dejó puesto. La pantalla de nivel
  del J8 tiene que heredar esa barra, no reescribirla.
- **`optimalSteps` ya está** en `LevelConfig` y vale 10 en `debugLevel`.
- **`readProgram` tira el número de montones.** `readRoots` lo tiene
  (`roots.length`), `firstOnCanvas` elige uno y la firma `Order[] | null` no lo
  deja salir. No hay forma de avisar desde la escena sin tocar el intérprete.
- **Nada de esto se puede probar montándolo.** jsdom no implementa WebGL, así que
  un test que monte `<Canvas>` prueba el simulacro. Lo que se prueba es el
  módulo puro; la barra se verifica en el navegador, **con el panel delante**
  (`CONTEXT.md` §2.9).

## Goals / Non-Goals

**Goals:**

- Que el número que ve el niño y el que el servidor calculará en el J10 salgan de
  **la misma regla**, y que haya algo que se rompa el día que dejen de salir.
- Que el resultado distinga los tres finales que hoy se pintan igual: no llegué,
  no había programa, y se ejecutó otra cosa.
- Que todo siga **bajo la frontera diferida**, sin que el intérprete asome al
  trozo principal.

**Non-Goals:**

- **Ninguna puntuación.** Ni porcentaje, ni XP, ni estrellas: eso lo calcula el
  servidor contando el programa (J10), y este paso no tiene con qué ni por qué.
- **Ningún recuento en vivo** mientras la ejecución corre —«paso 3 de 10»—. El
  criterio del roadmap es «al terminar»; enseñarlo durante añade un texto que
  cambia sesenta veces por segundo a cambio de nada que el paso pida.
- **Ninguna maquetación nueva.** El editor al lado del juego es del J8.

## Decisions

### 1. El recuento es una función **pura sobre las órdenes**, y no la longitud del recorrido

Entra `countSteps(orders: Order[]): number` en `interpreter.ts`, y es la que
alimenta la pantalla. La alternativa —`run.steps.length`, que ya está ahí— habría
sido cero código.

Se descarta porque **§4.4 define el recuento como una lectura del programa**, sin
tablero y sin ejecutar nada, y eso es literalmente lo que el servidor tendrá que
hacer en el J10. Tener aquí esa función es la especificación ejecutable de esa
cuenta; tener sólo la longitud del recorrido es tener la cuenta atada a un motor
que el servidor no va a ejecutar.

Y va **en `interpreter.ts`**, no en un módulo nuevo. Contar y ejecutar son la
misma pasada con distinto acumulador —lo dice el propio §4.4—, y separarlas en
dos archivos es invitar a que una cambie sin la otra.

### 2. Y con ella entra el test de que **las dos cuentas coinciden**

`countSteps(orders)` y `runProgram(config, orders).steps.length` dan lo mismo
sobre el PROGRAMA A y sobre el programa que choca contra el muro.

Hoy es verdad **por construcción**: `runProgram` empuja una entrada por giro y N
por `avanzar N`, que es la tabla de §4.4. Un test de algo que no puede fallar
parece de adorno, y no lo es: es la única cosa del proyecto que se rompe el día
que alguien haga que chocar **detenga** el programa —que es lo natural al
escribir un intérprete, y por eso `interpreter.ts` ya lleva un comentario
avisando—. Sin él, el síntoma aparecería en el J10 como un número distinto en la
pantalla del niño y en la puntuación del servidor, sin nada que apunte a la
causa.

### 3. `readProgram` devuelve `{ orders, rootCount }`

Las alternativas eran contar los montones en la escena —imposible sin duplicar
`readRoots`, que valida forma además de contar— o exportar un `countRoots`
aparte, que recorrería el mismo objeto por segunda vez y podría discrepar de lo
que `readProgram` acabó leyendo.

Se saca de donde la información **ya está**. El `null` se conserva tal cual: un
programa que no se entiende se sigue rechazando **entero**, y entonces no hay
órdenes ni montones que contar.

Cuesta adaptar seis tests de `readProgram`, y ése es todo el precio.

### 4. La escena guarda **un intento**, no tres banderas paralelas

Hoy `GameScene` lleva `run`, `index` y `unreadable`, y el J6 necesitaría añadir
«estaba vacío» y «había montones de más»: cinco piezas de estado que sólo son
válidas en ciertas combinaciones. Pasa a un valor discriminado —ilegible, vacío,
o ejecución con su recuento y sus montones— más el índice del paso, que es lo
único que cambia durante la animación.

No es limpieza: es lo que hace que la barra se derive de un `switch` en vez de
una escalera de `if` con combinaciones que nadie ha comprobado que no ocurran.

### 5. El lienzo vacío se distingue **por las órdenes, no por los pasos**

Es cierto que hoy «cero pasos» equivale a «ninguna orden» —toda orden produce al
menos una entrada—, así que bastaría mirar `run.steps.length === 0`. Se decide
**no** apoyarse en eso: es una invariante de `runProgram` que nada declara, y el
día que un bloque nuevo pueda no producir paso —una espera, un sonido— el lienzo
vacío volvería a confundirse con un programa que no hace nada. Se mira lo que de
verdad significa el caso: que no había órdenes.

Y con él se arregla el mismo camino cuando **el editor todavía no se ha
montado**: `start()` usa `{}` cuando no ha llegado programa, así que aterriza en
el caso vacío y dice lo mismo.

### 6. «Perfecto» es **llegar sin gastar de más**, y gastar de menos también lo es

La condición es `success && pasos <= optimalSteps`, no `=== optimalSteps`.

`optimalSteps` se escribe a mano y **nadie lo comprueba** (§4.2). Un número
escrito **por debajo** del óptimo real ya está avisado ahí: deja la marca
perfecta fuera del alcance. El caso de enfrente —escrito **por encima**, y un
niño lo bate— no está escrito en ninguna parte, y esta pantalla es la primera que
tiene que decidir qué pinta entonces.

Se pinta «perfecto», porque para el niño lo es: llegó, y no hay solución mejor
que la suya. Lo que ese caso significa de verdad es que **el nivel está mal
sembrado**, y eso se caza donde §4.2 dice que se caza —resolviendo el puzle a
mano antes de sembrarlo, en el J7.1—, no con un aviso en la cara de quien lo
juega. Se añade la frase que falta al contrato §4.2 para que el J7 la tenga
delante.

Y abrir el caso obliga a **redactarlo aparte**: el texto de «perfecto» no puede
afirmar que se usaron «los mismos pasos que la mejor solución», porque en este
caso son menos. Es la fila de más de la tabla del punto 7.

### 7. El resultado va **en la barra**, no en una capa sobre la escena

Una pantalla de resultado que se superpone es lo habitual del género, y aquí
estorba: §4.4 decide que **pisar la meta y seguir cuenta**, y acepta a sabiendas
que el personaje pueda acabar lejos de la meta —«no se esconde, se enseña»—. Una
capa encima tapa justamente el paseo de más que explica el número que esa capa
está enseñando.

Además la barra ya vive donde tiene que vivir: dentro de `GameScene.tsx`, debajo
del `<Canvas>`, para que el J8 la herede. Una capa nueva sería una pieza más que
esa pantalla tendría que heredar o rehacer.

Forma: la barra conserva los dos botones y el texto pasa a ser un bloque de hasta
tres líneas —el resultado, el recuento y, si procede, el aviso de los sueltos—.
Redacción propuesta, con `optimalSteps` de 10:

| Caso | Qué dice |
| --- | --- |
| Sin ejecutar | «Coloca bloques y pulsa «Ejecutar» para ver al personaje moverse.» |
| Ejecutando | «Ejecutando el programa…» |
| Lienzo vacío | «No hay bloques que ejecutar. Arrastra alguno al lienzo.» — **sin recuento** |
| Ilegible | «Ese programa no se puede leer.» — **sin recuento** |
| Llegó con los justos (pasos **=** óptimo) | «¡Perfecto! Llegaste a la meta con 10 pasos, justo lo que cuesta la mejor solución.» |
| Llegó con menos (pasos **<** óptimo) | «¡Perfecto! Llegaste a la meta con 8 pasos, menos todavía de lo que cuesta la mejor solución que teníamos apuntada.» |
| Llegó, gastando de más | «¡Llegaste a la meta! Usaste 12 pasos y la mejor solución cuesta 10 pasos.» |
| No llegó | «No llegaste a la meta. Usaste 6 pasos y la mejor solución cuesta 10 pasos.» |

**«Cuesta N pasos» y no «son N», y «1 paso» y no «1 pasos».** Un programa puede
costar un solo paso —un giro suelto— y un nivel puede tener `optimalSteps` de 1,
así que las dos cantidades pasan por un ayudante que las escribe en singular
cuando toca. Es la clase de detalle que no se ve hasta que un niño lo lee.
| Sobraron montones | Se añade: «Te sobraron bloques sueltos: sólo se ejecutó el montón de más arriba.» |

**Son ocho filas y no siete, y la de más existe por la decisión 6.** Con `<=`,
un niño que gaste menos que el número sembrado entra por la rama de «perfecto», y
decirle ahí «los mismos que la mejor solución» sería **falso**. La fila propia lo
dice sin afirmar una igualdad que no se cumple, y **sin acusarle de nada**: lo
raro es el número apuntado, no su solución, y él no tiene por qué enterarse de
eso.

**Esa fila no se puede ver en el laboratorio, y conviene saberlo antes de
buscarla.** `debugLevel.optimalSteps` vale 10 y **10 es el óptimo real** de ese
tablero —§4.4 lo resuelve—, así que ningún programa que llegue puede costar
menos. El camino queda escrito y sin ejercitar hasta que exista un nivel con el
número mal sembrado, que es justo lo que el J7.1 tiene que evitar. No se verifica
en el navegador y no se dirá que se verificó.

### 8. El aviso de los sueltos **acompaña** al resultado, no lo sustituye

El montón de arriba sí se ejecutó, y su resultado es real. Sustituirlo por el
aviso convertiría un programa que quizá resolvió el nivel en un error, que es
justo lo que §4.3 se negó a hacer al decidir **no rechazar** el programa por
tener bloques sueltos: «castiga el bloque olvidado en una esquina, que es lo más
frecuente en un lienzo de niño».

Se avisa por `rootCount > 1`, que cuenta **montones** y no bloques: el aviso dice
que sobró algo, no cuánto. Contar los bloques de los montones ignorados obligaría
a recorrerlos, y recorrer lo que no se ejecuta para poder decir un número más
grande no compra nada.

### 9. El delta **modifica** el requisito de la llegada, no sólo añade

El requisito vigente «El juego sabe si el programa llegó a la meta» trae el
escenario «el programa no pasa por la meta → se indica que no se llegó», y **el
lienzo vacío cae dentro**: hoy `runProgram(config, [])` se ejecuta, devuelve
`success: false` y la barra pinta «No llegaste a la meta». Ése es exactamente el
agujero que este paso cierra.

Con un delta sólo de `ADDED`, después del sync el spec principal **exigiría y
prohibiría lo mismo para el mismo caso**, y nada lo detectaría: `ROADMAP.md` §1.3
punto 8 manda leer las líneas borradas ante un `REMOVED`, pero el hueco
simétrico —un `ADDED` que debía ser `MODIFIED`— no lo mira nadie. Así que ese
requisito se reproduce **entero** bajo `## MODIFIED Requirements`, acotado a
cuando hay órdenes que ejecutar.

Y de paso deja escrito lo que sin decirlo se lee como una contradicción: el
requisito viejo manda calcular el resultado **de lo que ocurrió al ejecutar** y
el nuevo manda que el recuento **no** salga de ahí. No se contradicen —uno habla
de la llegada y el otro de los pasos—, pero puestos uno al lado del otro lo
parecen, y quien llegue en el J10 buscando cuál manda no tendría cómo saberlo.
La regla queda dicha en el propio requisito: la llegada se calcula ejecutando
porque depende del tablero, el recuento se calcula leyendo porque no depende de
él y porque quien puntúa no ejecuta.

### 10. La frontera no se mueve

`countSteps` se importa desde `GameScene.tsx`, bajo la frontera diferida, igual
que `readProgram` y `runProgram`. `StudentGameLabModule.tsx` **no se toca**: si
hubiera que tocarlo para enseñar el resultado, sería la señal de que la barra
está en el sitio equivocado.

## Risks / Trade-offs

**El test de igualdad parece redundante y alguien lo borra** → Lleva encima el
comentario que dice para qué está y qué rompería su ausencia, con la referencia a
§4.4. Es el mismo motivo por el que `interpreter.test.ts:158` ya existe.

**`rootCount` cuenta montones y el niño ve «bloques»** → El aviso está redactado
en el vocabulario del niño («te sobraron bloques sueltos») y no promete un
número. Si algún día hace falta el número exacto, se cuenta entonces y con un
caso real delante.

**Un `optimalSteps` mal sembrado no lo detecta nada, y ahora además se enseña** →
Es el riesgo que §4.2 ya declara y que el J7.1 tiene que cerrar resolviendo cada
puzle a mano. Este paso lo empeora en un sentido —el número sale a pantalla— y lo
mejora en otro: un número absurdo se ve jugando, que es más de lo que pasa hoy.
Se añade la frase que falta al contrato.

**La barra no se puede probar con tests** → jsdom no implementa WebGL y `<Canvas>`
no se monta. Lo que se prueba es `countSteps` y `readProgram`; los ocho
escenarios del delta que hablan de la pantalla se verifican **en el navegador con
el panel delante**, y queda escrito en `CONTEXT.md` §2.9 qué se verificó, como en
el J4 y el J5.

**El J8 rehará la maquetación** → A propósito. La barra vive dentro del juego
justamente para que ese paso mueva el cuadro y no el contenido.

## Migration Plan

No hay ninguna. No hay migración de base de datos, no hay `db push`, no hay datos
guardados que reinterpretar y no hay nada desplegado: la pantalla vive en el
banco de pruebas, que sólo existe en desarrollo. Revertir es revertir el commit.

El único cambio de forma es el retorno de `readProgram`, y su único consumidor
está en el mismo repositorio, dos archivos más allá.
