## Why

Pedido por el usuario el 17-sep-2026, al ver el mundo 3 jugándose: **al bajar, el
personaje atraviesa la esquina del cubo sobre el que estaba**.

La causa es que un descenso es un paso de andar normal y la escena interpola las
tres coordenadas a la vez, así que el personaje viaja en línea recta entre las dos
casillas. Medido en «La torre» con una bajada de tres niveles: a mitad de camino
la recta lo dejaba **una casilla y media por debajo** de donde estaba, todavía
sobre la columna de partida. Ahí es donde cortaba el bloque.

En un salto que baja es peor: el arco se monta sobre esa misma recta, así que un
salto de tres niveles hacia abajo llegaba a su cenit **por debajo** de la altura
desde la que despegó. No parecía un salto, parecía un picado.

**No es un fallo funcional.** Bajar cuesta un paso, como andar, y el recuento es
correcto. Es el dibujo.

## What Changes

- **Al bajar, el personaje se queda a su altura durante la primera mitad del
  paso** y sólo entonces cae hacia la casilla. Cruza el borde antes de empezar a
  bajar, así que no hay nada que cortar. Es el paso del coyote, con las palabras
  del usuario: «algo parecido al coyote y el correcaminos».
- **Cae con gravedad, baja y la misma para todas las caídas.** Pedido por el
  usuario al ver la primera versión: «que no se sienta brusco, tipo gravedad
  lunar». La primera repartía el paso en dos mitades fijas, así que una caída de
  tres niveles se despeñaba en 170 ms — un latigazo.
- **Por eso un paso que baja dura más**, y más cuanto más baja: lo que tarda la
  caída lo pone la altura. Es lo único que dura distinto. **Andar dura siempre lo
  mismo**, así que el ritmo del recorrido no depende del relieve y el personaje no
  se acerca al borde a cámara lenta.
- **Un salto que baja sube primero.** Decidido por el usuario: «salta como si
  fuera a subir pero termina cayendo a la plataforma». La mitad que despega se
  queda a la altura de partida, así que el arco se levanta desde ahí, y la mitad
  que aterriza es la caída.
- **Subir y andar en llano NO cambian.** Una recta hacia arriba se aleja del
  bloque de partida en vez de meterse en él, y retrasarla metería al personaje
  dentro del bloque al que sube.

## Capabilities

### Modified Capabilities

- **`juego-3d`**. El requisito del movimiento del personaje gana cómo se dibuja
  una bajada.

## Impact

**Base de datos.** Nada. Sin migración, sin tocar ningún nivel sembrado.

**Código.**

| Archivo | Qué le pasa |
| --- | --- |
| `apps/web/src/game/fall.ts` | **Nuevo. Puro.** `heightAt`: a qué altura va el personaje en un punto del paso |
| `apps/web/src/game/fall.test.ts` | **Nuevo.** 8 casos, incluido el número exacto del fallo que esto arregla |
| `apps/web/src/game/GameScene.tsx` | La altura del personaje sale de `heightAt` en vez de una interpolación lineal |

**Documentación.** `docs/CONTEXT.md` §2.9 y §4.13.

**Lo que NO entra, y es la restricción que decide:** **nada del recuento.** No
toca `countSteps`, ni el número que se le enseña al niño, ni `stepLimit`, ni lo
que el servidor recalculará en el J10. Un descenso cuesta un paso antes y
después. Una solución que necesitara cambiar el recuento sería la equivocada.
