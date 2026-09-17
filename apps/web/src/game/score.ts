/*
 * LA PUNTUACIÓN DE UNA PARTIDA: la eficiencia del programa contra la mejor
 * solución apuntada del nivel. Decidida por el usuario el 17-sep-2026 tras
 * medir tres candidatas contra los nueve programas resueltos a mano.
 *
 * ESTO NO ES LA PUNTUACIÓN QUE CUENTA. La que cuenta la calcula el servidor
 * contando el mismo programa (contrato §3), y este archivo existe para poder
 * enseñarla al instante: la ventana no espera al guardado, así que sin esta
 * copia habría que dejarle un hueco al número más visible de la pantalla.
 *
 * Su gemela en SQL es `score_for_steps` de la migración 0033, y las dos tienen
 * que dar lo mismo. Lo que ata las dos cuentas es que parten del MISMO
 * recuento de pasos —una lectura del programa, no de la ejecución—, y que la
 * puntuación de aquí se guarda con el intento al lado de la del servidor: el día
 * que dejen de coincidir, queda con qué darse cuenta.
 */

/** El tope de un nivel, que hoy es 100 en los nueve (migración 0023). */
export const MAX_SCORE = 100;

/*
 * El suelo de uno NO es una precaución contra el redondeo: es la regla de que
 * resolver siempre paga algo. Cero es lo que vale no haber resuelto el nivel, y
 * las dos cosas no pueden decirse con el mismo número.
 */
export const scoreForSteps = (steps: number, optimalSteps: number): number => {
  if (!Number.isFinite(steps) || !Number.isFinite(optimalSteps) || steps < 1 || optimalSteps < 1) {
    return 0;
  }

  return Math.max(1, Math.min(MAX_SCORE, Math.round((MAX_SCORE * optimalSteps) / steps)));
};
