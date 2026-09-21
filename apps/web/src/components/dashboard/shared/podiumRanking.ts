import type { ClassroomStudent } from '../../../types/classroom.types';

export type RosterSortKey = 'xp' | 'streak' | 'name';

const byName = (a: ClassroomStudent, b: ClassroomStudent): number =>
  a.name.localeCompare(b.name, 'es');

/*
 * Manda el XP porque es lo que ya ordena la tabla de abajo: un podio que no
 * coincidiera con ella haría dudar de las dos. Los desempates van por lo que el
 * XP resume —niveles superados, luego racha— y el nombre al final, para que dos
 * recargas nunca cambien el orden.
 */
const byXp = (a: ClassroomStudent, b: ClassroomStudent): number =>
  b.xp - a.xp ||
  b.completedLevels - a.completedLevels ||
  (b.streakDays ?? 0) - (a.streakDays ?? 0) ||
  byName(a, b);

/* A igual racha desempata el XP, para que el orden siga pareciéndose al podio. */
const byStreak = (a: ClassroomStudent, b: ClassroomStudent): number =>
  (b.streakDays ?? 0) - (a.streakDays ?? 0) || byXp(a, b);

const COMPARATORS: Record<RosterSortKey, (a: ClassroomStudent, b: ClassroomStudent) => number> = {
  xp: byXp,
  streak: byStreak,
  name: byName,
};

export const sortRoster = (students: ClassroomStudent[], key: RosterSortKey): ClassroomStudent[] =>
  [...students].sort(COMPARATORS[key]);

export const podiumRanking = (students: ClassroomStudent[]): ClassroomStudent[] =>
  sortRoster(
    students.filter((student) => student.xp > 0),
    'xp'
  ).slice(0, 3);
