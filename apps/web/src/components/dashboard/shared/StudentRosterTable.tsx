import { useState } from 'react';
import { PROVISIONAL_MAX_XP } from '../../../constants/progress';
import type { ClassroomStudent } from '../../../types/classroom.types';
import { XPBar } from '../../ui/XPBar';
import { formatLastActivity } from '../teacher/classroomsData';

const WorldBadgeIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="8" stroke="white" strokeWidth="2.2" />
    <path d="M9.5 14L11.2 10.8L14.5 9.2L12.8 12.4L9.5 14Z" fill="white" />
  </svg>
);

const FireIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M13.4 3C13.4 6.2 10.2 7.2 10.2 10.1C10.2 11.2 10.8 12.1 11.7 12.7C8.8 12.7 6.5 14.9 6.5 17.8C6.5 20.4 8.6 22.5 11.2 22.5C15.4 22.5 18.5 19.3 18.5 15.2C18.5 10.8 15.8 8.6 14.6 6.7C14.1 5.9 13.8 4.9 13.4 3Z"
      fill="#FFC93C"
      stroke="#2A1B45"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const SleepIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M20 14.5A8 8 0 019.5 4 8.5 8.5 0 1020 14.5Z"
      fill="#E3D9F7"
      stroke="#8B82A6"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

interface StudentRosterTableProps {
  students: ClassroomStudent[];
  /** Se muestra cuando el salón todavía no tiene niños inscritos. */
  emptyLabel?: string;
  /**
   * Si se pasa, aparece la columna de acciones con la opción de sacar al niño
   * del salón. Solo el tutor la recibe.
   */
  onRemoveStudent?: (studentId: string) => void;
}

/**
 * Tabla de seguimiento de los niños de un salón. La usan tanto el panel del
 * tutor como la vista de "Salón de clases" del niño.
 */
export const StudentRosterTable = ({
  students,
  emptyLabel = 'Todavía no hay exploradores en este salón.',
  onRemoveStudent,
}: StudentRosterTableProps) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  /*
   * La columna de XP cambia de sitio según quién mira: el niño la ve junto a la
   * última actividad y el tutor junto a las acciones. Es lo pedido, no un
   * descuido de la reutilización, así que las dos ramas se amplían por separado.
   */
  const gridColumns = onRemoveStudent
    ? 'grid-cols-[1.35fr_1fr_1fr_0.7fr_0.8fr_1.2fr]'
    : 'grid-cols-[1.35fr_1fr_1fr_0.8fr_0.7fr]';

  const handleRemove = (studentId: string) => {
    onRemoveStudent?.(studentId);
    setConfirmingId(null);
  };

  return (
    <section className="card overflow-hidden">
      <div
        className={`grid ${gridColumns} border-b-[3px] border-ink bg-grape-soft px-5 py-4 font-display text-[15px] text-grape-dark`}
      >
        <div>Explorador</div>
        <div>Mundo actual</div>
        <div>Última actividad</div>
        {onRemoveStudent ? null : <div>XP</div>}
        <div>Racha</div>
        {onRemoveStudent ? <div>XP</div> : null}
        {onRemoveStudent ? <div className="text-right">Acciones</div> : null}
      </div>

      {students.length === 0 ? (
        <p className="px-5 py-10 text-center text-[16px] font-semibold text-ink-faint">
          {emptyLabel}
        </p>
      ) : (
        <div>
          {students.map((student, index) => (
            <div
              key={student.id}
              className={`grid ${gridColumns} items-center border-b-2 border-line px-5 py-4 text-[16px] text-ink last:border-b-0 ${
                index % 2 === 1 ? 'bg-cream' : 'bg-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-[44px] w-[44px] shrink-0 items-center justify-center rounded-full border-[3px] border-ink font-display text-[15px] ${student.avatarTone}`}
                >
                  {student.initials}
                </div>
                <span className="font-bold">{student.name}</span>
              </div>

              <div>
                {student.currentWorld ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border-2 border-ink bg-mint px-3 py-1 font-display text-[13px] text-white">
                    <WorldBadgeIcon />
                    {student.currentWorld}
                  </span>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </div>

              <div className="flex items-center gap-2 font-semibold text-ink-soft">
                {student.hoursSinceLastActivity === null ? <SleepIcon /> : null}
                {formatLastActivity(student.hoursSinceLastActivity)}
              </div>

              {onRemoveStudent ? null : (
                <div>
                  <XPBar currentXP={student.xp} maxXP={PROVISIONAL_MAX_XP} showLabel={false} />
                </div>
              )}

              <div>
                {student.streakDays !== null ? (
                  <span className="inline-flex items-center gap-1.5 font-display text-[18px] text-sun-dark">
                    <FireIcon />
                    {student.streakDays}
                  </span>
                ) : (
                  <span className="text-ink-faint">—</span>
                )}
              </div>

              {onRemoveStudent ? (
                <div>
                  <XPBar currentXP={student.xp} maxXP={PROVISIONAL_MAX_XP} showLabel={false} />
                </div>
              ) : null}

              {onRemoveStudent ? (
                <div className="flex justify-end">
                  {confirmingId === student.id ? (
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemove(student.id)}
                        className="btn btn-sm btn-coral"
                      >
                        Confirmar
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingId(null)}
                        className="btn btn-sm btn-ghost"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmingId(student.id)}
                      className="rounded-full border-2 border-coral-dark bg-coral-soft px-4 py-1.5 font-display text-[14px] text-coral-dark transition-colors hover:bg-coral hover:text-white"
                    >
                      Quitar
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
