import { describe, expect, it } from 'vitest';
import type { Level } from '../../../types/world.types';
import { nextLevelId } from './nextLevel';

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
