## Context

Ver `proposal.md` — Why. Un descenso se dibujaba como una recta entre las dos
casillas y esa recta entra en el bloque de partida.

Lo que ya estaba puesto y esto aprovecha: la escena calcula la posición del
personaje a partir de `along` —lo recorrido del trayecto completo, de la casilla
de partida a la de llegada— y **el salto ya cosía sus dos entradas en un solo
trayecto**, con el despegue de 0 a 0,5 y el aterrizaje de 0,5 a 1. Que las tres
formas de moverse compartan ese eje es lo que deja arreglarlas todas con una
función.

## Goals / Non-Goals

**Goals:** que al bajar no se atraviese el bloque de partida, que un salto que
baja parezca un salto, y que las tres cosas se puedan probar sin WebGL.

**Non-Goals:** todo lo que sea recuento. Y la física de verdad: hay una gravedad y
nada más — ni masa, ni rebote, ni aire.

## Decisions

### La altura es una función pura, y por eso tiene test

`heightAt` y `stepSeconds` no saben de `three`: reciben dos alturas, cómo se está
moviendo el personaje y dónde va el reloj. Eso deja pinchar la curva en los puntos
que importan —el borde, la velocidad inicial, lo que dura cada caída— sin montar
una escena que jsdom no puede ejecutar. Es la misma línea que separa `movement.ts`
e `interpreter.ts` de `GameScene.tsx`, aplicada a algo que hasta hoy no se
consideraba comprobable porque «es dibujo».

Y el test no comprueba sólo lo nuevo: comprueba **el número del fallo**. A mitad
de camino de una bajada de una casilla la recta decía 1,5, dentro del bloque de
partida; ahora dice 2. Si alguien vuelve a poner la recta, ese caso cae.

### El medio paso de aire es dónde está el borde, no un gusto

`COYOTE_AIR = 0.5` no es un número estético. A mitad del trayecto el personaje
cruza de una columna a la otra, así que mantenerse arriba hasta ahí es exactamente
lo que hace falta para no tocar el bloque de partida, ni más ni menos. Con menos
volvería a rozarlo; con más, empezaría a caer ya pasado el destino.

Lo que **no** es es la duración de la caída: eso se decide aparte, abajo.

### La caída manda sobre el reloj, y por eso hay dos relojes

**La primera versión repartía el paso en dos mitades fijas** —medio paso de aire,
medio de caída— y el usuario la rechazó al verla: «¿por qué no aumentas un poco el
tiempo de caída para que no se sienta brusco? tipo gravedad lunar». Tenía razón, y
el defecto era estructural: con el tiempo fijado de antemano, una caída de tres
niveles tenía que recorrer tres casillas en 170 ms. Cuanto más alta la caída, más
violenta — justo al revés de lo que una caída debería parecer.

La vuelta es poner la **gravedad** como constante y dejar que el tiempo salga de
ella: `fallSeconds(altura) = √(2·altura/g)`. Con eso todas las caídas empiezan
igual de suaves y **una alta tarda más**, que es lo que hace que se lea como una
caída y no como un tirón. Bajar no tiene límite de niveles —las columnas son
pilares—, así que el caso es real: en «La torre» hay una bajada de **tres**
niveles.

Eso obliga a **dos relojes en el mismo paso**, y es la única complicación que este
cambio añade:

- **el del paso**, `STEP_SECONDS`, que mueve lo horizontal, el giro y el arco del
  salto. No cambia nunca, así que el ritmo del recorrido no depende del relieve;
- **el de la caída**, que dura lo que la altura pida y **se le pega al paso por
  detrás**.

Con un solo reloj no había salida buena: darle tiempo a la caída estirando el paso
entero habría puesto al personaje a andar hacia el borde a cámara lenta, que no es
lo que se estaba arreglando.

### Lo horizontal sigue siendo una recta

Sólo la altura se retrasa. El personaje cruza hacia la casilla a la velocidad de
siempre, empieza a caer al pasar el borde, llega a la vertical de su destino y
sigue bajando desde ahí: es «un paso en el aire y luego una caída», que es como el
usuario lo describió. Congelar también lo horizontal daría la caída vertical del
dibujo animado, pero dejaría al personaje quieto medio paso y luego corriendo el
doble de rápido.

### El salto se reparte solo entre sus dos mitades

Un salto ya llegaba partido en dos entradas del recorrido, y cada mitad cae en un
lado de la frontera: **el despegue no cae nunca** —se queda a la altura de
partida, así que el arco se levanta desde ahí, «como si fuera a subir»— y **el
aterrizaje es la caída entera**, que arranca en el cenit del arco. Medido en una
bajada de tres niveles: el cenit está a 0,9 por encima de donde despegó, igual que
el de un salto llano; antes quedaba 0,6 **por debajo**.

Y las dos mitades se cosen sin tirón porque las dos llegan a la frontera con
velocidad vertical cero: el arco porque es su cenit, la caída porque arranca desde
quieto.

## Risks / Trade-offs

**Un paso que baja dura bastante más que uno normal.** Medido: 0,73 s bajando un
nivel y 1,11 s bajando tres, contra 0,34 s de un paso cualquiera. Es lo que se
pidió, y el número que lo gobierna está solo y con nombre: `FALL_GRAVITY`.
Subirlo acelera la caída y acorta el paso; bajarlo la alarga. Nada más hay que
tocar, y en particular **no** la duración del paso ni `COYOTE_AIR`, que vale 0,5
porque ahí está el borde.
