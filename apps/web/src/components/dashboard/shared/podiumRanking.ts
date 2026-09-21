import type { ClassroomStudent } from '../../../types/classroom.types';

/*
 * Manda el XP porque es lo que ya ordena la tabla de abajo: un podio que no
 * coincidiera con ella haría dudar de las dos. Los desempates van por lo que el
 * XP resume —niveles superados, luego racha— y el nombre al final, para que dos
 * recargas nunca cambien el orden.
 */
export const podiumRanking = (students: ClassroomStudent[]): ClassroomStudent[] =>
  students
    .filter((student) => student.xp > 0)
    .sort(
      (a, b) =>
        b.xp - a.xp ||
        b.completedLevels - a.completedLevels ||
        (b.streakDays ?? 0) - (a.streakDays ?? 0) ||
        a.name.localeCompare(b.name, 'es')
    )
    .slice(0, 3);
