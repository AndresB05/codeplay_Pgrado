import { describe, expect, it } from 'vitest';
import { MAX_SCORE, scoreForSteps } from './score';

/*
 * LOS NUEVE NIVELES SEMBRADOS Y LO QUE DAN, con los pasos de sus soluciones
 * resueltas a mano —las que `levelSolutions.test.ts` comprueba en las dos
 * direcciones— y con los excesos que se midieron antes de elegir la regla: un
 * giro olvidado detrás de la meta, dos, un «avanzar 3» de sobra y el programa
 * duplicado. Los cuatro siguen superando el nivel, comprobado con el intérprete.
 *
 * Están aquí porque son la tabla que el usuario aprobó, y porque atan la regla a
 * los niveles de verdad: si alguien la cambia, esto dice a quién se lo cambia.
 */
const levels: { name: string; optimalSteps: number; expected: number[] }[] = [
  { name: 'M1N1 Siempre adelante', optimalSteps: 4, expected: [100, 80, 67, 57, 50] },
  { name: 'M1N2 Camino con curvas', optimalSteps: 12, expected: [100, 92, 86, 80, 50] },
  { name: 'M1N3 Laberinto', optimalSteps: 20, expected: [100, 95, 91, 87, 50] },
  { name: 'M2N1 Salta y sube', optimalSteps: 15, expected: [100, 94, 88, 83, 50] },
  { name: 'M2N2 Escalera', optimalSteps: 25, expected: [100, 96, 93, 89, 50] },
  { name: 'M2N3 La torre', optimalSteps: 23, expected: [100, 96, 92, 88, 50] },
  { name: 'M3N1 Dos caminos', optimalSteps: 10, expected: [100, 91, 83, 77, 50] },
  { name: 'M3N2 Pilares', optimalSteps: 17, expected: [100, 94, 89, 85, 50] },
  { name: 'M3N3 El faro', optimalSteps: 14, expected: [100, 93, 88, 82, 50] },
];

describe.each(levels)('$name', ({ optimalSteps, expected }) => {
  it('puntúa los pasos justos, los tres excesos y el programa duplicado', () => {
    const steps = [optimalSteps, optimalSteps + 1, optimalSteps + 2, optimalSteps + 3, optimalSteps * 2];

    expect(steps.map((count) => scoreForSteps(count, optimalSteps))).toEqual(expected);
  });
});

describe('scoreForSteps', () => {
  it('nunca pasa del tope, ni cuando el programa es más corto que la mejor solución', () => {
    expect(scoreForSteps(3, 4)).toBe(MAX_SCORE);
  });

  /*
   * El borde que la regla tiene por decisión, no por redondeo: un programa
   * disparatado que llega a la meta baja a uno, no a cero.
   */
  it('resolver el nivel nunca vale cero', () => {
    expect(scoreForSteps(100_000, 4)).toBe(1);
  });

  it('no puntúa sin pasos ni sin mejor solución apuntada', () => {
    expect(scoreForSteps(0, 4)).toBe(0);
    expect(scoreForSteps(12, 0)).toBe(0);
    expect(scoreForSteps(12, Number.NaN)).toBe(0);
  });
});
