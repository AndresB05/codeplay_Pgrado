import { describe, expect, it } from 'vitest';
import { COYOTE_AIR, fallSeconds, heightAt, STEP_SECONDS, stepSeconds } from './fall';

/* Medio paso: el momento en que el personaje cruza el borde y empieza a caer. */
const AIRE = COYOTE_AIR * STEP_SECONDS;

/* La altura de un paso andando, a la fracción de trayecto y el segundo que se digan. */
const andando = (from: number, to: number, along: number, seconds = along * STEP_SECONDS): number =>
  heightAt('walk', from, to, along, seconds);

describe('stepSeconds', () => {
  it('andar en llano y subir duran lo de siempre', () => {
    expect(stepSeconds('walk', 2, 2)).toBe(STEP_SECONDS);
    expect(stepSeconds('landing', 1, 2)).toBe(STEP_SECONDS);
  });

  /*
   * La mitad que DESPEGA no cae —la bajada vive en su aterrizaje—, así que dura
   * lo de siempre aunque el salto acabe más abajo. Si se alargara, el arco se
   * quedaría colgado en el cenit.
   */
  it('el despegue de un salto que baja dura lo de siempre', () => {
    expect(stepSeconds('takeoff', 5, 2)).toBe(STEP_SECONDS);
  });

  /*
   * LO QUE EL USUARIO PIDIÓ el 17-sep-2026: que la caída no se sienta brusca.
   * Un paso que baja se alarga por detrás lo que la caída tarde.
   */
  it('un paso que baja dura más, y más cuanto más baja', () => {
    const uno = stepSeconds('walk', 2, 1);
    const tres = stepSeconds('walk', 4, 1);

    expect(uno).toBeGreaterThan(STEP_SECONDS);
    expect(tres).toBeGreaterThan(uno);
    expect(uno).toBeCloseTo(AIRE + fallSeconds(1));
    expect(tres).toBeCloseTo(AIRE + fallSeconds(3));
  });

  /*
   * La misma gravedad para todas las caídas, que es la forma de que se comporten
   * igual: lo que cambia con la altura es lo que duran, no cómo empiezan. Caer
   * el cuádruple de alto tarda el doble, no el cuádruple.
   */
  it('la gravedad es la misma en todas las caídas', () => {
    expect(fallSeconds(4)).toBeCloseTo(fallSeconds(1) * 2);
    expect(fallSeconds(9)).toBeCloseTo(fallSeconds(1) * 3);
  });
});

describe('heightAt', () => {
  it('un paso llano no cambia de altura en ningún momento', () => {
    for (const along of [0, 0.25, 0.5, 0.75, 1]) {
      expect(andando(2, 2, along)).toBe(2);
    }
  });

  /*
   * Subir sigue siendo una recta a propósito: se aleja del bloque de partida en
   * vez de meterse en él, y retrasar la subida metería al personaje dentro del
   * bloque al que sube.
   */
  it('subir sigue siendo una recta sobre el trayecto', () => {
    expect(andando(1, 2, 0.25)).toBeCloseTo(1.25);
    expect(andando(1, 2, 0.5)).toBeCloseTo(1.5);
    expect(andando(1, 2, 0.75)).toBeCloseTo(1.75);
  });

  it('los dos extremos son las dos alturas, se suba o se baje', () => {
    expect(andando(3, 1, 0, 0)).toBe(3);
    expect(andando(3, 1, 1, stepSeconds('walk', 3, 1))).toBeCloseTo(1);
    expect(andando(1, 3, 0, 0)).toBe(1);
    expect(andando(1, 3, 1)).toBeCloseTo(3);
  });

  /*
   * EL FALLO QUE ESTO ARREGLA, escrito como número: a mitad de camino la recta
   * dejaba al personaje media casilla por debajo de donde estaba, todavía sobre
   * la columna de partida. Ahí es donde cortaba la esquina del bloque.
   */
  it('al bajar se queda arriba hasta cruzar el borde', () => {
    expect(andando(2, 1, 0.25, AIRE / 2)).toBe(2);

    // La recta de antes decía 1,5 aquí, dentro del bloque de partida.
    expect(andando(2, 1, 0.5, AIRE)).toBe(2);
  });

  it('cae acelerando, no a velocidad constante', () => {
    const caida = fallSeconds(1);
    const primerCuarto = andando(2, 1, 1, AIRE) - andando(2, 1, 1, AIRE + caida * 0.25);
    const ultimoCuarto = andando(2, 1, 1, AIRE + caida * 0.75) - andando(2, 1, 1, AIRE + caida);

    expect(ultimoCuarto).toBeGreaterThan(primerCuarto * 4);
  });

  it('empieza a caer con velocidad cero, y por eso no da un tirón', () => {
    expect(2 - andando(2, 1, 0.5, AIRE + 0.001)).toBeLessThan(0.0001);
  });

  it('nunca sube mientras cae, y se planta al aterrizar', () => {
    const total = stepSeconds('walk', 4, 1);
    let previa = 4;

    for (let t = 0; t <= total + 0.2; t += total / 40) {
      const altura = andando(4, 1, Math.min(t / STEP_SECONDS, 1), t);

      expect(altura).toBeLessThanOrEqual(previa + 1e-9);
      expect(altura).toBeGreaterThanOrEqual(1 - 1e-9);
      previa = altura;
    }
  });

  /*
   * «Salta como si fuera a subir pero termina cayendo a la plataforma», con sus
   * palabras: la mitad que despega se queda a la altura de partida, así que el
   * arco se levanta desde ahí en vez de hundirse con una recta hacia abajo.
   */
  it('el despegue de un salto que baja se queda a la altura de partida', () => {
    for (const along of [0, 0.2, 0.35, 0.5]) {
      expect(heightAt('takeoff', 5, 2, along, along * STEP_SECONDS)).toBe(5);
    }
  });

  /* Y el aterrizaje cae desde el primer instante: ya viene del cenit del arco. */
  it('el aterrizaje de un salto que baja cae desde el primer instante', () => {
    const caida = fallSeconds(3);

    expect(heightAt('landing', 5, 2, 0.5, 0)).toBe(5);
    expect(heightAt('landing', 5, 2, 0.75, caida / 2)).toBeLessThan(5);
    expect(heightAt('landing', 5, 2, 1, caida)).toBeCloseTo(2);
  });
});
