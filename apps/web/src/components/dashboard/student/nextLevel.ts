import type { Level } from '../../../types/world.types';

/*
 * El nivel que sigue a otro DENTRO DE SU MUNDO: el de orden inmediatamente
 * mayor. Por orden y no por posición en la lista, porque la lista no promete
 * venir ordenada ni sin huecos. En el último del mundo no hay siguiente, y la
 * ventana de felicitaciones no pinta el botón: decidido por el usuario.
 */
export const nextLevelId = (levels: Level[], currentOrder: number): string | null => {
  const next = levels
    .filter((level) => level.orderIndex > currentOrder)
    .sort((a, b) => a.orderIndex - b.orderIndex)[0];

  return next === undefined ? null : next.id;
};
