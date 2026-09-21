import { useAuth } from '../../../hooks/useAuth';
import { useMissionAssignments } from '../../../hooks/useMissionAssignments';
import type { Mission } from '../../../types/classroom.types';
import { TargetIcon } from '../teacher/TeacherIcons';
import { TropicalFlower } from '../../decor/JungleDecor';

const MissionCard = ({ mission, isCompleted }: { mission: Mission; isCompleted: boolean }) => (
  <article className="card flex flex-col p-5">
    <div className="flex items-start justify-between gap-3">
      <h3 className="font-display text-[19px] leading-tight text-ink">{mission.title}</h3>
      <span className="chip chip-grape shrink-0">{mission.difficultyLabel}</span>
    </div>

    <p className="mt-2 flex-1 text-[15px] font-semibold leading-[1.6] text-ink-soft">
      {mission.description}
    </p>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="chip chip-sun">+{mission.xpReward} XP</span>
    </div>

    {/*
     * Sigue sin haber botón, y ahora por otro motivo: una misión no se empieza,
     * se cumple jugando los niveles que ya existen. Un botón prometería una
     * pantalla propia que no tiene.
     */}
    {isCompleted ? (
      <p className="mt-4 rounded-[16px] border-2 border-jungle bg-mint-soft px-4 py-3 text-[14px] font-bold text-jungle-dark">
        ¡Cumplida! Ganaste {mission.xpReward} XP.
      </p>
    ) : (
      <p className="mt-4 rounded-[16px] border-2 border-line bg-cream px-4 py-3 text-[14px] font-bold text-ink-faint">
        Se cumple jugando los niveles. ¡Sigue explorando!
      </p>
    )}
  </article>
);

/**
 * Las misiones que el tutor asignó al salón del niño, con lo que él lleva
 * cumplido.
 *
 * Vive en `shared/` por lo mismo que `StudentRosterTable`: lo montan dos
 * pantallas del niño —«Mundos» y «Mi salón»— con marcos distintos.
 *
 * **No se pinta si no hay nada que enseñar.** Un niño sin salón no tiene tutor
 * que le asigne nada, y uno con salón puede no tener ninguna misión todavía: en
 * los dos casos una tarjeta vacía sería ruido. Un fallo de lectura sí se dice,
 * porque callarlo afirmaría que no hay misiones.
 *
 * **Una misión cumplida NO desaparece.** La asignación es del salón y el
 * cumplimiento es de cada alumno: la misión sigue ahí hasta que el tutor la
 * retire, y al que ya la cumplió le queda como lo que ganó.
 */
export const AssignedMissionsPanel = () => {
  const { user } = useAuth();
  const { catalog, assignments, completions, loading, error } = useMissionAssignments();

  if (error) {
    return (
      <section className="mt-8 rounded-[20px] border-2 border-coral-dark bg-coral-soft px-5 py-4 text-[15px] font-bold text-coral-dark">
        {error.message}
      </section>
    );
  }

  if (loading || assignments.length === 0) {
    return null;
  }

  /*
   * Se recorre el catálogo y no las asignaciones para que el orden sea el suyo,
   * el mismo que ve el tutor al asignarlas. Desde que `mission_key` tiene clave
   * ajena, toda asignación apunta a una misión que existe.
   */
  const assignedKeys = new Set(assignments.map((assignment) => assignment.missionKey));
  const missions = catalog.filter((mission) => assignedKeys.has(mission.key));

  if (missions.length === 0) {
    return null;
  }

  /*
   * La RLS ya sólo le devuelve al niño lo suyo, pero el filtro por `userId` se
   * escribe igual: este mismo hook lo usa el panel del tutor, donde `completions`
   * trae las de TODOS sus alumnos.
   */
  const myCompletions = new Set(
    completions
      .filter((completion) => completion.userId === user?.id)
      .map((completion) => completion.missionKey)
  );

  const completedCount = missions.filter((mission) => myCompletions.has(mission.key)).length;

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[16px] border-[3px] border-ink bg-sun-soft">
          <TargetIcon />
        </span>
        <h2 className="title-lg">Misiones de tu salón</h2>
        <span className="chip chip-leaf ml-auto">
          <TropicalFlower size={16} />
          {completedCount} de {missions.length} cumplidas
        </span>
      </div>

      <p className="subtitle mt-1">
        Tu profesor las eligió para ti. Dan más experiencia que un nivel normal.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {missions.map((mission) => (
          <MissionCard
            key={mission.key}
            mission={mission}
            isCompleted={myCompletions.has(mission.key)}
          />
        ))}
      </div>
    </section>
  );
};
