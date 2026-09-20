import type { LevelConfig } from './level';
import type { RunStep } from './interpreter';

/*
 * LA CAÍDA MÁS ALTA DE UNA PARTIDA, en casillas.
 *
 * No es dibujo: `fall.ts` calcula cuánto DURA una caída para animarla, y esto
 * calcula cuánto SE CAYÓ, que es una observación de la partida. Existe para
 * «¡Auch! mis rodillas», el único logro que no se puede leer del programa: para
 * saber que el explorador se tiró de lo alto de «La torre» hay que ejecutar el
 * recorrido, y el servidor no ejecuta nada.
 *
 * Por eso viaja como OBSERVACIÓN y no como verdad —`metadata`, junto a los pasos
 * y la puntuación del cliente—: el servidor se la cree igual que se cree
 * `success`, ni un bit más, y la acota exigiendo que la partida superara el
 * nivel.
 */
export const maxDrop = (config: LevelConfig, steps: RunStep[]): number => {
  const heightAt = (step: RunStep): number =>
    config.heights[step.pose.cell.row]?.[step.pose.cell.column] ?? 0;

  let previous = config.heights[config.start.cell.row]?.[config.start.cell.column] ?? 0;
  let deepest = 0;

  steps.forEach((step) => {
    const height = heightAt(step);

    deepest = Math.max(deepest, previous - height);
    previous = height;
  });

  return deepest;
};
