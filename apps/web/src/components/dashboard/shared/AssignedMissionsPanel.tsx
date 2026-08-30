import { useMissionAssignments } from '../../../hooks/useMissionAssignments';
import type { Mission } from '../../../types/classroom.types';
import { getSkillLabel, missionCatalog } from '../teacher/classroomsData';
import { TargetIcon } from '../teacher/TeacherIcons';
import { TropicalFlower } from '../../decor/JungleDecor';

const MissionCard = ({ mission }: { mission: Mission }) => (
  <article className="card flex flex-col p-5">
    <div className="flex items-start justify-between gap-3">
      <h3 className="font-display text-[19px] leading-tight text-ink">{mission.title}</h3>
      <span className="chip chip-grape shrink-0">{mission.difficultyLabel}</span>
    </div>

    <p className="mt-2 flex-1 text-[15px] font-semibold leading-[1.6] text-ink-soft">
      {mission.description}
    </p>

    <div className="mt-4 flex flex-wrap items-center gap-2">
      <span className="chip chip-mint">{getSkillLabel(mission.skill)}</span>
      <span className="chip chip-sun">+{mission.xpReward} XP</span>
      <span className="chip chip-sky">{mission.estimatedMinutes} min</span>
    </div>

    {/*
     * Aquí no va un botón: la misión todavía no puede empezarse, y ofrecerlo
     * sería prometer algo que no ocurre al pulsarlo.
     */}
    <p className="mt-4 rounded-[16px] border-2 border-line bg-cream px-4 py-3 text-[14px] font-bold text-ink-faint">
      Todavía no puedes jugarla: llegará con el juego.
    </p>
  </article>
);

/**
 * Las misiones que el tutor asignó al salón del niño.
 *
 * Vive en `shared/` por lo mismo que `StudentRosterTable`: lo montan dos
 * pantallas del niño —«Mundos» y «Mi salón»— con marcos distintos.
 *
 * **No se pinta si no hay nada que enseñar.** Un niño sin salón no tiene tutor
 * que le asigne nada, y uno con salón puede no tener ninguna misión todavía: en
 * los dos casos una tarjeta vacía sería ruido. Un fallo de lectura sí se dice,
 * porque callarlo afirmaría que no hay misiones.
 */
export const AssignedMissionsPanel = () => {
  const { assignments, loading, error } = useMissionAssignments();

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
   * `missionKey` es texto sin clave ajena, así que una fila puede apuntar a una
   * misión que ya no está en el catálogo. Se descarta en vez de pintar una
   * tarjeta rota.
   */
  const missions = assignments
    .map((assignment) => missionCatalog.find((mission) => mission.id === assignment.missionKey))
    .filter((mission): mission is Mission => mission !== undefined);

  if (missions.length === 0) {
    return null;
  }

  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-[46px] w-[46px] items-center justify-center rounded-[16px] border-[3px] border-ink bg-sun-soft">
          <TargetIcon />
        </span>
        <h2 className="title-lg">Misiones de tu salón</h2>
        <span className="chip chip-leaf ml-auto">
          <TropicalFlower size={16} />
          {missions.length === 1 ? '1 misión especial' : `${missions.length} misiones especiales`}
        </span>
      </div>

      <p className="subtitle mt-1">
        Tu profesor las eligió para ti. Dan más experiencia que un nivel normal.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-5 lg:grid-cols-2 xl:grid-cols-3">
        {missions.map((mission) => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
      </div>
    </section>
  );
};
