import { describe, expect, it } from 'vitest';
import type { Level, World } from '../../../types/world.types';
import { nextLevelId, worldsAfter } from './nextLevel';

const level = (id: string, orderIndex: number): Level => ({ id, orderIndex }) as Level;

describe('nextLevelId', () => {
  it('del nivel 1 lleva al 2', () => {
    expect(nextLevelId([level('a', 1), level('b', 2), level('c', 3)], 1)).toBe('b');
  });

  it('en el último nivel del mundo no hay siguiente', () => {
    expect(nextLevelId([level('a', 1), level('b', 2), level('c', 3)], 3)).toBeNull();
  });

  it('va por orden, aunque la lista llegue desordenada', () => {
    expect(nextLevelId([level('c', 3), level('a', 1), level('b', 2)], 1)).toBe('b');
  });

  it('salta los huecos de la numeración', () => {
    expect(nextLevelId([level('a', 1), level('c', 5)], 1)).toBe('c');
  });
});

const world = (id: string, orderIndex: number): World => ({ id, orderIndex }) as World;

describe('worldsAfter', () => {
  const worlds = [world('w1', 1), world('w2', 2), world('w3', 3)];

  it('del mundo 1 van el 2 y el 3, en orden', () => {
    expect(worldsAfter(worlds, 'w1').map((item) => item.id)).toEqual(['w2', 'w3']);
  });

  it('va por orden, aunque la lista llegue desordenada', () => {
    const shuffled = [world('w3', 3), world('w1', 1), world('w2', 2)];

    expect(worldsAfter(shuffled, 'w1').map((item) => item.id)).toEqual(['w2', 'w3']);
  });

  it('salta los huecos de la numeración', () => {
    expect(worldsAfter([world('w1', 1), world('w5', 5)], 'w1').map((item) => item.id)).toEqual([
      'w5',
    ]);
  });

  it('detrás del último mundo no hay nada', () => {
    expect(worldsAfter(worlds, 'w3')).toEqual([]);
  });

  it('un mundo que no está en la lista no tiene siguiente', () => {
    expect(worldsAfter(worlds, 'zz')).toEqual([]);
  });
});
