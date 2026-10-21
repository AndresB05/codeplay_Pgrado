import { useState } from 'react';
import { pickMascotAvatar } from '../../../constants/mascotAvatars';
import type { ClassroomStudent } from '../../../types/classroom.types';
import { formatLastActivity } from './classroomsData';

/* Cuatro caben junto a las cifras sin estirar la fila; el resto, a petición. */
const VISIBLE = 4;

/**
 * Los exploradores que llevan una semana o más sin jugar, para que el tutor
 * pregunte antes de que se descuelguen del todo. Sin ninguno, no ocupa sitio:
 * un «todo bien» permanente se deja de leer.
 */
export const AttentionSection = ({
  students,
  onOpen,
}: {
  /** Ya filtrados y ordenados con `inactiveStudents`. */
  students: ClassroomStudent[];
  onOpen: (studentId: string) => void;
}) => {
  const [showAll, setShowAll] = useState(false);

  if (students.length === 0) {
    return null;
  }

  const shown = showAll ? students : students.slice(0, VISIBLE);

  return (
    <section className="tutor-card overflow-hidden">
      <header className="flex flex-wrap items-center gap-x-2.5 gap-y-1 border-b border-tutor-rule px-4 py-3">
        <h2 className="text-[17px] leading-tight text-tutor-ink">Requiere tu atención</h2>
        <span className="tutor-badge tutor-badge-warn tutor-badge-plain">{students.length}</span>
        <p className="ml-auto text-[13.5px] text-tutor-ink-soft">Una semana o más sin jugar</p>
      </header>

      <ul>
        {shown.map((student) => (
          <li
            key={student.id}
            className="flex items-center gap-2.5 border-b border-tutor-rule px-4 py-2.5 last:border-b-0"
          >
            <img
              src={pickMascotAvatar(student.id, student.name)}
              alt=""
              className="h-[30px] w-[30px] shrink-0 rounded-full border border-tutor-rule object-cover"
            />
            <p className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-tutor-ink">{student.name}</span>
              <span className="block text-[13.5px] text-tutor-ink-soft">
                Última actividad {formatLastActivity(student.hoursSinceLastActivity)}
              </span>
            </p>

            <button
              type="button"
              onClick={() => onOpen(student.id)}
              aria-label={`Ver progreso de ${student.name}`}
              className="tutor-btn tutor-btn-secondary tutor-btn-sm shrink-0"
            >
              Ver progreso
            </button>
          </li>
        ))}
      </ul>

      {students.length > VISIBLE ? (
        <button
          type="button"
          onClick={() => setShowAll((current) => !current)}
          aria-expanded={showAll}
          className="tutor-focus block w-full border-t border-tutor-rule px-4 py-2.5 text-[14px] font-semibold text-tutor-accent hover:bg-tutor-sunken"
        >
          {showAll ? 'Ver menos' : `Ver todos (${students.length})`}
        </button>
      ) : null}
    </section>
  );
};
