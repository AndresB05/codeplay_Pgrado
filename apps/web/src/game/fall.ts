import type { Motion } from './interpreter';

/*
 * Cuánto dura un paso y a qué altura va el personaje mientras dura. Puro y sin
 * `three`: es dibujo, y el dibujo también se puede probar si no depende de WebGL.
 *
 * ES PURAMENTE VISUAL, y ésa es la restricción que decide. Aquí no se cuenta
 * nada: un descenso cuesta un paso antes y después, `countSteps` no lo mira,
 * `stepLimit` tampoco, y el número que el servidor recalculará en el J10 no
 * cambia. Una solución que necesitara tocar el recuento sería la equivocada.
 */

/*
 * Lo que dura un paso en pantalla. Ni tanto que aburra ni tan poco que el niño
 * no pueda seguir el recorrido con la vista, que es para lo que se anima: si el
 * personaje apareciera directamente en la meta, no habría nada que contar.
 *
 * Un paso que BAJA dura más, y sólo ése: lo que tarda en caer lo pone la altura.
 */
export const STEP_SECONDS = 0.34;

/*
 * Lo que el personaje anda en el aire antes de caer, en fracción del paso. El
 * resto del paso ya está cayendo.
 *
 * ES 0,5 PORQUE AHÍ ESTÁ EL BORDE, no por gusto: a mitad del trayecto cruza de
 * una columna a la otra, así que mantenerse arriba hasta ahí es exactamente lo
 * que hace falta para no tocar el bloque de partida. Con menos volvería a
 * rozarlo; con más, aparecería flotando sobre la casilla de llegada.
 */
export const COYOTE_AIR = 0.5;

/*
 * La gravedad de la caída, en casillas por segundo al cuadrado. **Es baja a
 * propósito**, pedido por el usuario el 17-sep-2026 al ver la primera versión:
 * «¿por qué no aumentas un poco el tiempo de caída para que no se sienta
 * brusco? tipo gravedad lunar».
 *
 * Con 7, caer un nivel son 0,54 s y caer tres, 0,93. Es el único número que hay
 * que tocar si alguna vez se quiere más o menos flotante: subirlo acelera la
 * caída y acorta el paso, bajarlo la alarga.
 */
export const FALL_GRAVITY = 7;

/*
 * Lo que tarda en caer una altura, con aceleración constante desde quieto. De
 * aquí sale que **la gravedad es la misma para todas las caídas** y que lo que
 * cambia con la altura es lo que duran, no lo deprisa que empiezan.
 *
 * Es la vuelta de la primera versión, que repartía el paso en dos mitades fijas
 * y por tanto hacía caer una caída larga mucho más rápido que una corta. Se veía
 * como un latigazo, que es justo lo que el usuario mandó quitar.
 */
export const fallSeconds = (drop: number): number =>
  drop <= 0 ? 0 : Math.sqrt((2 * drop) / FALL_GRAVITY);

/*
 * En qué segundo del paso el personaje empieza a caer. Un ATERRIZAJE de salto ya
 * viene del cenit del arco, así que cae desde el primer instante; un paso
 * andando anda primero su medio paso en el aire.
 */
const airSeconds = (motion: Motion): number =>
  motion === 'landing' ? 0 : COYOTE_AIR * STEP_SECONDS;

/*
 * Lo que dura este paso. Sólo se alarga cuando hay caída, y lo que se le añade
 * es lo que la caída tarde: el paso no se estira, se le pega la caída detrás.
 *
 * El DESPEGUE de un salto nunca cae —la bajada vive en su aterrizaje—, así que
 * dura lo de siempre aunque el salto acabe más abajo.
 */
export const stepSeconds = (motion: Motion, from: number, to: number): number => {
  if (to >= from || motion === 'takeoff') {
    return STEP_SECONDS;
  }

  return Math.max(STEP_SECONDS, airSeconds(motion) + fallSeconds(from - to));
};

/*
 * EL PASO DEL COYOTE. Al bajar, el personaje mantiene la altura que tenía
 * mientras cruza hacia la casilla y sólo entonces cae.
 *
 * Sin esto viajaba en línea recta entre las dos casillas, y esa recta **entra en
 * el bloque sobre el que estaba**: a mitad de camino ya ha bajado media casilla
 * y todavía está sobre la columna de partida, así que la corta por la esquina.
 * Quedarse arriba hasta cruzar el borde quita el problema de raíz, no lo
 * disimula.
 *
 * `along` es lo recorrido del trayecto completo y sólo manda cuando NO se cae;
 * cayendo manda el reloj, porque la caída ya no cabe en el paso.
 *
 * SUBIR Y LLANO NO CAMBIAN. Una recta hacia arriba se aleja del bloque de
 * partida en vez de meterse en él, así que ahí no hay nada que arreglar, y
 * retrasarlo dejaría al personaje atravesando el bloque al que sube.
 */
export const heightAt = (
  motion: Motion,
  from: number,
  to: number,
  along: number,
  seconds: number
): number => {
  if (to >= from) {
    return from + (to - from) * along;
  }

  /* La mitad que despega de un salto que baja: sube su arco desde aquí. */
  if (motion === 'takeoff') {
    return from;
  }

  const air = airSeconds(motion);

  if (seconds <= air) {
    return from;
  }

  const fallen = Math.min(seconds - air, fallSeconds(from - to));

  return from - 0.5 * FALL_GRAVITY * fallen * fallen;
};
