import type { ClassroomStudent } from '../../../types/classroom.types';
import { podiumRanking } from './podiumRanking';

const PLACES = [
  { label: '1.º', medal: '🥇', height: 'h-[120px]', block: 'bg-sun', text: 'text-ink' },
  { label: '2.º', medal: '🥈', height: 'h-[88px]', block: 'bg-line', text: 'text-ink' },
  { label: '3.º', medal: '🥉', height: 'h-[64px]', block: 'bg-papaya', text: 'text-white' },
];

/* El orden olímpico: el primero en el centro, el segundo a su izquierda. */
const VISUAL_ORDER = [1, 0, 2];

interface ClassroomPodiumProps {
  students: ClassroomStudent[];
}

/**
 * Los tres exploradores con más XP del salón. No se pinta si nadie ha ganado
 * nada todavía: un podio de ceros premiaría el orden alfabético.
 */
export const ClassroomPodium = ({ students }: ClassroomPodiumProps) => {
  const ranking = podiumRanking(students);

  if (ranking.length === 0) {
    return null;
  }

  return (
    <section className="card mt-6 px-5 pb-0 pt-5">
      <h2 className="title-lg">Podio del salón</h2>
      <p className="subtitle mt-1">Los tres exploradores con más experiencia.</p>

      <ol className="mt-6 flex items-end justify-center gap-3 sm:gap-5">
        {VISUAL_ORDER.filter((place) => place < ranking.length).map((place) => {
          const student = ranking[place];
          const style = PLACES[place];

          return (
            <li key={student.id} className="flex w-[110px] flex-col items-center sm:w-[150px]">
              <span className="text-[28px]" aria-hidden="true">
                {style.medal}
              </span>
              <div
                className={`mt-1 flex h-[52px] w-[52px] items-center justify-center rounded-full border-[3px] border-ink font-display text-[17px] ${student.avatarTone}`}
                aria-hidden="true"
              >
                {student.initials}
              </div>
              <span className="mt-2 w-full truncate text-center font-bold text-ink">
                {student.name}
              </span>
              <span className="font-display text-[14px] text-ink-soft">{student.xp} XP</span>

              <div
                className={`mt-2 flex w-full items-start justify-center rounded-t-[16px] border-[3px] border-b-0 border-ink pt-2 font-display text-[24px] ${style.height} ${style.block} ${style.text}`}
              >
                <span className="sr-only">Puesto </span>
                {style.label}
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
};
