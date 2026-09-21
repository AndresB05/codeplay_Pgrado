import { describe, expect, it } from 'vitest';
import type { Level } from '../../../types/world.types';
import { blockingLevel } from './levelLock';

const level = (id: string, orderIndex: number): Level => ({ id, orderIndex }) as Level;

const WORLD = [level('a', 1), level('b', 2), level('c', 3)];

describe('blockingLevel', () => {
  it('el primer nivel está siempre abierto', () => {
    expect(blockingLevel(WORLD, 'a', new Set())).toBeNull();
  });

  it('el nivel 2 espera al 1', () => {
    expect(blockingLevel(WORLD, 'b', new Set())?.id).toBe('a');
    expect(blockingLevel(WORLD, 'b', new Set(['a']))).toBeNull();
  });

  it('superar el 1 no abre el 3: hace falta el 2', () => {
    expect(blockingLevel(WORLD, 'c', new Set(['a']))?.id).toBe('b');
    expect(blockingLevel(WORLD, 'c', new Set(['a', 'b']))).toBeNull();
  });

  it('va por orden, aunque la lista llegue desordenada', () => {
    expect(blockingLevel([level('c', 3), level('b', 2), level('a', 1)], 'b', new Set())?.id).toBe(
      'a'
    );
  });

  it('un nivel que no está en la lista no se bloquea', () => {
    expect(blockingLevel(WORLD, 'z', new Set())).toBeNull();
  });
});
