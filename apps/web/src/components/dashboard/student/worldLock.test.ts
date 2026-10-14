import { describe, expect, it } from 'vitest';
import type { Level, World } from '../../../types/world.types';
import { blockingWorld, missionWorldOrder } from './worldLock';

const world = (id: string, orderIndex: number): World => ({ id, orderIndex }) as World;
const level = (id: string): Level => ({ id }) as Level;

const WORLDS = [world('w1', 1), world('w2', 2), world('w3', 3)];
const LEVELS = new Map([
  ['w1', [level('a1'), level('a2'), level('a3')]],
  ['w2', [level('b1'), level('b2'), level('b3')]],
  ['w3', [level('c1'), level('c2'), level('c3')]],
]);

describe('blockingWorld', () => {
  it('el primer mundo está siempre abierto', () => {
    expect(blockingWorld(WORLDS, LEVELS, 'w1', new Set())).toBeNull();
  });

  it('el mundo 2 se abre al superar todo el 1', () => {
    expect(blockingWorld(WORLDS, LEVELS, 'w2', new Set())?.id).toBe('w1');
    expect(blockingWorld(WORLDS, LEVELS, 'w2', new Set(['a1', 'a2', 'a3']))).toBeNull();
  });

  it('faltando un nivel del anterior sigue cerrado', () => {
    expect(blockingWorld(WORLDS, LEVELS, 'w2', new Set(['a1', 'a2']))?.id).toBe('w1');
  });

  it('sólo mira el mundo anterior', () => {
    expect(blockingWorld(WORLDS, LEVELS, 'w3', new Set(['a1', 'a2', 'a3']))?.id).toBe('w2');
  });

  it('un mundo sin niveles en medio no cuenta', () => {
    const levels = new Map([...LEVELS, ['w2', []]]);

    expect(blockingWorld(WORLDS, levels, 'w2', new Set())).toBeNull();
    expect(blockingWorld(WORLDS, levels, 'w3', new Set())?.id).toBe('w1');
    expect(blockingWorld(WORLDS, levels, 'w3', new Set(['a1', 'a2', 'a3']))).toBeNull();
  });

  it('un mundo con algún nivel ya superado sigue abierto', () => {
    expect(blockingWorld(WORLDS, LEVELS, 'w3', new Set(['c2']))).toBeNull();
  });

  it('va por orden, aunque la lista llegue desordenada', () => {
    const shuffled = [world('w3', 3), world('w1', 1), world('w2', 2)];

    expect(blockingWorld(shuffled, LEVELS, 'w2', new Set())?.id).toBe('w1');
  });

  it('un mundo que no está en la lista no se bloquea', () => {
    expect(blockingWorld(WORLDS, LEVELS, 'zz', new Set())).toBeNull();
  });
});

describe('missionWorldOrder', () => {
  it('lee el orden del mundo de la clave', () => {
    expect(missionWorldOrder('clear_world_2')).toBe(2);
  });

  it('«flawless_3» no es el mundo 3', () => {
    expect(missionWorldOrder('flawless_3')).toBeNull();
  });

  it('una clave mal formada no apunta a ningún mundo', () => {
    expect(missionWorldOrder('clear_world_')).toBeNull();
    expect(missionWorldOrder('clear_world_2_bis')).toBeNull();
    expect(missionWorldOrder('xclear_world_2')).toBeNull();
  });
});
