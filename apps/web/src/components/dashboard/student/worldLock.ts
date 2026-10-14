import type { Level, World } from '../../../types/world.types';

/*
 * EL CANDADO DE MUNDOS, decidido por el usuario el 14-oct-2026: un niño que
 * entraba en el tercer mundo sin la base de los anteriores se frustraba. El
 * primer mundo está siempre abierto y cada uno de los demás se abre al superar
 * TODOS los niveles del anterior. Por orden y no por posición, como
 * `blockingLevel`.
 *
 * Los mundos sin niveles no cuentan: ni se cierran ni cierran al siguiente, que
 * se compara con el anterior que sí tenga. Y un mundo en el que el niño ya
 * superó algún nivel sigue abierto: en la prueba preliminar no había candado, y
 * no se le quita lo que ya jugó.
 *
 * Devuelve el mundo que hay que superar antes, o `null` si éste ya se puede
 * abrir. Un mundo que no está en la lista, o sin niveles, no se bloquea: sin
 * saber qué va delante, cerrarlo dejaría al niño sin salida.
 */
export const blockingWorld = (
  worlds: World[],
  levelsByWorld: ReadonlyMap<string, Level[]>,
  worldId: string,
  completedIds: ReadonlySet<string>
): World | null => {
  const levelsOf = (world: World) => levelsByWorld.get(world.id) ?? [];
  const ordered = [...worlds]
    .filter((world) => levelsOf(world).length > 0)
    .sort((a, b) => a.orderIndex - b.orderIndex);
  const position = ordered.findIndex((world) => world.id === worldId);

  if (position <= 0) {
    return null;
  }

  if (levelsOf(ordered[position]).some((level) => completedIds.has(level.id))) {
    return null;
  }

  const previous = ordered[position - 1];

  return levelsOf(previous).every((level) => completedIds.has(level.id)) ? null : previous;
};

/*
 * El mundo que pide una misión, por su clave: la migración 0044 fija que la de
 * superar un mundo lleva su ORDEN, `clear_world_N`. El patrón es estricto a
 * propósito: `flawless_3` son tres niveles cualesquiera, no el mundo 3.
 */
export const missionWorldOrder = (missionKey: string): number | null => {
  const match = /^clear_world_(\d+)$/.exec(missionKey);

  return match === null ? null : Number(match[1]);
};
