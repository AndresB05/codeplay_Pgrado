import type { Level } from '../../../types/world.types';

/*
 * EL CANDADO ORDENA EL AVANCE, decidido por el usuario el 21-sep-2026 tras el
 * despliegue provisional: el primer nivel de cada mundo está siempre abierto, y
 * cada uno de los demás se abre al superar el anterior. Por orden y no por
 * posición, como `nextLevelId`: la lista no promete venir ordenada.
 *
 * Devuelve el nivel que hay que superar antes, o `null` si éste ya se puede
 * jugar. Un nivel que no está en la lista no se bloquea: sin saber qué va
 * delante, cerrarlo dejaría al niño sin salida.
 */
export const blockingLevel = (
  levels: Level[],
  levelId: string,
  completedIds: ReadonlySet<string>
): Level | null => {
  const ordered = [...levels].sort((a, b) => a.orderIndex - b.orderIndex);
  const position = ordered.findIndex((level) => level.id === levelId);

  if (position <= 0) {
    return null;
  }

  const previous = ordered[position - 1];

  return completedIds.has(previous.id) ? null : previous;
};
