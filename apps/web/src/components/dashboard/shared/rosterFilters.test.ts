import { describe, expect, it } from 'vitest';
import { filterRoster, hasFilters, NO_FILTERS, NO_WORLD, worldOptions } from './rosterFilters';

const student = (id: string, name: string, currentWorld: string | null) => ({
  id,
  name,
  currentWorld,
});

const ROSTER = [
  student('s1', 'Sofía Pérez', 'Sendero de los Patrones'),
  student('s2', 'Luis Gómez', 'Cordillera de la Abstracción'),
  student('s3', 'Ana Ruiz', null),
];
const ONLINE = new Set(['s2']);

const ids = (list: { id: string }[]) => list.map((item) => item.id);

describe('filterRoster', () => {
  it('sin filtros deja la tabla entera', () => {
    expect(ids(filterRoster(ROSTER, NO_FILTERS, ONLINE))).toEqual(['s1', 's2', 's3']);
  });

  it('busca por nombre sin tildes ni mayúsculas', () => {
    expect(ids(filterRoster(ROSTER, { ...NO_FILTERS, name: '  SOFIA ' }, ONLINE))).toEqual([
      's1',
    ]);
  });

  it('filtra por mundo', () => {
    const filters = { ...NO_FILTERS, world: 'Cordillera de la Abstracción' };

    expect(ids(filterRoster(ROSTER, filters, ONLINE))).toEqual(['s2']);
  });

  it('«Sin empezar» es quien no ha jugado nunca', () => {
    expect(ids(filterRoster(ROSTER, { ...NO_FILTERS, world: NO_WORLD }, ONLINE))).toEqual(['s3']);
  });

  it('separa conectados de inactivos', () => {
    expect(ids(filterRoster(ROSTER, { ...NO_FILTERS, activity: 'online' }, ONLINE))).toEqual([
      's2',
    ]);
    expect(ids(filterRoster(ROSTER, { ...NO_FILTERS, activity: 'offline' }, ONLINE))).toEqual([
      's1',
      's3',
    ]);
  });

  it('combina los filtros con «y»', () => {
    const filters = { name: 'luis', world: 'Sendero de los Patrones', activity: 'online' as const };

    expect(filterRoster(ROSTER, filters, ONLINE)).toEqual([]);
  });
});

describe('worldOptions', () => {
  it('ofrece los mundos de la tabla, ordenados, y «Sin empezar» al final', () => {
    expect(worldOptions(ROSTER).map((option) => option.label)).toEqual([
      'Cordillera de la Abstracción',
      'Sendero de los Patrones',
      'Sin empezar',
    ]);
  });

  it('sin nadie por empezar no ofrece «Sin empezar»', () => {
    expect(worldOptions(ROSTER.slice(0, 2)).map((option) => option.value)).not.toContain(NO_WORLD);
  });
});

describe('hasFilters', () => {
  it('un nombre de sólo espacios no es un filtro', () => {
    expect(hasFilters({ ...NO_FILTERS, name: '   ' })).toBe(false);
    expect(hasFilters({ ...NO_FILTERS, activity: 'offline' })).toBe(true);
  });
});
