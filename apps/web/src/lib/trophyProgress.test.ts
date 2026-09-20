import { describe, expect, it } from 'vitest';
import { trophyPercent, worldTrophyProgress } from './trophyProgress';
import type { CatalogAchievement } from '../services/achievements.service';

const logro = (key: string, unlocked = false): CatalogAchievement => ({
  key,
  title: key,
  description: '',
  iconName: 'medal',
  awardedXp: 50,
  category: 'level',
  sortOrder: 0,
  unlockedAt: unlocked ? '2026-09-20T10:00:00.000Z' : null,
});

/* Los nueve de nivel más los tres de mundo, como están sembrados. */
const CATALOGO: CatalogAchievement[] = [
  logro('perfect_w1_l1', true),
  logro('perfect_w1_l2', true),
  logro('perfect_w1_l3'),
  logro('perfect_w2_l1'),
  logro('perfect_w2_l2'),
  logro('perfect_w2_l3'),
  logro('perfect_w3_l1', true),
  logro('perfect_w3_l2', true),
  logro('perfect_w3_l3', true),
  logro('perfect_world_1'),
  logro('perfect_world_3', true),
];

describe('worldTrophyProgress', () => {
  /*
   * El fallo que lo motivó, visto en pantalla el 20-sep-2026: con dos niveles
   * del mundo 1 al 100, la barra del trofeo seguía vacía y se leía como «no
   * llevas nada».
   */
  it('cuenta los niveles del mundo que ya están al 100', () => {
    expect(worldTrophyProgress(CATALOGO, 1)).toEqual({ done: 2, total: 3 });
  });

  it('un mundo sin tocar va a cero, pero sabe cuántos niveles tiene', () => {
    expect(worldTrophyProgress(CATALOGO, 2)).toEqual({ done: 0, total: 3 });
  });

  it('un mundo entero da el total', () => {
    expect(worldTrophyProgress(CATALOGO, 3)).toEqual({ done: 3, total: 3 });
  });

  /* `perfect_world_1` empieza por `perfect_w` y NO es un nivel. */
  it('no confunde el logro del mundo con los de sus niveles', () => {
    expect(worldTrophyProgress(CATALOGO, 1).total).toBe(3);
  });

  it('un mundo que no existe no rompe el recuento', () => {
    expect(worldTrophyProgress(CATALOGO, 9)).toEqual({ done: 0, total: 0 });
  });
});

describe('trophyPercent', () => {
  it('traduce el recuento a la barra', () => {
    expect(trophyPercent({ done: 0, total: 3 })).toBe(0);
    expect(trophyPercent({ done: 1, total: 3 })).toBe(33);
    expect(trophyPercent({ done: 2, total: 3 })).toBe(67);
    expect(trophyPercent({ done: 3, total: 3 })).toBe(100);
  });

  it('sin niveles no divide entre cero', () => {
    expect(trophyPercent({ done: 0, total: 0 })).toBe(0);
  });
});
