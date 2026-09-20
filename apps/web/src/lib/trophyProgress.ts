import type { CatalogAchievement } from '../services/achievements.service';

/** Cuántos niveles de un mundo están al 100, sobre los que tiene. */
export interface TrophyProgress {
  done: number;
  total: number;
}

/*
 * EL AVANCE HACIA UN LOGRO DE MUNDO, que es lo que su barra tiene que pintar.
 *
 * Un logro de mundo se gana con los tres niveles al 100, así que hasta el
 * tercero su tarjeta estaba en cero y el niño no veía moverse nada: dos niveles
 * perfectos y una barra vacía se leen como «no llevas nada», que es lo contrario
 * de lo que pasa.
 *
 * Sale de los LOGROS DE NIVEL y no de una consulta nueva: `perfect_w2_l3` es el
 * tercer nivel del segundo mundo, así que el catálogo que la sala ya tiene en la
 * mano dice a la vez cuántos niveles tiene el mundo y cuántos van. Si algún día
 * entra un cuarto nivel en un mundo, el denominador sube solo.
 */
export const worldTrophyProgress = (
  achievements: CatalogAchievement[],
  worldOrder: number
): TrophyProgress => {
  const prefix = `perfect_w${worldOrder}_l`;
  const levels = achievements.filter((achievement) => achievement.key.startsWith(prefix));

  return {
    done: levels.filter((achievement) => achievement.unlockedAt !== null).length,
    total: levels.length,
  };
};

/** Qué porcentaje de la barra se pinta. Sin niveles no hay nada que pintar. */
export const trophyPercent = ({ done, total }: TrophyProgress): number =>
  total === 0 ? 0 : Math.round((done / total) * 100);
