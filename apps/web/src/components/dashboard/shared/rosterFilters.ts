import type { ClassroomStudent } from '../../../types/classroom.types';

/** El valor del filtro de mundo para quien todavía no ha jugado. */
export const NO_WORLD = '__sin-empezar__';

export type ActivityFilter = 'all' | 'online' | 'offline';

/*
 * Los tres filtros que eligió el usuario para las tablas del tutor, y ninguno
 * más. `world` es el nombre que pinta la tabla, `NO_WORLD` o `null` para todos.
 */
export interface RosterFilters {
  name: string;
  world: string | null;
  activity: ActivityFilter;
}

export const NO_FILTERS: RosterFilters = { name: '', world: null, activity: 'all' };

export const hasFilters = (filters: RosterFilters): boolean =>
  filters.name.trim() !== '' || filters.world !== null || filters.activity !== 'all';

// Sin tildes ni mayúsculas: el tutor escribe «sofia» y busca a «Sofía».
const fold = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .trim();

export const filterRoster = <T extends Pick<ClassroomStudent, 'id' | 'name' | 'currentWorld'>>(
  students: T[],
  filters: RosterFilters,
  onlineIds: ReadonlySet<string>
): T[] => {
  const name = fold(filters.name);

  return students.filter((student) => {
    if (name !== '' && !fold(student.name).includes(name)) {
      return false;
    }

    if (filters.world !== null) {
      const world = student.currentWorld ?? NO_WORLD;

      if (world !== filters.world) {
        return false;
      }
    }

    if (filters.activity !== 'all') {
      return onlineIds.has(student.id) === (filters.activity === 'online');
    }

    return true;
  });
};

/*
 * Los mundos que aparecen en la tabla, no los del catálogo: ofrecer uno que
 * nadie lleva dejaría la tabla vacía. «Sin empezar» va al final, si alguien
 * no ha jugado nunca.
 */
export const worldOptions = (
  students: Pick<ClassroomStudent, 'currentWorld'>[]
): { value: string; label: string }[] => {
  const worlds = [
    ...new Set(students.flatMap((student) => (student.currentWorld ? [student.currentWorld] : []))),
  ].sort((a, b) => a.localeCompare(b, 'es'));

  const options = worlds.map((world) => ({ value: world, label: world }));

  return students.some((student) => student.currentWorld === null)
    ? [...options, { value: NO_WORLD, label: 'Sin empezar' }]
    : options;
};
